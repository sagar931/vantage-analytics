import React from 'react';
import { FolderSearch, ShieldCheck, BarChart3 } from 'lucide-react';
import { useFileSystem } from '../context/FileSystemContext';

const LandingPage = () => {
  const { connectDirectory } = useFileSystem();

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Decorative Blobs (Premium Feel) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      {/* Main Card */}
      <div className="z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center">
        
        {/* Logo / Icon */}
        <div className="mb-8 flex justify-center">
          <div className="h-20 w-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Vantage</h1>
        <p className="text-slate-400 text-lg mb-8">
          Premium Fraud Model Monitoring. <br/>
          Secure. Local. Instant.
        </p>

        {/* Action Button */}
        <button 
          onClick={connectDirectory}
          className="group relative w-full flex items-center justify-center gap-3 bg-white text-slate-950 py-4 px-6 rounded-xl font-semibold text-lg transition-all hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          <FolderSearch className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
          <span>Connect Local Repository</span>
        </button>

        <p className="mt-6 text-xs text-slate-600 uppercase tracking-widest font-medium">
          Powered by Local File System API
        </p>
      </div>

      {/* Footer Feature List */}
      <div className="absolute bottom-10 flex gap-8 text-slate-500 text-sm font-medium">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Real-time Parsing
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> No Cloud Upload
        </div>
      </div>
    </div>
  );
};

export default LandingPage;