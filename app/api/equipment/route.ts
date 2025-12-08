import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/db/prisma'

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const availableEquipment = await prisma.equipment.findMany({
                where: { equipment_status: 1 },
                select: {
                    equipment_id: true,
                    equipment_name: true,
                    equipment_code: true
                }
            });

            return res.status(200).json({ data: availableEquipment });
        } catch (error) {
            console.error("Error fetching available equipment:", error);
            return res.status(500).json({ message: 'ไม่สามารถโหลดรายการอุปกรณ์ได้' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}
