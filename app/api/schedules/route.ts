import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Transform database snake_case to frontend camelCase
const transformSchedule = (schedule: any) => ({
  id: schedule.id,
  name: schedule.name,
  createdAt: schedule.created_at,
  updatedAt: schedule.updated_at,
  planningPeriod: schedule.planning_period,
  weekConfig: schedule.week_config,
  people: schedule.people,
  holidays: schedule.holidays,
  frSchedule: schedule.fr_schedule,
  frCapacityDays: schedule.fr_capacity_days,
  projects: schedule.projects,
});

// GET /api/schedules - Get all schedules for the current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const transformed = (schedules || []).map(transformSchedule);
    return NextResponse.json(transformed);
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

    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert({
        user_id: userId,
        name: body.name,
        planning_period: body.planningPeriod,
        week_config: body.weekConfig,
        people: body.people,
        holidays: body.holidays,
        fr_schedule: body.frSchedule,
        fr_capacity_days: body.frCapacityDays,
        projects: body.projects,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(transformSchedule(schedule));
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
