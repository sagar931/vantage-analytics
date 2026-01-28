import React, { useState } from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { FileSpreadsheet, LayoutGrid, ChevronRight, Database, Zap, List, Search, Filter } from 'lucide-react';
import clsx from 'clsx';

// --- COMPONENT: GRID CARD VIEW ---
const ModelCard = ({ model, onClick, index }) => {
  const fileCount = model.files.length;
  const hasMonthly = model.files.some(f => f.frequency === 'Monthly');
  const hasQuarterly = model.files.some(f => f.frequency === 'Quarterly');

  return (
    <div 
      onClick={onClick}
      className="group relative w-full cursor-pointer"
      style={{ 
        animation: `fadeInUp 0.6s ease-out forwards ${index * 0.05}s`, 
        opacity: 0,
        transform: 'translateY(10px)'
      }}
    >
      <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)] hover:-translate-y-1">
        
        {/* Glows */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/10 blur-[80px] transition-all duration-500 group-hover:bg-blue-500/20"></div>
        
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-400">
              <LayoutGrid className="h-6 w-6 text-slate-300 transition-colors group-hover:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">
              ID: {model.id}
            </span>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold leading-tight text-white group-hover:text-blue-200 transition-colors">
              {model.name.replace(/_/g, ' ')}
            </h3>
            <div className="mt-4 flex items-center gap-3 text-sm font-medium text-slate-400">
              <div className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" /> <span>{fileCount} Files</span>
              </div>
              <span className="h-1 w-1 rounded-full bg-slate-700"></span>
              <div className="flex items-center gap-1.5 text-amber-500/80">
                <Zap className="h-3.5 w-3.5" /> <span>Live</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex gap-2">
              {hasMonthly && <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-400 border border-emerald-500/20">Monthly</span>}
              {hasQuarterly && <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-400 border border-amber-500/20">Quarterly</span>}
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: LIST ROW VIEW ---
const ModelRow = ({ model, onClick, index }) => {
  const fileCount = model.files.length;
  const hasMonthly = model.files.some(f => f.frequency === 'Monthly');
  const hasQuarterly = model.files.some(f => f.frequency === 'Quarterly');

  return (
    <div 
      onClick={onClick}
      className="group w-full cursor-pointer"
      style={{ 
        animation: `fadeInLeft 0.4s ease-out forwards ${index * 0.05}s`, 
        opacity: 0,
        transform: 'translateX(-10px)'
      }}
    >
      <div className="flex items-center gap-6 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-200 hover:bg-white/[0.05] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-900/10">
        
        {/* Icon */}
        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
           <FileSpreadsheet className="h-6 w-6" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
             <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-200 transition-colors">{model.name.replace(/_/g, ' ')}</h3>
             <span className="text-[10px] font-mono text-slate-600 border border-slate-800 px-1.5 rounded bg-black/20">
               {model.id}
             </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
             <span>{fileCount} Linked Files</span>
             <span className="w-1 h-1 rounded-full bg-slate-700"></span>
             <span className="flex items-center gap-1 text-amber-500/80"><Zap className="w-3 h-3"/> Live Sync</span>
          </div>
        </div>

        {/* Tags */}
        <div className="hidden md:flex gap-2">
           {hasMonthly && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-900/20 text-emerald-500 border border-emerald-900/30">Monthly</span>}
           {hasQuarterly && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-900/20 text-amber-500 border border-amber-900/30">Quarterly</span>}
        </div>

        {/* Action */}
        <div className="pl-4 border-l border-white/5">
           <div className="p-2 rounded-full hover:bg-white/10 text-slate-500 group-hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
           </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---
const Dashboard = () => {
  const { folderName, models, isScanning, disconnect, openModel } = useFileSystem();
  const modelList = Object.values(models);
  const [isExiting, setIsExiting] = useState(false);
  
  // New States for Search & View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const handleModelClick = (id) => {
    setIsExiting(true);
    setTimeout(() => { openModel(id); }, 300);
  };

  // Filter Logic
  const filteredModels = modelList.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isScanning) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#050b14] text-white">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600/30 border-t-blue-500"></div>
        </div>
        <p className="mt-6 animate-pulse text-sm font-medium uppercase tracking-widest text-slate-500">Scanning Repository...</p>
      </div>
    );
  }

  return (
    <div className={clsx(
      "min-h-screen w-full bg-[#050b14] text-white transition-opacity duration-500 overflow-x-hidden relative font-sans selection:bg-blue-500/30",
      isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
    )}>
      
      {/* 1. CLEAN BACKGROUND (No Grain) */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl p-8 lg:p-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8 animate-in slide-in-from-top-4 duration-700 fade-in">
          <div>
            <div className="mb-2 flex items-center gap-2">
               <span className="flex h-2 w-2 items-center justify-center">
                 <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
               </span>
               <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">System Online</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Command Center
            </h1>
            <p className="mt-2 text-slate-400 max-w-lg text-lg">
              Repository: <span className="text-blue-400 font-mono">{folderName}</span>
            </p>
          </div>
          
          <button 
            onClick={disconnect}
            className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors py-2"
          >
            Disconnect
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center animate-in slide-in-from-bottom-2 duration-500 fade-in fill-mode-backwards delay-100">
           
           {/* Search Input */}
           <div className="relative w-full md:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-white/5 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all sm:text-sm"
                 placeholder="Search models by name or ID..."
              />
           </div>

           {/* View Toggle */}
           <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
              <button 
                onClick={() => setViewMode('grid')}
                className={clsx(
                   "p-2 rounded-md transition-all",
                   viewMode === 'grid' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                )}
              >
                 <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={clsx(
                   "p-2 rounded-md transition-all",
                   viewMode === 'list' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                )}
              >
                 <List className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* CONTENT GRID/LIST */}
        {/* 'key' on the container forces a slight re-render for animation when switching views */}
        <div 
           key={viewMode} 
           className={clsx(
             "transition-all duration-500 ease-in-out",
             viewMode === 'grid' 
               ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
               : "flex flex-col space-y-3"
           )}
        >
          {filteredModels.length > 0 ? (
            filteredModels.map((model, idx) => (
               viewMode === 'grid' ? (
                 <ModelCard key={model.id} model={model} index={idx} onClick={() => handleModelClick(model.id)} />
               ) : (
                 <ModelRow key={model.id} model={model} index={idx} onClick={() => handleModelClick(model.id)} />
               )
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                 <Filter className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-white">No models found</h3>
              <p className="text-slate-500">Try adjusting your search query.</p>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default Dashboard;