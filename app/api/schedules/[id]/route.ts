import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/schedules/[id] - Update a schedule
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Update only if the schedule belongs to the user
    const schedule = await prisma.schedule.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        name: body.name,
        planningPeriod: body.planningPeriod,
        weekConfig: body.weekConfig,
        people: body.people,
        holidays: body.holidays,
        frSchedule: body.frSchedule,
        frCapacityDays: body.frCapacityDays,
        projects: body.projects,
      },
    });

    if (schedule.count === 0) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Fetch and return the updated schedule
    const updated = await prisma.schedule.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

// DELETE /api/schedules/[id] - Delete a schedule
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete only if the schedule belongs to the user
    await prisma.schedule.deleteMany({
      where: {
        id,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
