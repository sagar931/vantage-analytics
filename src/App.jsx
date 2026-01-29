import React from 'react';
import { FileSystemProvider, useFileSystem } from './context/FileSystemContext';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import Auth

// Components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ModelDetail from './components/ModelDetail';
import VlmSetup from './components/VlmSetup';
import LoginPage from './components/LoginPage'; // Import Login
import LoadingAnimation from './components/LoadingAnimation'; // Re-using your loader

const AuthenticatedContent = () => {
  const { rootHandle, vlmHandle, selectedModel } = useFileSystem();

  // 1. No Folder -> Landing
  if (!rootHandle) return <LandingPage />;
  
  // 2. No VLM -> Setup
  if (!vlmHandle) return <VlmSetup />;
  
  // 3. Model Selected -> Detail
  if (selectedModel) return <ModelDetail />;
  
  // 4. Default -> Dashboard
  return <Dashboard />;
};

const MainApp = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking session
  if (isLoading) {
    return <div className="h-screen bg-[#020617] flex items-center justify-center"><LoadingAnimation onComplete={()=>{}} /></div>;
  }

  // If not logged in, show Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If logged in, show the actual App
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