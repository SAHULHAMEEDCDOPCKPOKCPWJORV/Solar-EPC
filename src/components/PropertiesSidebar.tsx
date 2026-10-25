import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { WbsItem, ActivityItem } from '../types';
import {
  X,
  Calendar,
  Clock,
  Trash2,
  Plus,
  Pencil,
  Check,
  Diamond,
  Layers,
  FileText,
  Users,
  GitBranch,
  Save
} from 'lucide-react';
import { PHASE_COLORS } from '../utils/schedulerEngine';

interface PropertiesSidebarProps {
  onClose: () => void;
  onOpenAddActivity: (targetWbsId: string) => void;
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  onClose,
  onOpenAddActivity
}) => {
  const {
    wbsList,
    activities,
    selectedItem,
    setSelectedItem,
    updateWbs,
    deleteWbs,
    updateActivity,
    deleteActivity,
    updateActivityDates,
    showToast
  } = useProject();

  const [activeTab, setActiveTab] = useState<'General' | 'Predecessors' | 'Resources' | 'Notes'>('General');

  // Find currently selected item
  const selectedWbs = selectedItem?.type === 'WBS' ? wbsList.find(w => w.id === selectedItem.id) : null;
  const selectedActivity = selectedItem?.type === 'ACTIVITY' ? activities.find(a => a.id === selectedItem.id) : null;
  const parentWbs = selectedActivity ? wbsList.find(w => w.id === selectedActivity.wbsId) : null;

  // Local form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [color, setColor] = useState('#2563eb');
  const [isMilestone, setIsMilestone] = useState(false);
  const [predecessors, setPredecessors] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Sync state when selectedItem changes
  useEffect(() => {
    if (selectedWbs) {
      setName(selectedWbs.name);
      setCode(selectedWbs.code);
      setStartDate(selectedWbs.startDate || '');
      setFinishDate(selectedWbs.finishDate || '');
      setDuration(selectedWbs.duration || 1);
      setColor(selectedWbs.color);
      setIsMilestone(false);
      setPredecessors([]);
      setNotes(selectedWbs.description || '');
    } else if (selectedActivity) {
      setName(selectedActivity.name);
      setCode(selectedActivity.code);
      setStartDate(selectedActivity.startDate);
      setFinishDate(selectedActivity.finishDate);
      setDuration(selectedActivity.duration);
      setColor(selectedActivity.color || parentWbs?.color || '#2563eb');
      setIsMilestone(selectedActivity.isMilestone);
      setPredecessors(selectedActivity.predecessors || []);
      setNotes(selectedActivity.description || '');
    }
  }, [selectedItem, selectedWbs, selectedActivity, parentWbs]);

  if (!selectedItem || (!selectedWbs && !selectedActivity)) {
    return null;
  }

  // Handle Save / Update
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedWbs) {
      updateWbs({
        ...selectedWbs,
        name: name.trim() || selectedWbs.name,
        code: code.trim() || selectedWbs.code,
        color,
        description: notes
      });
    } else if (selectedActivity) {
      updateActivity({
        ...selectedActivity,
        name: name.trim() || selectedActivity.name,
        code: code.trim() || selectedActivity.code,
        startDate,
        finishDate,
        duration: Number(duration),
        color,
        isMilestone,
        predecessors,
        description: notes
      });
    }
  };

  const handleDelete = () => {
    if (selectedWbs) {
      deleteWbs(selectedWbs.id);
      onClose();
    } else if (selectedActivity) {
      deleteActivity(selectedActivity.id);
      onClose();
    }
  };

  // Sub-activities list (if WBS is selected, or siblings if activity is selected)
  const currentWbsId = selectedWbs ? selectedWbs.id : parentWbs?.id;
  const subActivities = currentWbsId ? activities.filter(a => a.wbsId === currentWbsId) : [];

  const titleColor = selectedWbs ? selectedWbs.color : parentWbs?.color || '#2563eb';
  const titleText = selectedWbs
    ? `${selectedWbs.code} ${selectedWbs.name}`
    : `${selectedActivity?.code} ${selectedActivity?.name}`;

  return (
    <aside className="w-80 sm:w-96 bg-white border-l border-slate-300 flex flex-col h-full shadow-lg z-20 overflow-hidden select-none">
      {/* 1. Header with Phase Color Matching Reference Image */}
      <div
        style={{ backgroundColor: titleColor }}
        className="px-4 py-3 flex items-center justify-between text-white font-bold text-sm shadow-sm"
      >
        <span className="truncate pr-2">{titleText}</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/20 text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Tabs: General | Predecessors | Resources | Notes */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
        {(['General', 'Predecessors', 'Resources', 'Notes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Tab Body Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {activeTab === 'General' && (
          <form onSubmit={handleUpdate} className="space-y-3.5">
            {/* WBS Code */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">WBS</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Activity Name */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Activity Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Finish Date */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Finish Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={finishDate}
                  onChange={(e) => setFinishDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Duration (Days) */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Duration (Days)</label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phase Color</label>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded border border-slate-300 shrink-0"
                  style={{ backgroundColor: color }}
                />
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="#2563eb">Deep Blue (Development)</option>
                  <option value="#16a34a">Forest Green (Land & Site)</option>
                  <option value="#ea580c">Vibrant Orange (Engineering)</option>
                  <option value="#9333ea">Royal Purple (Procurement)</option>
                  <option value="#dc2626">Crimson Red (Civil Works)</option>
                  <option value="#0284c7">Cyan / Sky Blue (Electrical)</option>
                  <option value="#d97706">Amber Gold (Commissioning)</option>
                  <option value="#4f46e5">Indigo Blue (Handover)</option>
                  <option value="#7c3aed">Violet (Substation/Grid)</option>
                  <option value="#0d9488">Emerald Teal (Battery BESS)</option>
                </select>
              </div>
            </div>

            {/* Milestone Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="font-medium text-slate-700">Milestone</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMilestone}
                  onChange={(e) => setIsMilestone(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Action Buttons Matching Reference Image */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="submit"
                className="py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-colors cursor-pointer text-center"
              >
                Update
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="py-2 px-3 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition-colors cursor-pointer text-center"
              >
                Delete
              </button>
            </div>
          </form>
        )}

        {/* PREDECESSORS TAB */}
        {activeTab === 'Predecessors' && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Select predecessor activities that must finish before this activity can begin (Finish-to-Start):
            </p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded p-2">
              {activities
                .filter(a => a.id !== selectedActivity?.id)
                .map(a => {
                  const isChecked = predecessors.includes(a.code) || predecessors.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPredecessors([...predecessors, a.code]);
                          } else {
                            setPredecessors(predecessors.filter(p => p !== a.code && p !== a.id));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-mono text-[11px] text-slate-600 font-semibold">{a.code}</span>
                      <span className="text-slate-800 truncate">{a.name}</span>
                    </label>
                  );
                })}
            </div>
            <button
              onClick={handleUpdate}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition-colors"
            >
              Save Dependencies
            </button>
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'Resources' && (
          <div className="space-y-3 text-slate-600">
            <p className="text-[11px] text-slate-500">Assigned Project Resources & Engineering Roles:</p>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Civil & Structural Team</span>
                <span className="text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Quality Inspection (QA/QC)</span>
                <span className="text-emerald-600">Assigned</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Health, Safety & Environment</span>
                <span className="text-emerald-600">Assigned</span>
              </div>
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'Notes' && (
          <div className="space-y-2">
            <label className="block font-medium text-slate-700">Engineering Notes & Assumptions</label>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record technical assumptions, vendor constraints, or clearance notes..."
              className="w-full p-2.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            />
            <button
              onClick={handleUpdate}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition-colors"
            >
              Save Notes
            </button>
          </div>
        )}

        {/* 4. SUB ACTIVITIES LIST MATCHING REFERENCE IMAGE */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="font-bold text-slate-800 text-xs">
              Sub Activities ({subActivities.length})
            </h4>
            <button
              onClick={() => onOpenAddActivity(currentWbsId || '')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Activity</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {subActivities.map((subAct, idx) => {
              const isSelected = selectedItem?.type === 'ACTIVITY' && selectedItem.id === subAct.id;
              return (
                <div
                  key={subAct.id}
                  onClick={() => setSelectedItem({ type: 'ACTIVITY', id: subAct.id })}
                  className={`flex items-center justify-between p-2 rounded border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 font-medium'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-500 shrink-0">
                      {`${parentWbs?.code.replace('.0', '') || selectedWbs?.code.replace('.0', '') || '1'}.${idx + 1}`}
                    </span>
                    <span className="truncate text-slate-800 text-xs">{subAct.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedItem({ type: 'ACTIVITY', id: subAct.id })}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Edit Sub Activity"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteActivity(subAct.id)}
                      className="p-1 text-rose-600 hover:bg-rose-100 rounded"
                      title="Delete Sub Activity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
