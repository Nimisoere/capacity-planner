"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Users, Calendar, TrendingUp, Settings, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHeader, TableCaption, TableHead, TableRow, TableFooter } from '@/components/ui/table';

const STORAGE_KEY = 'ix-capacity-planner-data';

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
}

interface PlanningPeriod {
  startDate: string;
  numberOfWeeks: number;
}

export default function CapacityPlanner() {
  const loadFromStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  };

  const initialData = loadFromStorage();

  const [planningPeriod, setPlanningPeriod] = useState<PlanningPeriod>(
    initialData?.planningPeriod || { startDate: '2025-11-24', numberOfWeeks: 6 }
  );
  const [weekConfig, setWeekConfig] = useState<WeekConfig[]>(
    initialData?.weekConfig || [
      { id: 'W1', name: 'Week 1', workingDays: 5 },
      { id: 'W2', name: 'Week 2', workingDays: 5 },
      { id: 'W3', name: 'Week 3', workingDays: 4 },
      { id: 'W4', name: 'Week 4', workingDays: 5 },
      { id: 'W5', name: 'Week 5', workingDays: 5 },
      { id: 'W6', name: 'Week 6', workingDays: 5 },
    ]
  );
  const [people, setPeople] = useState<Person[]>(
    initialData?.people || [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]
  );
  const [holidays, setHolidays] = useState<Record<string, number>>(
    initialData?.holidays || {
      '1-W1': 0, '1-W2': 2, '1-W3': 0, '1-W4': 0, '1-W5': 5, '1-W6': 0,
      '2-W1': 0, '2-W2': 0, '2-W3': 0, '2-W4': 0, '2-W5': 0, '2-W6': 0,
      '3-W1': 0, '3-W2': 0, '3-W3': 0, '3-W4': 3, '3-W5': 0, '3-W6': 0,
    }
  );
  const [frSchedule, setFrSchedule] = useState<Record<string, number>>(initialData?.frSchedule || {});
  const [frCapacityDays, setFrCapacityDays] = useState<number>(initialData?.frCapacityDays || 3);
  const [projects, setProjects] = useState<Project[]>(
    initialData?.projects || [
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
    ]
  );

  const [showWeekConfig, setShowWeekConfig] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const dataToSave = {
        planningPeriod,
        weekConfig,
        people,
        holidays,
        frSchedule,
        frCapacityDays,
        projects,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [planningPeriod, weekConfig, people, holidays, frSchedule, frCapacityDays, projects]);

  const exportData = () => {
    const dataToExport = {
      planningPeriod,
      weekConfig,
      people,
      holidays,
      frSchedule,
      frCapacityDays,
      projects,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capacity-plan-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.planningPeriod) setPlanningPeriod(imported.planningPeriod);
        if (imported.weekConfig) setWeekConfig(imported.weekConfig);
        if (imported.people) setPeople(imported.people);
        if (imported.holidays) setHolidays(imported.holidays);
        if (imported.frSchedule) setFrSchedule(imported.frSchedule);
        if (imported.frCapacityDays) setFrCapacityDays(imported.frCapacityDays);
        if (imported.projects) setProjects(imported.projects);
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      }
    }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">IX Capacity Planner</h1>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Label htmlFor="import-file" className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </Label>
          <Button onClick={clearAllData} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">1. Setup & Holidays</TabsTrigger>
          <TabsTrigger value="capacity">2. Capacity Overview</TabsTrigger>
          <TabsTrigger value="projects">3. Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
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
                  onChange={(e) => updateNumberOfWeeks(parseInt(e.target.value) || 6)}
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

          <Card>
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
                            <Input
                              value={week.name}
                              onChange={(e) => {
                                const newConfig = [...weekConfig];
                                newConfig[idx].name = e.target.value;
                                setWeekConfig(newConfig);
                              }}
                              className="flex-1"
                            />
                            <Label className="flex items-center gap-2 whitespace-nowrap">
                              Working days:
                              <Input
                                type="number"
                                min="1"
                                max="5"
                                value={week.workingDays}
                                onChange={(e) => {
                                  const newConfig = [...weekConfig];
                                  newConfig[idx].workingDays = parseInt(e.target.value) || 5;
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
                            onChange={(e) => setFrCapacityDays(parseInt(e.target.value) || 3)}
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
                          <div className="font-semibold">{week.name}</div>
                          <div className="text-xs text-muted-foreground">{week.workingDays}d</div>
                          <div className="text-xs text-muted-foreground">{formatWeekDateRange(idx)}</div>
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
                                    value={holidayDays}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                First Responder Schedule ({frCapacityDays}d per week)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {weekConfig.map((week) => (
                  <div key={week.id} className="space-y-2">
                    <Label htmlFor={`fr-${week.id}`}>{week.name}</Label>
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
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarterStats.totalAvailability.toFixed(0)}d</div>
                <p className="text-xs text-muted-foreground">Avg {quarterStats.avgAvailabilityPerWeek.toFixed(1)}d/week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Available Capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarterStats.totalCapacity.toFixed(0)}d</div>
                <p className="text-xs text-muted-foreground">After FR duties</p>
              </CardContent>
            </Card>
            <Card>
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
                      {weekConfig.map((week) => (
                        <TableHead key={week.id} className="text-center p-3 font-medium">
                          {week.name}
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

            const projectStats = projectWeeks.reduce((acc, week) => {
              const weekCapacity = project.assignments.reduce((sum, assignment) => sum + assignment.daysPerWeek, 0);
              return acc + weekCapacity;
            }, 0);

            return (
              <Card key={project.id}>
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
                          {weekConfig.map((week) => (
                            <SelectItem key={week.id} value={week.id}>
                              {week.name}
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
                          {weekConfig.map((week) => (
                            <SelectItem key={week.id} value={week.id}>
                              {week.name}
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
                            value={assignment.daysPerWeek}
                            onChange={(e) =>
                              updateAssignment(project.id, assignment.personId, parseFloat(e.target.value))
                            }
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
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}