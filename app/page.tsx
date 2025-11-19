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
        { personId: 1, daysPerWeek: 3 },
        { personId: 2, daysPerWeek: 4 },
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
      setProjects(currentSchedule.projects);
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
    return Math.max(0, availability - (isFR ? frCapacityDays : 0));
  };

  const getPersonAllocated = (personId: number, weekId: string) => {
    return projects.reduce((total, project) => {
      const weekIndex = weekConfig.findIndex((w) => w.id === weekId);
      const startIndex = weekConfig.findIndex((w) => w.id === project.startWeek);
      const endIndex = weekConfig.findIndex((w) => w.id === project.endWeek);

      if (weekIndex >= startIndex && weekIndex <= endIndex) {
        const assignment = project.assignments.find((a) => a.personId === personId);
        if (assignment) {
          return total + assignment.daysPerWeek;
        }
      }
      return total;
    }, 0);
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

  const canBeFirstResponder = (personId: number, weekId: string) => {
    const availability = getPersonAvailability(personId, weekId);
    return availability >= frCapacityDays;
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
    if (id && !canBeFirstResponder(id, weekId)) {
      alert('This person does not have enough availability this week for FR duty');
      return;
    }
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
            assignments: [...p.assignments, { personId, daysPerWeek: 2 }],
          };
        }
        return p;
      })
    );
  };

  const updateAssignment = (projectId: number, personId: number, daysPerWeek: number) => {
    setProjects(
      projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            assignments: p.assignments.map((a) =>
              a.personId === personId ? { ...a, daysPerWeek: parseFloat(daysPerWeek.toString()) } : a
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading schedules...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Team Planner
              </h1>
              <p className="text-muted-foreground mt-1">Manage your team capacity and projects</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={createSchedule} size="default" className="shadow-md hover:shadow-lg transition-all">
                <Plus className="w-4 h-4 mr-2" />
                New Schedule
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

        <Card className="shadow-lg border-muted/50">
          <CardHeader>
            <CardTitle className="text-2xl">My Schedules</CardTitle>
            <CardDescription>Select a schedule to view or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className="hover:shadow-lg hover:border-primary/20 transition-all duration-200 border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Input
                          value={schedule.name}
                          onChange={(e) => renameSchedule(schedule.id, e.target.value)}
                          className="text-lg font-semibold border-0 px-0 focus-visible:ring-1 mb-2"
                        />
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            {schedule.people.length} people • {schedule.projects.length} projects
                          </div>
                          <div>
                            {new Date(schedule.planningPeriod.startDate).toLocaleDateString('en-GB', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            - {schedule.planningPeriod.numberOfWeeks} weeks
                          </div>
                          <div className="text-xs">
                            Last updated: {new Date(schedule.updatedAt).toLocaleString('en-GB')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => openSchedule(schedule.id)} size="sm" className="shadow-sm">
                          Open
                        </Button>
                        <Button onClick={() => duplicateSchedule(schedule.id)} variant="outline" size="sm" className="shadow-sm">
                          Duplicate
                        </Button>
                        <Button
                          onClick={() => deleteSchedule(schedule.id)}
                          variant="ghost"
                          size="sm"
                          disabled={schedules.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between py-4">
          <div>
            <Button onClick={() => setView('list')} variant="ghost" size="sm" className="mb-2">
              ← Back to Schedules
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{currentSchedule?.name}</h1>
              {isSaving && (
                <Badge variant="secondary" className="animate-pulse">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={shareSchedule} variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-all">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={exportData} variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-all">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => deleteSchedule(currentSchedule?.id || '')} variant="destructive" size="sm" className="shadow-sm hover:shadow-md transition-all">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <UserButton />
          </div>
        </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-auto shadow-sm">
          <TabsTrigger value="setup" className="data-[state=active]:shadow-md">
            <Calendar className="w-4 h-4 mr-2" />
            Setup & Holidays
          </TabsTrigger>
          <TabsTrigger value="capacity" className="data-[state=active]:shadow-md">
            <TrendingUp className="w-4 h-4 mr-2" />
            Capacity
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:shadow-md">
            <Users className="w-4 h-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:shadow-md">
            <AlertCircle className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card className="shadow-lg border-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Planning Period
              </CardTitle>
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
                  min="1"
                  max="26"
                  value={planningPeriod.numberOfWeeks}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') return;
                    updateNumberOfWeeks(parseInt(val) || 1);
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

          <Card className="shadow-lg border-muted/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Setup
                </CardTitle>
                <div className="flex gap-2">
                  <Dialog open={showWeekConfig} onOpenChange={setShowWeekConfig}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Week Config
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
                                min="1"
                                max="5"
                                value={week.workingDays}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') return;
                                  const newConfig = [...weekConfig];
                                  newConfig[idx].workingDays = parseInt(val) || 1;
                                  setWeekConfig(newConfig);
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
                            min="1"
                            max="5"
                            value={frCapacityDays}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') return;
                              setFrCapacityDays(parseInt(val) || 1);
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
                <Table className="w-full border-collapse">
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="text-left p-3 font-medium">Person</TableHead>
                      {weekConfig.map((week, idx) => (
                        <TableHead key={week.id} className="text-center p-3 font-medium">
                          <div className="font-semibold text-sm">{formatWeekDateRange(idx)}</div>
                          <div className="text-xs text-muted-foreground">{week.workingDays} days</div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center p-3 font-medium">Avg</TableHead>
                      <TableHead className="p-3"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {people.map((person) => {
                      const avgAvail =
                        weekConfig.reduce((sum, week) => sum + getPersonAvailability(person.id, week.id), 0) /
                        weekConfig.length;

                      return (
                        <TableRow key={person.id} className="border-b">
                          <TableCell className="p-3">
                            <Input
                              value={person.name}
                              onChange={(e) => updatePerson(person.id, e.target.value)}
                              className="w-full"
                            />
                          </TableCell>
                          {weekConfig.map((week) => {
                            const availability = getPersonAvailability(person.id, week.id);
                            const holidayDays = holidays[`${person.id}-${week.id}`] || 0;

                            return (
                              <TableCell key={week.id} className="p-3">
                                <div className="text-center space-y-1">
                                  <div className="text-sm font-semibold text-green-700">{availability}d avail</div>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={week.workingDays}
                                    step="0.5"
                                    value={holidayDays || ''}
                                    onChange={(e) => setHoliday(person.id, week.id, e.target.value)}
                                    className="w-16 mx-auto text-xs"
                                    placeholder="0"
                                  />
                                  <div className="text-xs text-muted-foreground">days off</div>
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell className="p-3 text-center font-semibold">{avgAvail.toFixed(1)}d</TableCell>
                          <TableCell className="p-3">
                            <Button onClick={() => deletePerson(person.id)} variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted font-semibold">
                      <TableCell className="p-3">Team Average</TableCell>
                      {weekConfig.map((week) => (
                        <TableCell key={week.id} className="p-3 text-center">
                          {getTeamAverageAvailability(week.id).toFixed(1)}d
                        </TableCell>
                      ))}
                      <TableCell className="p-3 text-center">
                        {(
                          weekConfig.reduce((sum, week) => sum + getTeamAverageAvailability(week.id), 0) /
                          weekConfig.length
                        ).toFixed(1)}
                        d
                      </TableCell>
                      <TableCell className="p-3"></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
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
                        {people.map((person) => {
                          const canBeFR = canBeFirstResponder(person.id, week.id);
                          return (
                            <SelectItem key={person.id} value={person.id.toString()} disabled={!canBeFR}>
                              {person.name} {!canBeFR ? '(unavailable)' : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="shadow-md border-muted/50">
              <CardHeader className="pb-3">
                <CardDescription>Total Availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarterStats.totalAvailability.toFixed(0)}d</div>
                <p className="text-xs text-muted-foreground">Avg {quarterStats.avgAvailabilityPerWeek.toFixed(1)}d/week</p>
              </CardContent>
            </Card>
            <Card className="shadow-md border-muted/50">
              <CardHeader className="pb-3">
                <CardDescription>Available Capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarterStats.totalCapacity.toFixed(0)}d</div>
                <p className="text-xs text-muted-foreground">After FR duties</p>
              </CardContent>
            </Card>
            <Card className="shadow-md border-muted/50">
              <CardHeader className="pb-3">
                <CardDescription>Allocated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarterStats.totalAllocated.toFixed(0)}d</div>
                <p className="text-xs text-muted-foreground">{quarterStats.utilizationPercent.toFixed(0)}% utilization</p>
              </CardContent>
            </Card>
            <Card
              className={
                quarterStats.totalAllocated > quarterStats.totalCapacity
                  ? 'border-destructive'
                  : ''
              }
            >
              <CardHeader className="pb-3">
                <CardDescription>Remaining</CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle>Weekly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="w-full border-collapse">
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="text-left p-3 font-medium">Person</TableHead>
                      {weekConfig.map((week, idx) => (
                        <TableHead key={week.id} className="text-center p-3 font-medium text-sm">
                          {formatWeekDateRange(idx)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {people.map((person) => (
                      <TableRow key={person.id} className="border-b">
                        <TableCell className="p-3 font-medium">{person.name}</TableCell>
                        {weekConfig.map((week) => {
                          const capacity = getPersonCapacity(person.id, week.id);
                          const allocated = getPersonAllocated(person.id, week.id);
                          const isOver = allocated > capacity;
                          const isFR = frSchedule[week.id] === person.id;

                          return (
                            <TableCell
                              key={week.id}
                              className={`text-center p-3 ${isOver ? 'bg-destructive/10' : ''}`}
                            >
                              <div className="text-xs">
                                <div className="font-semibold">
                                  {allocated.toFixed(1)} / {capacity.toFixed(1)}d
                                </div>
                                {isFR && <Badge variant="outline" className="text-xs mt-1">FR</Badge>}
                                {isOver && <AlertCircle className="w-3 h-3 text-destructive mx-auto mt-1" />}
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

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Projects</h2>
            <Button onClick={addProject}>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>

          {projects.map((project) => {
            const startIdx = weekConfig.findIndex((w) => w.id === project.startWeek);
            const endIdx = weekConfig.findIndex((w) => w.id === project.endWeek);
            const projectWeeks = weekConfig.slice(startIdx, endIdx + 1);

            const projectStats = projectWeeks.reduce((acc) => {
              const weekCapacity = project.assignments.reduce((sum, assignment) => sum + assignment.daysPerWeek, 0);
              return acc + weekCapacity;
            }, 0);

            return (
              <Card key={project.id} className="shadow-lg hover:shadow-xl transition-shadow border-muted/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Input
                      value={project.name}
                      onChange={(e) => updateProject(project.id, { name: e.target.value })}
                      className="text-lg font-semibold border-0 px-0 focus-visible:ring-0"
                    />
                    <Button onClick={() => deleteProject(project.id)} variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold">Total Project Capacity Required</div>
                      <div className="text-2xl font-bold">{projectStats.toFixed(0)} days</div>
                      <div className="text-xs text-muted-foreground">Across {projectWeeks.length} weeks</div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label>Team Assignments</Label>
                    {project.assignments.map((assignment) => {
                      const person = people.find((p) => p.id === assignment.personId);
                      return (
                        <div key={assignment.personId} className="flex items-center gap-3">
                          <span className="w-24 text-sm">{person?.name}</span>
                          <Input
                            type="number"
                            min="0"
                            max="5"
                            step="0.5"
                            value={assignment.daysPerWeek || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                updateAssignment(project.id, assignment.personId, 0);
                                return;
                              }
                              updateAssignment(project.id, assignment.personId, parseFloat(val));
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">days/week</span>
                          <Button
                            onClick={() => removeAssignment(project.id, assignment.personId)}
                            variant="ghost"
                            size="sm"
                            className="ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
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
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Per-Person Schedule</CardTitle>
              <CardDescription>View each team member&apos;s allocation across all weeks</CardDescription>
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
                              const weekIndex = weekConfig.findIndex((w) => w.id === week.id);
                              const startIndex = weekConfig.findIndex((w) => w.id === project.startWeek);
                              const endIndex = weekConfig.findIndex((w) => w.id === project.endWeek);
                              const isInRange = weekIndex >= startIndex && weekIndex <= endIndex;
                              const hasAssignment = project.assignments.find((a) => a.personId === person.id);
                              return isInRange && hasAssignment;
                            });

                            return (
                              <TableRow key={week.id} className={isOverallocated ? 'bg-destructive/10' : ''}>
                                <TableCell className="font-medium text-sm">{formatWeekDateRange(idx)}</TableCell>
                                <TableCell className="text-sm">{availability}d {isFR && <Badge variant="outline" className="ml-1 text-xs">FR</Badge>}</TableCell>
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

          <Card className="shadow-lg border-muted/50">
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>Visual overview of all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => {
                  const startIdx = weekConfig.findIndex((w) => w.id === project.startWeek);
                  const endIdx = weekConfig.findIndex((w) => w.id === project.endWeek);
                  const projectWeeks = weekConfig.slice(startIdx, endIdx + 1);

                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{project.name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {formatWeekDateRange(startIdx)} → {formatWeekDateRange(endIdx)}
                        </span>
                      </div>
                      <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="absolute h-full bg-primary/20 border-2 border-primary rounded"
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
                      <div className="flex flex-wrap gap-2 text-sm">
                        {project.assignments.map((assignment) => {
                          const person = people.find((p) => p.id === assignment.personId);
                          return (
                            <Badge key={assignment.personId} variant="outline">
                              {person?.name} - {assignment.daysPerWeek}d/week
                            </Badge>
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