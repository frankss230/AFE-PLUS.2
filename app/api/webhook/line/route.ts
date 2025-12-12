import { NextResponse } from 'next/server';
import { Client, WebhookEvent } from '@line/bot-sdk';
import prisma from '@/lib/db/prisma'; // Default Import

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

    // ⭐ Log ดู Event ที่เข้ามา (Debug)
    console.log("🔥 EVENT LOG:", JSON.stringify(events, null, 2));

    await Promise.all(events.map(async (event) => {
      
      // ============================================================
      // 🟢 PART 1: จัดการกลุ่ม (Rescue Group Logic) - สำคัญมาก!
      // ============================================================
      if (event.type === 'join' && event.source.type === 'group') {
        const groupId = event.source.groupId;
        console.log(`🤖 บอทเข้ากลุ่ม ID: ${groupId}`);
        try {
            await prisma.rescueGroup.deleteMany(); // ลบกลุ่มเก่า
            await prisma.rescueGroup.create({ data: { groupId } }); // จำกลุ่มใหม่
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '✅ บันทึกกลุ่มนี้เป็น "กลุ่มแจ้งเหตุฉุกเฉิน" เรียบร้อยแล้วครับ 🚑'
            });
        } catch (e) { console.error("Database Error:", e); }
      }

      if (event.type === 'leave' && event.source.type === 'group') {
         await prisma.rescueGroup.deleteMany({ where: { groupId: event.source.groupId } });
         console.log("👋 บอทออกจากกลุ่ม - ลบข้อมูลแล้ว");
      }


      // ============================================================
      // 🟡 PART 2: ตอบแชท / เมนู (Message Logic)
      // ============================================================
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text.trim();
        const senderLineId = event.source.userId;
        if (!senderLineId) return;

        // --- 1. ตั้งค่าความปลอดภัย ---
        if (userMessage === 'ตั้งค่าความปลอดภัย') {
            await handleSafetySettingsRequest(senderLineId, event.replyToken);
        }
        // --- 2. สถานะปัจจุบัน ---
        else if (userMessage === 'สถานะปัจจุบัน' || userMessage === 'ดูข้อมูลสุขภาพ') {
            await handleStatusRequest(senderLineId, event.replyToken);
        }
        // --- 3. ข้อมูลรายละเอียด ---
        else if (userMessage === 'ข้อมูลรายละเอียด') {
            await handleProfileRequest(senderLineId, event.replyToken);
        }
        // --- 4. การเชื่อมต่อนาฬิกา ---
        else if (userMessage === 'ข้อมูลการเชื่อมต่อนาฬิกา') {
            await handleWatchConnectionRequest(senderLineId, event.replyToken);
        }
        // --- 5. การยืม-คืนครุภัณฑ์ ---
        else if (userMessage === 'การยืม-คืนครุภัณฑ์') {
            await handleBorrowReturnRequest(senderLineId, event.replyToken);
        }
        // --- 6. (แถม) เช็คคำสั่งลงทะเบียนจาก User ทั่วไป (เผื่อคนพิมพ์เอง) ---
        else if (userMessage.includes('ลงทะเบียน') && event.source.type === 'user') {
             await client.replyMessage(event.replyToken, {
                type: 'template',
                altText: 'ลงทะเบียนใช้งาน',
                template: {
                    type: 'buttons',
                    text: 'กรุณาลงทะเบียนเพื่อใช้งานระบบ',
                    actions: [{ type: 'uri', label: '📝 ลงทะเบียน', uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}` }]
                }
             });
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
// 🛠️ Helper Functions (Logic เดิมที่นายน้อยส่งมา)
// ============================================================

async function handleSafetySettingsRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: { caregiverProfile: { include: { dependents: { include: { safeZones: true, tempSetting: true, heartRateSetting: true } } } } }
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
    await client.replyMessage(replyToken, { type: 'flex', altText: 'เมนูตั้งค่าความปลอดภัย', contents: flexMessage });
}

async function handleStatusRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: { caregiverProfile: { include: { dependents: { include: { locations: { orderBy: { timestamp: 'desc' }, take: 1 }, heartRateRecords: { orderBy: { timestamp: 'desc' }, take: 1 }, temperatureRecords: { orderBy: { recordDate: 'desc' }, take: 1 } } } } } }
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
    await client.replyMessage(replyToken, { type: 'flex', altText: `สถานะปัจจุบัน: คุณ${dependent.firstName}`, contents: flexMessage });
}

async function handleProfileRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: { caregiverProfile: { include: { dependents: true } } }
    });
    if (!caregiverUser || !caregiverUser.caregiverProfile) {
        await client.replyMessage(replyToken, { type: 'text', text: '⚠️ ไม่พบข้อมูลลงทะเบียน' });
        return;
    }
    const caregiverProfile = caregiverUser.caregiverProfile;
    const dependentProfile = caregiverProfile.dependents[0];
    const flexMessage = createProfileFlexMessage(caregiverProfile, dependentProfile);
    await client.replyMessage(replyToken, { type: 'flex', altText: 'ข้อมูลลงทะเบียนของคุณ', contents: flexMessage });
}

async function handleWatchConnectionRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: { caregiverProfile: { include: { dependents: { include: { locations: { orderBy: { timestamp: 'desc' }, take: 1 }, user: true } } } } }
    });
    if (!caregiverUser || !caregiverUser.caregiverProfile || caregiverUser.caregiverProfile.dependents.length === 0) {
        await client.replyMessage(replyToken, { type: 'text', text: '⚠️ ไม่พบข้อมูลผู้สูงอายุ' });
        return;
    }
    const dependent = caregiverUser.caregiverProfile.dependents[0];
    const dependentAccount = dependent.user;
    const latestLoc = dependent.locations[0];
    const isOnline = latestLoc ? (new Date().getTime() - new Date(latestLoc.timestamp).getTime()) < 5 * 60 * 1000 : false;
    const flexMessage = createWatchConnectionBubble(caregiverUser.caregiverProfile, dependent, dependentAccount, isOnline, latestLoc?.timestamp);
    await client.replyMessage(replyToken, { type: 'flex', altText: 'ข้อมูลการเชื่อมต่อนาฬิกา', contents: flexMessage });
}

async function handleBorrowReturnRequest(lineId: string, replyToken: string) {
    const caregiverUser = await prisma.user.findFirst({
        where: { lineId },
        include: { caregiverProfile: { include: { borrowRequests: { where: { status: { in: ['PENDING', 'APPROVED'] } }, include: { items: { include: { equipment: true } } }, orderBy: { createdAt: 'desc' }, take: 1 } } } }
    });
    if (!caregiverUser || !caregiverUser.caregiverProfile) {
        await client.replyMessage(replyToken, { type: 'text', text: '⚠️ ไม่พบข้อมูลลงทะเบียน' });
        return;
    }
    const activeBorrow = caregiverUser.caregiverProfile.borrowRequests[0] || null;
    const flexMessage = createBorrowReturnFlexMessage(caregiverUser.caregiverProfile, activeBorrow);
    await client.replyMessage(replyToken, { type: 'flex', altText: 'เมนูยืม-คืนครุภัณฑ์', contents: flexMessage });
}