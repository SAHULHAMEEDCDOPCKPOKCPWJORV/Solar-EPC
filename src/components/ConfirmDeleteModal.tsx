import React from 'react';
import { useProject } from '../context/ProjectContext';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose }) => {
  const { selectedItem, wbsList, activities, deleteWbs, deleteActivity } = useProject();

  if (!isOpen || !selectedItem) return null;

  const targetWbs = selectedItem.type === 'WBS' ? wbsList.find(w => w.id === selectedItem.id) : null;
  const targetAct = selectedItem.type === 'ACTIVITY' ? activities.find(a => a.id === selectedItem.id) : null;
  const childActs = targetWbs ? activities.filter(a => a.wbsId === targetWbs.id) : [];

  const handleConfirm = () => {
    if (selectedItem.type === 'WBS') {
      deleteWbs(selectedItem.id);
    } else {
      deleteActivity(selectedItem.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-5 flex items-start gap-4">
          <div className="p-3 bg-rose-100 rounded-xl text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Delete {selectedItem.type === 'WBS' ? 'Work Breakdown Package' : 'Activity'}?
            </h3>
            <p className="text-slate-600">
              Are you sure you want to delete{' '}
              <span className="font-bold text-slate-800">
                {targetWbs ? `${targetWbs.code} ${targetWbs.name}` : `${targetAct?.code} ${targetAct?.name}`}
              </span>
              ?
            </p>
            {targetWbs && childActs.length > 0 && (
              <div className="mt-3 p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 font-medium">
                <span className="font-bold">Warning:</span> This WBS contains{' '}
                <span className="font-bold">{childActs.length} child activities</span> which will also be permanently removed.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
