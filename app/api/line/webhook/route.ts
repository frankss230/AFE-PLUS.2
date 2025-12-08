import { NextRequest, NextResponse } from 'next/server';
import { WebhookEvent, validateSignature } from '@line/bot-sdk';
import { lineClient } from '@/lib/line/client';
import { env } from '@/config/env';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 401 });
    }

    // Validate signature
    if (!validateSignature(body, env.LINE_CHANNEL_SECRET, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const events: WebhookEvent[] = JSON.parse(body).events;

    await Promise.all(
      events.map(async (event) => {
        if (event.type === 'message' && event.message.type === 'text') {
          const userId = event.source.userId;
          if (!userId) return;

          const text = event.message.text.toLowerCase();

          // Handle different commands
          if (text.includes('ลงทะเบียน') || text.includes('register')) {
            const user = await prisma.user.findFirst({
              where: { lineId: userId },
            });

            if (user) {
              await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: 'คุณได้ลงทะเบียนแล้ว ✅',
              });
            } else {
              await lineClient.replyMessage(event.replyToken, {
                type: 'template',
                altText: 'ลงทะเบียนใช้งาน',
                template: {
                  type: 'buttons',
                  text: 'กรุณาลงทะเบียนเพื่อใช้งานระบบ',
                  actions: [
                    {
                      type: 'uri',
                      label: '📝 ลงทะเบียน',
                      uri: `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_ID}`,
                    },
                  ],
                },
              });
            }
          } else if (text.includes('ตำแหน่ง') || text.includes('location')) {
            await lineClient.replyMessage(event.replyToken, {
              type: 'template',
              altText: 'ดูตำแหน่ง',
              template: {
                type: 'buttons',
                text: 'ดูตำแหน่งผู้สูงอายุ',
                actions: [
                  {
                    type: 'uri',
                    label: '📍 ดูตำแหน่ง',
                    uri: `${env.NEXT_PUBLIC_APP_URL}/location`,
                  },
                ],
              },
            });
          } else {
            await lineClient.replyMessage(event.replyToken, {
              type: 'text',
              text: 'สวัสดีครับ 👋\n\nคำสั่งที่ใช้ได้:\n- ลงทะเบียน\n- ตำแหน่ง\n- โปรไฟล์',
            });
          }
        }

        // Handle follow event
        if (event.type === 'follow') {
          const userId = event.source.userId;
          if (!userId) return;

          await lineClient.pushMessage(userId, {
            type: 'text',
            text: 'ยินดีต้อนรับสู่ระบบติดตามสุขภาพผู้สูงอายุ 🏥\n\nพิมพ์ "ลงทะเบียน" เพื่อเริ่มใช้งาน',
          });
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook failed' },
      { status: 500 }
    );
  }
}