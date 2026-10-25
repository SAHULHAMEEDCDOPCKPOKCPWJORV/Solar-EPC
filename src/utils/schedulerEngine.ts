import { format, parseISO, addDays, isValid, isBefore, isAfter, differenceInCalendarDays } from 'date-fns';
import { ProjectDetails, WbsItem, ActivityItem, DependencyLink, WorkingCalendarType } from '../types';

// Helper to determine if a date is a working day based on calendar
export function isWorkingDay(date: Date, calendarType: WorkingCalendarType): boolean {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  switch (calendarType) {
    case '7_DAYS_WEEK':
      return true;
    case '6_DAYS_WEEK':
      return day !== 0; // Sunday off
    case '5.5_DAYS_WEEK':
      return day !== 0; // (Half Saturday counted as working day for duration)
    case '5_DAYS_WEEK':
    default:
      return day !== 0 && day !== 6; // Saturday and Sunday off
  }
}

// Add working days to a start date
export function addWorkingDaysToDate(startDateStr: string, workingDays: number, calendarType: WorkingCalendarType): string {
  if (workingDays <= 0) return startDateStr;
  let currentDate = parseISO(startDateStr);
  if (!isValid(currentDate)) return startDateStr;

  // Make sure start date itself is a working day if we need to align
  while (!isWorkingDay(currentDate, calendarType)) {
    currentDate = addDays(currentDate, 1);
  }

  let daysRemaining = workingDays - 1; // 1-day duration starts and ends on same working day
  while (daysRemaining > 0) {
    currentDate = addDays(currentDate, 1);
    if (isWorkingDay(currentDate, calendarType)) {
      daysRemaining--;
    }
  }

  return format(currentDate, 'yyyy-MM-dd');
}

// Calculate number of working days between two dates inclusive
export function calculateWorkingDaysBetween(startDateStr: string, finishDateStr: string, calendarType: WorkingCalendarType): number {
  const start = parseISO(startDateStr);
  const finish = parseISO(finishDateStr);
  if (!isValid(start) || !isValid(finish) || isAfter(start, finish)) return 1;

  let count = 0;
  let cur = start;
  while (!isAfter(cur, finish)) {
    if (isWorkingDay(cur, calendarType)) {
      count++;
    }
    cur = addDays(cur, 1);
  }
  return Math.max(1, count);
}

// Detect cycles in dependency graph
export function hasCircularDependency(activities: ActivityItem[]): boolean {
  const adj = new Map<string, string[]>();
  for (const act of activities) {
    const preds = act.predecessors || [];
    adj.set(act.id, preds);
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const pred of neighbors) {
      // Find activity by ID or code
      const predAct = activities.find(a => a.id === pred || a.code === pred);
      if (!predAct) continue;
      const targetId = predAct.id;
      if (!visited.has(targetId)) {
        if (dfs(targetId)) return true;
      } else if (recStack.has(targetId)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const act of activities) {
    if (!visited.has(act.id)) {
      if (dfs(act.id)) return true;
    }
  }

  return false;
}

// Recalculate schedule dates & Critical Path Method (CPM)
export function runCpmCalculation(
  activities: ActivityItem[],
  calendarType: WorkingCalendarType,
  autoReschedule = true
): ActivityItem[] {
  if (activities.length === 0) return [];

  // Build lookup maps
  const actMap = new Map<string, ActivityItem>();
  activities.forEach(a => {
    actMap.set(a.id, { ...a });
    actMap.set(a.code, actMap.get(a.id)!);
  });

  const processedActivities = activities.map(a => ({ ...a }));

  // Check circular dependencies
  const isCircular = hasCircularDependency(processedActivities);
  if (isCircular) {
    console.warn("Circular dependency detected in project schedule! Skipping CPM auto-pass.");
    return activities;
  }

  // 1. Forward Pass (Early Start & Early Finish)
  // Sort activities topologically or iteratively resolve predecessors
  let changed = true;
  let iterations = 0;
  const maxIterations = processedActivities.length * 2;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const act of processedActivities) {
      if (!act.predecessors || act.predecessors.length === 0) {
        // No predecessors, early start is planned start date
        const es = act.startDate;
        const ef = addWorkingDaysToDate(es, act.duration, calendarType);
        if (act.earlyStart !== es || act.earlyFinish !== ef) {
          act.earlyStart = es;
          act.earlyFinish = ef;
          if (autoReschedule) {
            act.finishDate = ef;
          }
          changed = true;
        }
      } else {
        // Find latest finish among predecessors
        let maxPredFinish: string | null = null;
        for (const predRef of act.predecessors) {
          const predAct = processedActivities.find(p => p.id === predRef || p.code === predRef);
          if (predAct && predAct.earlyFinish) {
            if (!maxPredFinish || isAfter(parseISO(predAct.earlyFinish), parseISO(maxPredFinish))) {
              maxPredFinish = predAct.earlyFinish;
            }
          }
        }

        if (maxPredFinish) {
          // Finish-to-Start: successor starts on the next working day after predecessor finish
          let nextWorkingDay = addDays(parseISO(maxPredFinish), 1);
          while (!isWorkingDay(nextWorkingDay, calendarType)) {
            nextWorkingDay = addDays(nextWorkingDay, 1);
          }
          const calculatedStart = format(nextWorkingDay, 'yyyy-MM-dd');
          
          let effectiveStart = calculatedStart;
          if (!autoReschedule) {
            // In manual mode, respect manual start if after predecessor
            if (isAfter(parseISO(act.startDate), parseISO(calculatedStart))) {
              effectiveStart = act.startDate;
            }
          } else {
            act.startDate = effectiveStart;
          }

          const calculatedFinish = addWorkingDaysToDate(effectiveStart, act.duration, calendarType);
          if (act.earlyStart !== effectiveStart || act.earlyFinish !== calculatedFinish) {
            act.earlyStart = effectiveStart;
            act.earlyFinish = calculatedFinish;
            if (autoReschedule) {
              act.finishDate = calculatedFinish;
            }
            changed = true;
          }
        }
      }
    }
  }

  // 2. Determine Project End Date
  let projectFinishDate: string | null = null;
  for (const act of processedActivities) {
    const ef = act.earlyFinish || act.finishDate;
    if (!projectFinishDate || isAfter(parseISO(ef), parseISO(projectFinishDate))) {
      projectFinishDate = ef;
    }
  }

  // 3. Backward Pass (Late Finish & Late Start)
  // For terminal activities, Late Finish = Project Finish Date
  const successorsMap = new Map<string, ActivityItem[]>();
  processedActivities.forEach(a => successorsMap.set(a.id, []));

  processedActivities.forEach(a => {
    (a.predecessors || []).forEach(predRef => {
      const pred = processedActivities.find(p => p.id === predRef || p.code === predRef);
      if (pred) {
        successorsMap.get(pred.id)?.push(a);
      }
    });
  });

  // Initialize late finish
  processedActivities.forEach(a => {
    const succs = successorsMap.get(a.id) || [];
    if (succs.length === 0) {
      a.lateFinish = projectFinishDate || a.earlyFinish || a.finishDate;
      // late start = subtract working days
      a.lateStart = a.lateFinish; // approximation for now
    }
  });

  // Backward iterations
  changed = true;
  iterations = 0;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const act of processedActivities) {
      const succs = successorsMap.get(act.id) || [];
      if (succs.length > 0) {
        let minSuccStart: string | null = null;
        for (const succ of succs) {
          const succLateStart = succ.lateStart || succ.earlyStart || succ.startDate;
          if (!minSuccStart || isBefore(parseISO(succLateStart), parseISO(minSuccStart))) {
            minSuccStart = succLateStart;
          }
        }

        if (minSuccStart) {
          // Late finish is the working day before successor late start
          let prevDay = addDays(parseISO(minSuccStart), -1);
          while (!isWorkingDay(prevDay, calendarType)) {
            prevDay = addDays(prevDay, -1);
          }
          const lf = format(prevDay, 'yyyy-MM-dd');
          if (act.lateFinish !== lf) {
            act.lateFinish = lf;
            changed = true;
          }
        }
      }

      // Calculate Late Start from Late Finish
      if (act.lateFinish) {
        // Late start = lf - (duration - 1) working days
        let count = act.duration - 1;
        let cur = parseISO(act.lateFinish);
        while (count > 0) {
          cur = addDays(cur, -1);
          if (isWorkingDay(cur, calendarType)) {
            count--;
          }
        }
        const ls = format(cur, 'yyyy-MM-dd');
        if (act.lateStart !== ls) {
          act.lateStart = ls;
          changed = true;
        }
      }
    }
  }

  // 4. Calculate Total Float & Critical Path
  processedActivities.forEach(a => {
    if (a.earlyStart && a.lateStart) {
      const floatDays = calculateWorkingDaysBetween(a.earlyStart, a.lateStart, calendarType) - 1;
      a.totalFloat = Math.max(0, floatDays);
      a.isCritical = a.totalFloat === 0;
    } else {
      a.totalFloat = 0;
      a.isCritical = false;
    }
  });

  return processedActivities;
}

// Recalculate WBS summary dates based on child activities
export function updateWbsSummaries(wbsList: WbsItem[], activities: ActivityItem[], calendarType: WorkingCalendarType): WbsItem[] {
  return wbsList.map(wbs => {
    const childActivities = activities.filter(a => a.wbsId === wbs.id);
    if (childActivities.length === 0) {
      return {
        ...wbs,
        startDate: wbs.startDate || format(new Date(), 'yyyy-MM-dd'),
        finishDate: wbs.finishDate || format(new Date(), 'yyyy-MM-dd'),
        duration: 0
      };
    }

    let earliestStart = childActivities[0].startDate;
    let latestFinish = childActivities[0].finishDate;

    for (const act of childActivities) {
      if (isBefore(parseISO(act.startDate), parseISO(earliestStart))) {
        earliestStart = act.startDate;
      }
      if (isAfter(parseISO(act.finishDate), parseISO(latestFinish))) {
        latestFinish = act.finishDate;
      }
    }

    const duration = calculateWorkingDaysBetween(earliestStart, latestFinish, calendarType);

    return {
      ...wbs,
      startDate: earliestStart,
      finishDate: latestFinish,
      duration
    };
  });
}

// Phase color mapping matching reference image
export const PHASE_COLORS: { [key: string]: string } = {
  DEV: '#2563eb', // Blue
  LAND: '#16a34a', // Green
  ENG: '#ea580c', // Orange
  PRC: '#9333ea', // Purple
  CIV: '#dc2626', // Red
  ELE: '#0284c7', // Cyan / Teal
  TNC: '#d97706', // Amber / Gold
  HND: '#4f46e5', // Slate / Indigo
  SUB: '#7c3aed', // Violet
  BES: '#0d9488'  // Emerald / Teal
};

// DYNAMIC PROJECT GENERATOR
export function generateScheduleForProject(project: ProjectDetails): { wbs: WbsItem[]; activities: ActivityItem[] } {
  const wbs: WbsItem[] = [];
  const activities: ActivityItem[] = [];

  const {
    dcCapacityMWp,
    acCapacityMW,
    startDate,
    calendarType,
    mountingSystem,
    foundationType,
    inverterConfiguration,
    substationScope,
    tLineLengthKm,
    includeBess,
    scopes,
    parallelExecutionPreference
  } = project;

  // Capacity scale factor (baseline normalized around 50 MWp)
  // Large projects have more civil/electrical work, but executed in parallel blocks
  const scale = Math.max(0.6, Math.min(2.5, Math.pow(dcCapacityMWp / 50, 0.35)));

  // Fast-track factor
  const fastTrack = parallelExecutionPreference === 'Aggressive Fast-Track' ? 0.8 : parallelExecutionPreference === 'Sequential Risk-Averse' ? 1.25 : 1.0;

  let currentWbsIndex = 1;

  // 1.0 Project Development & Approvals
  const devScope = scopes.find(s => s.name.includes('Development') || s.name.includes('Approvals'))?.included ?? true;
  if (devScope) {
    const wbsId = 'wbs-dev';
    const wbsCode = `${currentWbsIndex}.0`;
    wbs.push({
      id: wbsId,
      code: wbsCode,
      name: 'Project Development & Approvals',
      level: 1,
      color: PHASE_COLORS.DEV,
      description: 'Statutory clearances, PPA compliance, and initial site study',
      isExpanded: true
    });

    const d1 = Math.round(7 * fastTrack);
    const d2 = Math.round(14 * fastTrack);
    const d3 = Math.round(17 * fastTrack);
    const d4 = Math.round(28 * fastTrack);

    activities.push(
      {
        id: 'act-dev-001',
        wbsId,
        code: 'DEV-001',
        name: 'Project Kick-off & Mobilization',
        startDate: startDate,
        finishDate: addWorkingDaysToDate(startDate, d1, calendarType),
        duration: d1,
        calendarId: calendarType,
        predecessors: [],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.DEV
      },
      {
        id: 'act-dev-002',
        wbsId,
        code: 'DEV-002',
        name: 'Site Feasibility & Energy Yield Assessment',
        startDate: startDate, // will be rescheduled by CPM
        finishDate: startDate,
        duration: d2,
        calendarId: calendarType,
        predecessors: ['DEV-001'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.DEV
      },
      {
        id: 'act-dev-003',
        wbsId,
        code: 'DEV-003',
        name: 'Project Cost Estimation & Financial Close',
        startDate: startDate,
        finishDate: startDate,
        duration: d3,
        calendarId: calendarType,
        predecessors: ['DEV-002'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.DEV
      },
      {
        id: 'act-dev-004',
        wbsId,
        code: 'DEV-004',
        name: 'Approvals & Statutory Clearances',
        startDate: startDate,
        finishDate: startDate,
        duration: d4,
        calendarId: calendarType,
        predecessors: ['DEV-003'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.DEV
      }
    );
    currentWbsIndex++;
  }

  // 2.0 Land & Site Preparation
  const landScope = scopes.find(s => s.name.includes('Land') || s.name.includes('Site Preparation'))?.included ?? true;
  if (landScope) {
    const wbsId = 'wbs-land';
    const wbsCode = `${currentWbsIndex}.0`;
    wbs.push({
      id: wbsId,
      code: wbsCode,
      name: 'Land & Site Preparation',
      level: 1,
      color: PHASE_COLORS.LAND,
      description: 'Site possession, boundary fencing, contouring and clearing',
      isExpanded: true
    });

    const d1 = Math.round(10 * fastTrack);
    const d2 = Math.round(14 * fastTrack);
    const d3 = Math.round(19 * fastTrack);
    const d4 = Math.round(25 * scale * fastTrack);

    activities.push(
      {
        id: 'act-land-001',
        wbsId,
        code: 'LAND-001',
        name: 'Land Handover & Boundary Demarcation',
        startDate: startDate,
        finishDate: startDate,
        duration: d1,
        calendarId: calendarType,
        predecessors: ['DEV-004'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.LAND
      },
      {
        id: 'act-land-002',
        wbsId,
        code: 'LAND-002',
        name: 'Topographical Survey & Contouring',
        startDate: startDate,
        finishDate: startDate,
        duration: d2,
        calendarId: calendarType,
        predecessors: ['LAND-001'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.LAND
      },
      {
        id: 'act-land-003',
        wbsId,
        code: 'LAND-003',
        name: `Geotechnical & Soil Investigation (${foundationType.split(' ')[0]})`,
        startDate: startDate,
        finishDate: startDate,
        duration: d3,
        calendarId: calendarType,
        predecessors: ['LAND-002'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.LAND
      },
      {
        id: 'act-land-004',
        wbsId,
        code: 'LAND-004',
        name: 'Site Clearing, Leveling & Security Fencing',
        startDate: startDate,
        finishDate: startDate,
        duration: d4,
        calendarId: calendarType,
        predecessors: ['LAND-003'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.LAND
      }
    );
    currentWbsIndex++;
  }

  // 3.0 Engineering & Design
  const engScope = scopes.find(s => s.name.includes('Engineering'))?.included ?? true;
  if (engScope) {
    const wbsId = 'wbs-eng';
    const wbsCode = `${currentWbsIndex}.0`;
    wbs.push({
      id: wbsId,
      code: wbsCode,
      name: 'Engineering & Design',
      level: 1,
      color: PHASE_COLORS.ENG,
      description: 'Civil, electrical, and structural detailed engineering',
      isExpanded: true
    });

    const d1 = Math.round(22 * fastTrack);
    const d2 = Math.round(25 * fastTrack);
    const d3 = Math.round(16 * fastTrack);

    activities.push(
      {
        id: 'act-eng-001',
        wbsId,
        code: 'ENG-001',
        name: `Basic Engineering & Plant Layout Optimization (${mountingSystem.split(' ')[0]})`,
        startDate: startDate,
        finishDate: startDate,
        duration: d1,
        calendarId: calendarType,
        predecessors: ['LAND-003'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.ENG
      },
      {
        id: 'act-eng-002',
        wbsId,
        code: 'ENG-002',
        name: `Detailed Civil & Electrical Engineering (${inverterConfiguration.split(' ')[0]})`,
        startDate: startDate,
        finishDate: startDate,
        duration: d2,
        calendarId: calendarType,
        predecessors: ['ENG-001'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.ENG
      },
      {
        id: 'act-eng-003',
        wbsId,
        code: 'ENG-003',
        name: 'Drawings, Statutory Submissions & Approvals',
        startDate: startDate,
        finishDate: startDate,
        duration: d3,
        calendarId: calendarType,
        predecessors: ['ENG-002'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.ENG
      }
    );
    currentWbsIndex++;
  }

  // 4.0 Procurement & Supply Chain
  const prcScope = scopes.find(s => s.name.includes('Procurement'))?.included ?? true;
  if (prcScope) {
    const wbsId = 'wbs-prc';
    const wbsCode = `${currentWbsIndex}.0`;
    wbs.push({
      id: wbsId,
      code: wbsCode,
      name: 'Procurement',
      level: 1,
      color: PHASE_COLORS.PRC,
      description: 'Supply of PV modules, inverters, MMS and balance of plant materials',
      isExpanded: true
    });

    const d1 = Math.round(46 * scale * fastTrack);
    const d2 = Math.round(57 * fastTrack);
    const d3 = Math.round(47 * scale * fastTrack);

    activities.push(
      {
        id: 'act-prc-001',
        wbsId,
        code: 'PRC-001',
        name: `PV Modules Procurement & Delivery (${dcCapacityMWp} MWp)`,
        startDate: startDate,
        finishDate: startDate,
        duration: d1,
        calendarId: calendarType,
        predecessors: ['ENG-003'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.PRC
      },
      {
        id: 'act-prc-002',
        wbsId,
        code: 'PRC-002',
        name: `Inverters & Electrical Equipment Supply (${acCapacityMW} MW)`,
        startDate: startDate,
        finishDate: startDate,
        duration: d2,
        calendarId: calendarType,
        predecessors: ['ENG-003'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.PRC
      },
      {
        id: 'act-prc-003',
        wbsId,
        code: 'PRC-003',
        name: `MMS Structures & Civil Materials Supply (${foundationType.split(' ')[0]})`,
        startDate: startDate,
        finishDate: startDate,
        duration: d3,
        calendarId: calendarType,
        predecessors: ['ENG-003'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.PRC
      }
    );
    currentWbsIndex++;
  }

  // 5.0 Civil Construction
  const civScope = scopes.find(s => s.name.includes('Civil'))?.included ?? true;
  if (civScope) {
    const wbsId = 'wbs-civ';
    const wbsCode = `${currentWbsIndex}.0`;
    wbs.push({
      id: wbsId,
      code: wbsCode,
      name: 'Civil Construction',
      level: 1,
      color: PHASE_COLORS.CIV,
      description: 'Roads, piling, foundation casting, and structure erection',
      isExpanded: true
    });

    const d1 = Math.round(30 * scale * fastTrack);
    const d2 = Math.round(42 * scale * fastTrack);
    const d3 = Math.round(72 * scale * fastTrack);

    activities.push(
      {
        id: 'act-civ-001',
        wbsId,
        code: 'CIV-001',
        name: 'Site Roads & Drainage Construction',
        startDate: startDate,
        finishDate: startDate,
        duration: d1,
        calendarId: calendarType,
        predecessors: ['PRC-001'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.CIV
      },
      {
        id: 'act-civ-002',
        wbsId,
        code: 'CIV-002',
        name: `Pile Foundation / Ramming Works (${foundationType})`,
        startDate: startDate,
        finishDate: startDate,
        duration: d2,
        calendarId: calendarType,
        predecessors: ['CIV-001'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.CIV
      },
      {
        id: 'act-civ-003',
        wbsId,
        code: 'CIV-003',
        name: `Module Mounting Structure (MMS) Erection (${mountingSystem})`,
        startDate: startDate,
        finishDate: startDate,
        duration: d3,
        calendarId: calendarType,
        predecessors: ['CIV-002'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.CIV
      }
    );
    currentWbsIndex++;
  }

  // 6.0 Electrical Installation
  const eleScope = scopes.find(s => s.name.includes('Electrical'))?.included ?? true;
  if (eleScope) {
    const wbsId = 'wbs-ele';
    const wbsCode = `${currentWbsIndex}.0`;
    wbs.push({
      id: wbsId,
      code: wbsCode,
      name: 'Electrical Installation',
      level: 1,
      color: PHASE_COLORS.ELE,
      description: 'PV module mounting, DC stringing, cabling, and inverter skid placement',
      isExpanded: true
    });

    const d1 = Math.round(78 * scale * fastTrack);
    const d2 = Math.round(81 * scale * fastTrack);
    const d3 = Math.round(77 * scale * fastTrack);

    activities.push(
      {
        id: 'act-ele-001',
        wbsId,
        code: 'ELE-001',
        name: 'Module Installation & Clamping',
        startDate: startDate,
        finishDate: startDate,
        duration: d1,
        calendarId: calendarType,
        predecessors: ['CIV-003'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.ELE
      },
      {
        id: 'act-ele-002',
        wbsId,
        code: 'ELE-002',
        name: 'Stringing, DC Cabling & Earthing Grid',
        startDate: startDate,
        finishDate: startDate,
        duration: d2,
        calendarId: calendarType,
        predecessors: ['ELE-001'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.ELE
      },
      {
        id: 'act-ele-003',
        wbsId,
        code: 'ELE-003',
        name: `Inverter & Transformer Skid Installation (${inverterConfiguration.split(' ')[0]})`,
        startDate: startDate,
        finishDate: startDate,
        duration: d3,
        calendarId: calendarType,
        predecessors: ['ELE-002'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.ELE
      }
    );
    currentWbsIndex++;
  }

  // Optional: Substation & Grid Interconnection Scope
  if (substationScope !== 'Not Applicable' || tLineLengthKm > 0) {
    const wbsId = 'wbs-sub';
    const wbsCode = `${currentWbsIndex}.0`;
    wbs.push({
      id: wbsId,
      code: wbsCode,
      name: 'Substation & Grid Interconnection',
      level: 1,
      color: PHASE_COLORS.SUB,
      description: `${substationScope} & ${tLineLengthKm} km Transmission Line`,
      isExpanded: true
    });

    const d1 = Math.round(45 * fastTrack);
    const d2 = Math.round(35 * fastTrack);

    activities.push(
      {
        id: 'act-sub-001',
        wbsId,
        code: 'SUB-001',
        name: `Pooling Substation / Bay Erection (${substationScope})`,
        startDate: startDate,
        finishDate: startDate,
        duration: d1,
        calendarId: calendarType,
        predecessors: ['CIV-002'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.SUB
      },
      {
        id: 'act-sub-002',
        wbsId,
        code: 'SUB-002',
        name: `Transmission Line Erection & Stringing (${tLineLengthKm} km)`,
        startDate: startDate,
        finishDate: startDate,
        duration: d2,
        calendarId: calendarType,
        predecessors: ['SUB-001'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.SUB
      }
    );
    currentWbsIndex++;
  }

  // 7.0 Testing & Commissioning
  const tncScope = scopes.find(s => s.name.includes('Testing') || s.name.includes('Commissioning'))?.included ?? true;
  if (tncScope) {
    const wbsId = 'wbs-tnc';
    const wbsCode = `${currentWbsIndex}.0`;
    wbs.push({
      id: wbsId,
      code: wbsCode,
      name: 'Testing & Commissioning',
      level: 1,
      color: PHASE_COLORS.TNC,
      description: 'Cold commissioning, hot commissioning, grid synchronization & COD',
      isExpanded: true
    });

    const d1 = Math.round(10 * fastTrack);
    const d2 = Math.round(16 * fastTrack);
    const d3 = Math.round(11 * fastTrack);

    activities.push(
      {
        id: 'act-tnc-001',
        wbsId,
        code: 'TNC-001',
        name: 'Pre-Commissioning Cold & Hot Tests',
        startDate: startDate,
        finishDate: startDate,
        duration: d1,
        calendarId: calendarType,
        predecessors: ['ELE-003'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.TNC
      },
      {
        id: 'act-tnc-002',
        wbsId,
        code: 'TNC-002',
        name: 'Grid Synchronization & Initial Charging',
        startDate: startDate,
        finishDate: startDate,
        duration: d2,
        calendarId: calendarType,
        predecessors: ['TNC-001'],
        isMilestone: true,
        status: 'Not Started',
        color: PHASE_COLORS.TNC
      },
      {
        id: 'act-tnc-003',
        wbsId,
        code: 'TNC-003',
        name: 'Commercial Operation Date (COD) & Performance Ratio Testing',
        startDate: startDate,
        finishDate: startDate,
        duration: d3,
        calendarId: calendarType,
        predecessors: ['TNC-002'],
        isMilestone: true,
        status: 'Not Started',
        color: PHASE_COLORS.TNC
      }
    );
    currentWbsIndex++;
  }

  // 8.0 Project Handover
  const hndScope = scopes.find(s => s.name.includes('Handover') || s.name.includes('Documentation'))?.included ?? true;
  if (hndScope) {
    const wbsId = 'wbs-hnd';
    const wbsCode = `${currentWbsIndex}.0`;
    wbs.push({
      id: wbsId,
      code: wbsCode,
      name: 'Project Handover',
      level: 1,
      color: PHASE_COLORS.HND,
      description: 'As-built documentation, O&M manuals, warranty handover & final punch list clearance',
      isExpanded: true
    });

    const d1 = Math.round(20 * fastTrack);
    const d2 = Math.round(16 * fastTrack);

    activities.push(
      {
        id: 'act-hnd-001',
        wbsId,
        code: 'HND-001',
        name: 'Final Documentation & As-Built Drawings',
        startDate: startDate,
        finishDate: startDate,
        duration: d1,
        calendarId: calendarType,
        predecessors: ['TNC-003'],
        isMilestone: false,
        status: 'Not Started',
        color: PHASE_COLORS.HND
      },
      {
        id: 'act-hnd-002',
        wbsId,
        code: 'HND-002',
        name: 'Final Project Handover & Client Sign-off',
        startDate: startDate,
        finishDate: startDate,
        duration: d2,
        calendarId: calendarType,
        predecessors: ['HND-001'],
        isMilestone: true,
        status: 'Not Started',
        color: PHASE_COLORS.HND
      }
    );
  }

  // Run initial CPM forward and backward pass
  const cpmActivities = runCpmCalculation(activities, calendarType, true);

  // Set baseline properties initially to match generated plan
  const baselineActivities = cpmActivities.map(a => ({
    ...a,
    baselineStart: a.startDate,
    baselineFinish: a.finishDate,
    baselineDuration: a.duration
  }));

  // Update summary dates for all WBS items
  const updatedWbs = updateWbsSummaries(wbs, baselineActivities, calendarType);

  return {
    wbs: updatedWbs,
    activities: baselineActivities
  };
}
