import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { X, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AddActivityModalProps {
  isOpen: boolean;
  targetWbsId?: string;
  onClose: () => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  targetWbsId,
  onClose
}) => {
  const { addActivity, wbsList, activities, project } = useProject();

  const defaultWbs = targetWbsId ? wbsList.find(w => w.id === targetWbsId) : wbsList[0];
  const [selectedWbsId, setSelectedWbsId] = useState(defaultWbs?.id || wbsList[0]?.id || '');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState(defaultWbs?.startDate || project?.startDate || format(new Date(), 'yyyy-MM-dd'));
  const [duration, setDuration] = useState(10);
  const [isMilestone, setIsMilestone] = useState(false);
  const [selectedPreds, setSelectedPreds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addActivity(
      {
        code: code.trim() || undefined,
        name: name.trim(),
        startDate,
        duration: Number(duration),
        isMilestone,
        predecessors: selectedPreds
      },
      selectedWbsId
    );

    setName('');
    setCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-[#0f172a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Add Activity / Task</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Target WBS */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target WBS Phase</label>
            <select
              value={selectedWbsId}
              onChange={(e) => setSelectedWbsId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {wbsList.map(w => (
                <option key={w.id} value={w.id}>
                  {w.code} {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Activity Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Auto (e.g. ELE-004)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Activity Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Transformer Skid Foundation & Oil Pit"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duration (Working Days)</label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isMilestoneModal"
              checked={isMilestone}
              onChange={(e) => setIsMilestone(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="isMilestoneModal" className="font-semibold text-slate-700 cursor-pointer">
              Mark as Major Project Milestone (Zero Duration Diamond)
            </label>
          </div>

          {/* Predecessors list */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Predecessors (Finish-to-Start)</label>
            <div className="max-h-36 overflow-y-auto border border-slate-300 rounded-lg p-2 space-y-1">
              {activities.map(a => (
                <label key={a.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPreds.includes(a.code)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPreds([...selectedPreds, a.code]);
                      } else {
                        setSelectedPreds(selectedPreds.filter(p => p !== a.code));
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-mono text-[11px] font-semibold text-slate-600">{a.code}</span>
                  <span className="truncate text-slate-800">{a.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
            >
              Add Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
