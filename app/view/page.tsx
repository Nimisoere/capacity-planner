"use client";

import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
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
    assignments: Array<{ personId: number; daysPerWeek: number; startWeek: string; endWeek: string }>;
    notes?: string;
  }>;
}

function SharedViewContent() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get('data');

  // Parse and migrate data directly without effect
  const { data, error } = React.useMemo(() => {
    if (!encoded) {
      return { data: null, error: 'No schedule data found in URL' };
    }

    try {
      const decoded = atob(encoded);
      const parsed = JSON.parse(decoded);

      // Migrate old data that doesn't have per-person start/end weeks
      if (parsed.projects) {
        parsed.projects = parsed.projects.map((project: SharedData['projects'][0]) => ({
          ...project,
          assignments: project.assignments.map((assignment: SharedData['projects'][0]['assignments'][0]) => ({
            ...assignment,
            startWeek: assignment.startWeek || project.startWeek,
            endWeek: assignment.endWeek || project.endWeek,
          })),
        }));
      }

      return { data: parsed as SharedData, error: '' };
    } catch (e) {
      console.error(e);
      return { data: null, error: 'Invalid schedule data' };
    }
  }, [encoded]);

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
    const isFR = data.frSchedule[weekId] === personId;
    if (isFR) return 0;

    const availability = getPersonAvailability(personId, weekId);

    const projectAllocation = data.projects.reduce((total, project) => {
      const assignment = project.assignments.find((a) => a.personId === personId);
      if (!assignment) return total;

      const weekIndex = data.weekConfig.findIndex((w) => w.id === weekId);
      const assignmentStartIndex = data.weekConfig.findIndex((w) => w.id === assignment.startWeek);
      const assignmentEndIndex = data.weekConfig.findIndex((w) => w.id === assignment.endWeek);

      if (weekIndex >= assignmentStartIndex && weekIndex <= assignmentEndIndex) {
        return total + assignment.daysPerWeek;
      }
      return total;
    }, 0);

    // Cap allocation at availability - you can't work more days than available
    return Math.min(projectAllocation, availability);
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
                              const assignment = project.assignments.find((a) => a.personId === person.id);
                              if (!assignment) return false;

                              // Check if this week is within the person's assignment range
                              const weekIndex = data.weekConfig.findIndex((w) => w.id === week.id);
                              const assignmentStartIndex = data.weekConfig.findIndex((w) => w.id === assignment.startWeek);
                              const assignmentEndIndex = data.weekConfig.findIndex((w) => w.id === assignment.endWeek);
                              return weekIndex >= assignmentStartIndex && weekIndex <= assignmentEndIndex;
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
                                    <div className="flex flex-col gap-1">
                                      {personProjects.map((project) => {
                                        const assignment = project.assignments.find((a) => a.personId === person.id);
                                        const startIdx = data.weekConfig.findIndex((w) => w.id === assignment?.startWeek);
                                        const endIdx = data.weekConfig.findIndex((w) => w.id === assignment?.endWeek);
                                        return (
                                          <div key={project.id} className="flex items-start gap-1">
                                            <Badge variant="secondary" className="text-xs">
                                              {project.name}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                              {assignment?.daysPerWeek}d/wk • {formatWeekDateRange(startIdx)} → {formatWeekDateRange(endIdx)}
                                            </span>
                                          </div>
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
            {data.projects.map((project) => {
              const startIdx = data.weekConfig.findIndex((w) => w.id === project.startWeek);
              const endIdx = data.weekConfig.findIndex((w) => w.id === project.endWeek);
              const projectWeeks = data.weekConfig.slice(startIdx, endIdx + 1);

              // Calculate planned capacity (what's assigned)
              const plannedCapacity = projectWeeks.reduce((total, week) => {
                const weekIndex = data.weekConfig.findIndex((w) => w.id === week.id);

                const weekCapacity = project.assignments.reduce((sum, assignment) => {
                  const assignmentStartIdx = data.weekConfig.findIndex((w) => w.id === assignment.startWeek);
                  const assignmentEndIdx = data.weekConfig.findIndex((w) => w.id === assignment.endWeek);

                  if (weekIndex >= assignmentStartIdx && weekIndex <= assignmentEndIdx) {
                    return sum + assignment.daysPerWeek;
                  }
                  return sum;
                }, 0);

                return total + weekCapacity;
              }, 0);

              // Calculate actual available capacity (considering holidays, FR, availability)
              const actualCapacity = projectWeeks.reduce((total, week) => {
                const weekIndex = data.weekConfig.findIndex((w) => w.id === week.id);

                const weekCapacity = project.assignments.reduce((sum, assignment) => {
                  const assignmentStartIdx = data.weekConfig.findIndex((w) => w.id === assignment.startWeek);
                  const assignmentEndIdx = data.weekConfig.findIndex((w) => w.id === assignment.endWeek);

                  if (weekIndex >= assignmentStartIdx && weekIndex <= assignmentEndIdx) {
                    const personCapacity = getPersonCapacity(assignment.personId, week.id);
                    // Person can contribute min of their assignment or their available capacity
                    return sum + Math.min(assignment.daysPerWeek, personCapacity);
                  }
                  return sum;
                }, 0);

                return total + weekCapacity;
              }, 0);

              return (
              <div key={project.id} className="border rounded-lg p-4 space-y-2">
                <div>
                  <h4 className="font-semibold">{project.name}</h4>
                  <div className={`text-xs font-medium ${actualCapacity < plannedCapacity ? 'text-warning' : 'text-muted-foreground'}`}>
                    {actualCapacity.toFixed(0)} / {plannedCapacity.toFixed(0)} days
                    {plannedCapacity > 0 && (
                      <span className="ml-1">
                        ({((actualCapacity / plannedCapacity) * 100).toFixed(0)}%)
                      </span>
                    )}
                    {actualCapacity < plannedCapacity && <span className="ml-1">⚠ Reduced by holidays/FR</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  {project.assignments.map((assignment) => {
                    const person = data.people.find((p) => p.id === assignment.personId);
                    const assignmentStartIdx = data.weekConfig.findIndex((w) => w.id === assignment.startWeek);
                    const assignmentEndIdx = data.weekConfig.findIndex((w) => w.id === assignment.endWeek);
                    return (
                      <div key={assignment.personId} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{person?.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {assignment.daysPerWeek}d/week
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatWeekDateRange(assignmentStartIdx)} → {formatWeekDateRange(assignmentEndIdx)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {project.notes && (
                  <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">{project.notes}</p>
                )}
              </div>
              );
            })}
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
