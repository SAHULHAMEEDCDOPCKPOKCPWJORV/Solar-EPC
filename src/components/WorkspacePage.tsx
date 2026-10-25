import React, { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import { ProjectHeader } from './ProjectHeader';
import { Toolbar } from './Toolbar';
import { WbsTable } from './WbsTable';
import { GanttChart } from './GanttChart';
import { PropertiesSidebar } from './PropertiesSidebar';
import { AddWbsModal } from './AddWbsModal';
import { AddActivityModal } from './AddActivityModal';
import { BaselineManagerModal } from './BaselineManagerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ActivityItem } from '../types';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const { selectedItem, setSelectedItem } = useProject();

  // Modals state
  const [isAddWbsOpen, setIsAddWbsOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [targetWbsForActivity, setTargetWbsForActivity] = useState<string>('');
  const [isBaselineManagerOpen, setIsBaselineManagerOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Synchronized Vertical Scroll Refs with active scroller lock
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const ganttScrollRef = useRef<HTMLDivElement>(null);
  const activeScroller = useRef<'table' | 'gantt' | null>(null);
  const scrollTimeout = useRef<any>(null);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeScroller.current === 'gantt') return;
    activeScroller.current = 'table';
    if (ganttScrollRef.current) {
      ganttScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      activeScroller.current = null;
    }, 60);
  };

  const handleGanttScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeScroller.current === 'table') return;
    activeScroller.current = 'gantt';
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      activeScroller.current = null;
    }, 60);
  };

  const handleOpenAddActivity = (targetWbsId: string) => {
    setTargetWbsForActivity(targetWbsId);
    setIsAddActivityOpen(true);
  };

  const handleOpenEditActivity = (activity: ActivityItem) => {
    setSelectedItem({ type: 'ACTIVITY', id: activity.id });
    setIsSidebarOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-100 font-sans">
      {/* 1. Project Dark Navy Header */}
      <ProjectHeader onOpenBaselineManager={() => setIsBaselineManagerOpen(true)} />

      {/* 2. Top Scheduling Toolbar */}
      <Toolbar
        onOpenAddWbs={() => setIsAddWbsOpen(true)}
        onOpenAddActivity={() => handleOpenAddActivity('')}
        onConfirmDelete={() => setIsConfirmDeleteOpen(true)}
      />

      {/* 3. Main Split Workspace (Table + Gantt + Properties Sidebar) */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Table Section */}
        <div className="w-[520px] lg:w-[620px] xl:w-[700px] shrink-0 h-full flex flex-col">
          <WbsTable
            onOpenEditActivity={handleOpenEditActivity}
            onOpenAddActivity={handleOpenAddActivity}
            onConfirmDelete={() => setIsConfirmDeleteOpen(true)}
            tableScrollRef={tableScrollRef}
            onScroll={handleTableScroll}
          />
        </div>

        {/* Center / Right Gantt Chart Section */}
        <div className="flex-1 h-full flex flex-col relative overflow-hidden">
          <GanttChart
            onOpenEditActivity={handleOpenEditActivity}
            ganttScrollRef={ganttScrollRef}
            onScroll={handleGanttScroll}
          />

          {/* Toggle Sidebar Floating Pill Button */}
          {!isSidebarOpen && selectedItem && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              title="Open Properties Sidebar"
              className="absolute top-14 right-4 z-30 p-2 bg-slate-900/90 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs cursor-pointer border border-slate-700"
            >
              <PanelRightOpen className="w-4 h-4 text-blue-400" />
              <span>Inspector</span>
            </button>
          )}
        </div>

        {/* Right Properties Sidebar */}
        {isSidebarOpen && selectedItem && (
          <PropertiesSidebar
            onClose={() => setIsSidebarOpen(false)}
            onOpenAddActivity={handleOpenAddActivity}
          />
        )}
      </div>

      {/* Modals */}
      <AddWbsModal
        isOpen={isAddWbsOpen}
        onClose={() => setIsAddWbsOpen(false)}
      />

      <AddActivityModal
        isOpen={isAddActivityOpen}
        targetWbsId={targetWbsForActivity}
        onClose={() => setIsAddActivityOpen(false)}
      />

      <BaselineManagerModal
        isOpen={isBaselineManagerOpen}
        onClose={() => setIsBaselineManagerOpen(false)}
      />

      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
