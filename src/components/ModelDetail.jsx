import React, { useState, useEffect } from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { readExcelFile, parseSheetData } from '../utils/excelReader';
import { getCellStyle } from '../utils/logicEngine'; 
import RuleBuilder from './RuleBuilder'; 
import { 
  ArrowLeft, Layers, Calendar, Search, Bell, UserCircle, Download, Filter, 
  ChevronLeft, ChevronRight, MonitorPlay, ZoomIn, ZoomOut, Minimize2, 
  Edit3, Save, Snowflake, XCircle 
} from 'lucide-react';
import clsx from 'clsx';

const ModelDetail = () => {
  const { selectedModel, closeModel, manifest, updateManifest } = useFileSystem();
  
  // Data State
  const [activeFile, setActiveFile] = useState(null);
  const [workbookData, setWorkbookData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // VIEW STATE
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // NEW: Feature States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFirstColFrozen, setIsFirstColFrozen] = useState(false);

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

  const navigateSheet = (direction) => {
    if (!workbookData || !activeSheet) return;
    const currentIndex = workbookData.sheetNames.indexOf(activeSheet);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < workbookData.sheetNames.length) {
      handleSheetSwitch(workbookData.sheetNames[newIndex]);
    }
  };

  const togglePresentation = () => {
    if (!isPresentationMode) {
      setIsPresentationMode(true);
      setIsSidebarCollapsed(true);
      setZoomLevel(110);
    } else {
      setIsPresentationMode(false);
      setIsSidebarCollapsed(false);
      setZoomLevel(100);
    }
  };

  // NEW: Handle Cell Editing
  const handleCellEdit = (rowIndex, cellIndex, newValue) => {
    const updatedData = [...sheetData];
    // rowIndex + 1 because row 0 is headers in our slice logic below, 
    // but here we are editing the raw data which includes header at 0.
    // Wait, sheetData includes headers at 0.
    // The map below uses sheetData.slice(1), so rowIndex corresponds to sheetData[rowIndex + 1]
    
    // Let's be precise: We want to update sheetData[rowIndex + 1][cellIndex]
    const actualRowIndex = rowIndex + 1;
    updatedData[actualRowIndex][cellIndex] = newValue;
    setSheetData(updatedData);
  };

  return (
    <div className="h-screen w-full flex bg-slate-950 text-white overflow-hidden font-sans relative">
      
      {/* 1. LEFT SIDEBAR */}
      <div 
        className={clsx(
          "bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20 transition-all duration-500 ease-in-out relative",
          isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-72 opacity-100"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900 whitespace-nowrap">
          <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-tight text-lg">
             <img src="/barclays_logo.png" alt="Barclays" className="h-8 w-auto object-contain"/>
             <span>BARCLAYS</span>
          </div>
        </div>

        <div className="p-4 whitespace-nowrap">
           <button onClick={closeModel} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 py-2 rounded-lg transition-all text-sm font-medium border border-slate-700">
            <ArrowLeft className="w-4 h-4" /> Return to Grid
          </button>
        </div>

        <div className="px-6 mb-4 whitespace-nowrap">
          <h2 className="text-xl font-bold text-white leading-tight">{selectedModel.name.replace(/_/g, ' ')}</h2>
          <span className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 mt-2 inline-block">
            ID: {selectedModel.id}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar whitespace-nowrap">
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

      {/* COLLAPSE TRIGGER */}
      {!isPresentationMode && (
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-blue-600 p-1 rounded-r-lg shadow-lg transition-all"
          style={{ left: isSidebarCollapsed ? '0px' : '288px' }}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full relative bg-slate-950 transition-all duration-500">
        
        {/* PRESENTATION HEADER */}
        {isPresentationMode && (
           <div className="absolute top-0 left-0 w-full h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-50 flex items-center justify-between px-8 shadow-2xl">
              <div className="flex items-center gap-4 text-white">
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-xl text-blue-400">{selectedModel.name.replace(/_/g, ' ')}</span>
                    <span className="text-slate-600 text-xl">/</span>
                    <span className="text-lg font-mono text-slate-300">{activeFile?.period}</span>
                 </div>
                 <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-bold uppercase tracking-widest text-emerald-400">
                    {activeSheet}
                 </div>
              </div>
              <button 
                  onClick={togglePresentation}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
              >
                 <Minimize2 className="w-4 h-4" /> Exit Slide Show
              </button>
           </div>
        )}

        {/* STANDARD NAV */}
        {!isPresentationMode && (
          <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10 transition-all duration-500">
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

             <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="Search..." className="bg-slate-800 border border-slate-700 text-sm rounded-full pl-9 pr-4 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500 w-48"/>
                </div>
                <div className="h-8 w-px bg-slate-800 mx-2"></div>
                
                <button 
                  onClick={togglePresentation}
                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Presentation Mode"
                >
                  <MonitorPlay className="w-5 h-5" />
                </button>

                <Bell className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
                <UserCircle className="w-8 h-8 text-slate-400 hover:text-white cursor-pointer" />
             </div>
          </div>
        )}

        {/* WORKSPACE */}
        {activeFile ? (
          <>
            {/* Toolbar & Tabs */}
            {!isPresentationMode && (
              <div className="bg-slate-900/50 border-b border-slate-800 px-4 flex items-end gap-1 overflow-x-auto pt-2">
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
                 <div className="pb-2 flex gap-2">
                   
                   {/* NEW: Toggle Freeze Column */}
                   <button 
                     onClick={() => setIsFirstColFrozen(!isFirstColFrozen)}
                     className={clsx(
                       "p-1.5 rounded transition-colors border",
                       isFirstColFrozen ? "bg-blue-600 border-blue-500 text-white" : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-white"
                     )}
                     title="Freeze First Column"
                   >
                     <Snowflake className="w-4 h-4"/>
                   </button>

                   {/* NEW: Toggle Edit Mode */}
                   <button 
                     onClick={() => setIsEditMode(!isEditMode)}
                     className={clsx(
                       "flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors border",
                       isEditMode ? "bg-amber-600 border-amber-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                     )}
                   >
                     {isEditMode ? <><Save className="w-3 h-3"/> </> : <><Edit3 className="w-3 h-3"/> </>}
                   </button>

                   <div className="w-px h-6 bg-slate-700 mx-1"></div>

                   <button 
                     onClick={() => setIsRuleModalOpen(true)}
                     className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                   >
                     <Filter className="w-3 h-3" /> Add Rule
                   </button>
                   <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><Download className="w-4 h-4"/></button>
                 </div>
              </div>
            )}

            {/* Table Area */}
            <div className="flex-1 overflow-hidden relative bg-slate-950">
              <div 
                className={clsx(
                  "absolute inset-0 overflow-auto custom-scrollbar", 
                  isPresentationMode && "pt-20"
                )}
              > 
                
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                    Loading Data...
                  </div>
                ) : (
                  <div 
                    style={{ zoom: zoomLevel / 100 }}
                    className="min-w-full"
                  >
                    <table className="min-w-full whitespace-nowrap text-left border-collapse relative">
                      {/* HEADER: Z-50 forces it on top */}
                      <thead className="text-slate-400 uppercase sticky top-0 z-50 shadow-xl">
                        <tr>
                          {sheetData[0]?.map((head, i) => (
                            <th 
                              key={i} 
                              className={clsx(
                                "border-b border-slate-700 font-semibold tracking-wider bg-slate-900 whitespace-nowrap",
                                isPresentationMode ? "px-10 py-6 text-sm" : "px-6 py-4 text-xs",
                                // FROZEN COLUMN LOGIC for Header
                                isFirstColFrozen && i === 0 && "sticky left-0 z-50 bg-slate-900 border-r border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)]"
                              )}
                            >
                              {head || `Col ${i+1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      {/* BODY: Z-0 ensures it stays below */}
                      <tbody className="divide-y divide-slate-800/50 bg-slate-900 relative z-0">
                        {sheetData.slice(1).map((row, rowIndex) => {
                          const rowObject = {};
                          sheetData[0].forEach((header, index) => {
                            rowObject[header] = row[index];
                          });

                          return (
                            <tr key={rowIndex} className="hover:bg-blue-900/10 transition-colors group">
                              {row.map((cell, cellIndex) => {
                                const columnName = sheetData[0][cellIndex];
                                const { className, style } = getCellStyle(
                                  cell, columnName, rowObject, selectedModel.id, activeSheet, manifest
                                );

                                return (
                                  <td 
                                    key={cellIndex} 
                                    className={clsx(
                                      "border-r border-slate-800/30 last:border-r-0 text-slate-300 group-hover:text-white transition-colors",
                                      className,
                                      isPresentationMode ? "px-10 py-5 text-base" : "px-6 py-3 text-sm",
                                      // FROZEN COLUMN LOGIC for Cells
                                      isFirstColFrozen && cellIndex === 0 && "sticky left-0 z-40 bg-slate-900 border-r border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)]"
                                    )}
                                    style={style} 
                                  >
                                    {/* EDIT MODE INPUT */}
                                    {isEditMode ? (
                                      <input 
                                        type="text" 
                                        defaultValue={cell}
                                        onBlur={(e) => handleCellEdit(rowIndex, cellIndex, e.target.value)}
                                        className="bg-slate-800 border border-blue-500/50 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    ) : (
                                      cell
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {/* Controls */}
              <div className="absolute bottom-6 right-6 flex items-center gap-4 z-50">
                 {isPresentationMode && (
                   <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-lg shadow-xl">
                     <button onClick={() => navigateSheet('prev')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded">
                        <ChevronLeft className="w-5 h-5"/>
                     </button>
                     <div className="h-4 w-px bg-slate-700 mx-1"></div>
                     <button onClick={() => navigateSheet('next')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded">
                        <ChevronRight className="w-5 h-5"/>
                     </button>
                   </div>
                 )}
                 <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-1 rounded-lg shadow-xl">
                    <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><ZoomOut className="w-4 h-4"/></button>
                    <span className="text-xs font-mono w-10 text-center text-slate-300">{zoomLevel}%</span>
                    <button onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><ZoomIn className="w-4 h-4"/></button>
                 </div>
              </div>

            </div>
            
            <RuleBuilder 
              isOpen={isRuleModalOpen}
              onClose={() => setIsRuleModalOpen(false)}
              columns={sheetData[0] || []}
              activeSheet={activeSheet}
              onSave={(newRule) => updateManifest(selectedModel.id, activeSheet, newRule)}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-slate-950">
            <Layers className="w-20 h-20 mb-6 opacity-10" />
            <p className="text-lg font-medium">Select a monitoring period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelDetail;