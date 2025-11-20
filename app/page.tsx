"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Users, Calendar, TrendingUp, Settings, Download, Upload, ChevronDown, Share2, Loader2 } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const createDefaultSchedule = (): Schedule => ({
  id: Date.now().toString(),
  name: 'My Schedule',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  planningPeriod: { startDate: '2025-11-24', numberOfWeeks: 6 },
  weekConfig: [
    { id: 'W1', name: 'Week 1', workingDays: 5 },
    { id: 'W2', name: 'Week 2', workingDays: 5 },
    { id: 'W3', name: 'Week 3', workingDays: 4 },
    { id: 'W4', name: 'Week 4', workingDays: 5 },
    { id: 'W5', name: 'Week 5', workingDays: 5 },
    { id: 'W6', name: 'Week 6', workingDays: 5 },
  ],
  people: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ],
  holidays: {
    '1-W1': 0, '1-W2': 2, '1-W3': 0, '1-W4': 0, '1-W5': 5, '1-W6': 0,
    '2-W1': 0, '2-W2': 0, '2-W3': 0, '2-W4': 0, '2-W5': 0, '2-W6': 0,
    '3-W1': 0, '3-W2': 0, '3-W3': 0, '3-W4': 3, '3-W5': 0, '3-W6': 0,
  },
  frSchedule: {},
  frCapacityDays: 3,
  projects: [
    {
      id: 1,
      name: 'API Migration',
      startWeek: 'W1',
      endWeek: 'W3',
      assignments: [
        { personId: 1, daysPerWeek: 3, startWeek: 'W1', endWeek: 'W3' },
        { personId: 2, daysPerWeek: 4, startWeek: 'W1', endWeek: 'W3' },
      ],
    },
  ],
});

interface Person {
  id: number;
  name: string;
}

interface WeekConfig {
  id: string;
  name: string;
  workingDays: number;
}

interface ProjectAssignment {
  personId: number;
  daysPerWeek: number;
  startWeek: string;
  endWeek: string;
}

interface Project {
  id: number;
  name: string;
  startWeek: string;
  endWeek: string;
  assignments: ProjectAssignment[];
  notes?: string;
}

interface PlanningPeriod {
  startDate: string;
  numberOfWeeks: number;
}

interface Schedule {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  planningPeriod: PlanningPeriod;
  weekConfig: WeekConfig[];
  people: Person[];
  holidays: Record<string, number>;
  frSchedule: Record<string, number>;
  frCapacityDays: number;
  projects: Project[];
}

export default function CapacityPlanner() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'schedule'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load schedules from database on mount
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/schedules');
        if (!response.ok) {
          throw new Error('Failed to load schedules');
        }
        const data = await response.json();

        // If no schedules exist, create a default one
        if (data.length === 0) {
          const newSchedule = createDefaultSchedule();
          const createResponse = await fetch('/api/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSchedule),
          });

          if (createResponse.ok) {
            const created = await createResponse.json();
            setSchedules([created]);
            setSelectedScheduleId(created.id);
          } else {
            setError('Failed to create initial schedule');
          }
        } else {
          setSchedules(data);
          if (!selectedScheduleId) {
            setSelectedScheduleId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading schedules:', err);
        setError('Failed to load schedules from database');
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedules();
  }, []);

  const currentSchedule = schedules.find((s) => s.id === selectedScheduleId);

  const [planningPeriod, setPlanningPeriod] = useState<PlanningPeriod>(
    currentSchedule?.planningPeriod || { startDate: '2025-11-24', numberOfWeeks: 6 }
  );
  const [weekConfig, setWeekConfig] = useState<WeekConfig[]>(
    currentSchedule?.weekConfig || []
  );
  const [people, setPeople] = useState<Person[]>(
    currentSchedule?.people || []
  );
  const [holidays, setHolidays] = useState<Record<string, number>>(
    currentSchedule?.holidays || {}
  );
  const [frSchedule, setFrSchedule] = useState<Record<string, number>>(
    currentSchedule?.frSchedule || {}
  );
  const [frCapacityDays, setFrCapacityDays] = useState<number>(
    currentSchedule?.frCapacityDays || 3
  );
  const [projects, setProjects] = useState<Project[]>(
    currentSchedule?.projects || []
  );

  const [showWeekConfig, setShowWeekConfig] = useState(false);

  // Load schedule data when switching schedules
  useEffect(() => {
    if (currentSchedule) {
      setPlanningPeriod(currentSchedule.planningPeriod);
      setWeekConfig(currentSchedule.weekConfig);
      setPeople(currentSchedule.people);
      setHolidays(currentSchedule.holidays);
      setFrSchedule(currentSchedule.frSchedule);
      setFrCapacityDays(currentSchedule.frCapacityDays);

      // Migrate old projects that don't have per-person start/end weeks
      const migratedProjects = currentSchedule.projects.map((project) => ({
        ...project,
        assignments: project.assignments.map((assignment) => ({
          ...assignment,
          startWeek: assignment.startWeek || project.startWeek,
          endWeek: assignment.endWeek || project.endWeek,
        })),
      }));
      setProjects(migratedProjects);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScheduleId]);

  // Save current schedule changes to database
  useEffect(() => {
    if (!selectedScheduleId || isLoading) return;

    const saveSchedule = async () => {
      try {
        setIsSaving(true);
        const updatedSchedule = {
          planningPeriod,
          weekConfig,
          people,
          holidays,
          frSchedule,
          frCapacityDays,
          projects,
        };

        const response = await fetch(`/api/schedules/${selectedScheduleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSchedule),
        });

        if (!response.ok) {
          throw new Error('Failed to save schedule');
        }

        const savedSchedule = await response.json();

        // Update local state with saved data
        setSchedules((prev) =>
          prev.map((s) => (s.id === selectedScheduleId ? savedSchedule : s))
        );
      } catch (err) {
        console.error('Error saving schedule:', err);
        setError('Failed to save changes to database');
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce saves to avoid too many requests
    const timeoutId = setTimeout(saveSchedule, 1000);
    return () => clearTimeout(timeoutId);
  }, [planningPeriod, weekConfig, people, holidays, frSchedule, frCapacityDays, projects, selectedScheduleId, isLoading]);

  const createSchedule = async () => {
    try {
      const newSchedule = createDefaultSchedule();
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });

      if (!response.ok) {
        throw new Error('Failed to create schedule');
      }

      const created = await response.json();
      setSchedules([...schedules, created]);
      setSelectedScheduleId(created.id);
      setView('schedule');
    } catch (err) {
      console.error('Error creating schedule:', err);
      setError('Failed to create schedule');
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (schedules.length === 1) {
      alert('Cannot delete the last schedule');
      return;
    }
    if (confirm('Are you sure you want to delete this schedule?')) {
      try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete schedule');
        }

        const newSchedules = schedules.filter((s) => s.id !== scheduleId);
        setSchedules(newSchedules);
        if (selectedScheduleId === scheduleId) {
          setSelectedScheduleId(newSchedules[0]?.id || null);
          setView('list');
        }
      } catch (err) {
        console.error('Error deleting schedule:', err);
        setError('Failed to delete schedule');
      }
    }
  };

  const renameSchedule = async (scheduleId: string, newName: string) => {
    try {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return;

      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...schedule, name: newName }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename schedule');
      }

      const updated = await response.json();
      setSchedules(schedules.map((s) => (s.id === scheduleId ? updated : s)));
    } catch (err) {
      console.error('Error renaming schedule:', err);
      setError('Failed to rename schedule');
    }
  };

  const duplicateSchedule = async (scheduleId: string) => {
    try {
      const scheduleToDuplicate = schedules.find((s) => s.id === scheduleId);
      if (!scheduleToDuplicate) return;

      const newSchedule = {
        ...scheduleToDuplicate,
        name: `${scheduleToDuplicate.name} (Copy)`,
      };

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate schedule');
      }

      const created = await response.json();
      setSchedules([...schedules, created]);
    } catch (err) {
      console.error('Error duplicating schedule:', err);
      setError('Failed to duplicate schedule');
    }
  };

  const openSchedule = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setView('schedule');
  };

  const shareSchedule = () => {
    if (!currentSchedule) return;

    // Create a compressed version of the schedule data
    const shareData = {
      name: currentSchedule.name,
      planningPeriod,
      weekConfig,
      people,
      holidays,
      frSchedule,
      frCapacityDays,
      projects,
    };

    // Encode the data in base64
    const encoded = btoa(JSON.stringify(shareData));

    // Create shareable URL
    const shareUrl = `${window.location.origin}/view?data=${encoded}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Shareable link copied to clipboard! Anyone with this link can view (but not edit) your schedule.');
    }).catch(() => {
      // Fallback: show the URL in a prompt
      prompt('Copy this shareable link:', shareUrl);
    });
  };

  const exportData = () => {
    if (!currentSchedule) return;

    // Create CSV header
    const headers = ['Person', ...weekConfig.map((_, idx) => formatWeekDateRange(idx)), 'Total Allocated', 'Total Capacity', 'Utilization %'];

    // Create CSV rows
    const rows = people.map((person) => {
      const weekData = weekConfig.map((week) => {
        const capacity = getPersonCapacity(person.id, week.id);
        const allocated = getPersonAllocated(person.id, week.id);
        return `${allocated.toFixed(1)}/${capacity.toFixed(1)}`;
      });

      const totalAllocated = weekConfig.reduce((sum, week) => sum + getPersonAllocated(person.id, week.id), 0);
      const totalCapacity = weekConfig.reduce((sum, week) => sum + getPersonCapacity(person.id, week.id), 0);
      const utilization = totalCapacity > 0 ? ((totalAllocated / totalCapacity) * 100).toFixed(0) : '0';

      return [person.name, ...weekData, totalAllocated.toFixed(1), totalCapacity.toFixed(1), utilization];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSchedule.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };



  const getWeekDate = (weekIndex: number) => {
    const startDate = new Date(planningPeriod.startDate);
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + weekIndex * 7);
    return weekDate;
  };

  const formatWeekDateRange = (weekIndex: number) => {
    const startDate = getWeekDate(weekIndex);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const formatDate = (date: Date) => {
      const month = date.toLocaleDateString('en-GB', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const updateNumberOfWeeks = (newNumber: number) => {
    const oldNumber = weekConfig.length;
    const newPeriod = { ...planningPeriod, numberOfWeeks: newNumber };
    setPlanningPeriod(newPeriod);

    if (newNumber > oldNumber) {
      const newWeeks: { id: string; name: string; workingDays: number; }[] = [];
      for (let i = oldNumber; i < newNumber; i++) {
        newWeeks.push({
          id: `W${i + 1}`,
          name: `Week ${i + 1}`,
          workingDays: 5,
        });
      }
      setWeekConfig([...weekConfig, ...newWeeks]);

      const newHolidays = { ...holidays };
      people.forEach((person) => {
        newWeeks.forEach((week) => {
          newHolidays[`${person.id}-${week.id}`] = 0;
        });
      });
      setHolidays(newHolidays);
    } else if (newNumber < oldNumber) {
      const weeksToKeep = weekConfig.slice(0, newNumber);
      setWeekConfig(weeksToKeep);

      const weeksToRemove = weekConfig.slice(newNumber);
      const weekIdsToRemove = weeksToRemove.map((w) => w.id);

      const newHolidays = { ...holidays };
      Object.keys(newHolidays).forEach((key) => {
        const weekId = key.split('-')[1];
        if (weekIdsToRemove.includes(weekId)) {
          delete newHolidays[key];
        }
      });
      setHolidays(newHolidays);

      const newFR = { ...frSchedule };
      weekIdsToRemove.forEach((weekId) => {
        delete newFR[weekId];
      });
      setFrSchedule(newFR);
    }
  };

  const getPersonAvailability = (personId: number, weekId: string) => {
    const week = weekConfig.find((w) => w.id === weekId);
    if (!week) return 0;

    const holidayDays = holidays[`${personId}-${weekId}`] || 0;
    return Math.max(0, week.workingDays - holidayDays);
  };

  const getPersonCapacity = (personId: number, weekId: string) => {
    const availability = getPersonAvailability(personId, weekId);
    const isFR = frSchedule[weekId] === personId;

    // If FR, subtract FR days from available days
    // e.g., 5 available - 3 FR = 2 days for projects
    return Math.max(0, availability - (isFR ? frCapacityDays : 0));
  };

  const getPersonAllocated = (personId: number, weekId: string) => {
    const isFR = frSchedule[weekId] === personId;

    // If person is FR this week, they're not working on projects
    if (isFR) {
      return 0;
    }

    const availability = getPersonAvailability(personId, weekId);

    const projectAllocation = projects.reduce((total, project) => {
      const assignment = project.assignments.find((a) => a.personId === personId);
      if (!assignment) return total;

      // Check if this week is within the person's assignment range
      const weekIndex = weekConfig.findIndex((w) => w.id === weekId);
      const assignmentStartIndex = weekConfig.findIndex((w) => w.id === assignment.startWeek);
      const assignmentEndIndex = weekConfig.findIndex((w) => w.id === assignment.endWeek);

      if (weekIndex >= assignmentStartIndex && weekIndex <= assignmentEndIndex) {
        return total + assignment.daysPerWeek;
      }
      return total;
    }, 0);

    // Cap allocation at availability - you can't work more days than available
    return Math.min(projectAllocation, availability);
  };

  const getTeamAverageAvailability = (weekId: string) => {
    if (people.length === 0) return 0;
    const total = people.reduce((sum, person) => sum + getPersonAvailability(person.id, weekId), 0);
    return total / people.length;
  };

  const getRangeStats = (startWeekId: string, endWeekId: string) => {
    const startIdx = weekConfig.findIndex((w) => w.id === startWeekId);
    const endIdx = weekConfig.findIndex((w) => w.id === endWeekId);
    const weeks = weekConfig.slice(startIdx, endIdx + 1);

    let totalAvailability = 0;
    let totalCapacity = 0;
    let totalAllocated = 0;

    weeks.forEach((week) => {
      people.forEach((person) => {
        totalAvailability += getPersonAvailability(person.id, week.id);
        totalCapacity += getPersonCapacity(person.id, week.id);
        totalAllocated += getPersonAllocated(person.id, week.id);
      });
    });

    return {
      totalAvailability,
      totalCapacity,
      totalAllocated,
      avgAvailabilityPerWeek: totalAvailability / weeks.length,
      avgCapacityPerWeek: totalCapacity / weeks.length,
      utilizationPercent: totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0,
    };
  };

  const addPerson = () => {
    const newId = Math.max(0, ...people.map((p) => p.id)) + 1;
    const newPerson = { id: newId, name: `Person ${newId}` };
    setPeople([...people, newPerson]);

    const newHolidays = { ...holidays };
    weekConfig.forEach((week) => {
      newHolidays[`${newId}-${week.id}`] = 0;
    });
    setHolidays(newHolidays);
  };

  const updatePerson = (personId: number, name: string) => {
    setPeople(people.map((p) => (p.id === personId ? { ...p, name } : p)));
  };

  const deletePerson = (personId: number) => {
    setPeople(people.filter((p) => p.id !== personId));
    const newHolidays = { ...holidays };
    Object.keys(newHolidays).forEach((key) => {
      if (key.startsWith(`${personId}-`)) delete newHolidays[key];
    });
    setHolidays(newHolidays);

    const newFR = { ...frSchedule };
    Object.keys(newFR).forEach((week) => {
      if (newFR[week] === personId) delete newFR[week];
    });
    setFrSchedule(newFR);
  };

  const setHoliday = (personId: number, weekId: string, days: string) => {
    setHolidays({
      ...holidays,
      [`${personId}-${weekId}`]: parseFloat(days) || 0,
    });
  };

  const setFR = (weekId: string, personId: string) => {
    const id = personId ? parseInt(personId) : null;
    setFrSchedule({ ...frSchedule, [weekId]: id || 0 });
  };

  const addProject = () => {
    const newProject = {
      id: Date.now(),
      name: `Project ${projects.length + 1}`,
      startWeek: weekConfig[0].id,
      endWeek: weekConfig[2].id,
      assignments: [],
    };
    setProjects([...projects, newProject]);
  };

  const updateProject = (projectId: number, updates: Partial<Project>) => {
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)));
  };

  const deleteProject = (projectId: number) => {
    setProjects(projects.filter((p) => p.id !== projectId));
  };

  const addAssignment = (projectId: number, personId: number) => {
    setProjects(
      projects.map((p) => {
        if (p.id === projectId && !p.assignments.find((a) => a.personId === personId)) {
          return {
            ...p,
            assignments: [...p.assignments, {
              personId,
              daysPerWeek: 2,
              startWeek: p.startWeek,
              endWeek: p.endWeek
            }],
          };
        }
        return p;
      })
    );
  };

  const updateAssignment = (projectId: number, personId: number, updates: Partial<ProjectAssignment>) => {
    setProjects(
      projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            assignments: p.assignments.map((a) =>
              a.personId === personId ? { ...a, ...updates } : a
            ),
          };
        }
        return p;
      })
    );
  };

  const removeAssignment = (projectId: number, personId: number) => {
    setProjects(
      projects.map((p) => {
        if (p.id === projectId) {
          return { ...p, assignments: p.assignments.filter((a) => a.personId !== personId) };
        }
        return p;
      })
    );
  };

  const quarterStats = getRangeStats(weekConfig[0]?.id, weekConfig[weekConfig.length - 1]?.id);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 border-muted">
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-base text-muted-foreground">Loading schedules...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-8 space-y-8 max-w-6xl">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Team Planner
              </h1>
              <p className="text-sm text-muted-foreground">Manage your team capacity and projects</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={createSchedule}>
                <Plus className="w-4 h-4 mr-2" />
                New Schedule
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="hover:bg-muted/30 transition-colors border-muted">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Input
                      value={schedule.name}
                      onChange={(e) => renameSchedule(schedule.id, e.target.value)}
                      className="text-lg font-semibold border-0 px-0 focus-visible:ring-1 mb-2 bg-transparent"
                    />
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        {schedule.people.length} people • {schedule.projects.length} projects
                      </div>
                      <div>
                        {new Date(schedule.planningPeriod?.startDate).toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {schedule.planningPeriod.numberOfWeeks} weeks
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => openSchedule(schedule.id)} size="sm">
                      Open
                    </Button>
                    <Button onClick={() => duplicateSchedule(schedule.id)} variant="outline" size="sm">
                      Duplicate
                    </Button>
                    <Button
                      onClick={() => deleteSchedule(schedule.id)}
                      variant="ghost"
                      size="icon"
                      disabled={schedules.length === 1}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <Button onClick={() => setView('list')} variant="ghost" size="sm" className="mb-2">
              ← Back
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{currentSchedule?.name}</h1>
              {isSaving && (
                <Badge variant="secondary" className="text-xs">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={shareSchedule} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button onClick={() => deleteSchedule(currentSchedule?.id || '')} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
            <UserButton />
          </div>
        </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1 h-auto">
          <TabsTrigger value="setup" className="data-[state=active]:bg-background text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="capacity" className="data-[state=active]:bg-background text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Capacity
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-background text-sm">
            <Users className="w-4 h-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-background text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4 mt-4">
          <Card className="bg-muted/20 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Planning Period</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={planningPeriod.startDate}
                  onChange={(e) => setPlanningPeriod({ ...planningPeriod, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="num-weeks">Number of Weeks</Label>
                <Input
                  id="num-weeks"
                  type="number"
                  min="0"
                  max="26"
                  placeholder="Number of weeks"
                  defaultValue={planningPeriod.numberOfWeeks}
                  key={`weeks-${planningPeriod.numberOfWeeks}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== '') {
                      updateNumberOfWeeks(parseInt(val) || 0);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="text"
                  value={(() => {
                    const endDate = getWeekDate(planningPeriod.numberOfWeeks - 1);
                    endDate.setDate(endDate.getDate() + 6);
                    return endDate.toISOString().split('T')[0];
                  })()}
                  disabled
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-muted">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Team Setup</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={showWeekConfig} onOpenChange={setShowWeekConfig}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Weeks
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Week Configuration</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        {weekConfig.map((week, idx) => (
                          <div key={week.id} className="flex items-center gap-3">
                            <div className="flex-1 space-y-1">
                              <Input
                                value={week.name}
                                onChange={(e) => {
                                  const newConfig = [...weekConfig];
                                  newConfig[idx].name = e.target.value;
                                  setWeekConfig(newConfig);
                                }}
                                className="w-full"
                              />
                              <div className="text-xs text-muted-foreground pl-3">
                                {formatWeekDateRange(idx)}
                              </div>
                            </div>
                            <Label className="flex items-center gap-2 whitespace-nowrap">
                              Working days:
                              <Input
                                type="number"
                                min="0"
                                max="5"
                                defaultValue={week.workingDays}
                                key={`working-${week.id}-${week.workingDays}`}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val !== '') {
                                    const newConfig = [...weekConfig];
                                    newConfig[idx].workingDays = parseInt(val) || 0;
                                    setWeekConfig(newConfig);
                                  }
                                }}
                                className="w-16"
                              />
                            </Label>
                          </div>
                        ))}
                        <div className="pt-4">
                          <Label>FR Capacity (days per week)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="5"
                            defaultValue={frCapacityDays}
                            key={`fr-${frCapacityDays}`}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== '') {
                                setFrCapacityDays(parseInt(val) || 0);
                              }
                            }}
                            className="w-32 mt-2"
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={addPerson} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Person
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b hover:bg-transparent">
                      <TableHead className="text-left p-2 font-medium text-xs">Person</TableHead>
                      {weekConfig.map((week, idx) => (
                        <TableHead key={week.id} className="text-center p-2 font-medium text-xs">
                          <div className="font-medium">{formatWeekDateRange(idx)}</div>
                          <div className="text-xs text-muted-foreground font-normal">{week.workingDays}d</div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center p-2 font-medium text-xs">Avg</TableHead>
                      <TableHead className="p-2"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {people.map((person) => {
                      const avgAvail =
                        weekConfig.reduce((sum, week) => sum + getPersonAvailability(person.id, week.id), 0) /
                        weekConfig.length;

                      return (
                        <TableRow key={person.id} className="border-b hover:bg-muted/20">
                          <TableCell className="p-2">
                            <Input
                              value={person.name}
                              onChange={(e) => updatePerson(person.id, e.target.value)}
                              className="w-full h-8 text-sm"
                            />
                          </TableCell>
                          {weekConfig.map((week) => {
                            const availability = getPersonAvailability(person.id, week.id);
                            const holidayDays = holidays[`${person.id}-${week.id}`] || 0;

                            return (
                              <TableCell key={week.id} className="p-2">
                                <div className="text-center space-y-1">
                                  <div className="text-xs font-medium">{availability}d</div>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={week.workingDays}
                                    step="0.5"
                                    value={holidayDays || ''}
                                    onChange={(e) => setHoliday(person.id, week.id, e.target.value)}
                                    className="w-14 mx-auto text-xs h-7"
                                    placeholder="0"
                                  />
                                  <div className="text-xs text-muted-foreground">off</div>
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell className="p-2 text-center text-sm font-medium">{avgAvail.toFixed(1)}d</TableCell>
                          <TableCell className="p-2">
                            <Button onClick={() => deletePerson(person.id)} variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell className="p-2 text-sm font-medium">Team Avg</TableCell>
                      {weekConfig.map((week) => (
                        <TableCell key={week.id} className="p-2 text-center text-sm font-medium">
                          {getTeamAverageAvailability(week.id).toFixed(1)}d
                        </TableCell>
                      ))}
                      <TableCell className="p-2 text-center text-sm font-medium">
                        {(
                          weekConfig.reduce((sum, week) => sum + getTeamAverageAvailability(week.id), 0) /
                          weekConfig.length
                        ).toFixed(1)}d
                      </TableCell>
                      <TableCell className="p-2"></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                First Responder Schedule ({frCapacityDays}d per week)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {weekConfig.map((week, idx) => (
                  <div key={week.id} className="space-y-2">
                    <Label htmlFor={`fr-${week.id}`} className="text-xs">{formatWeekDateRange(idx)}</Label>
                    <Select value={frSchedule[week.id]?.toString() || ''} onValueChange={(val) => setFR(week.id, val)}>
                      <SelectTrigger id={`fr-${week.id}`}>
                        <SelectValue placeholder="Not assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Not assigned</SelectItem>
                        {people.map((person) => (
                          <SelectItem key={person.id} value={person.id.toString()}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4 mt-4">
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-muted/20 border-muted">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarterStats.totalAvailability.toFixed(0)}d</div>
                <p className="text-xs text-muted-foreground">Avg {quarterStats.avgAvailabilityPerWeek.toFixed(1)}d/week</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 border-muted">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Available Capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarterStats.totalCapacity.toFixed(0)}d</div>
                <p className="text-xs text-muted-foreground">After FR duties</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 border-muted">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Allocated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarterStats.totalAllocated.toFixed(0)}d</div>
                <p className="text-xs text-muted-foreground">{quarterStats.utilizationPercent.toFixed(0)}% utilization</p>
              </CardContent>
            </Card>
            <Card
              className={
                quarterStats.totalAllocated > quarterStats.totalCapacity
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-muted/20 border-muted'
              }
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Remaining</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(quarterStats.totalCapacity - quarterStats.totalAllocated).toFixed(0)}d
                </div>
                <p className="text-xs text-muted-foreground">
                  {quarterStats.totalAllocated > quarterStats.totalCapacity ? 'Over-allocated!' : 'Available'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/20 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Weekly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b hover:bg-transparent">
                      <TableHead className="text-left p-2 font-medium text-xs">Person</TableHead>
                      {weekConfig.map((week, idx) => (
                        <TableHead key={week.id} className="text-center p-2 font-medium text-xs">
                          {formatWeekDateRange(idx)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {people.map((person) => (
                      <TableRow key={person.id} className="border-b hover:bg-muted/20">
                        <TableCell className="p-2 text-sm font-medium">{person.name}</TableCell>
                        {weekConfig.map((week) => {
                          const capacity = getPersonCapacity(person.id, week.id);
                          const allocated = getPersonAllocated(person.id, week.id);
                          const isOver = allocated > capacity;
                          const isFR = frSchedule[week.id] === person.id;

                          return (
                            <TableCell
                              key={week.id}
                              className={`text-center p-2 ${isOver ? 'bg-destructive/10' : ''}`}
                            >
                              <div className="text-xs space-y-0.5">
                                <div className="font-medium">
                                  {allocated.toFixed(1)} / {capacity.toFixed(1)}d
                                </div>
                                {isFR && <Badge variant="outline" className="text-xs">FR</Badge>}
                                {isOver && <AlertCircle className="w-3 h-3 text-destructive mx-auto" />}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Button onClick={addProject} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>

          {projects.map((project) => {
            const startIdx = weekConfig.findIndex((w) => w.id === project.startWeek);
            const endIdx = weekConfig.findIndex((w) => w.id === project.endWeek);
            const projectWeeks = weekConfig.slice(startIdx, endIdx + 1);

            // Calculate planned capacity (what's assigned)
            const plannedCapacity = projectWeeks.reduce((total, week) => {
              const weekIndex = weekConfig.findIndex((w) => w.id === week.id);

              const weekCapacity = project.assignments.reduce((sum, assignment) => {
                // Check if person is working this week
                const assignmentStartIdx = weekConfig.findIndex((w) => w.id === assignment.startWeek);
                const assignmentEndIdx = weekConfig.findIndex((w) => w.id === assignment.endWeek);

                if (weekIndex >= assignmentStartIdx && weekIndex <= assignmentEndIdx) {
                  return sum + assignment.daysPerWeek;
                }
                return sum;
              }, 0);

              return total + weekCapacity;
            }, 0);

            // Calculate actual available capacity (considering holidays, FR, availability)
            const actualCapacity = projectWeeks.reduce((total, week) => {
              const weekIndex = weekConfig.findIndex((w) => w.id === week.id);

              const weekCapacity = project.assignments.reduce((sum, assignment) => {
                // Check if person is working this week
                const assignmentStartIdx = weekConfig.findIndex((w) => w.id === assignment.startWeek);
                const assignmentEndIdx = weekConfig.findIndex((w) => w.id === assignment.endWeek);

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
              <Collapsible key={project.id} className="bg-muted/20 border rounded-lg hover:bg-muted/30 transition-colors">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronDown className="w-4 h-4 transition-transform [[data-state=open]>&]:rotate-180" />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-sm">{project.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatWeekDateRange(startIdx)} → {formatWeekDateRange(endIdx)} • {project.assignments.length} people
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        value={project.name}
                        onChange={(e) => updateProject(project.id, { name: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Week</Label>
                      <Select
                        value={project.startWeek}
                        onValueChange={(val) => updateProject(project.id, { startWeek: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weekConfig.map((week, idx) => (
                            <SelectItem key={week.id} value={week.id}>
                              {formatWeekDateRange(idx)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>End Week</Label>
                      <Select
                        value={project.endWeek}
                        onValueChange={(val) => updateProject(project.id, { endWeek: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weekConfig.map((week, idx) => (
                            <SelectItem key={week.id} value={week.id}>
                              {formatWeekDateRange(idx)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Alert className={actualCapacity < plannedCapacity ? 'border-warning bg-warning/5' : ''}>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold">Project Capacity</div>
                      <div className={`text-2xl font-bold ${actualCapacity < plannedCapacity ? 'text-warning' : ''}`}>
                        {actualCapacity.toFixed(0)} / {plannedCapacity.toFixed(0)} days
                        <span className="text-base ml-2">
                          ({plannedCapacity > 0 ? ((actualCapacity / plannedCapacity) * 100).toFixed(0) : '0'}%)
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {actualCapacity < plannedCapacity
                          ? `Reduced by holidays and FR duty`
                          : `Full capacity available across ${projectWeeks.length} weeks`
                        }
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label>Team Assignments</Label>
                    {project.assignments.map((assignment) => {
                      const person = people.find((p) => p.id === assignment.personId);
                      return (
                        <div key={assignment.personId} className="border rounded-lg p-3 space-y-3 bg-background">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{person?.name}</span>
                            <Button
                              onClick={() => removeAssignment(project.id, assignment.personId)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Days/Week</Label>
                              <Input
                                type="number"
                                min="0"
                                max="5"
                                step="0.5"
                                value={assignment.daysPerWeek || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    updateAssignment(project.id, assignment.personId, { daysPerWeek: 0 });
                                    return;
                                  }
                                  updateAssignment(project.id, assignment.personId, { daysPerWeek: parseFloat(val) });
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Start Week</Label>
                              <Select
                                value={assignment.startWeek}
                                onValueChange={(val) => updateAssignment(project.id, assignment.personId, { startWeek: val })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {weekConfig.map((week, idx) => (
                                    <SelectItem key={week.id} value={week.id}>
                                      {formatWeekDateRange(idx)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">End Week</Label>
                              <Select
                                value={assignment.endWeek}
                                onValueChange={(val) => updateAssignment(project.id, assignment.personId, { endWeek: val })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {weekConfig.map((week, idx) => (
                                    <SelectItem key={week.id} value={week.id}>
                                      {formatWeekDateRange(idx)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Select
                      onValueChange={(val) => {
                        if (val) addAssignment(project.id, parseInt(val));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="+ Add team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {people
                          .filter((p) => !project.assignments.find((a) => a.personId === p.id))
                          .map((person) => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label>Notes</Label>
                    <Textarea
                      value={project.notes || ''}
                      onChange={(e) => updateProject(project.id, { notes: e.target.value })}
                      placeholder="Add project notes, objectives, or important details..."
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <Card className="bg-muted/20 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Per-Person Schedule</CardTitle>
              <CardDescription className="text-sm">View each team member&apos;s allocation across all weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {people.map((person) => {
                  // Calculate summary stats for the person
                  const totalAllocated = weekConfig.reduce((sum, week) => sum + getPersonAllocated(person.id, week.id), 0);
                  const totalCapacity = weekConfig.reduce((sum, week) => sum + getPersonCapacity(person.id, week.id), 0);
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
                              {totalAllocated.toFixed(1)}d / {totalCapacity.toFixed(1)}d allocated • {utilizationPercent.toFixed(0)}% utilization
                            </div>
                          </div>
                        </div>
                        {isOverallocated && (
                          <Badge variant="destructive" className="ml-auto mr-2">Over-allocated</Badge>
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
                          {weekConfig.map((week, idx) => {
                            const availability = getPersonAvailability(person.id, week.id);
                            const capacity = getPersonCapacity(person.id, week.id);
                            const allocated = getPersonAllocated(person.id, week.id);
                            const isFR = frSchedule[week.id] === person.id;
                            const free = capacity - allocated;
                            const isOverallocated = allocated > capacity;

                            const personProjects = projects.filter((project) => {
                              const assignment = project.assignments.find((a) => a.personId === person.id);
                              if (!assignment) return false;

                              // Check if this week is within the person's assignment range
                              const weekIndex = weekConfig.findIndex((w) => w.id === week.id);
                              const assignmentStartIndex = weekConfig.findIndex((w) => w.id === assignment.startWeek);
                              const assignmentEndIndex = weekConfig.findIndex((w) => w.id === assignment.endWeek);
                              return weekIndex >= assignmentStartIndex && weekIndex <= assignmentEndIndex;
                            });

                            return (
                              <TableRow key={week.id} className={isOverallocated ? 'bg-destructive/10' : ''}>
                                <TableCell className="font-medium text-sm">{formatWeekDateRange(idx)}</TableCell>
                                <TableCell className="text-sm">{availability}d {isFR && <Badge variant="outline" className="ml-1 text-xs">FR</Badge>}</TableCell>
                                <TableCell className="text-sm">{capacity}d</TableCell>
                                <TableCell className="text-sm font-semibold">{allocated.toFixed(1)}d</TableCell>
                                <TableCell className="text-sm">
                                  {personProjects.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                      {personProjects.map((project) => {
                                        const assignment = project.assignments.find((a) => a.personId === person.id);
                                        const startIdx = weekConfig.findIndex((w) => w.id === assignment?.startWeek);
                                        const endIdx = weekConfig.findIndex((w) => w.id === assignment?.endWeek);
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
                                <TableCell className={`text-right font-semibold ${isOverallocated ? 'text-destructive' : 'text-green-600'}`}>
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

          <Card className="bg-muted/20 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Project Timeline</CardTitle>
              <CardDescription className="text-sm">Visual overview of all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => {
                  const startIdx = weekConfig.findIndex((w) => w.id === project.startWeek);
                  const endIdx = weekConfig.findIndex((w) => w.id === project.endWeek);
                  const projectWeeks = weekConfig.slice(startIdx, endIdx + 1);

                  // Calculate planned capacity (what's assigned)
                  const plannedCapacity = projectWeeks.reduce((total, week) => {
                    const weekIndex = weekConfig.findIndex((w) => w.id === week.id);

                    const weekCapacity = project.assignments.reduce((sum, assignment) => {
                      const assignmentStartIdx = weekConfig.findIndex((w) => w.id === assignment.startWeek);
                      const assignmentEndIdx = weekConfig.findIndex((w) => w.id === assignment.endWeek);

                      if (weekIndex >= assignmentStartIdx && weekIndex <= assignmentEndIdx) {
                        return sum + assignment.daysPerWeek;
                      }
                      return sum;
                    }, 0);

                    return total + weekCapacity;
                  }, 0);

                  // Calculate actual available capacity (considering holidays, FR, availability)
                  const actualCapacity = projectWeeks.reduce((total, week) => {
                    const weekIndex = weekConfig.findIndex((w) => w.id === week.id);

                    const weekCapacity = project.assignments.reduce((sum, assignment) => {
                      const assignmentStartIdx = weekConfig.findIndex((w) => w.id === assignment.startWeek);
                      const assignmentEndIdx = weekConfig.findIndex((w) => w.id === assignment.endWeek);

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
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
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
                        <span className="text-sm text-muted-foreground">
                          {formatWeekDateRange(startIdx)} → {formatWeekDateRange(endIdx)}
                        </span>
                      </div>
                      <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="absolute h-full bg-primary/20 border-2 border-primary rounded-lg"
                          style={{
                            left: `${(startIdx / weekConfig.length) * 100}%`,
                            width: `${(projectWeeks.length / weekConfig.length) * 100}%`,
                          }}
                        >
                          <div className="flex items-center justify-center h-full px-2 text-xs font-medium">
                            {project.assignments.length} team {project.assignments.length === 1 ? 'member' : 'members'}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {project.assignments.map((assignment) => {
                          const person = people.find((p) => p.id === assignment.personId);
                          const assignmentStartIdx = weekConfig.findIndex((w) => w.id === assignment.startWeek);
                          const assignmentEndIdx = weekConfig.findIndex((w) => w.id === assignment.endWeek);
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
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}