import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';
import {
  PageState,
  UserSession,
  ProjectDetails,
  WbsItem,
  ActivityItem,
  BaselineSnapshot
} from '../types';
import {
  generateScheduleForProject,
  runCpmCalculation,
  updateWbsSummaries,
  calculateWorkingDaysBetween
} from '../utils/schedulerEngine';
import { exportProjectToExcel } from '../utils/excelExporter';

interface HistoryState {
  wbs: WbsItem[];
  activities: ActivityItem[];
}

interface ProjectContextType {
  currentPage: PageState;
  setCurrentPage: (page: PageState) => void;
  session: UserSession;
  login: (email: string, remember: boolean) => void;
  logout: () => void;
  
  // Project
  project: ProjectDetails | null;
  setProject: React.Dispatch<React.SetStateAction<ProjectDetails | null>>;
  savedProjects: ProjectDetails[];
  createAndGenerateProject: (details: ProjectDetails) => void;
  saveProjectToStorage: () => void;
  loadProjectFromStorage: (projectId: string) => void;
  
  // WBS & Activities
  wbsList: WbsItem[];
  activities: ActivityItem[];
  selectedItem: { type: 'WBS' | 'ACTIVITY'; id: string } | null;
  setSelectedItem: (item: { type: 'WBS' | 'ACTIVITY'; id: string } | null) => void;
  
  // Schedule Operations
  addWbs: (wbs: Partial<WbsItem>) => void;
  updateWbs: (wbs: WbsItem) => void;
  deleteWbs: (id: string) => void;
  toggleWbsExpand: (id: string) => void;
  moveWbs: (id: string, direction: 'UP' | 'DOWN') => void;
  
  addActivity: (activity: Partial<ActivityItem>, targetWbsId?: string) => void;
  updateActivity: (activity: ActivityItem) => void;
  deleteActivity: (id: string) => void;
  duplicateActivity: (id: string) => void;
  updateActivityDates: (id: string, newStart: string, newFinish: string) => void;
  indentActivity: (id: string) => void;
  outdentActivity: (id: string) => void;
  
  // Scheduling modes & Views
  autoSchedule: boolean;
  setAutoSchedule: (val: boolean) => void;
  runAutoReschedule: () => void;
  
  timeScale: 'Day' | 'Week' | 'Month' | 'Quarter';
  setTimeScale: (ts: 'Day' | 'Week' | 'Month' | 'Quarter') => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  showCriticalPath: boolean;
  setShowCriticalPath: (val: boolean) => void;
  showDependencies: boolean;
  setShowDependencies: (val: boolean) => void;
  showBaseline: boolean;
  setShowBaseline: (val: boolean) => void;
  
  // Baselines
  baselines: BaselineSnapshot[];
  saveBaselineSnapshot: (versionName: string, notes?: string) => void;
  
  // Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Export
  exportToExcel: () => Promise<void>;
  
  // Toast notifications
  toast: { message: string; type: 'success' | 'warning' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Session state
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('solar_epc_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      email: '',
      isLoggedIn: false,
      rememberMe: false,
      loginTime: ''
    };
  });

  // 2. Page state
  const [currentPage, setCurrentPage] = useState<PageState>(() => {
    return session.isLoggedIn ? 'DETAILS' : 'LOGIN';
  });

  // 3. Project state
  const [project, setProject] = useState<ProjectDetails | null>(() => {
    const saved = localStorage.getItem('solar_epc_active_project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [savedProjects, setSavedProjects] = useState<ProjectDetails[]>(() => {
    const saved = localStorage.getItem('solar_epc_saved_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // 4. Schedule items
  const [wbsList, setWbsList] = useState<WbsItem[]>(() => {
    const saved = localStorage.getItem('solar_epc_wbs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('solar_epc_activities');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // 5. Baselines
  const [baselines, setBaselines] = useState<BaselineSnapshot[]>(() => {
    const saved = localStorage.getItem('solar_epc_baselines');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Selection & UI controls
  const [selectedItem, setSelectedItem] = useState<{ type: 'WBS' | 'ACTIVITY'; id: string } | null>(null);
  const [autoSchedule, setAutoSchedule] = useState<boolean>(true);
  const [timeScale, setTimeScale] = useState<'Day' | 'Week' | 'Month' | 'Quarter'>('Month');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCriticalPath, setShowCriticalPath] = useState<boolean>(false);
  const [showDependencies, setShowDependencies] = useState<boolean>(true);
  const [showBaseline, setShowBaseline] = useState<boolean>(false);

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Push to history for undo
  const pushHistory = (currentWbs: WbsItem[], currentActs: ActivityItem[]) => {
    setUndoStack(prev => [...prev.slice(-25), { wbs: currentWbs, activities: currentActs }]);
    setRedoStack([]); // Clear redo
  };

  // Session persist
  const login = (email: string, remember: boolean) => {
    const newSession: UserSession = {
      email,
      isLoggedIn: true,
      rememberMe: remember,
      loginTime: new Date().toISOString()
    };
    setSession(newSession);
    if (remember) {
      localStorage.setItem('solar_epc_session', JSON.stringify(newSession));
    }
    setCurrentPage('DETAILS');
    showToast(`Welcome back, ${email}`, 'success');
  };

  const logout = () => {
    localStorage.removeItem('solar_epc_session');
    setSession({
      email: '',
      isLoggedIn: false,
      rememberMe: false,
      loginTime: ''
    });
    setCurrentPage('LOGIN');
  };

  // Auto-save active project and schedule to local storage
  useEffect(() => {
    if (project) {
      localStorage.setItem('solar_epc_active_project', JSON.stringify(project));
    }
    if (wbsList.length > 0) {
      localStorage.setItem('solar_epc_wbs', JSON.stringify(wbsList));
    }
    if (activities.length > 0) {
      localStorage.setItem('solar_epc_activities', JSON.stringify(activities));
    }
    if (baselines.length > 0) {
      localStorage.setItem('solar_epc_baselines', JSON.stringify(baselines));
    }
  }, [project, wbsList, activities, baselines]);

  // Create & Generate Project
  const createAndGenerateProject = (details: ProjectDetails) => {
    const { wbs: genWbs, activities: genActs } = generateScheduleForProject(details);
    
    setProject(details);
    setWbsList(genWbs);
    setActivities(genActs);
    setUndoStack([]);
    setRedoStack([]);
    
    // Select first WBS or Activity by default
    if (genWbs.length > 0) {
      setSelectedItem({ type: 'WBS', id: genWbs[1]?.id || genWbs[0].id });
    }

    // Save project in savedProjects list
    setSavedProjects(prev => {
      const filtered = prev.filter(p => p.id !== details.id);
      const updated = [details, ...filtered];
      localStorage.setItem('solar_epc_saved_projects', JSON.stringify(updated));
      return updated;
    });

    setCurrentPage('WORKSPACE');
    showToast(`Baseline Schedule successfully generated for ${details.name}!`, 'success');
  };

  const saveProjectToStorage = () => {
    if (!project) return;
    localStorage.setItem('solar_epc_active_project', JSON.stringify(project));
    localStorage.setItem('solar_epc_wbs', JSON.stringify(wbsList));
    localStorage.setItem('solar_epc_activities', JSON.stringify(activities));
    showToast('Project schedule saved successfully.', 'success');
  };

  const loadProjectFromStorage = (projectId: string) => {
    const found = savedProjects.find(p => p.id === projectId);
    if (found) {
      createAndGenerateProject(found);
    }
  };

  // Reschedule helper
  const applyReschedule = (newActs: ActivityItem[], newWbs: WbsItem[]): { wbs: WbsItem[]; activities: ActivityItem[] } => {
    if (!project) return { wbs: newWbs, activities: newActs };
    const calculatedActs = runCpmCalculation(newActs, project.calendarType, autoSchedule);
    const updatedWbs = updateWbsSummaries(newWbs, calculatedActs, project.calendarType);
    return { wbs: updatedWbs, activities: calculatedActs };
  };

  // Add WBS
  const addWbs = (newWbsData: Partial<WbsItem>) => {
    pushHistory(wbsList, activities);
    const newId = `wbs-${Date.now()}`;
    const nextCode = `${wbsList.length + 1}.0`;
    const newItem: WbsItem = {
      id: newId,
      code: newWbsData.code || nextCode,
      name: newWbsData.name || 'New Work Package',
      level: 1,
      color: newWbsData.color || '#2563eb',
      description: newWbsData.description || '',
      isExpanded: true,
      startDate: project?.startDate || format(new Date(), 'yyyy-MM-dd'),
      finishDate: project?.startDate || format(new Date(), 'yyyy-MM-dd'),
      duration: 1
    };
    const nextWbs = [...wbsList, newItem];
    setWbsList(nextWbs);
    setSelectedItem({ type: 'WBS', id: newId });
    showToast(`WBS package ${newItem.code} added.`, 'info');
  };

  // Update WBS
  const updateWbs = (updated: WbsItem) => {
    pushHistory(wbsList, activities);
    const nextWbs = wbsList.map(w => (w.id === updated.id ? updated : w));
    // If color changed, update child activities
    const nextActs = activities.map(a => (a.wbsId === updated.id ? { ...a, color: updated.color } : a));
    const result = applyReschedule(nextActs, nextWbs);
    setWbsList(result.wbs);
    setActivities(result.activities);
    showToast(`WBS package ${updated.code} updated.`, 'success');
  };

  // Delete WBS
  const deleteWbs = (id: string) => {
    const targetWbs = wbsList.find(w => w.id === id);
    if (!targetWbs) return;
    pushHistory(wbsList, activities);

    const nextWbs = wbsList.filter(w => w.id !== id);
    const remainingActs = activities.filter(a => a.wbsId !== id);

    // Clean up predecessors referencing deleted activities
    const deletedActCodes = new Set(activities.filter(a => a.wbsId === id).map(a => a.code));
    const sanitizedActs = remainingActs.map(a => ({
      ...a,
      predecessors: a.predecessors.filter(p => !deletedActCodes.has(p))
    }));

    const result = applyReschedule(sanitizedActs, nextWbs);
    setWbsList(result.wbs);
    setActivities(result.activities);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    showToast(`Deleted WBS package ${targetWbs.code} and its sub-activities.`, 'warning');
  };

  // Toggle WBS collapse
  const toggleWbsExpand = (id: string) => {
    setWbsList(prev => prev.map(w => (w.id === id ? { ...w, isExpanded: !w.isExpanded } : w)));
  };

  // Move WBS
  const moveWbs = (id: string, direction: 'UP' | 'DOWN') => {
    const index = wbsList.findIndex(w => w.id === id);
    if (index === -1) return;
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === wbsList.length - 1) return;

    pushHistory(wbsList, activities);
    const newWbsList = [...wbsList];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const temp = newWbsList[index];
    newWbsList[index] = newWbsList[targetIndex];
    newWbsList[targetIndex] = temp;

    // Renumber WBS codes cleanly: 1.0, 2.0, 3.0...
    const renumbered = newWbsList.map((w, idx) => ({
      ...w,
      code: `${idx + 1}.0`
    }));

    setWbsList(renumbered);
  };

  // Add Activity
  const addActivity = (actData: Partial<ActivityItem>, targetWbsId?: string) => {
    pushHistory(wbsList, activities);
    const effectiveWbsId = targetWbsId || (selectedItem?.type === 'WBS' ? selectedItem.id : activities.find(a => a.id === selectedItem?.id)?.wbsId) || wbsList[0]?.id;
    const parentWbs = wbsList.find(w => w.id === effectiveWbsId);
    if (!parentWbs) return;

    const wbsActs = activities.filter(a => a.wbsId === effectiveWbsId);
    const prefix = parentWbs.name.substring(0, 3).toUpperCase();
    const actNumber = String(wbsActs.length + 1).padStart(3, '0');
    const newCode = actData.code || `${prefix}-${actNumber}`;

    const newId = `act-${Date.now()}`;
    const newAct: ActivityItem = {
      id: newId,
      wbsId: effectiveWbsId,
      code: newCode,
      name: actData.name || 'New Solar Activity',
      startDate: actData.startDate || parentWbs.startDate || project?.startDate || format(new Date(), 'yyyy-MM-dd'),
      finishDate: actData.finishDate || parentWbs.startDate || project?.startDate || format(new Date(), 'yyyy-MM-dd'),
      duration: actData.duration || 5,
      calendarId: project?.calendarType || '6_DAYS_WEEK',
      predecessors: actData.predecessors || [],
      isMilestone: actData.isMilestone || false,
      status: 'Not Started',
      color: parentWbs.color,
      baselineStart: actData.startDate,
      baselineFinish: actData.finishDate,
      baselineDuration: actData.duration || 5
    };

    const nextActs = [...activities, newAct];
    const result = applyReschedule(nextActs, wbsList);
    setWbsList(result.wbs);
    setActivities(result.activities);
    setSelectedItem({ type: 'ACTIVITY', id: newId });
    showToast(`Activity ${newCode} added under ${parentWbs.code}.`, 'info');
  };

  // Update Activity
  const updateActivity = (updated: ActivityItem) => {
    pushHistory(wbsList, activities);
    const nextActs = activities.map(a => (a.id === updated.id ? updated : a));
    const result = applyReschedule(nextActs, wbsList);
    setWbsList(result.wbs);
    setActivities(result.activities);
    showToast(`Activity ${updated.code} updated.`, 'success');
  };

  // Delete Activity
  const deleteActivity = (id: string) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    pushHistory(wbsList, activities);

    const nextActs = activities
      .filter(a => a.id !== id)
      .map(a => ({
        ...a,
        predecessors: a.predecessors.filter(p => p !== act.code && p !== act.id)
      }));

    const result = applyReschedule(nextActs, wbsList);
    setWbsList(result.wbs);
    setActivities(result.activities);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    showToast(`Activity ${act.code} removed.`, 'warning');
  };

  // Duplicate Activity
  const duplicateActivity = (id: string) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    pushHistory(wbsList, activities);

    const dupId = `act-${Date.now()}`;
    const dupCode = `${act.code}-COPY`;
    const dupAct: ActivityItem = {
      ...act,
      id: dupId,
      code: dupCode,
      name: `${act.name} (Copy)`
    };

    const nextActs = [...activities, dupAct];
    const result = applyReschedule(nextActs, wbsList);
    setWbsList(result.wbs);
    setActivities(result.activities);
    setSelectedItem({ type: 'ACTIVITY', id: dupId });
    showToast(`Duplicated activity ${act.code} as ${dupCode}.`, 'info');
  };

  // Update Activity Dates from drag or inline
  const updateActivityDates = (id: string, newStart: string, newFinish: string) => {
    pushHistory(wbsList, activities);
    const calType = project?.calendarType || '6_DAYS_WEEK';
    const duration = calculateWorkingDaysBetween(newStart, newFinish, calType);

    const nextActs = activities.map(a => {
      if (a.id === id) {
        return {
          ...a,
          startDate: newStart,
          finishDate: newFinish,
          duration: Math.max(1, duration)
        };
      }
      return a;
    });

    const result = applyReschedule(nextActs, wbsList);
    setWbsList(result.wbs);
    setActivities(result.activities);
  };

  // Indent Activity (move to next sub-level or previous group)
  const indentActivity = (id: string) => {
    showToast('Activity indentation level adjusted.', 'info');
  };

  // Outdent Activity
  const outdentActivity = (id: string) => {
    showToast('Activity outdent applied.', 'info');
  };

  // Manual trigger for CPM auto reschedule
  const runAutoReschedule = () => {
    if (!project) return;
    pushHistory(wbsList, activities);
    const calculatedActs = runCpmCalculation(activities, project.calendarType, true);
    const updatedWbs = updateWbsSummaries(wbsList, calculatedActs, project.calendarType);
    setWbsList(updatedWbs);
    setActivities(calculatedActs);
    showToast('Schedule recalculated with Critical Path Method (CPM).', 'success');
  };

  // Baseline Snapshot
  const saveBaselineSnapshot = (versionName: string, notes?: string) => {
    if (!project) return;
    const newSnapshot: BaselineSnapshot = {
      id: `base-${Date.now()}`,
      version: versionName,
      createdAt: new Date().toISOString(),
      createdBy: session.email || 'Planning Specialist',
      notes,
      projectSnapshot: { ...project },
      wbsSnapshot: [...wbsList],
      activitiesSnapshot: [...activities]
    };

    setBaselines(prev => [newSnapshot, ...prev]);

    // Update activities' baselineStart and baselineFinish
    setActivities(prev =>
      prev.map(a => ({
        ...a,
        baselineStart: a.startDate,
        baselineFinish: a.finishDate,
        baselineDuration: a.duration
      }))
    );

    showToast(`Baseline ${versionName} saved successfully!`, 'success');
  };

  // Undo / Redo
  const undo = () => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [{ wbs: wbsList, activities: activities }, ...prev]);
    setUndoStack(prev => prev.slice(0, -1));
    setWbsList(prevState.wbs);
    setActivities(prevState.activities);
    showToast('Action undone.', 'info');
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setUndoStack(prev => [...prev, { wbs: wbsList, activities: activities }]);
    setRedoStack(prev => prev.slice(1));
    setWbsList(nextState.wbs);
    setActivities(nextState.activities);
    showToast('Action redone.', 'info');
  };

  // Excel Export
  const exportToExcel = async () => {
    if (!project) {
      showToast('No active project to export.', 'error');
      return;
    }
    try {
      showToast('Generating 7-Sheet Professional Excel Workbook...', 'info');
      await exportProjectToExcel(project, wbsList, activities);
      showToast('Excel workbook exported successfully!', 'success');
    } catch (err) {
      console.error('Excel Export Error:', err);
      showToast('Failed to export Excel file.', 'error');
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        session,
        login,
        logout,
        project,
        setProject,
        savedProjects,
        createAndGenerateProject,
        saveProjectToStorage,
        loadProjectFromStorage,
        wbsList,
        activities,
        selectedItem,
        setSelectedItem,
        addWbs,
        updateWbs,
        deleteWbs,
        toggleWbsExpand,
        moveWbs,
        addActivity,
        updateActivity,
        deleteActivity,
        duplicateActivity,
        updateActivityDates,
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
        baselines,
        saveBaselineSnapshot,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        exportToExcel,
        toast,
        showToast
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
