import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { X, Layers, Plus, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

interface BaselineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BaselineManagerModal: React.FC<BaselineManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    baselines,
    saveBaselineSnapshot,
    activities,
    showBaseline,
    setShowBaseline
  } = useProject();

  const [versionName, setVersionName] = useState(`v${baselines.length + 1}.0 Contract Baseline`);
  const [notes, setNotes] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionName.trim()) return;
    saveBaselineSnapshot(versionName.trim(), notes.trim());
    setShowSaveForm(false);
    setShowBaseline(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0f172a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm">Baseline Management & Versioning</h3>
              <p className="text-[11px] text-slate-400">Lock, compare, and protect project schedule baselines</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Baseline Comparison Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/80 rounded-xl border border-blue-200">
            <div>
              <h4 className="font-bold text-blue-900 text-xs">Baseline Ghost Bars Comparison</h4>
              <p className="text-[11px] text-blue-700">
                Overlay saved baseline bars directly underneath working activities in the Gantt chart
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showBaseline}
                onChange={(e) => setShowBaseline(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Create New Baseline Section */}
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Snapshot Current Schedule as New Baseline</span>
            </button>
          ) : (
            <form onSubmit={handleSave} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">Snapshot New Baseline</h4>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Baseline Version Label</label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approval Notes / Reasons</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Approved by Owner Engineer after geotechnical borelogs review..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveForm(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-sm"
                >
                  Confirm & Lock Baseline
                </button>
              </div>
            </form>
          )}

          {/* Saved Baselines History */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2">Saved Baselines History ({baselines.length})</h4>
            {baselines.length === 0 ? (
              <p className="text-slate-400 italic py-4 text-center">
                No custom baseline version saved yet. Click above to freeze your proposed baseline.
              </p>
            ) : (
              <div className="space-y-2">
                {baselines.map((base, idx) => (
                  <div key={base.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{base.version}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                          {idx === 0 ? 'Active Comparison' : 'Archived'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Saved on {format(parseISO(base.createdAt), 'dd MMM yyyy, HH:mm')} by {base.createdBy}
                      </p>
                      {base.notes && <p className="text-[11px] text-slate-600 italic mt-1">"{base.notes}"</p>}
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      {base.activitiesSnapshot.length} Tasks Locked
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variance Summary */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2">Schedule Variance Analysis</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Activity</th>
                    <th className="py-2 px-2 text-center">Baseline Finish</th>
                    <th className="py-2 px-2 text-center">Planned Finish</th>
                    <th className="py-2 px-2 text-center">Variance (Days)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.slice(0, 6).map(act => {
                    const varDays = act.baselineFinish && act.finishDate ? differenceInDays(parseISO(act.finishDate), parseISO(act.baselineFinish)) : 0;
                    return (
                      <tr key={act.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3">
                          <span className="font-mono text-slate-500 mr-2">{act.code}</span>
                          <span className="text-slate-800">{act.name}</span>
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-slate-600">
                          {act.baselineFinish || act.finishDate}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-slate-600">
                          {act.finishDate}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-semibold">
                          {varDays === 0 ? (
                            <span className="text-slate-500">0 d (On Time)</span>
                          ) : varDays > 0 ? (
                            <span className="text-rose-600">+{varDays} d Delayed</span>
                          ) : (
                            <span className="text-emerald-600">{varDays} d Ahead</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
