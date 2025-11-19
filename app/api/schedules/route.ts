import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/schedules - Get all schedules for the current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedules = await prisma.schedule.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

// POST /api/schedules - Create a new schedule
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const schedule = await prisma.schedule.create({
      data: {
        userId,
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

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
