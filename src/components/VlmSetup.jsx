import React from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { Plus, FolderOpen, ShieldCheck, Database, LayoutGrid, FileJson } from 'lucide-react';
import clsx from 'clsx';

const VlmSetup = () => {
  const { folderName, createVlmFile, selectVlmFile } = useFileSystem();

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* 1. PREMIUM GRID BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{ 
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, 
            backgroundSize: '50px 50px' 
          }}
        />
        {/* Radial Fade for Depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)]"></div>
        
        {/* Subtle Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      {/* 2. MAIN CARD */}
      <div className="max-w-4xl w-full relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-slate-400 text-xs font-medium backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Repository Connected: <span className="text-white font-mono ml-1">{folderName}</span></span>
          </div>
          
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
                Configure Logic Manifest
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-lg mx-auto font-light leading-relaxed">
              The manifest acts as the neural core of Vantage, storing your team's rules, formatting logic, and dashboard configurations.
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          
          {/* OPTION A: CREATE NEW */}
          <button 
            onClick={createVlmFile}
            className="group relative flex flex-col items-start p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 transition-all duration-500 hover:bg-slate-900/60 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)] text-left"
          >
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
               <Plus className="w-6 h-6 text-blue-500" />
            </div>

            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform duration-500">
              <LayoutGrid className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">Initialize New VLM</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Start fresh. We will generate a pristine <code>vantage_logic.vlm</code> file structure optimized for your current dataset.
            </p>

            <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500 group-hover:text-blue-400">
              <span>Create Manifest</span>
              <div className="w-4 h-px bg-blue-500/50 group-hover:w-8 transition-all"></div>
            </div>
          </button>

          {/* OPTION B: LOAD EXISTING */}
          <button 
            onClick={selectVlmFile}
            className="group relative flex flex-col items-start p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/50 transition-all duration-500 hover:bg-slate-900/60 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] text-left"
          >
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
               <FolderOpen className="w-6 h-6 text-emerald-500" />
            </div>

            <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20 group-hover:scale-110 transition-transform duration-500">
              <Database className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors">Load Existing VLM</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Restore your environment. Load a previously saved <code>.vlm</code> configuration to instantly apply your team's rules.
            </p>

            <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-500 group-hover:text-emerald-400">
              <span>Select File</span>
              <div className="w-4 h-px bg-emerald-500/50 group-hover:w-8 transition-all"></div>
            </div>
          </button>

        </div>
        
        <div className="mt-16 text-center border-t border-slate-800/50 pt-8">
          <div className="inline-flex items-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-600" />
                Standardized
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span>Instant State Binding</span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span>AES-256 Encryption</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VlmSetup;