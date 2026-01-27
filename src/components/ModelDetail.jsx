import React, { useState, useEffect } from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { readExcelFile, parseSheetData } from '../utils/excelReader';
import { ArrowLeft, Layers, Calendar, Search, Bell, UserCircle, Download, Filter } from 'lucide-react';
import clsx from 'clsx';

const ModelDetail = () => {
  const { selectedModel, closeModel } = useFileSystem();
  
  // State
  const [activeFile, setActiveFile] = useState(null);
  const [workbookData, setWorkbookData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Group files by Year
  const filesByYear = selectedModel.files.reduce((acc, file) => {
    const year = file.period.slice(-4);
    if (!acc[year]) acc[year] = [];
    acc[year].push(file);
    return acc;
  }, {});

  const handleFileClick = async (file) => {
    try {
      setIsLoading(true);
      setActiveFile(file);
      const data = await readExcelFile(file.handle);
      setWorkbookData(data);
      const firstSheet = data.sheetNames[0];
      setActiveSheet(firstSheet);
      setSheetData(parseSheetData(data.workbook, firstSheet));
    } catch (error) {
      console.error("Failed to load file", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetSwitch = (sheetName) => {
    if (!workbookData) return;
    setActiveSheet(sheetName);
    setSheetData(parseSheetData(workbookData.workbook, sheetName));
  };

  return (
    <div className="h-screen w-full flex bg-slate-950 text-white overflow-hidden font-sans">
      
      {/* 1. LEFT SIDEBAR (Navigation & Branding) */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
        
        {/* BRANDING HEADER */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
          {/* Simulated Barclays Logo */}
          <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-tight text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center text-white">
              <span className="font-serif italic font-black text-xl">B</span>
            </div>
            <span>BARCLAYS</span>
          </div>
        </div>

        {/* BACK BUTTON */}
        <div className="p-4">
           <button onClick={closeModel} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 py-2 rounded-lg transition-all text-sm font-medium border border-slate-700">
            <ArrowLeft className="w-4 h-4" /> Return to Grid
          </button>
        </div>

        {/* MODEL INFO */}
        <div className="px-6 mb-4">
          <h2 className="text-xl font-bold text-white leading-tight">{selectedModel.name.replace(/_/g, ' ')}</h2>
          <span className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 mt-2 inline-block">
            ID: {selectedModel.id}
          </span>
        </div>

        {/* TIMELINE LIST */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          {Object.keys(filesByYear).sort().reverse().map(year => (
            <div key={year} className="mb-6">
              <div className="flex items-center gap-2 mb-2 px-2">
                 <div className="h-px bg-slate-800 flex-1"></div>
                 <span className="text-xs font-bold text-slate-500">{year}</span>
                 <div className="h-px bg-slate-800 flex-1"></div>
              </div>
              <div className="space-y-1">
                {filesByYear[year].map(file => (
                  <button
                    key={file.originalName}
                    onClick={() => handleFileClick(file)}
                    className={clsx(
                      "w-full text-left px-3 py-3 rounded-lg text-sm flex items-center justify-between group transition-all border",
                      activeFile?.originalName === file.originalName 
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500 shadow-lg shadow-blue-900/50" 
                        : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 opacity-70" />
                      <span className="font-medium">{file.period.replace(/\d{4}/, '')}</span>
                    </span>
                    {file.frequency === 'Quarterly' && (
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">Q</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full relative bg-slate-950">
        
        {/* 2. TOP NAV BAR (Global App Header) */}
        <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10">
           {/* Left: Breadcrumbs */}
           <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Fraud Analytics</span>
              <span className="text-slate-600">/</span>
              <span className="text-white font-medium">{selectedModel.name}</span>
              {activeFile && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-blue-400">{activeFile.period}</span>
                </>
              )}
           </div>

           {/* Right: Actions */}
           <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-slate-800 border border-slate-700 text-sm rounded-full pl-9 pr-4 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500 w-48"
                />
              </div>
              <div className="h-8 w-px bg-slate-800 mx-2"></div>
              <Bell className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
              <UserCircle className="w-8 h-8 text-slate-400 hover:text-white cursor-pointer" />
           </div>
        </div>

        {/* 3. WORKSPACE (Tabs + Table) */}
        {activeFile ? (
          <>
            {/* Sheet Tabs Bar */}
            <div className="bg-slate-900/50 border-b border-slate-800 pt-2 px-4 flex items-end gap-1 overflow-x-auto">
               {workbookData?.sheetNames.map(sheet => (
                 <button
                   key={sheet}
                   onClick={() => handleSheetSwitch(sheet)}
                   className={clsx(
                     "px-5 py-2.5 rounded-t-lg text-sm font-medium transition-all relative",
                     activeSheet === sheet 
                       ? "bg-slate-950 text-blue-400 border-t border-x border-slate-800 z-10" 
                       : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                   )}
                 >
                   {sheet}
                   {activeSheet === sheet && <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>}
                 </button>
               ))}
               
               <div className="flex-1"></div>
               {/* Toolbar for the Table */}
               <div className="pb-2 flex gap-2">
                 <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><Filter className="w-4 h-4"/></button>
                 <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><Download className="w-4 h-4"/></button>
               </div>
            </div>

            {/* DATA TABLE CONTAINER */}
            {/* Fixed: Added relative and overflow logic for proper scrolling */}
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 overflow-auto custom-scrollbar p-6">
                
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                    Loading Data...
                  </div>
                ) : (
                  <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-xl inline-block min-w-full">
                    <table className="min-w-full whitespace-nowrap text-sm text-left border-collapse">
                      {/* Fixed: Sticky Header */}
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950 sticky top-0 z-10 shadow-sm">
                        <tr>
                          {sheetData[0]?.map((head, i) => (
                            <th key={i} className="px-6 py-4 border-b border-slate-800 font-semibold tracking-wider bg-slate-950">
                              {head || `Col ${i+1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {sheetData.slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-blue-900/10 transition-colors group">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-6 py-3 text-slate-300 border-r border-slate-800/30 last:border-r-0 group-hover:text-white">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-slate-950">
            <Layers className="w-20 h-20 mb-6 opacity-10" />
            <p className="text-lg font-medium">Select a monitoring period</p>
            <p className="text-sm opacity-50">Choose a file from the sidebar to begin analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelDetail;