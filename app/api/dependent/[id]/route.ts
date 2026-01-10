import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dependentId = parseInt(params.id);

    const dependent = await prisma.dependentProfile.findUnique({
      where: { id: dependentId },
      include: {
        user: {
            select: { username: true, lineId: true, isActive: true }
        },
        caregiver: {
            select: { firstName: true, lastName: true, phone: true }
        }
      }
    });

    if (!dependent) {
      return NextResponse.json({ error: 'Dependent not found' }, { status: 404 });
    }

    return NextResponse.json({ dependent });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch dependent' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.statusId !== 1) { 
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dependentId = parseInt(params.id);
    const body = await request.json();

    const updatedDependent = await prisma.dependentProfile.update({
        where: { id: dependentId },
        data: {
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            gender: body.gender,
            birthday: body.birthday ? new Date(body.birthday) : undefined,
            caregiverId: body.caregiverId ? parseInt(body.caregiverId) : undefined,
        }
    });

    return NextResponse.json({ success: true, dependent: updatedDependent });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: 'Failed to update dependent' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.statusId !== 1) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dependentId = parseInt(params.id);

    const dependent = await prisma.dependentProfile.findUnique({
        where: { id: dependentId },
        select: { userId: true }
    });

    if (!dependent) {
        return NextResponse.json({ error: 'Dependent not found' }, { status: 404 });
    }

    await prisma.user.delete({
        where: { id: dependent.userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: 'Failed to delete dependent' }, { status: 500 });
  }
}