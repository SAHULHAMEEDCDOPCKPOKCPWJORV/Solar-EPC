import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Plus,
  Trash2,
  Indent,
  Outdent,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Calendar,
  Eye,
  GitBranch,
  ShieldAlert,
  Layers,
  RotateCcw,
  RotateCw,
  LayoutGrid,
  Settings
} from 'lucide-react';

interface ToolbarProps {
  onOpenAddWbs: () => void;
  onOpenAddActivity: () => void;
  onConfirmDelete: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenAddWbs,
  onOpenAddActivity,
  onConfirmDelete
}) => {
  const {
    selectedItem,
    moveWbs,
    indentActivity,
    outdentActivity,
    autoSchedule,
    setAutoSchedule,
    runAutoReschedule,
    timeScale,
    setTimeScale,
    zoomLevel,
    setZoomLevel,
    searchQuery,
    setSearchQuery,
    showCriticalPath,
    setShowCriticalPath,
    showDependencies,
    setShowDependencies,
    showBaseline,
    setShowBaseline,
    undo,
    redo,
    canUndo,
    canRedo
  } = useProject();

  const handleMoveUp = () => {
    if (selectedItem?.type === 'WBS') {
      moveWbs(selectedItem.id, 'UP');
    }
  };

  const handleMoveDown = () => {
    if (selectedItem?.type === 'WBS') {
      moveWbs(selectedItem.id, 'DOWN');
    }
  };

  const handleIndent = () => {
    if (selectedItem?.id) {
      indentActivity(selectedItem.id);
    }
  };

  const handleOutdent = () => {
    if (selectedItem?.id) {
      outdentActivity(selectedItem.id);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleFitView = () => {
    setZoomLevel(1);
    setTimeScale('Month');
  };

  return (
    <div className="bg-[#0f172a] text-slate-200 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 select-none shadow-sm text-xs">
      {/* Left Operation Buttons Matching Reference Image */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* + Add WBS (Blue Pill) */}
        <button
          onClick={onOpenAddWbs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2563eb] hover:bg-blue-600 text-white font-medium shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add WBS</span>
        </button>

        {/* + Add Activity (Green Pill) */}
        <button
          onClick={onOpenAddActivity}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16a34a] hover:bg-emerald-600 text-white font-medium shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Activity</span>
        </button>

        {/* Delete (Red Pill) */}
        <button
          onClick={onConfirmDelete}
          disabled={!selectedItem}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium shadow-sm transition-all ${
            selectedItem
              ? 'bg-[#dc2626] hover:bg-rose-600 text-white cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-700/80 mx-1 hidden sm:block" />

        {/* Indent / Outdent */}
        <button
          onClick={handleIndent}
          title="Indent selected row"
          className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
        >
          <Indent className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Indent</span>
        </button>

        <button
          onClick={handleOutdent}
          title="Outdent selected row"
          className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
        >
          <Outdent className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Outdent</span>
        </button>

        {/* Move Up / Move Down */}
        <button
          onClick={handleMoveUp}
          title="Move WBS Up"
          className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Move Up</span>
        </button>

        <button
          onClick={handleMoveDown}
          title="Move WBS Down"
          className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Move Down</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-700/80 mx-1 hidden sm:block" />

        {/* Auto Schedule Toggle */}
        <button
          onClick={() => {
            if (!autoSchedule) {
              setAutoSchedule(true);
              runAutoReschedule();
            } else {
              setAutoSchedule(false);
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-colors cursor-pointer ${
            autoSchedule
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-semibold'
              : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${autoSchedule ? 'text-blue-400' : ''}`} />
          <span>Auto Schedule</span>
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded border ${
              canUndo
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 cursor-pointer'
                : 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-1.5 rounded border ${
              canRedo
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 cursor-pointer'
                : 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-slate-700/80 mx-1 hidden lg:block" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            title="Zoom In Timeline"
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Zoom In</span>
          </button>

          <button
            onClick={handleZoomOut}
            title="Zoom Out Timeline"
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Zoom Out</span>
          </button>

          <button
            onClick={handleFitView}
            title="Fit Entire Project in View"
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Fit View</span>
          </button>
        </div>
      </div>

      {/* Right Controls: Search, Timescale, View Filters */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity..."
            className="pl-8 pr-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Timescale Dropdown (Day / Week / Month / Quarter) */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-2 py-1 gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={timeScale}
            onChange={(e) => setTimeScale(e.target.value as any)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="Day" className="bg-slate-900 text-slate-200">Day</option>
            <option value="Week" className="bg-slate-900 text-slate-200">Week</option>
            <option value="Month" className="bg-slate-900 text-slate-200">Month</option>
            <option value="Quarter" className="bg-slate-900 text-slate-200">Quarter</option>
          </select>
        </div>

        {/* Toggle: Critical Path */}
        <button
          onClick={() => setShowCriticalPath(!showCriticalPath)}
          title="Toggle Critical Path Highlighting"
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            showCriticalPath
              ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
        </button>

        {/* Toggle: Dependencies */}
        <button
          onClick={() => setShowDependencies(!showDependencies)}
          title="Toggle Dependency Arrows"
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            showDependencies
              ? 'bg-blue-500/20 border-blue-500 text-blue-300'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
        </button>

        {/* Toggle: Baseline Comparison */}
        <button
          onClick={() => setShowBaseline(!showBaseline)}
          title="Toggle Baseline Comparison Bars"
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            showBaseline
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
