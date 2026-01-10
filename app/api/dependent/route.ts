import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('q') || '';
    
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.DependentProfileWhereInput = {
        user: { isActive: true }
    };

    if (search) {
        whereCondition.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
        ];
    }

    const [dependents, total] = await Promise.all([
      prisma.dependentProfile.findMany({
        where: whereCondition,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            marital: true,
            birthday: true,
            user: {
                select: {
                    username: true,
                    lineId: true,
                    isActive: true
                }
            },
            caregiver: {
                select: {
                    firstName: true,
                    lastName: true,
                    phone: true
                }
            },
            locations: {
                take: 1,
                orderBy: { timestamp: 'desc' },
                select: {
                    latitude: true,
                    longitude: true,
                    battery: true,
                    status: true,
                    timestamp: true
                }
            }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      
      prisma.dependentProfile.count({
        where: whereCondition
      }),
    ]);

    return NextResponse.json({
      dependents, 
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch dependents' },
      { status: 500 }
    );
  }
}