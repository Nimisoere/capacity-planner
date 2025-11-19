"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface SharedData {
  name: string;
  planningPeriod: { startDate: string; numberOfWeeks: number };
  weekConfig: Array<{ id: string; name: string; workingDays: number }>;
  people: Array<{ id: number; name: string }>;
  holidays: Record<string, number>;
  frSchedule: Record<string, number>;
  frCapacityDays: number;
  projects: Array<{
    id: number;
    name: string;
    startWeek: string;
    endWeek: string;
    assignments: Array<{ personId: number; daysPerWeek: number }>;
    notes?: string;
  }>;
}

function SharedViewContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const encoded = searchParams.get('data');
    if (!encoded) {
      setError('No schedule data found in URL');
      return;
    }

    try {
      const decoded = atob(encoded);
      const parsed = JSON.parse(decoded);
      setData(parsed);
    } catch (e) {
      setError('Invalid schedule data');
      console.error(e);
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader>
            <CardTitle>Error Loading Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading schedule...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatWeekDateRange = (weekIndex: number) => {
    const startDate = new Date(data.planningPeriod.startDate);
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + weekIndex * 7);
    const endDate = new Date(weekDate);
    endDate.setDate(weekDate.getDate() + 6);

    const formatDate = (date: Date) => {
      const month = date.toLocaleDateString('en-GB', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };

    return `${formatDate(weekDate)} - ${formatDate(endDate)}`;
  };

  const getPersonAvailability = (personId: number, weekId: string) => {
    const week = data.weekConfig.find((w) => w.id === weekId);
    if (!week) return 0;
    const holidayDays = data.holidays[`${personId}-${weekId}`] || 0;
    return Math.max(0, week.workingDays - holidayDays);
  };

  const getPersonCapacity = (personId: number, weekId: string) => {
    const availability = getPersonAvailability(personId, weekId);
    const isFR = data.frSchedule[weekId] === personId;
    return Math.max(0, availability - (isFR ? data.frCapacityDays : 0));
  };

  const getPersonAllocated = (personId: number, weekId: string) => {
    return data.projects.reduce((total, project) => {
      const weekIndex = data.weekConfig.findIndex((w) => w.id === weekId);
      const startIndex = data.weekConfig.findIndex((w) => w.id === project.startWeek);
      const endIndex = data.weekConfig.findIndex((w) => w.id === project.endWeek);

      if (weekIndex >= startIndex && weekIndex <= endIndex) {
        const assignment = project.assignments.find((a) => a.personId === personId);
        if (assignment) {
          return total + assignment.daysPerWeek;
        }
      }
      return total;
    }, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            Read-Only View
          </div>
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date(data.planningPeriod.startDate).toLocaleDateString('en-GB', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            • {data.planningPeriod.numberOfWeeks} weeks
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Schedule</CardTitle>
          <CardDescription>View each team member&apos;s allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.people.map((person) => {
              const totalAllocated = data.weekConfig.reduce(
                (sum, week) => sum + getPersonAllocated(person.id, week.id),
                0
              );
              const totalCapacity = data.weekConfig.reduce(
                (sum, week) => sum + getPersonCapacity(person.id, week.id),
                0
              );
              const utilizationPercent = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;
              const isOverallocated = totalAllocated > totalCapacity;

              return (
                <Collapsible key={person.id} className="border rounded-lg">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <ChevronDown className="w-5 h-5 transition-transform [[data-state=open]>&]:rotate-180" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">{person.name}</h3>
                        <div className="text-sm text-muted-foreground">
                          {totalAllocated.toFixed(1)}d / {totalCapacity.toFixed(1)}d allocated •{' '}
                          {utilizationPercent.toFixed(0)}% utilization
                        </div>
                      </div>
                    </div>
                    {isOverallocated && (
                      <Badge variant="destructive" className="ml-auto mr-2">
                        Over-allocated
                      </Badge>
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="overflow-x-auto mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-32">Week</TableHead>
                            <TableHead>Availability</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Allocated</TableHead>
                            <TableHead>Projects</TableHead>
                            <TableHead className="text-right">Free Days</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.weekConfig.map((week, idx) => {
                            const availability = getPersonAvailability(person.id, week.id);
                            const capacity = getPersonCapacity(person.id, week.id);
                            const allocated = getPersonAllocated(person.id, week.id);
                            const isFR = data.frSchedule[week.id] === person.id;
                            const free = capacity - allocated;
                            const isOver = allocated > capacity;

                            const personProjects = data.projects.filter((project) => {
                              const weekIndex = data.weekConfig.findIndex((w) => w.id === week.id);
                              const startIndex = data.weekConfig.findIndex((w) => w.id === project.startWeek);
                              const endIndex = data.weekConfig.findIndex((w) => w.id === project.endWeek);
                              const isInRange = weekIndex >= startIndex && weekIndex <= endIndex;
                              const hasAssignment = project.assignments.find((a) => a.personId === person.id);
                              return isInRange && hasAssignment;
                            });

                            return (
                              <TableRow key={week.id} className={isOver ? 'bg-destructive/10' : ''}>
                                <TableCell className="font-medium text-sm">{formatWeekDateRange(idx)}</TableCell>
                                <TableCell className="text-sm">
                                  {availability}d{' '}
                                  {isFR && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                                      FR
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">{capacity}d</TableCell>
                                <TableCell className="text-sm font-semibold">{allocated.toFixed(1)}d</TableCell>
                                <TableCell className="text-sm">
                                  {personProjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {personProjects.map((project) => {
                                        const assignment = project.assignments.find((a) => a.personId === person.id);
                                        return (
                                          <Badge key={project.id} variant="secondary" className="text-xs">
                                            {project.name} ({assignment?.daysPerWeek}d)
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell
                                  className={`text-right font-semibold ${
                                    isOver ? 'text-destructive' : 'text-green-600'
                                  }`}
                                >
                                  {free.toFixed(1)}d
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">{project.name}</h4>
                <div className="flex flex-wrap gap-2 text-sm">
                  {project.assignments.map((assignment) => {
                    const person = data.people.find((p) => p.id === assignment.personId);
                    return (
                      <Badge key={assignment.personId} variant="outline">
                        {person?.name} - {assignment.daysPerWeek}d/week
                      </Badge>
                    );
                  })}
                </div>
                {project.notes && (
                  <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">{project.notes}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground py-4">
        <p>This is a read-only view. To create or edit schedules, visit Team Planner.</p>
      </div>
    </div>
  );
}

export default function SharedView() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SharedViewContent />
    </Suspense>
  );
}
