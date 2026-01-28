import React, { createContext, useContext, useState, useEffect } from 'react';
import { scanDirectory } from '../utils/fileScanner';

const FileSystemContext = createContext();

export const useFileSystem = () => useContext(FileSystemContext);

export const FileSystemProvider = ({ children }) => {
  const [rootHandle, setRootHandle] = useState(null);
  const [vlmHandle, setVlmHandle] = useState(null); // NEW: The Handle to the .vlm file
  const [folderName, setFolderName] = useState('');
  const [models, setModels] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [manifest, setManifest] = useState(null);

  // 1. Connect Data Repository
  const connectDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'read', startIn: 'desktop' });
      setRootHandle(handle);
      setFolderName(handle.name);
      
      setIsScanning(true);
      const scannedModels = await scanDirectory(handle);
      setModels(scannedModels);
      setIsScanning(false);
    } catch (err) {
      if (err.name !== 'AbortError') console.error("Error accessing folder:", err);
      setIsScanning(false);
    }
  };

  // 2. Load EXISTING .vlm File
  const selectVlmFile = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Vantage Logic Manifest', accept: { 'application/json': ['.vlm'] } }],
        multiple: false
      });
      
      const file = await handle.getFile();
      const text = await file.text();
      const json = JSON.parse(text);
      
      setManifest(json);
      setVlmHandle(handle); // Save the handle so we can write later
      console.log("✅ VLM Loaded & Linked");
      return true;
    } catch (err) {
      console.error("VLM Load Error:", err);
      return false;
    }
  };

  // 3. Create NEW .vlm File
  const createVlmFile = async () => {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'vantage_logic.vlm',
        types: [{ description: 'Vantage Logic Manifest', accept: { 'application/json': ['.vlm'] } }],
      });

      // Default Structure
      const defaultManifest = {
        meta: { created: new Date().toISOString(), version: "1.0" },
        global_rules: [],
        conditional_formatting: {}
      };

      // Write immediately
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(defaultManifest, null, 2));
      await writable.close();

      setManifest(defaultManifest);
      setVlmHandle(handle);
      console.log("✅ New VLM Created");
      return true;
    } catch (err) {
      console.error("VLM Creation Error:", err);
      return false;
    }
  };

  // 4. Helper: Write Memory State to Disk
  const saveToDisk = async (data, handle) => {
    if (!handle) return;
    try {
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      console.log("💾 Auto-Saved to .vlm file");
    } catch (err) {
      console.error("Auto-Save Failed:", err);
      alert("Failed to save changes to .vlm file. Check permissions.");
    }
  };

  // 5. Update Manifest & Trigger Auto-Save
  const updateManifest = (modelId, sheetName, newRule) => {
    setManifest(prev => {
      // Deep Copy
      const newManifest = JSON.parse(JSON.stringify(prev || { conditional_formatting: {} }));
      
      if (!newManifest.conditional_formatting) newManifest.conditional_formatting = {};
      if (!newManifest.conditional_formatting[modelId]) newManifest.conditional_formatting[modelId] = {};
      if (!newManifest.conditional_formatting[modelId][sheetName]) newManifest.conditional_formatting[modelId][sheetName] = [];
      
      // Add Rule
      newManifest.conditional_formatting[modelId][sheetName].push(newRule);
      
      // TRIGGER SAVE TO DISK
      saveToDisk(newManifest, vlmHandle);
      
      return newManifest;
    });
  };

  const saveChart = (modelId, sheetName, chartConfig) => {
    setManifest(prev => {
      const newManifest = JSON.parse(JSON.stringify(prev || {}));
      
      // Ensure path exists
      if (!newManifest.visualizations) newManifest.visualizations = {};
      if (!newManifest.visualizations[modelId]) newManifest.visualizations[modelId] = {};
      if (!newManifest.visualizations[modelId][sheetName]) newManifest.visualizations[modelId][sheetName] = [];
      
      // Add the chart
      newManifest.visualizations[modelId][sheetName].push(chartConfig);
      
      console.log("📊 Chart Saved:", newManifest);
      return newManifest;
    });
  };

  const disconnect = () => {
    setRootHandle(null);
    setVlmHandle(null);
    setModels({});
    setManifest(null);
  };

  // Remove Chart
  const removeChart = (modelId, sheetName, chartIndex) => {
    setManifest(prev => {
      const newManifest = JSON.parse(JSON.stringify(prev || {}));
      if (newManifest.visualizations?.[modelId]?.[sheetName]) {
        newManifest.visualizations[modelId][sheetName].splice(chartIndex, 1);
      }
      return newManifest;
    });
  };

  const openModel = (modelId) => {
    if (models[modelId]) setSelectedModel(models[modelId]);
  };

  const closeModel = () => {
    setSelectedModel(null);
  };

  return (
    <FileSystemContext.Provider value={{ 
      rootHandle, vlmHandle, folderName, models, isScanning, 
      connectDirectory, disconnect, 
      selectedModel, openModel, closeModel, 
      manifest, selectVlmFile, createVlmFile, updateManifest,
      saveChart, removeChart
    }}>
      {children}
    </FileSystemContext.Provider>
  );
};