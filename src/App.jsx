import React, { useEffect } from 'react';
import { FileSystemProvider, useFileSystem } from './context/FileSystemContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ModelDetail from './components/ModelDetail';
import VlmSetup from './components/VlmSetup';
import LoginPage from './components/LoginPage';
import LoadingAnimation from './components/LoadingAnimation';

const AuthenticatedContent = () => {
  const { rootHandle, vlmHandle, selectedModel } = useFileSystem();

  if (!rootHandle) return <LandingPage />;
  if (!vlmHandle) return <VlmSetup />;
  if (selectedModel) return <ModelDetail />;
  return <Dashboard />;
};

const MainApp = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // --- FORCE DARK MODE ---
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <LoadingAnimation onComplete={() => {}} />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <FileSystemProvider>
      <AuthenticatedContent />
    </FileSystemProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;