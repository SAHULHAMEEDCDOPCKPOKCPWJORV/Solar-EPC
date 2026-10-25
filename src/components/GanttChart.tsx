import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { WbsItem, ActivityItem } from '../types';
import {
  format,
  parseISO,
  differenceInDays,
  addDays,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isValid
} from 'date-fns';

interface GanttChartProps {
  onOpenEditActivity: (activity: ActivityItem) => void;
  ganttScrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

const ROW_HEIGHT = 36; // Exact match with table rows
const HEADER_HEIGHT = 44;

export const GanttChart: React.FC<GanttChartProps> = ({
  onOpenEditActivity,
  ganttScrollRef,
  onScroll
}) => {
  const {
    project,
    wbsList,
    activities,
    selectedItem,
    setSelectedItem,
    updateActivityDates,
    timeScale,
    zoomLevel,
    showCriticalPath,
    showDependencies,
    showBaseline,
    searchQuery
  } = useProject();

  // Dragging state for interactive bar editing
  const [dragState, setDragState] = useState<{
    activityId: string;
    type: 'MOVE' | 'RESIZE_START' | 'RESIZE_END';
    initialMouseX: number;
    initialStart: string;
    initialFinish: string;
    currentStart: string;
    currentFinish: string;
  } | null>(null);

  // 1. Determine Project Timeline Boundaries
  const { minDate, maxDate, totalDays, monthsList } = useMemo(() => {
    let start = project?.startDate ? parseISO(project.startDate) : new Date();
    let end = project?.targetFinishDate ? parseISO(project.targetFinishDate) : addDays(start, 365);

    // Expand to fit all activities
    activities.forEach(a => {
      try {
        const aStart = parseISO(a.startDate);
        const aEnd = parseISO(a.finishDate);
        if (isValid(aStart) && aStart < start) start = aStart;
        if (isValid(aEnd) && aEnd > end) end = aEnd;
      } catch {}
    });

    // Add margin (15 days before start, 45 days after end)
    const timelineStart = addDays(startOfMonth(start), -5);
    const timelineEnd = addDays(endOfMonth(end), 30);
    const days = Math.max(30, differenceInDays(timelineEnd, timelineStart) + 1);

    const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });

    return {
      minDate: timelineStart,
      maxDate: timelineEnd,
      totalDays: days,
      monthsList: months
    };
  }, [project, activities]);

  // Pixel width per day based on timescale and zoom level
  const pxPerDay = useMemo(() => {
    const base = timeScale === 'Day' ? 32 : timeScale === 'Week' ? 14 : timeScale === 'Month' ? 4.2 : 2.0;
    return base * zoomLevel;
  }, [timeScale, zoomLevel]);

  const totalWidth = totalDays * pxPerDay;

  // Convert Date to X coordinate
  const getXFromDate = (dateStr: string): number => {
    try {
      const d = parseISO(dateStr);
      if (!isValid(d)) return 0;
      const diff = differenceInDays(d, minDate);
      return Math.max(0, diff * pxPerDay);
    } catch {
      return 0;
    }
  };

  // Convert X coordinate back to Date (used during drag)
  const getDateFromX = (x: number): string => {
    const daysOffset = Math.round(x / pxPerDay);
    const targetDate = addDays(minDate, daysOffset);
    return format(targetDate, 'yyyy-MM-dd');
  };

  // Filter activities
  const filteredActivities = searchQuery.trim()
    ? activities.filter(
        a =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activities;

  // Flatten rows to synchronize Y positions with Left Table
  interface GanttRowItem {
    type: 'WBS' | 'ACTIVITY';
    wbs: WbsItem;
    activity?: ActivityItem;
    rowIndex: number;
    subIndex?: number;
  }

  const flattenedRows: GanttRowItem[] = useMemo(() => {
    const rows: GanttRowItem[] = [];
    let currentRow = 0;

    wbsList.forEach(wbs => {
      rows.push({
        type: 'WBS',
        wbs,
        rowIndex: currentRow++
      });

      if (wbs.isExpanded ?? true) {
        const childActs = filteredActivities.filter(a => a.wbsId === wbs.id);
        childActs.forEach((act, actIdx) => {
          rows.push({
            type: 'ACTIVITY',
            wbs,
            activity: act,
            rowIndex: currentRow++,
            subIndex: actIdx + 1
          });
        });
      }
    });

    return rows;
  }, [wbsList, filteredActivities]);

  // ----------------------------------------------------
  // MOUSE DRAG HANDLERS FOR INTERACTIVE EDITING
  // ----------------------------------------------------
  const handleMouseDown = (
    e: React.MouseEvent,
    activity: ActivityItem,
    type: 'MOVE' | 'RESIZE_START' | 'RESIZE_END'
  ) => {
    e.stopPropagation();
    setSelectedItem({ type: 'ACTIVITY', id: activity.id });
    setDragState({
      activityId: activity.id,
      type,
      initialMouseX: e.clientX,
      initialStart: activity.startDate,
      initialFinish: activity.finishDate,
      currentStart: activity.startDate,
      currentFinish: activity.finishDate
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.initialMouseX;
      const deltaDays = Math.round(deltaX / pxPerDay);

      if (deltaDays === 0) return;

      if (dragState.type === 'MOVE') {
        const newStart = format(addDays(parseISO(dragState.initialStart), deltaDays), 'yyyy-MM-dd');
        const newFinish = format(addDays(parseISO(dragState.initialFinish), deltaDays), 'yyyy-MM-dd');
        setDragState(prev => (prev ? { ...prev, currentStart: newStart, currentFinish: newFinish } : null));
      } else if (dragState.type === 'RESIZE_START') {
        const newStart = format(addDays(parseISO(dragState.initialStart), deltaDays), 'yyyy-MM-dd');
        if (newStart < dragState.initialFinish) {
          setDragState(prev => (prev ? { ...prev, currentStart: newStart } : null));
        }
      } else if (dragState.type === 'RESIZE_END') {
        const newFinish = format(addDays(parseISO(dragState.initialFinish), deltaDays), 'yyyy-MM-dd');
        if (newFinish > dragState.initialStart) {
          setDragState(prev => (prev ? { ...prev, currentFinish: newFinish } : null));
        }
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        if (
          dragState.currentStart !== dragState.initialStart ||
          dragState.currentFinish !== dragState.initialFinish
        ) {
          updateActivityDates(dragState.activityId, dragState.currentStart, dragState.currentFinish);
        }
        setDragState(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, pxPerDay, updateActivityDates]);

  // ----------------------------------------------------
  // DEPENDENCY CONNECTIONS (ARROWS) CALCULATION
  // ----------------------------------------------------
  interface DependencyPath {
    id: string;
    path: string;
    isCritical: boolean;
  }

  const dependencyPaths: DependencyPath[] = useMemo(() => {
    if (!showDependencies) return [];
    const paths: DependencyPath[] = [];

    // Map each activity ID/code to its row position and bar coordinates
    const actPositionMap = new Map<string, { xStart: number; xEnd: number; yCenter: number }>();

    flattenedRows.forEach(row => {
      if (row.type === 'ACTIVITY' && row.activity) {
        const act = row.activity;
        const xStart = getXFromDate(act.startDate);
        const xEnd = getXFromDate(act.finishDate) + (act.isMilestone ? 14 : pxPerDay);
        const yCenter = row.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

        actPositionMap.set(act.id, { xStart, xEnd, yCenter });
        actPositionMap.set(act.code, { xStart, xEnd, yCenter });
      }
    });

    flattenedRows.forEach(row => {
      if (row.type === 'ACTIVITY' && row.activity) {
        const succ = row.activity;
        const succPos = actPositionMap.get(succ.id);
        if (!succPos) return;

        (succ.predecessors || []).forEach((predRef, idx) => {
          const predPos = actPositionMap.get(predRef);
          if (!predPos) return;

          const x1 = predPos.xEnd;
          const y1 = predPos.yCenter;
          const x2 = succPos.xStart;
          const y2 = succPos.yCenter;

          // Orthogonal routing with elbow bend
          let d = '';
          if (x2 >= x1 + 10) {
            // Standard forward connector
            const midX = x1 + (x2 - x1) / 2;
            d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
          } else {
            // Backward/loop connector
            const offset = 14;
            const midY = y1 + (y2 - y1) / 2;
            d = `M ${x1} ${y1} L ${x1 + offset} ${y1} L ${x1 + offset} ${midY} L ${x2 - offset} ${midY} L ${x2 - offset} ${y2} L ${x2} ${y2}`;
          }

          const isCrit = (succ.isCritical && (activities.find(a => a.id === predRef || a.code === predRef)?.isCritical)) ?? false;

          paths.push({
            id: `dep-${predRef}-${succ.id}-${idx}`,
            path: d,
            isCritical: isCrit
          });
        });
      }
    });

    return paths;
  }, [flattenedRows, showDependencies, pxPerDay, activities]);

  // Current year display for timeline header
  const projectYear = format(minDate, 'yyyy');

  return (
    <div
      ref={ganttScrollRef}
      onScroll={onScroll}
      className="relative flex-1 h-full overflow-auto bg-slate-50 select-none custom-scrollbar"
      style={{ scrollbarWidth: 'thin' }}
    >
      <div style={{ width: Math.max(900, totalWidth), position: 'relative' }}>
        {/* ---------------------------------------------------- */}
        {/* TIMELINE CALENDAR HEADER (STICKY)                    */}
        {/* ---------------------------------------------------- */}
        <div className="sticky top-0 z-20 bg-[#0f172a] text-white shadow-sm border-b border-slate-700">
          {/* Top Row: Year Banner */}
          <div className="h-5 flex items-center justify-center font-bold text-xs tracking-wider border-b border-slate-700/80 bg-slate-900/90 text-slate-300">
            <span>{projectYear}</span>
          </div>

          {/* Bottom Row: Months / Subdivisions */}
          <div className="h-6 flex text-[11px] font-semibold text-slate-300">
            {monthsList.map((mDate, idx) => {
              const daysInMonth = differenceInDays(endOfMonth(mDate), startOfMonth(mDate)) + 1;
              const monthWidth = daysInMonth * pxPerDay;

              return (
                <div
                  key={idx}
                  style={{ width: monthWidth }}
                  className="flex items-center justify-center border-r border-slate-700/70 truncate px-1"
                >
                  {format(mDate, 'MMM')}
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* BACKGROUND GRID LINES                                */}
        {/* ---------------------------------------------------- */}
        <div className="absolute inset-0 top-[44px] pointer-events-none flex">
          {monthsList.map((mDate, idx) => {
            const daysInMonth = differenceInDays(endOfMonth(mDate), startOfMonth(mDate)) + 1;
            const monthWidth = daysInMonth * pxPerDay;
            return (
              <div
                key={idx}
                style={{ width: monthWidth }}
                className="h-full border-r border-slate-200/90"
              />
            );
          })}
        </div>

        {/* ---------------------------------------------------- */}
        {/* SVG DEPENDENCY ARROWS LAYER                          */}
        {/* ---------------------------------------------------- */}
        <svg
          className="absolute inset-0 top-[44px] pointer-events-none z-10"
          style={{ width: totalWidth, height: flattenedRows.length * ROW_HEIGHT }}
        >
          <defs>
            {/* Standard arrowhead */}
            <marker
              id="arrowhead-normal"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#475569" />
            </marker>

            {/* Critical arrowhead */}
            <marker
              id="arrowhead-critical"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#dc2626" />
            </marker>
          </defs>

          {dependencyPaths.map(dp => (
            <path
              key={dp.id}
              d={dp.path}
              fill="none"
              stroke={dp.isCritical && showCriticalPath ? '#dc2626' : '#64748b'}
              strokeWidth={dp.isCritical && showCriticalPath ? '2.5' : '1.5'}
              strokeDasharray={dp.isCritical && showCriticalPath ? 'none' : 'none'}
              markerEnd={
                dp.isCritical && showCriticalPath
                  ? 'url(#arrowhead-critical)'
                  : 'url(#arrowhead-normal)'
              }
              className="transition-colors"
            />
          ))}
        </svg>

        {/* ---------------------------------------------------- */}
        {/* GANTT ROWS & BARS                                    */}
        {/* ---------------------------------------------------- */}
        <div className="relative z-10">
          {flattenedRows.map(row => {
            const isSelected =
              (row.type === 'WBS' && selectedItem?.type === 'WBS' && selectedItem.id === row.wbs.id) ||
              (row.type === 'ACTIVITY' &&
                selectedItem?.type === 'ACTIVITY' &&
                selectedItem.id === row.activity?.id);

            // ==================================================
            // CASE A: WBS SUMMARY ROW
            // ==================================================
            if (row.type === 'WBS') {
              const wbs = row.wbs;
              const xStart = getXFromDate(wbs.startDate || project?.startDate || '');
              const xEnd = getXFromDate(wbs.finishDate || wbs.startDate || project?.startDate || '');
              const barWidth = Math.max(28, xEnd - xStart);

              return (
                <div
                  key={`gantt-wbs-${wbs.id}`}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => setSelectedItem({ type: 'WBS', id: wbs.id })}
                  className={`relative flex items-center border-b border-slate-200/80 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-100/50'
                  }`}
                >
                  {/* WBS Summary Bar */}
                  <div
                    style={{
                      left: xStart,
                      width: barWidth,
                      backgroundColor: wbs.color
                    }}
                    className="absolute h-4 rounded shadow-sm flex items-center transition-all group"
                  >
                    {/* Left & Right Bracket Notches (Primavera / MS Project Style) */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/30 rounded-l" />
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-black/30 rounded-r" />
                  </div>

                  {/* Milestone Diamond on WBS End */}
                  <div
                    style={{ left: xStart - 4, backgroundColor: wbs.color }}
                    className="absolute w-2.5 h-2.5 rotate-45 rounded-[1px] shadow-sm"
                  />

                  {/* NON-NEGOTIABLE REQUIREMENT: DIRECT DISPLAY OF WBS NAME INSIDE GANTT */}
                  <div
                    style={{ left: xStart + barWidth + 8 }}
                    className="absolute whitespace-nowrap text-xs font-bold text-slate-800 flex items-center gap-1.5 pointer-events-none drop-shadow-sm"
                  >
                    <span className="font-mono text-slate-900">{wbs.code}</span>
                    <span className="text-slate-900">{wbs.name}</span>
                  </div>
                </div>
              );
            }

            // ==================================================
            // CASE B: ACTIVITY ROW
            // ==================================================
            const act = row.activity!;
            const isDraggingThis = dragState?.activityId === act.id;
            const effStart = isDraggingThis ? dragState.currentStart : act.startDate;
            const effFinish = isDraggingThis ? dragState.currentFinish : act.finishDate;

            const xStart = getXFromDate(effStart);
            const xEnd = getXFromDate(effFinish);
            const barWidth = Math.max(16, xEnd - xStart);

            const isCriticalActive = showCriticalPath && act.isCritical;

            return (
              <div
                key={`gantt-act-${act.id}`}
                style={{ height: ROW_HEIGHT }}
                onClick={() => setSelectedItem({ type: 'ACTIVITY', id: act.id })}
                onDoubleClick={() => onOpenEditActivity(act)}
                className={`relative flex items-center border-b border-slate-200/60 cursor-pointer transition-colors group ${
                  isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-100/60'
                }`}
              >
                {/* Baseline Comparison Ghost Bar (Shown underneath when enabled) */}
                {showBaseline && act.baselineStart && act.baselineFinish && (
                  <div
                    style={{
                      left: getXFromDate(act.baselineStart),
                      width: Math.max(14, getXFromDate(act.baselineFinish) - getXFromDate(act.baselineStart))
                    }}
                    title={`Baseline: ${act.baselineStart} to ${act.baselineFinish} (${act.baselineDuration}d)`}
                    className="absolute h-2.5 -bottom-0.5 rounded-sm bg-slate-400/50 border border-slate-500/50 pointer-events-none z-0"
                  />
                )}

                {/* Milestone Diamond OR Activity Bar */}
                {act.isMilestone ? (
                  <div
                    style={{
                      left: xStart,
                      transform: 'translateX(-50%)'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, act, 'MOVE')}
                    title={`${act.code} - ${act.name} (Milestone)`}
                    className="absolute w-5 h-5 rotate-45 bg-amber-500 hover:bg-amber-400 border-2 border-white shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform hover:scale-110 z-10"
                  />
                ) : (
                  /* Standard Activity Bar */
                  <div
                    style={{
                      left: xStart,
                      width: barWidth,
                      backgroundColor: act.color || row.wbs.color
                    }}
                    onMouseDown={(e) => handleMouseDown(e, act, 'MOVE')}
                    className={`absolute h-5 rounded-[4px] shadow-sm flex items-center cursor-grab active:cursor-grabbing transition-all select-none z-10 ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white' : ''
                    } ${
                      isCriticalActive
                        ? 'ring-2 ring-rose-500 shadow-md shadow-rose-500/30 font-bold'
                        : ''
                    }`}
                  >
                    {/* Left Drag Resize Handle */}
                    <div
                      onMouseDown={(e) => handleMouseDown(e, act, 'RESIZE_START')}
                      title="Drag to change start date"
                      className="absolute -left-1 top-0 bottom-0 w-2.5 hover:bg-black/30 rounded-l cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    />

                    {/* Right Drag Resize Handle */}
                    <div
                      onMouseDown={(e) => handleMouseDown(e, act, 'RESIZE_END')}
                      title="Drag to change duration / finish date"
                      className="absolute -right-1 top-0 bottom-0 w-2.5 hover:bg-black/30 rounded-r cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}

                {/* NON-NEGOTIABLE REQUIREMENT: DIRECT DISPLAY OF ACTIVITY ID & NAME BESIDE BAR */}
                <div
                  style={{
                    left: xStart + barWidth + (act.isMilestone ? 14 : 8)
                  }}
                  className="absolute whitespace-nowrap text-xs font-medium text-slate-800 flex items-center gap-1.5 pointer-events-none drop-shadow-sm select-none"
                >
                  <span className="font-mono text-slate-600 font-semibold">{`${row.wbs.code.replace('.0', '')}.${row.subIndex}`}</span>
                  <span className="text-slate-800 font-medium">{act.name}</span>
                  {isCriticalActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-300">
                      CRITICAL
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
