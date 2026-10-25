import React from 'react';
import { useProject } from '../context/ProjectContext';
import { WbsItem, ActivityItem } from '../types';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  MoreVertical,
  CheckCircle,
  Clock,
  Diamond
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface WbsTableProps {
  onOpenEditActivity: (activity: ActivityItem) => void;
  onOpenAddActivity: (targetWbsId: string) => void;
  onConfirmDelete: () => void;
  tableScrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const WbsTable: React.FC<WbsTableProps> = ({
  onOpenEditActivity,
  onOpenAddActivity,
  onConfirmDelete,
  tableScrollRef,
  onScroll
}) => {
  const {
    wbsList,
    activities,
    selectedItem,
    setSelectedItem,
    toggleWbsExpand,
    deleteActivity,
    deleteWbs,
    searchQuery
  } = useProject();

  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  // Filter activities based on search query
  const filteredActivities = searchQuery.trim()
    ? activities.filter(
        a =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activities;

  return (
    <div
      ref={tableScrollRef}
      onScroll={onScroll}
      className="h-full overflow-y-auto overflow-x-auto bg-white border-r border-slate-300 select-none custom-scrollbar"
      style={{ scrollbarWidth: 'thin' }}
    >
      <table className="w-full border-collapse text-left text-xs text-slate-700 min-w-[780px]">
        {/* Table Header */}
        <thead className="sticky top-0 z-20 bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider shadow-sm">
          <tr>
            <th className="py-2.5 px-2.5 w-14 text-center border-r border-slate-700">WBS</th>
            <th className="py-2.5 px-3 w-28 border-r border-slate-700">Activity ID</th>
            <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-700">Activity Name</th>
            <th className="py-2.5 px-2.5 w-24 text-center border-r border-slate-700">Start Date</th>
            <th className="py-2.5 px-2.5 w-24 text-center border-r border-slate-700">Finish Date</th>
            <th className="py-2.5 px-2 w-20 text-center border-r border-slate-700">Duration (Days)</th>
            <th className="py-2.5 px-2 w-20 text-center border-r border-slate-700">Predecessors</th>
            <th className="py-2.5 px-2 w-24 text-center">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {wbsList.map(wbs => {
            const childActs = filteredActivities.filter(a => a.wbsId === wbs.id);
            const isSelected = selectedItem?.type === 'WBS' && selectedItem.id === wbs.id;
            const isExpanded = wbs.isExpanded ?? true;

            return (
              <React.Fragment key={wbs.id}>
                {/* WBS Phase Header Row */}
                <tr
                  onClick={() => setSelectedItem({ type: 'WBS', id: wbs.id })}
                  className={`h-9 cursor-pointer transition-all border-b border-white/20 text-white font-bold text-xs select-none ${
                    isSelected ? 'ring-2 ring-blue-400 ring-inset' : ''
                  }`}
                  style={{ backgroundColor: wbs.color }}
                >
                  {/* WBS Code with Expand Toggle */}
                  <td className="py-1 px-2 text-center border-r border-white/20 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWbsExpand(wbs.id);
                        }}
                        className="hover:bg-black/20 p-0.5 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span>{wbs.code}</span>
                    </div>
                  </td>

                  {/* Empty ID */}
                  <td className="py-1 px-2 text-center border-r border-white/20 text-[11px] opacity-80">
                    —
                  </td>

                  {/* WBS Name */}
                  <td className="py-1 px-3 border-r border-white/20 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0" />}
                      <span className="truncate">{wbs.name}</span>
                    </div>
                  </td>

                  {/* Start Date */}
                  <td className="py-1 px-2 text-center border-r border-white/20 whitespace-nowrap text-[11px] font-semibold">
                    {formatDateDisplay(wbs.startDate || '')}
                  </td>

                  {/* Finish Date */}
                  <td className="py-1 px-2 text-center border-r border-white/20 whitespace-nowrap text-[11px] font-semibold">
                    {formatDateDisplay(wbs.finishDate || '')}
                  </td>

                  {/* Duration */}
                  <td className="py-1 px-2 text-center border-r border-white/20 font-mono text-xs">
                    {wbs.duration || 0}
                  </td>

                  {/* Predecessors */}
                  <td className="py-1 px-2 text-center border-r border-white/20 text-slate-200">
                    —
                  </td>

                  {/* WBS Actions */}
                  <td className="py-1 px-2 text-center">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedItem({ type: 'WBS', id: wbs.id })}
                        title="Edit WBS Properties"
                        className="p-1 rounded hover:bg-black/20 text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenAddActivity(wbs.id)}
                        title="Add Activity to this WBS"
                        className="p-1 rounded hover:bg-black/20 text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteWbs(wbs.id)}
                        title="Delete WBS Package"
                        className="p-1 rounded hover:bg-black/20 text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Child Activities (Rendered if expanded) */}
                {isExpanded &&
                  childActs.map((act, actIdx) => {
                    const isActSelected = selectedItem?.type === 'ACTIVITY' && selectedItem.id === act.id;
                    const isEven = actIdx % 2 === 0;

                    return (
                      <tr
                        key={act.id}
                        onClick={() => setSelectedItem({ type: 'ACTIVITY', id: act.id })}
                        className={`h-9 border-b border-slate-200 cursor-pointer transition-colors text-xs ${
                          isActSelected
                            ? 'bg-blue-50/90 font-medium text-blue-900 border-l-4 border-l-blue-600'
                            : isEven
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-[#fcfdfd] hover:bg-slate-50'
                        }`}
                      >
                        {/* WBS Subcode */}
                        <td className="py-1 px-2 text-center text-slate-500 font-mono border-r border-slate-200">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-slate-400 text-[10px]">&gt;</span>
                            <span>{`${wbs.code.replace('.0', '')}.${actIdx + 1}`}</span>
                          </div>
                        </td>

                        {/* Activity ID */}
                        <td className="py-1 px-3 font-mono text-[11px] font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                          {act.code}
                        </td>

                        {/* Activity Name */}
                        <td className="py-1 px-3 border-r border-slate-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {act.isMilestone ? (
                              <Diamond className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            ) : (
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: act.color || wbs.color }}
                              />
                            )}
                            <span className="truncate text-slate-900">{act.name}</span>
                          </div>
                        </td>

                        {/* Start Date */}
                        <td className="py-1 px-2 text-center border-r border-slate-200 whitespace-nowrap font-mono text-[11px] text-slate-700">
                          {formatDateDisplay(act.startDate)}
                        </td>

                        {/* Finish Date */}
                        <td className="py-1 px-2 text-center border-r border-slate-200 whitespace-nowrap font-mono text-[11px] text-slate-700">
                          {formatDateDisplay(act.finishDate)}
                        </td>

                        {/* Duration (Days) */}
                        <td className="py-1 px-2 text-center border-r border-slate-200 font-semibold font-mono text-slate-800">
                          {act.duration}
                        </td>

                        {/* Predecessors */}
                        <td className="py-1 px-2 text-center border-r border-slate-200 text-slate-600 font-mono text-[11px]">
                          {(act.predecessors || []).join(', ') || '-'}
                        </td>

                        {/* Actions Matching Reference Image Icons */}
                        <td className="py-1 px-2 text-center">
                          <div
                            className="flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Blue Pencil Edit */}
                            <button
                              onClick={() => onOpenEditActivity(act)}
                              title="Edit Activity"
                              className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Blue Plus Add Sibling */}
                            <button
                              onClick={() => onOpenAddActivity(wbs.id)}
                              title="Add Activity Here"
                              className="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            {/* Red Trash Delete */}
                            <button
                              onClick={() => deleteActivity(act.id)}
                              title="Delete Activity"
                              className="p-1 rounded hover:bg-rose-100 text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Vertical 3 dots */}
                            <button
                              onClick={() => setSelectedItem({ type: 'ACTIVITY', id: act.id })}
                              title="More Options"
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
