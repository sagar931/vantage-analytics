import React from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { FileJson, PlusCircle, FolderOpen, ShieldCheck } from 'lucide-react';

const VlmSetup = () => {
  const { folderName, createVlmFile, selectVlmFile } = useFileSystem();

  return (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-10 shadow-2xl relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-4">
            <ShieldCheck className="w-3 h-3" /> Repository Connected: {folderName}
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Logic Manifest Configuration</h1>
          <p className="text-slate-400 text-lg">
            Where should we store your logics, formatting, rules, etc?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Option A: Create New */}
          <button 
            onClick={createVlmFile}
            className="group flex flex-col items-center p-8 bg-slate-800/50 hover:bg-blue-600/10 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all duration-300"
          >
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Create New .vlm</h3>
            <p className="text-slate-500 text-sm text-center">
              Start fresh. We will create a <code>vantage_logic.vlm</code> file that you can share with your team.
            </p>
          </button>

          {/* Option B: Load Existing */}
          <button 
            onClick={selectVlmFile}
            className="group flex flex-col items-center p-8 bg-slate-800/50 hover:bg-purple-600/10 border border-slate-700 hover:border-purple-500/50 rounded-xl transition-all duration-300"
          >
            <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-purple-900/50 group-hover:scale-110 transition-transform">
              <FolderOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Load Existing .vlm</h3>
            <p className="text-slate-500 text-sm text-center">
              Have a configuration file already? Load it to restore your team's formatting rules.
            </p>
          </button>

        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-600">
            <strong className="text-slate-500">What is a .vlm file?</strong> It acts as the "Brain" of this project, storing all your color-coding rules, settings, and views. It syncs automatically.
          </p>
        </div>

      </div>
    </div>
  );
};

export default VlmSetup;