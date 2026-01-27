import React from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { FileSpreadsheet, LayoutGrid, Clock, ChevronRight } from 'lucide-react';

// 1. Add openModel to props here
const ModelCard = ({ model, openModel }) => {
  const fileCount = model.files.length;
  const hasMonthly = model.files.some(f => f.frequency === 'Monthly');
  const hasQuarterly = model.files.some(f => f.frequency === 'Quarterly');

  return (
    <div 
      // 2. Add the Click Handler here
      onClick={() => openModel(model.id)}
      className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 cursor-pointer relative overflow-hidden"
    >
      
      {/* Hover Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-blue-500/10" />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-blue-900/30 group-hover:text-blue-400 transition-colors">
          <LayoutGrid className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
        </div>
        <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
          ID: {model.id}
        </span>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-100">{model.name.replace(/_/g, ' ')}</h3>
      <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
        <FileSpreadsheet className="w-3 h-3" /> {fileCount} Linked Files
      </p>

      {/* Footer Tags */}
      <div className="flex gap-2 mt-auto">
        {hasMonthly && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-md border border-emerald-900/50">
            Monthly
          </span>
        )}
        {hasQuarterly && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950/30 px-2 py-1 rounded-md border border-amber-900/50">
            Quarterly
          </span>
        )}
      </div>

      {/* Arrow Icon appearing on hover */}
      <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <ChevronRight className="text-blue-400 w-5 h-5" />
      </div>
    </div>
  );
};

const Dashboard = () => {
  // 3. Extract openModel from the hook
  const { folderName, models, isScanning, disconnect, openModel } = useFileSystem();
  const modelList = Object.values(models);

  if (isScanning) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 animate-pulse">Scanning {folderName}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Command Center</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected to: <span className="font-mono text-emerald-400">{folderName}</span>
          </p>
        </div>
        <button 
          onClick={disconnect}
          className="text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 px-4 py-2 rounded-lg transition-colors"
        >
          Disconnect Repository
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modelList.length > 0 ? (
          modelList.map((model) => (
            // 4. Pass openModel to the component
            <ModelCard key={model.id} model={model} openModel={openModel} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <p>No valid GMD models found in this folder.</p>
            <p className="text-xs mt-2">Expected format: GMDxx_Name_M_Date.xlsx</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;