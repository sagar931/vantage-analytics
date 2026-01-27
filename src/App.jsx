import React from 'react';
import { FileSystemProvider, useFileSystem } from './context/FileSystemContext';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard'; // Import the new component
import ModelDetail from './components/ModelDetail';

const MainContent = () => {
  const { rootHandle, selectedModel } = useFileSystem();

  if (!rootHandle) return <LandingPage />;
  if (selectedModel) return <ModelDetail />; // If model is selected, show Matrix
  return <Dashboard />; // Otherwise show Grid
};

function App() {
  return (
    <FileSystemProvider>
      <MainContent />
    </FileSystemProvider>
  );
}

export default App;