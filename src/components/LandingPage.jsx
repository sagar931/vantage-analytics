import React, { useRef } from 'react'; // Add useRef
import { FolderSearch, ShieldCheck, BarChart3, FileJson, CheckCircle } from 'lucide-react'; // Add Icons
import { useFileSystem } from '../context/FileSystemContext';

const LandingPage = () => {
  const { connectDirectory, loadManifest, manifest } = useFileSystem();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate extension
      if (!file.name.endsWith('.vlm')) {
        alert("Please select a valid .vlm file");
        return;
      }
      await loadManifest(file);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* ... Background blobs (keep existing code) ... */}
      
      <div className="z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center">
        
        {/* ... Logo Section (keep existing code) ... */}

        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Vantage</h1>
        <p className="text-slate-400 text-lg mb-8">
          Premium Fraud Model Monitoring. <br/>
          Secure. Local. Instant.
        </p>

        {/* 1. Main Action: Connect Folder */}
        <button 
          onClick={connectDirectory}
          className="group relative w-full flex items-center justify-center gap-3 bg-white text-slate-950 py-4 px-6 rounded-xl font-semibold text-lg transition-all hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] mb-4"
        >
          <FolderSearch className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
          <span>Connect Local Repository</span>
        </button>

        {/* 2. Secondary Action: Upload VLM */}
        <div className="relative">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".vlm" // Only accept .vlm
            className="hidden"
          />
          
          {manifest ? (
            // Success State
            <div className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 py-3 px-6 rounded-xl text-sm font-medium border border-emerald-500/20 cursor-default">
              <CheckCircle className="w-4 h-4" />
              <span>Logic Manifest Loaded</span>
            </div>
          ) : (
            // Upload State
            <button 
              onClick={() => fileInputRef.current.click()}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-400 py-3 px-6 rounded-xl text-sm font-medium transition-all hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-600 dashed-border"
            >
              <FileJson className="w-4 h-4" />
              <span>Load Logic Manifest (.vlm)</span>
            </button>
          )}
        </div>

        {/* ... Footer (keep existing code) ... */}
      </div>
    </div>
  );
};

export default LandingPage;