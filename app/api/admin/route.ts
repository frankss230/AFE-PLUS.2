import type { NextApiRequest, NextApiResponse } from 'next'; 
import prisma from '@/lib/db/prisma';
import { hash, genSalt } from 'bcryptjs';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        const {
            username, password, fname, sname, users_pin,
            users_line_id, users_status_onweb, users_number,
            users_moo, users_road, users_tubon, users_amphur,
            users_province, users_postcode, users_tel1,
            users_alert_battery, users_status_active,
            users_related_borrow, users_token, status_id
        } = req.body;

        // ตรวจสอบว่าข้อมูลครบถ้วน
        if (
            !username || !password || !fname || !sname || 
            typeof users_pin === 'undefined'
        ) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูล Username, Password, ชื่อ, นามสกุล และ PIN' });
        }

        try {
            // เข้ารหัสรหัสผ่าน
            const hashedPassword = await hash(password, await genSalt(10));

            // เพิ่มข้อมูลผู้ใช้ลงในฐานข้อมูล
            const newUser = await prisma.user.create({
                data: {
                    username: username,
                    password: hashedPassword,
                    statusId: status_id || 2, // ใช้ค่า status_id จากคำขอ ถ้าไม่มีให้ใช้ 1 เป็นค่าเริ่มต้น
                    statusOnWeb: users_status_onweb || 1,
                    isActive: users_status_active || 1,
                    lineId: users_line_id || "",
                    firstName: fname,
                    lastName: sname,
                    pin: users_pin,
                    houseNumber: users_number || null,
                    village: users_moo || null,
                    road: users_road || null,
                    subDistrict: users_tubon || null,
                    district: users_amphur || null,
                    province: users_province || null,
                    postalCode: users_postcode || null,
                    phone: users_tel1 || null,
                    alertBattery: users_alert_battery || 0,
                    relatedToBorrow: users_related_borrow || null,
                    token: users_token || null,
                }
            });
            

            return res.status(201).json({ message: 'สร้างบัญชีผู้ใช้สำเร็จ', user: newUser });
        } catch (error) {
            console.error("Error creating user:", error);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้' });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
};

export default handler;
