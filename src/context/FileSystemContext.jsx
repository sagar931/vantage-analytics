import React, { createContext, useContext, useState } from 'react';
import { scanDirectory } from '../utils/fileScanner';

const FileSystemContext = createContext();

export const useFileSystem = () => useContext(FileSystemContext);

export const FileSystemProvider = ({ children }) => {
  const [rootHandle, setRootHandle] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [models, setModels] = useState({}); // This stores our scanned data
  const [isScanning, setIsScanning] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [manifest, setManifest] = useState(null);

  const connectDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'desktop',
      });

      setRootHandle(handle);
      setFolderName(handle.name);
      
      // TRIGGER THE SCAN IMMEDIATELY
      setIsScanning(true);
      console.log("🔍 Scanning directory...");
      
      const scannedModels = await scanDirectory(handle);
      
      console.log("✅ Scan Complete. Found Models:", scannedModels);
      setModels(scannedModels);
      setIsScanning(false);

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error accessing folder:", err);
        alert("Could not access the folder.");
      }
      setIsScanning(false);
    }
  };

  const disconnect = () => {
    setRootHandle(null);
    setFolderName('');
    setModels({});
  };

  const openModel = (modelId) => {
    if (models[modelId]) {
      setSelectedModel(models[modelId]);
    }
  };

  const closeModel = () => {
    setSelectedModel(null);
  };


  const loadManifest = async (file) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setManifest(json);
      console.log("✅ VLM Manifest Loaded:", json);
      return true;
    } catch (err) {
      console.error("Failed to parse .vlm file", err);
      return false;
    }
  };

  // Add this function inside FileSystemProvider
  const updateManifest = (modelId, sheetName, newRule) => {
    setManifest(prev => {
      // Deep copy safely
      const newManifest = JSON.parse(JSON.stringify(prev || { conditional_formatting: {} }));
      
      // Ensure structure exists
      if (!newManifest.conditional_formatting) newManifest.conditional_formatting = {};
      if (!newManifest.conditional_formatting[modelId]) newManifest.conditional_formatting[modelId] = {};
      if (!newManifest.conditional_formatting[modelId][sheetName]) newManifest.conditional_formatting[modelId][sheetName] = [];
      
      // Add rule
      newManifest.conditional_formatting[modelId][sheetName].push(newRule);
      
      console.log("📝 Manifest Updated:", newManifest);
      return newManifest;
    });
  };

  // Add 'updateManifest' to the value={{...}} object

  return (
    <FileSystemContext.Provider value={{ 
      rootHandle, 
      folderName, 
      models,          // Expose the scanned models to the UI
      isScanning,      // Expose loading state
      connectDirectory, 
      disconnect,
      selectedModel,
      openModel,
      closeModel,
      manifest,
      loadManifest,
      updateManifest 
    }}>
      {children}
    </FileSystemContext.Provider>
  );
};