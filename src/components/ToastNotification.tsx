import React from 'react';
import { useProject } from '../context/ProjectContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast } = useProject();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100',
    warning: 'border-amber-500/30 bg-amber-950/90 text-amber-100',
    error: 'border-rose-500/30 bg-rose-950/90 text-rose-100',
    info: 'border-blue-500/30 bg-slate-900/95 text-slate-100'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-sm font-medium transition-all duration-300 max-w-md ${borders[toast.type]}">
      {icons[toast.type]}
      <span className="flex-1">{toast.message}</span>
    </div>
  );
};
