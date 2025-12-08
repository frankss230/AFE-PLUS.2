import { NextResponse } from 'next/server';
import { Client, WebhookEvent } from '@line/bot-sdk';
import prisma from '@/lib/db/prisma';

// Import ตัวสร้าง Flex Message ทั้งหมด
import { 
    createSafetySettingsBubble, 
    createCurrentStatusBubble,  
    createProfileFlexMessage,
    createWatchConnectionBubble,
    createBorrowReturnFlexMessage
} from '@/lib/line/flex-messages';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new Client(config);

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    if (!bodyText) return NextResponse.json({ status: 'ok', message: 'No body' });

    const body = JSON.parse(bodyText);
    const events: WebhookEvent[] = body.events;

    await Promise.all(events.map(async (event) => {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text.trim();
        const senderLineId = event.source.userId;
        if (!senderLineId) return;

        // 1. ตั้งค่าความปลอดภัย
        if (userMessage === 'ตั้งค่าความปลอดภัย') {
            await handleSafetySettingsRequest(senderLineId, event.replyToken);
        }
        // 2. สถานะปัจจุบัน
        else if (userMessage === 'สถานะปัจจุบัน' || userMessage === 'ดูข้อมูลสุขภาพ') {
            await handleStatusRequest(senderLineId, event.replyToken);
        }
        // 3. ข้อมูลรายละเอียด
        else if (userMessage === 'ข้อมูลรายละเอียด') {
            await handleProfileRequest(senderLineId, event.replyToken);
        }
        // 4. การเชื่อมต่อนาฬิกา
        else if (userMessage === 'ข้อมูลการเชื่อมต่อนาฬิกา') {
            await handleWatchConnectionRequest(senderLineId, event.replyToken);
        }
        // 5. การยืม-คืนครุภัณฑ์
        else if (userMessage === 'การยืม-คืนครุภัณฑ์') {
            await handleBorrowReturnRequest(senderLineId, event.replyToken);
        }
      }
    }));

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

// ============================================================
// 🛠️ 1. Handle: ตั้งค่าความปลอดภัย
// ============================================================
async function handleSafetySettingsRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: {
            caregiverProfile: {
                include: {
                    dependents: { // ดูแลใครบ้าง? (เอาคนแรก)
                        include: {
                            safeZones: true,
                            tempSetting: true,
                            heartRateSetting: true
                        }
                    }
                }
            }
        }
    });

    if (!caregiverUser || !caregiverUser.caregiverProfile || caregiverUser.caregiverProfile.dependents.length === 0) {
        await client.replyMessage(replyToken, { type: 'text', text: '⚠️ ไม่พบข้อมูลผู้สูงอายุ กรุณาลงทะเบียนก่อนครับ' });
        return;
    }

    const dependent = caregiverUser.caregiverProfile.dependents[0];
    
    const settingsValues = {
        safezoneLv1: dependent.safeZones[0]?.radiusLv1 || 0,
        safezoneLv2: dependent.safeZones[0]?.radiusLv2 || 0,
        maxTemp: dependent.tempSetting?.maxTemperature || 37.5,
        maxBpm: dependent.heartRateSetting?.maxBpm || 120
    };

    const flexMessage = createSafetySettingsBubble(dependent, settingsValues);

    await client.replyMessage(replyToken, {
        type: 'flex',
        altText: 'เมนูตั้งค่าความปลอดภัย',
        contents: flexMessage
    });
}

// ============================================================
// 📊 2. Handle: สถานะปัจจุบัน
// ============================================================
async function handleStatusRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: {
            caregiverProfile: {
                include: {
                    dependents: {
                        include: {
                            locations: { orderBy: { timestamp: 'desc' }, take: 1 },
                            heartRateRecords: { orderBy: { timestamp: 'desc' }, take: 1 },
                            temperatureRecords: { orderBy: { recordDate: 'desc' }, take: 1 }
                        }
                    }
                }
            }
        }
    });

    if (!caregiverUser || !caregiverUser.caregiverProfile || caregiverUser.caregiverProfile.dependents.length === 0) {
        await client.replyMessage(replyToken, { type: 'text', text: '⚠️ ไม่พบข้อมูลผู้สูงอายุ' });
        return;
    }

    const dependent = caregiverUser.caregiverProfile.dependents[0];
    
    const latestLoc = dependent.locations[0];
    const latestHr = dependent.heartRateRecords[0];
    const latestTemp = dependent.temperatureRecords[0];

    const healthData = {
        bpm: latestHr?.bpm || 0,
        temp: latestTemp?.value || 0,
        battery: latestLoc?.battery || 0,
        lat: latestLoc?.latitude || 0,
        lng: latestLoc?.longitude || 0,
        updatedAt: latestLoc?.timestamp || new Date()
    };

    const flexMessage = createCurrentStatusBubble(dependent, healthData);

    await client.replyMessage(replyToken, {
        type: 'flex',
        altText: `สถานะปัจจุบัน: คุณ${dependent.firstName}`,
        contents: flexMessage
    });
}

// ============================================================
// 📋 3. Handle: ข้อมูลรายละเอียด
// ============================================================
async function handleProfileRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: {
            caregiverProfile: {
                include: { dependents: true }
            }
        }
    });

    if (!caregiverUser || !caregiverUser.caregiverProfile) {
        await client.replyMessage(replyToken, { type: 'text', text: '⚠️ ไม่พบข้อมูลลงทะเบียน' });
        return;
    }

    const caregiverProfile = caregiverUser.caregiverProfile;
    const dependentProfile = caregiverProfile.dependents[0]; // เอาคนแรก

    const flexMessage = createProfileFlexMessage(caregiverProfile, dependentProfile);

    await client.replyMessage(replyToken, {
        type: 'flex',
        altText: 'ข้อมูลลงทะเบียนของคุณ',
        contents: flexMessage
    });
}

// ============================================================
// ⌚ 4. Handle: การเชื่อมต่อนาฬิกา
// ============================================================
async function handleWatchConnectionRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: {
            caregiverProfile: {
                include: {
                    dependents: {
                        include: {
                            locations: { orderBy: { timestamp: 'desc' }, take: 1 },
                            user: true // เอา User Account ของ dependent (เพื่อเอา ID)
                        }
                    }
                }
            }
        }
    });

    if (!caregiverUser || !caregiverUser.caregiverProfile || caregiverUser.caregiverProfile.dependents.length === 0) {
        await client.replyMessage(replyToken, { type: 'text', text: '⚠️ ไม่พบข้อมูลผู้สูงอายุ' });
        return;
    }

    const dependent = caregiverUser.caregiverProfile.dependents[0];
    const dependentAccount = dependent.user; // User ที่ใช้ Login นาฬิกา
    
    const latestLoc = dependent.locations[0];
    const isOnline = latestLoc 
        ? (new Date().getTime() - new Date(latestLoc.timestamp).getTime()) < 5 * 60 * 1000
        : false;

    const flexMessage = createWatchConnectionBubble(
        caregiverUser.caregiverProfile, 
        dependent, 
        dependentAccount, 
        isOnline, 
        latestLoc?.timestamp
    );

    await client.replyMessage(replyToken, {
        type: 'flex',
        altText: 'ข้อมูลการเชื่อมต่อนาฬิกา',
        contents: flexMessage
    });
}

// ============================================================
// 🤝 5. Handle: การยืม-คืน
// ============================================================
async function handleBorrowReturnRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: {
            caregiverProfile: {
                include: {
                    borrowRequests: {
                        where: { status: { in: ['PENDING', 'APPROVED'] } },
                        include: { items: { include: { equipment: true } } },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }
        }
    });

    if (!caregiverUser || !caregiverUser.caregiverProfile) {
        await client.replyMessage(replyToken, { type: 'text', text: '⚠️ ไม่พบข้อมูลลงทะเบียน' });
        return;
    }

    const activeBorrow = caregiverUser.caregiverProfile.borrowRequests[0] || null;
    const flexMessage = createBorrowReturnFlexMessage(caregiverUser.caregiverProfile, activeBorrow);

    await client.replyMessage(replyToken, {
        type: 'flex',
        altText: 'เมนูยืม-คืนครุภัณฑ์',
        contents: flexMessage
    });
}