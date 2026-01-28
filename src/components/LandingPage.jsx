import React, { useRef, useState } from 'react';
import { FolderSearch, ShieldCheck, Zap, ChevronRight, UploadCloud } from 'lucide-react';
import { useFileSystem } from '../context/FileSystemContext';
import LoadingAnimation from './LoadingAnimation';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [showLoading, setShowLoading] = useState(true);
  const fileInputRef = useRef(null);
  const { connectDirectory, selectVlmFile } = useFileSystem();

  if (showLoading) {
    return <LoadingAnimation onComplete={() => setShowLoading(false)} />;
  }

  return (
    <div className="h-screen w-full bg-[#020617] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* 1. Cinematic Background Effects */}
      <div className="absolute inset-0 z-0">
         {/* Subtle Grid */}
         <div className="absolute inset-0 opacity-[0.03]" 
              style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
         />
         {/* Glow Orbs */}
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10s]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      {/* 2. Main Glass Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 relative w-full max-w-2xl mx-4"
      >
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-12 rounded-2xl shadow-2xl ring-1 ring-white/10">
          
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wider uppercase mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
              System Ready v2.0
            </motion.div>
            
            <h1 className="text-6xl font-bold tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              VANTAGE
            </h1>
            <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
              Enterprise-grade fraud model monitoring. <br/>
              Local security. Instant analytics.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 max-w-sm mx-auto">
            {/* Primary Action */}
            <button 
              onClick={connectDirectory}
              className="group relative w-full flex items-center justify-between bg-white text-slate-950 py-4 px-6 rounded-xl font-semibold text-base transition-all hover:bg-blue-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <div className="flex items-center gap-3">
                <FolderSearch className="w-5 h-5 text-blue-600" />
                <span>Open Data Directory</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary Action */}
            <button 
              onClick={selectVlmFile}
              className="group w-full flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-slate-300 py-4 px-6 rounded-xl font-medium text-base transition-all"
            >
              <div className="flex items-center gap-3">
                <UploadCloud className="w-5 h-5 text-slate-400" />
                <span>Load Existing Manifest</span>
              </div>
            </button>
          </div>

          {/* Footer Metrics */}
          <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
             <div>
                <div className="text-2xl font-bold text-white mb-1">100%</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Local & Secure</div>
             </div>
             <div>
                <div className="text-2xl font-bold text-white mb-1">0ms</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Latency</div>
             </div>
             <div>
                <div className="text-2xl font-bold text-white mb-1">∞</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Scale</div>
             </div>
          </div>

        </div>
      </motion.div>

      {/* Bottom Legal/Status */}
      <div className="absolute bottom-8 text-center">
        <p className="text-slate-600 text-xs font-mono">BARCLAYS FRAUD ANALYTICS • AUTHORIZED USE ONLY</p>
      </div>
    </div>
  );
};

export default LandingPage;