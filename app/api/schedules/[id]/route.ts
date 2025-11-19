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
    const { data: schedule, error } = await supabase
      .from('schedules')
      .update({
        name: body.name,
        planning_period: body.planningPeriod,
        week_config: body.weekConfig,
        people: body.people,
        holidays: body.holidays,
        fr_schedule: body.frSchedule,
        fr_capacity_days: body.frCapacityDays,
        projects: body.projects,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(transformSchedule(schedule));
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
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
