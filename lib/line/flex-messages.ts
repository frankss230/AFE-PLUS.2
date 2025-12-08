import { Client, FlexBubble } from '@line/bot-sdk';
import { FallRecord, User, CaregiverProfile, DependentProfile, ExtendedHelp } from '@prisma/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const lineClient = new Client(config);

// =================================================================
// 🚨 1. Alert Message (Fall & SOS) - ธีมฉุกเฉิน
// =================================================================
export const createAlertFlexMessage = (
    record: FallRecord | ExtendedHelp, 
    user: User, 
    dependentProfile: DependentProfile 
): FlexBubble => {
    
    const isSOS = 'type' in record;
    const isFall = !isSOS;
    
    const startColor = isFall ? "#FF416C" : "#FF4B1F"; 
    const endColor = isFall ? "#FF4B2B" : "#FF9068";   
    const headerText = isFall ? "⚠️ ตรวจพบการล้ม" : "SOS ขอความช่วยเหลือ";

    const eventTimeRaw = 'timestamp' in record ? record.timestamp : record.requestedAt;
    const time = format(new Date(eventTimeRaw), "HH:mm น.", { locale: th });
    const date = format(new Date(eventTimeRaw), "d MMM yyyy", { locale: th });

    const staticMapUrl = "https://cdn-icons-png.flaticon.com/512/854/854878.png"; 
    const elderlyName = `คุณ${dependentProfile.firstName} ${dependentProfile.lastName}`;

    const baseUrl = process.env.SERVER_URL || "https://chirpier-gannon-windier.ngrok-free.dev"; 
    const acknowledgeUrl = `${baseUrl}/api/fall/acknowledge?recordId=${record.id}&type=${isFall ? 'fall' : 'sos'}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`;

    return {
        type: "bubble",
        size: "mega",
        body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            paddingAll: "xl",
            contents: [
                // Header Box with Gradient
                {
                    type: "box",
                    layout: "horizontal",
                    paddingAll: "lg",
                    background: {
                        type: "linearGradient",
                        angle: "135deg",
                        startColor: startColor,
                        endColor: endColor
                    },
                    cornerRadius: "xxl",
                    contents: [
                        {
                            type: "text",
                            text: headerText,
                            weight: "bold",
                            size: "xl",
                            color: "#FFFFFF",
                            align: "center",
                            gravity: "center",
                            wrap: true
                        }
                    ]
                },
                // Hero Image (Map)
                {
                    type: "box",
                    layout: "vertical",
                    cornerRadius: "xl",
                    margin: "md",
                    contents: [
                        {
                            type: "image",
                            url: staticMapUrl,
                            size: "full",
                            aspectRatio: "20:13",
                            aspectMode: "cover",
                            action: { type: "uri", label: "View Map", uri: googleMapsUrl }
                        }
                    ]
                },
                // Elderly Name
                {
                    type: "box",
                    layout: "vertical",
                    spacing: "xs",
                    margin: "lg",
                    paddingAll: "sm",
                    contents: [
                        { type: "text", text: "ผู้ประสบเหตุ", color: "#94A3B8", size: "xs", weight: "bold" },
                        { type: "text", text: elderlyName, color: "#1E293B", size: "xl", weight: "bold", wrap: true, margin: "xs" }
                    ]
                },
                // Info Box with Gradient Background
                {
                    type: "box",
                    layout: "vertical",
                    background: {
                        type: "linearGradient",
                        angle: "180deg",
                        startColor: "#F8FAFC",
                        endColor: "#F1F5F9"
                    },
                    cornerRadius: "xl",
                    paddingAll: "lg",
                    spacing: "md",
                    margin: "md",
                    contents: [
                        {
                            type: "box", 
                            layout: "horizontal", 
                            contents: [
                                { type: "text", text: "📅 วันที่", size: "sm", color: "#64748B", flex: 2 },
                                { type: "text", text: date, size: "sm", color: "#334155", flex: 3, weight: "bold", align: "end" }
                            ]
                        },
                        {
                            type: "box", 
                            layout: "horizontal", 
                            contents: [
                                { type: "text", text: "⏰ เวลา", size: "sm", color: "#64748B", flex: 2 },
                                { type: "text", text: time, size: "sm", color: "#334155", flex: 3, weight: "bold", align: "end" }
                            ]
                        },
                        { 
                            type: "separator", 
                            color: "#E2E8F0", 
                            margin: "md" 
                        },
                        {
                            type: "box", 
                            layout: "horizontal", 
                            margin: "md", 
                            contents: [
                                { type: "text", text: "📍 พิกัด", size: "sm", color: "#64748B", flex: 1 },
                                { type: "text", text: `${record.latitude?.toFixed(5)}, ${record.longitude?.toFixed(5)}`, size: "xxs", color: "#111827", flex: 4, align: "end", wrap: true }
                            ]
                        }
                    ]
                },
                // Acknowledge Button
                {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    margin: "lg",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            color: "#2EA1FF",
                            height: "md",
                            action: { type: "uri", label: "รับทราบเหตุ", uri: acknowledgeUrl },
                            adjustMode: "shrink-to-fit"
                        },
                        {
                            type: "text",
                            text: "กดปุ่มเมื่อตรวจสอบและช่วยเหลือแล้ว",
                            size: "xxs",
                            color: "#94A3B8",
                            align: "center",
                            margin: "sm"
                        }
                    ]
                }
            ]
        }
    };
};

// ✅ ฟังก์ชันส่ง Alert
export async function sendCriticalAlertFlexMessage(
    recipientLineId: string, 
    record: FallRecord | ExtendedHelp, 
    user: User,
    caregiverPhone: string,
    dependentProfile: DependentProfile
) {
    if (!config.channelAccessToken) return;
    
    const flexMessageContent = createAlertFlexMessage(record, user, dependentProfile);

    try {
        await lineClient.pushMessage(recipientLineId, {
            type: 'flex',
            altText: `🚨 แจ้งเตือนด่วน! จากคุณ ${dependentProfile.firstName}`,
            contents: flexMessageContent, 
        });
        console.log(`✅ LINE Alert sent to: ${recipientLineId}`);
    } catch (error: any) {
        console.error('❌ Failed to send LINE message:', error.response?.data || error.message);
    }
}

// =================================================================
// 🔔 2. General Alert (HR, Temp, Safezone)
// =================================================================
export const createGeneralAlertBubble = (title: string, message: string, value: string, color: string = "#3B82F6"): FlexBubble => {
    return {
        type: "bubble", 
        size: "mega",
        body: {
            type: "box", 
            layout: "vertical", 
            paddingAll: "xl", 
            spacing: "lg", 
            contents: [
                // Header with Gradient
                {
                    type: "box", 
                    layout: "vertical", 
                    paddingAll: "lg",
                    background: { 
                        type: "linearGradient", 
                        angle: "135deg", 
                        startColor: color, 
                        endColor: "#1E293B" 
                    },
                    cornerRadius: "xl",
                    contents: [
                        { type: "text", text: "⚠️ แจ้งเตือนระบบ", weight: "bold", color: "#FFFFFFCC", size: "xs", align: "center" },
                        { type: "text", text: title, weight: "bold", size: "lg", color: "#FFFFFF", margin: "xs", align: "center", wrap: true }
                    ]
                },
                // Message
                { 
                    type: "text", 
                    text: message, 
                    size: "sm", 
                    color: "#475569", 
                    wrap: true, 
                    align: "center",
                    margin: "lg"
                },
                // Value Box with Gradient
                {
                    type: "box", 
                    layout: "vertical", 
                    background: {
                        type: "linearGradient",
                        angle: "180deg",
                        startColor: "#F8FAFC",
                        endColor: "#F1F5F9"
                    },
                    cornerRadius: "xl", 
                    paddingAll: "lg", 
                    margin: "md",
                    contents: [
                        { type: "text", text: "ค่าที่วัดได้", size: "xs", color: "#94A3B8", align: "center" },
                        { type: "text", text: value, size: "xxl", color: "#0F172A", align: "center", weight: "bold", margin: "sm" }
                    ]
                }
            ]
        }
    };
};

// =================================================================
// 📊 3. Dashboard (Current Status)
// =================================================================
export const createCurrentStatusBubble = (dependentProfile: DependentProfile, health: { bpm: number; temp: number; battery: number; updatedAt: Date; lat: number; lng: number }): FlexBubble => {
    const time = health.updatedAt ? format(new Date(health.updatedAt), "d MMM HH:mm น.", { locale: th }) : "-";
    // const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${health.lat},${health.lng}&zoom=16&size=800x400&maptype=satellite&markers=color:red%7C${health.lat},${health.lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const mapUrl = "https://cdn-icons-png.flaticon.com/512/235/235861.png";
    const displayMapUrl = (health.lat && health.lng) ? mapUrl : "https://cdn-icons-png.flaticon.com/512/235/235861.png";
    // const googleMapsUrl = (health.lat && health.lng) ? `https://www.google.com/maps/search/?api=1&query=${health.lat},${health.lng}` : "https://maps.google.com";
    const destination = `${health.lat},${health.lng}`;

    const googleMapsUrl = (health.lat && health.lng) 
        ? `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
        : "https://maps.google.com";
    const elderlyName = `คุณ${dependentProfile.firstName} ${dependentProfile.lastName}`;

    return {
        type: "bubble", 
        size: "mega",
        body: {
            type: "box", 
            layout: "vertical", 
            paddingAll: "xl", 
            spacing: "lg",
            contents: [
                // Header with Dark Gradient
                {
                    type: "box", 
                    layout: "vertical", 
                    paddingAll: "xl", 
                    background: {
                        type: "linearGradient",
                        angle: "135deg",
                        startColor: "#1E293B",
                        endColor: "#334155"
                    },
                    cornerRadius: "xxl",
                    contents: [
                        { type: "text", text: "สถานะปัจจุบัน", weight: "bold", color: "#94A3B8", size: "xs", align: "center" },
                        { type: "text", text: elderlyName, weight: "bold", size: "xl", color: "#FFFFFF", margin: "sm", align: "center" },
                        { type: "text", text: `อัปเดต: ${time}`, size: "xxs", color: "#64748B", margin: "md", align: "center" }
                    ]
                },
                // Map Image
                {
                    type: "box", 
                    layout: "vertical", 
                    cornerRadius: "xl", 
                    margin: "lg",
                    contents: [
                        { 
                            type: "image", 
                            url: displayMapUrl, 
                            size: "full", 
                            aspectRatio: "20:13", 
                            aspectMode: "cover", 
                            action: { type: "uri", label: "View Map", uri: googleMapsUrl } 
                        }
                    ]
                },
                // Health Stats
                {
                    type: "box", 
                    layout: "horizontal", 
                    spacing: "md",
                    margin: "lg",
                    contents: [
                        {
                            type: "box", 
                            layout: "vertical", 
                            background: {
                                type: "linearGradient",
                                angle: "180deg",
                                startColor: "#FEF2F2",
                                endColor: "#FEE2E2"
                            },
                            cornerRadius: "xl", 
                            paddingAll: "md", 
                            flex: 1, 
                            alignItems: "center",
                            contents: [
                                { type: "text", text: "❤️", size: "xl" },
                                { type: "text", text: "ชีพจร", size: "xxs", color: "#64748B", margin: "xs" },
                                { type: "text", text: `${health.bpm || '-'}`, size: "lg", weight: "bold", color: "#EF4444", margin: "xs" }
                            ]
                        },
                        {
                            type: "box", 
                            layout: "vertical", 
                            background: {
                                type: "linearGradient",
                                angle: "180deg",
                                startColor: "#FFF7ED",
                                endColor: "#FFEDD5"
                            },
                            cornerRadius: "xl", 
                            paddingAll: "md", 
                            flex: 1, 
                            alignItems: "center",
                            contents: [
                                { type: "text", text: "🌡️", size: "xl" },
                                { type: "text", text: "อุณหภูมิ", size: "xxs", color: "#64748B", margin: "xs" },
                                { type: "text", text: `${health.temp || '-'}`, size: "lg", weight: "bold", color: "#F59E0B", margin: "xs" }
                            ]
                        },
                        {
                            type: "box", 
                            layout: "vertical", 
                            background: {
                                type: "linearGradient",
                                angle: "180deg",
                                startColor: "#F0FDF4",
                                endColor: "#DCFCE7"
                            },
                            cornerRadius: "xl", 
                            paddingAll: "md", 
                            flex: 1, 
                            alignItems: "center",
                            contents: [
                                { type: "text", text: "🔋", size: "xl" },
                                { type: "text", text: "แบต", size: "xxs", color: "#64748B", margin: "xs" },
                                { type: "text", text: `${health.battery || '-'}%`, size: "lg", weight: "bold", color: "#10B981", margin: "xs" }
                            ]
                        }
                    ]
                },
                // Map Button
                {
                    type: "button",
                    style: "link",
                    height: "md",
                    margin: "lg",
                    action: {
                        type: "uri",
                        label: "ดูตำแหน่งบนแผนที่",
                        uri: googleMapsUrl 
                    }
                }
            ]
        }
    };
};

// =================================================================
// 📋 4. Profile Info - ธีมขาว/ฟ้า (Clean Blue Gradient)
// =================================================================
export const createProfileFlexMessage = (caregiverProfile: CaregiverProfile, dependentProfile: DependentProfile): FlexBubble => {
    const liffUrl = process.env.LIFF_BASE_URL || "https://liff.line.me/YOUR_LIFF_ID";
    const val = (v: any) => v ? v : "-";

    const getAge = (date: Date | null | undefined) => {
        if (!date) return "-";
        const diff = Date.now() - new Date(date).getTime();
        const ageDate = new Date(diff);
        return `${Math.abs(ageDate.getUTCFullYear() - 1970)} ปี`.toString();
    };

    return {
        type: "bubble", 
        size: "mega",
        body: {
            type: "box", 
            layout: "vertical", 
            paddingAll: "xl", 
            spacing: "lg",
            contents: [
                {
                    type: "box", 
                    layout: "vertical", 
                    paddingAll: "xl",
                    background: { 
                        type: "linearGradient", 
                        angle: "135deg", 
                        startColor: "#1E293B", 
                        endColor: "#334155" 
                    },
                    cornerRadius: "xxl",
                    contents: [
                        { type: "text", text: "ข้อมูลผู้ใช้งาน", weight: "bold", size: "xl", color: "#FFFFFF", align: "center" },
                        { type: "text", text: "รายละเอียดการลงทะเบียน", size: "xs", color: "#DBEAFE", align: "center", margin: "sm" }
                    ]
                },
                {
                    type: "box", 
                    layout: "vertical", 
                    spacing: "sm",
                    margin: "lg",
                    paddingAll: "md",
                    contents: [
                        { type: "text", text: "ข้อมูลผู้ดูแล", weight: "bold", size: "sm", color: "#3B82F6" },
                        { type: "box", layout: "baseline", margin: "md", contents: [{ type: "text", text: "ชื่อ:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: `${val(caregiverProfile.firstName)} ${val(caregiverProfile.lastName)}`, color: "#334155", size: "xs", flex: 4, wrap: true }] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "เพศ:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val((caregiverProfile.gender === "MALE" ? "ชาย" : "หญิง")), color: "#334155", size: "xs", flex: 4 }] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "อายุ:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: getAge(caregiverProfile.birthday), color: "#334155", size: "xs", flex: 4 }] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "บ้านเลขที่:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(caregiverProfile.houseNumber), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "หมู่ที่:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(caregiverProfile.village), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "ถนน:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(caregiverProfile.road), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "ตำบล:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(caregiverProfile.subDistrict), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "อำเภอ:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(caregiverProfile.district), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "จังหวัด:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(caregiverProfile.province), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "รหัสไปรษณีย์:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(caregiverProfile.postalCode), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "เบอร์โทร:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(caregiverProfile.phone), color: "#334155", size: "xs", flex: 4 }] },

                    ]
                },
                { type: "separator", color: "#E2E8F0", margin: "lg" },
                {
                    type: "box", 
                    layout: "vertical", 
                    spacing: "sm",
                    margin: "lg",
                    paddingAll: "md",
                    contents: [
                        { type: "text", text: "ข้อมูลผู้ที่มีภาวะพึ่งพิง", weight: "bold", size: "sm", color: "#EF4444" },
                        { type: "box", layout: "baseline", margin: "md", contents: [{ type: "text", text: "ชื่อ:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: dependentProfile ? `${val(dependentProfile.firstName)} ${val(dependentProfile.lastName)}` : "ยังไม่ระบุ", color: "#334155", size: "xs", flex: 4, wrap: true }] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "เพศ:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val((dependentProfile.gender === "MALE" ? "ชาย" : "หญิง")), color: "#334155", size: "xs", flex: 4 }] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "อายุ:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: getAge(dependentProfile.birthday), color: "#334155", size: "xs", flex: 4 }] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "บ้านเลขที่:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(dependentProfile.houseNumber), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "หมู่ที่:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(dependentProfile.village), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "ถนน:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(dependentProfile.road), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "ตำบล:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(dependentProfile.subDistrict), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "อำเภอ:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(dependentProfile.district), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "จังหวัด:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(dependentProfile.province), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "รหัสไปรษณีย์:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(dependentProfile.postalCode), color: "#334155", size: "xs", flex: 4 } ] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "โรคประจำตัว:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: dependentProfile ? val(dependentProfile.diseases) : "-", color: "#334155", size: "xs", flex: 4, wrap: true }] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "เบอร์โทร:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(dependentProfile.medications), color: "#334155", size: "xs", flex: 4 }] },
                        { type: "box", layout: "baseline", contents: [{ type: "text", text: "เบอร์โทร:", color: "#94A3B8", size: "xs", flex: 2 }, { type: "text", text: val(dependentProfile.phone), color: "#334155", size: "xs", flex: 4 }] },
                    ]
                },
                // Buttons
                {
                    type: "box", 
                    layout: "vertical", 
                    spacing: "sm", 
                    margin: "xl",
                    contents: [
                        { type: "button", style: "secondary", height: "sm", action: { type: "uri", label: "แก้ไขข้อมูลผู้ดูแล", uri: `${liffUrl}/register/user` } },
                        { type: "button", style: "secondary", height: "sm", action: { type: "uri", label: "แก้ไขข้อมูลผู้สูงอายุ", uri: `${liffUrl}/register/elderly` } }
                    ]
                }
            ]
        }
    };
};

// =================================================================
// ⌚ 5. Watch Connection - ธีมโมเดิร์น (Modern Tech)
// =================================================================
export const createWatchConnectionBubble = (caregiverProfile: CaregiverProfile, dependentProfile: DependentProfile, elderlyAccount: User, isOnline: boolean, lastUpdate?: Date): FlexBubble => {
    const statusText = isOnline ? "ONLINE" : "OFFLINE";
    const statusColor = isOnline ? "#10B981" : "#94A3B8";
    const updateTime = lastUpdate ? format(new Date(lastUpdate), "HH:mm น.", { locale: th }) : "-";

    return {
        type: "bubble", 
        size: "mega",
        body: {
            type: "box", 
            layout: "vertical", 
            paddingAll: "xl", 
            spacing: "lg",
            contents: [
                // Header with Dark Gradient
                {
                    type: "box", 
                    layout: "vertical", 
                    paddingAll: "xl",
                    background: { 
                        type: "linearGradient", 
                        angle: "135deg", 
                        startColor: "#1E293B", 
                        endColor: "#334155" 
                    },
                    cornerRadius: "xxl",
                    contents: [
                        { type: "text", text: "การเชื่อมต่อนาฬิกา", weight: "bold", size: "xl", color: "#FFFFFF", align: "center" },
                        { type: "text", text: `สำหรับ: คุณ${dependentProfile.firstName} ${dependentProfile.lastName}`, size: "xs", color: "#94A3B8", align: "center", margin: "md" }
                    ]
                },
                // Status Box
                {
                    type: "box", 
                    layout: "vertical", 
                    background: {
                        type: "linearGradient",
                        angle: "180deg",
                        startColor: "#F8FAFC",
                        endColor: "#F1F5F9"
                    },
                    cornerRadius: "xl", 
                    paddingAll: "lg", 
                    spacing: "sm",
                    margin: "lg",
                    contents: [
                        { type: "box", layout: "horizontal", contents: [{ type: "text", text: "สถานะระบบ", size: "sm", color: "#64748B" }, { type: "text", text: statusText, size: "sm", color: statusColor, weight: "bold", align: "end" }] },
                        { type: "box", layout: "horizontal", contents: [{ type: "text", text: "อัปเดตล่าสุด", size: "sm", color: "#64748B" }, { type: "text", text: updateTime, size: "sm", color: "#334155", align: "end" }] }
                    ]
                },
                // Device ID & PIN Box
                {
                    type: "box", 
                    layout: "vertical", 
                    background: {
                        type: "linearGradient",
                        angle: "180deg",
                        startColor: "#EFF6FF",
                        endColor: "#DBEAFE"
                    },
                    cornerRadius: "xl", 
                    paddingAll: "xl", 
                    spacing: "md",
                    margin: "lg",
                    contents: [
                        { type: "text", text: "รหัสเชื่อมต่อนาฬิกา", size: "xs", color: "#64748B", align: "center", weight: "bold" },
                        { type: "text", text: `${elderlyAccount.id}`, size: "xxl", weight: "bold", color: "#0F172A", align: "center", margin: "sm" },
                        { type: "separator", margin: "lg", color: "#BFDBFE" },
                        { type: "text", text: `PIN: ${dependentProfile.pin}`, size: "lg", color: "#EF4444", align: "center", weight: "bold", margin: "md" }
                    ]
                }
            ]
        }
    };
};

// =================================================================
// 🤝 6. Borrow/Return - ธีมส้ม (Orange Gradient)
// =================================================================
export const createBorrowReturnFlexMessage = (caregiverProfile: CaregiverProfile, activeBorrow: any): FlexBubble => {
    const liffBase = process.env.LIFF_BASE_URL || "https://liff.line.me/YOUR_LIFF_ID";
    const isBorrowing = !!activeBorrow;
    const borrowUrl = `${liffBase}/borrow/create`;
    const returnUrl = `${liffBase}/borrow/return/${activeBorrow?.id || ''}`;

    return {
        type: "bubble", 
        size: "mega",
        body: {
            type: "box", 
            layout: "vertical", 
            paddingAll: "xl", 
            spacing: "lg",
            contents: [
                // Header with Orange Gradient
                {
                    type: "box", 
                    layout: "vertical", 
                    paddingAll: "xl",
                    background: { 
                        type: "linearGradient", 
                        angle: "135deg", 
                        startColor: "#F97316", 
                        endColor: "#FB923C" 
                    },
                    cornerRadius: "xxl",
                    contents: [
                        { type: "text", text: "ยืม-คืนครุภัณฑ์", weight: "bold", size: "xl", color: "#FFFFFF", align: "center" },
                        { type: "text", text: "ระบบจัดการอุปกรณ์", size: "xs", color: "#FFEDD5", align: "center", margin: "sm" }
                    ]
                },
                // Status Box
                {
                    type: "box", 
                    layout: "vertical", 
                    backgroundColor: isBorrowing ? "#F0FDF4" : "#F8FAFC", 
                    cornerRadius: "xl", 
                    paddingAll: "xl", 
                    borderWidth: "2px", 
                    borderColor: isBorrowing ? "#BBF7D0" : "#E2E8F0",
                    margin: "lg",
                    contents: [
                        { type: "text", text: isBorrowing ? "🟢 กำลังยืมอุปกรณ์" : "⚪ ยังไม่มีรายการยืม", weight: "bold", color: isBorrowing ? "#166534" : "#64748B", align: "center", size: "md" },
                        ...(isBorrowing ? [{ type: "text", text: activeBorrow.items[0]?.equipment?.name, size: "sm", color: "#15803D", align: "center", margin: "md" } as const] : [])
                    ]
                },
                // Buttons
                {
                    type: "box", 
                    layout: "vertical", 
                    spacing: "md",
                    margin: "lg",
                    contents: [
                        { type: "button", style: "primary", color: "#10B981", height: "md", action: { type: "uri", label: "ทำรายการยืม", uri: borrowUrl } },
                        { type: "button", style: "secondary", color: isBorrowing ? "#3B82F6" : "#CBD5E1", height: "md", action: isBorrowing ? { type: "uri", label: "ทำรายการคืน", uri: returnUrl } : { type: "postback", label: "ทำรายการคืน", data: "no_action" } }
                    ]
                }
            ]
        }
    };
};

// =================================================================
// 🛡️ 7. Safety Settings Bubble - ธีมเขียว (Emerald Gradient)
// =================================================================
interface SettingsValues { safezoneLv1: number; safezoneLv2: number; maxTemp: number; maxBpm: number; }

export const createSafetySettingsBubble = (elderlyProfile: DependentProfile, settings: SettingsValues): FlexBubble => {
    const liffBase = process.env.LIFF_BASE_URL || "https://liff.line.me/YOUR_LIFF_ID";
    const elderlyName = `คุณ${elderlyProfile.firstName} ${elderlyProfile.lastName}`;

    return {
        type: "bubble", 
        size: "mega",
        body: {
            type: "box", 
            layout: "vertical", 
            paddingAll: "xl", 
            spacing: "lg",
            contents: [
                // Header with Emerald Gradient
                {
                    type: "box", 
                    layout: "vertical", 
                    paddingAll: "xl",
                    background: { 
                        type: "linearGradient", 
                        angle: "135deg", 
                        startColor: "#141E30", 
                        endColor: "#243B55" 
                    },
                    cornerRadius: "xxl",
                    contents: [
                        { type: "text", text: "ตั้งค่าความปลอดภัย", weight: "bold", size: "xl", color: "#FFFFFF", align: "center" },
                        { type: "text", text: `สำหรับ: ${elderlyName}`, size: "xs", color: "#D1FAE5", align: "center", margin: "sm" }
                    ]
                },
                // Settings Box with Gradient
                {
                    type: "box", 
                    layout: "vertical", 
                    backgroundColor: "#F7FAFF",
                    cornerRadius: "xl", 
                    paddingAll: "lg", 
                    spacing: "md",
                    margin: "lg",
                    contents: [
                        { type: "box", layout: "horizontal", contents: [{ type: "text", text: "รัศมี ชั้นที่ 1", size: "sm", color: "#7B818F" }, { type: "text", text: `${settings.safezoneLv1} ม.`, size: "sm", color: "#065F46", align: "end", weight: "bold" }] },
                        { type: "box", layout: "horizontal", contents: [{ type: "text", text: "รัศมี ชั้นที่ 2", size: "sm", color: "#7B818F" }, { type: "text", text: `${settings.safezoneLv2} ม.`, size: "sm", color: "#065F46", align: "end", weight: "bold" }] },
                        { type: "separator", margin: "md", color: "#E2E8F0" },
                        { type: "box", layout: "horizontal", margin: "md", contents: [{ type: "text", text: "อุณหภูมิสูงสุด", size: "sm", color: "#7B818F" }, { type: "text", text: `${settings.maxTemp} °C`, size: "sm", color: "#F97316", align: "end", weight: "bold" }] },
                        { type: "box", layout: "horizontal", contents: [{ type: "text", text: "ชีพจรสูงสุด", size: "sm", color: "#7B818F" }, { type: "text", text: `${settings.maxBpm} bpm`, size: "sm", color: "#EF4444", align: "end", weight: "bold" }] }
                    ]
                },
                // Buttons
                {
                    type: "box", 
                    layout: "vertical", 
                    spacing: "sm", 
                    margin: "xl",
                    contents: [
                        { type: "button", style: "primary", color: "#243B55", height: "sm", action: { type: "uri", label: "ตั้งค่าเขตปลอดภัย", uri: `${liffBase}/safety-settings/safezone` } },
                        { type: "button", style: "primary", color: "#243B55", height: "sm", action: { type: "uri", label: "ตั้งค่าอุณหภูมิ", uri: `${liffBase}/safety-settings/temperature` } },
                        { type: "button", style: "primary", color: "#243B55", height: "sm", action: { type: "uri", label: "ตั้งค่าชีพจร", uri: `${liffBase}/safety-settings/heartrate` } }
                    ]
                }
            ]
        }
    };
};