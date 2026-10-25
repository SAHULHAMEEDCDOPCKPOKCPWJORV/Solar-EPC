import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { X, Plus, FolderPlus } from 'lucide-react';

interface AddWbsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWbsModal: React.FC<AddWbsModalProps> = ({ isOpen, onClose }) => {
  const { addWbs, wbsList } = useProject();
  const [name, setName] = useState('');
  const [code, setCode] = useState(`${wbsList.length + 1}.0`);
  const [color, setColor] = useState('#2563eb');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addWbs({
      code: code.trim(),
      name: name.trim(),
      color,
      description: description.trim()
    });

    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-[#0f172a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">Add Work Breakdown Package (WBS)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">WBS Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Package Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Battery Energy Storage System (BESS)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phase Color</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief scope summary..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
            >
              Add WBS Package
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
