import React from 'react';
import { useProject, ProjectProvider } from './context/ProjectContext';
import { LoginPage } from './components/LoginPage';
import { ProjectDetailsPage } from './components/ProjectDetailsPage';
import { WorkspacePage } from './components/WorkspacePage';
import { ToastNotification } from './components/ToastNotification';

const AppContent: React.FC = () => {
  const { currentPage } = useProject();

  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans antialiased text-slate-800">
      {currentPage === 'LOGIN' && <LoginPage />}
      {currentPage === 'DETAILS' && <ProjectDetailsPage />}
      {currentPage === 'WORKSPACE' && <WorkspacePage />}
      <ToastNotification />
    </div>
  );
};

export function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}

export default App;
