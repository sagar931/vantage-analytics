import React from 'react';
import { FileSystemProvider, useFileSystem } from './context/FileSystemContext';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ModelDetail from './components/ModelDetail';
import VlmSetup from './components/VlmSetup'; // Import the new screen

const MainContent = () => {
  const { rootHandle, vlmHandle, selectedModel } = useFileSystem();

  // STEP 1: No Folder Connection -> Show Landing
  if (!rootHandle) {
    return <LandingPage />;
  }

  // STEP 2: Folder Connected, but No VLM -> Show Setup
  if (!vlmHandle) {
    return <VlmSetup />;
  }

  // STEP 3: Both Connected -> Show App
  // Sub-routing for Dashboard vs Detail View
  if (selectedModel) {
    return <ModelDetail />;
  }
  
  return <Dashboard />;
};

function App() {
  return (
    <FileSystemProvider>
      <MainContent />
    </FileSystemProvider>
  );
}

export default App;