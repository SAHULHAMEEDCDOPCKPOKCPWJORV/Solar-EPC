import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  SunMedium,
  Calendar,
  Clock,
  Zap,
  MapPin,
  ArrowLeft,
  Save,
  FileSpreadsheet,
  Layers,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

export const ProjectHeader: React.FC<{ onOpenBaselineManager: () => void }> = ({ onOpenBaselineManager }) => {
  const {
    project,
    wbsList,
    activities,
    setCurrentPage,
    saveProjectToStorage,
    exportToExcel,
    logout,
    showBaseline,
    setShowBaseline,
    showCriticalPath,
    setShowCriticalPath
  } = useProject();

  if (!project) return null;

  // Format dates
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  // Calculate project finish from activities
  let finishDate = project.targetFinishDate || project.startDate;
  if (activities.length > 0) {
    const dates = activities.map(a => a.finishDate).sort();
    finishDate = dates[dates.length - 1];
  }

  const totalDays = differenceInDays(parseISO(finishDate), parseISO(project.startDate)) + 1;
  const criticalCount = activities.filter(a => a.isCritical).length;

  return (
    <header className="bg-[#0b1329] text-white border-b border-slate-800 shadow-md">
      {/* Top Bar with Project Identity and Actions */}
      <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('DETAILS')}
            title="Edit Project Configuration"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20 border border-blue-400/30">
              <SunMedium className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
                  {project.name}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold">
                  {project.code || project.id}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Baseline Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{project.client}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {project.location.district}, {project.location.state}
                </span>
                <span>•</span>
                <span className="text-blue-400">{project.executionModel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2">
          {/* Baseline Manager Button */}
          <button
            onClick={onOpenBaselineManager}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Baselines</span>
          </button>

          {/* Save Project Button */}
          <button
            onClick={saveProjectToStorage}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save</span>
          </button>

          {/* Export Excel Button (Prominent) */}
          <button
            onClick={exportToExcel}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Bar */}
      <div className="px-5 py-2.5 bg-[#080e1e] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        {/* Card 1: Start Date */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/90">
          <div className="p-2 rounded-md bg-blue-500/10 text-blue-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Project Start</p>
            <p className="text-xs font-bold text-white truncate">{formatDateDisplay(project.startDate)}</p>
          </div>
        </div>

        {/* Card 2: Finish Date */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/90">
          <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Project Finish</p>
            <p className="text-xs font-bold text-white truncate">{formatDateDisplay(finishDate)}</p>
          </div>
        </div>

        {/* Card 3: Total Planned Duration */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/90">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Total Duration</p>
            <p className="text-xs font-bold text-amber-300 truncate">{totalDays} Calendar Days</p>
          </div>
        </div>

        {/* Card 4: Capacity */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/90">
          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Capacity</p>
            <p className="text-xs font-bold text-white truncate">
              {project.dcCapacityMWp} MWp <span className="text-slate-400 font-normal">/ {project.acCapacityMW} MW</span>
            </p>
          </div>
        </div>

        {/* Card 5: Critical Path Status */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/90">
          <div className="p-2 rounded-md bg-rose-500/10 text-rose-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Critical Path</p>
            <p className="text-xs font-bold text-rose-300 truncate">
              {criticalCount} Critical Tasks
            </p>
          </div>
        </div>

        {/* Card 6: Work Calendar */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/90">
          <div className="p-2 rounded-md bg-purple-500/10 text-purple-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Calendar</p>
            <p className="text-xs font-bold text-slate-200 truncate">
              {project.workingDaysPerWeek}d / wk ({project.dailyWorkingHours}h)
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
