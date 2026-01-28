import React, { useState, useEffect } from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { readExcelFile, parseSheetData } from '../utils/excelReader';
import { getCellStyle } from '../utils/logicEngine'; 
import RuleBuilder from './RuleBuilder'; 
import { 
  ArrowLeft, Layers, Calendar, Search, Bell, UserCircle, Download, Filter, 
  ChevronLeft, ChevronRight, MonitorPlay, ZoomIn, ZoomOut, Minimize2, 
  Edit3, Save, Snowflake, Ruler 
} from 'lucide-react';
import clsx from 'clsx';

const ModelDetail = () => {
  const { selectedModel, closeModel, manifest, updateManifest } = useFileSystem();
  
  // Data State
  const [activeFile, setActiveFile] = useState(null);
  const [workbookData, setWorkbookData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [sheetMerges, setSheetMerges] = useState([]); // NEW: Store Merge Data
  const [isLoading, setIsLoading] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // VIEW STATE
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // FEATURE STATES
  const [isEditMode, setIsEditMode] = useState(false);
  const [showRowNumbers, setShowRowNumbers] = useState(false);
  const [frozenColCount, setFrozenColCount] = useState(0);     
  const [selectedColIndex, setSelectedColIndex] = useState(null); 

  // Constants
  const COLUMN_WIDTH = 192; // 12rem
  const ROW_NUM_WIDTH = 64; 
  const BG_COLOR = '#0f172a'; // Slate 900 (Opaque)

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
      
      // NEW: Extract data AND merges
      const { data: rawData, merges } = parseSheetData(data.workbook, firstSheet);
      setSheetData(rawData);
      setSheetMerges(merges);
      
      setFrozenColCount(0);
      setSelectedColIndex(null);
    } catch (error) {
      console.error("Failed to load file", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetSwitch = (sheetName) => {
    if (!workbookData) return;
    setActiveSheet(sheetName);
    
    // NEW: Extract data AND merges
    const { data: rawData, merges } = parseSheetData(workbookData.workbook, sheetName);
    setSheetData(rawData);
    setSheetMerges(merges);
    
    setFrozenColCount(0);
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

  const handleCellEdit = (rowIndex, cellIndex, newValue) => {
    const updatedData = [...sheetData];
    const actualRowIndex = rowIndex + 1;
    updatedData[actualRowIndex][cellIndex] = newValue;
    setSheetData(updatedData);
  };

  const handleFreeze = () => {
    if (selectedColIndex !== null) {
      if (frozenColCount === selectedColIndex + 1) {
        setFrozenColCount(0);
      } else {
        setFrozenColCount(selectedColIndex + 1);
      }
    }
  };

  const getStickyLeft = (index) => {
    let left = 0;
    if (showRowNumbers) left += ROW_NUM_WIDTH; 
    left += index * COLUMN_WIDTH; 
    return left;
  };

  // NEW: Helper to check if a cell is merged
  const getMergeProps = (rowIndex, colIndex) => {
    if (!sheetMerges || sheetMerges.length === 0) return null;

    for (const merge of sheetMerges) {
      // merge.s = start {c, r}, merge.e = end {c, r}
      
      // 1. Is this the Top-Left cell of a merge?
      if (merge.s.r === rowIndex && merge.s.c === colIndex) {
        return {
          rowSpan: merge.e.r - merge.s.r + 1,
          colSpan: merge.e.c - merge.s.c + 1,
          isStart: true
        };
      }

      // 2. Is this cell INSIDE a merge (but not the start)?
      // It should be hidden.
      if (
        rowIndex >= merge.s.r && rowIndex <= merge.e.r &&
        colIndex >= merge.s.c && colIndex <= merge.e.c
      ) {
        return { isHidden: true };
      }
    }
    return null; // Not merged
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
           <div className="absolute top-0 left-0 w-full h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-[60] flex items-center justify-between px-8 shadow-2xl">
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
            {/* Toolbar */}
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
                   <button 
                     onClick={() => setShowRowNumbers(!showRowNumbers)}
                     className={clsx(
                       "p-1.5 rounded transition-colors border",
                       showRowNumbers ? "bg-purple-600 border-purple-500 text-white" : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-white"
                     )}
                     title="Toggle Row Numbers"
                   >
                     <Ruler className="w-4 h-4"/>
                   </button>
                   <button 
                     onClick={handleFreeze}
                     disabled={selectedColIndex === null}
                     className={clsx(
                       "p-1.5 rounded transition-colors border flex items-center gap-1",
                       frozenColCount > 0 ? "bg-blue-600 border-blue-500 text-white" : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-white",
                       selectedColIndex === null && "opacity-50 cursor-not-allowed"
                     )}
                     title="Freeze up to selected column"
                   >
                     <Snowflake className="w-4 h-4"/>
                     {selectedColIndex !== null && <span className="text-[10px] font-bold">{selectedColIndex + 1}</span>}
                   </button>
                   <div className="w-px h-6 bg-slate-700 mx-1"></div>
                   <button 
                     onClick={() => setIsEditMode(!isEditMode)}
                     className={clsx(
                       "flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors border",
                       isEditMode ? "bg-amber-600 border-amber-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                     )}
                   >
                     {isEditMode ? <><Save className="w-3 h-3"/> Done Editing</> : <><Edit3 className="w-3 h-3"/> Edit Data</>}
                   </button>
                   <div className="w-px h-6 bg-slate-700 mx-1"></div>
                   <button 
                     onClick={() => setIsRuleModalOpen(true)}
                     className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                   >
                     <Filter className="w-3 h-3" /> Add Rule
                   </button>
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
                    <table className="table-fixed min-w-full text-left border-collapse relative">
                      
                      {/* HEADER - Row Index 0 */}
                      <thead className="text-slate-400 uppercase sticky top-0 z-50 shadow-xl">
                        <tr>
                          {showRowNumbers && (
                             <th 
                               className="px-4 py-4 border-b border-r border-slate-700 font-bold sticky left-0 z-[60] text-center text-slate-500"
                               style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, backgroundColor: BG_COLOR }}
                             >
                               #
                             </th>
                          )}

                          {sheetData[0]?.map((head, i) => {
                            // CHECK FOR HEADER MERGES (Row 0)
                            const mergeProps = getMergeProps(0, i);
                            if (mergeProps?.isHidden) return null; // Hide covered cells

                            return (
                              <th 
                                key={i} 
                                onClick={() => setSelectedColIndex(selectedColIndex === i ? null : i)}
                                colSpan={mergeProps?.colSpan || 1}
                                rowSpan={mergeProps?.rowSpan || 1}
                                className={clsx(
                                  "border-b border-slate-700 font-semibold tracking-wider whitespace-nowrap cursor-pointer transition-colors relative",
                                  selectedColIndex === i ? "text-blue-200 border-blue-500" : "hover:bg-slate-800",
                                  isPresentationMode ? "px-10 py-6 text-sm" : "px-6 py-4 text-xs",
                                  
                                  // FROZEN LOGIC
                                  i < frozenColCount && "sticky z-[60] border-r border-slate-700",
                                  i === frozenColCount - 1 && "shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] border-r-2 border-r-blue-500"
                                )}
                                style={{ 
                                  width: (mergeProps?.colSpan || 1) * COLUMN_WIDTH, 
                                  minWidth: (mergeProps?.colSpan || 1) * COLUMN_WIDTH,
                                  backgroundColor: selectedColIndex === i ? '#172554' : BG_COLOR,
                                  ...(i < frozenColCount ? { left: getStickyLeft(i) } : {})
                                }}
                              >
                                {head || `Col ${i+1}`}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      {/* BODY - Row Index 1+ */}
                      <tbody className="divide-y divide-slate-800/50 bg-slate-900 relative z-0">
                        {sheetData.slice(1).map((row, rowIndex) => {
                          const actualRowIndex = rowIndex + 1; // 0 is header, so data starts at 1
                          
                          const rowObject = {};
                          sheetData[0].forEach((header, index) => {
                            rowObject[header] = row[index];
                          });

                          return (
                            <tr key={rowIndex} className="hover:bg-blue-900/10 transition-colors group">
                              
                              {/* Row Number */}
                              {showRowNumbers && (
                                <td 
                                  className="px-2 py-3 border-r border-slate-700/50 sticky left-0 z-[30] text-center font-mono text-xs text-slate-500"
                                  style={{ backgroundColor: BG_COLOR }}
                                >
                                  {actualRowIndex + 1}
                                </td>
                              )}

                              {row.map((cell, cellIndex) => {
                                // CHECK FOR BODY MERGES
                                const mergeProps = getMergeProps(actualRowIndex, cellIndex);
                                if (mergeProps?.isHidden) return null; // Hide covered cells

                                const columnName = sheetData[0][cellIndex];
                                const { className, style } = getCellStyle(
                                  cell, columnName, rowObject, selectedModel.id, activeSheet, manifest
                                );

                                return (
                                  <td 
                                    key={cellIndex} 
                                    colSpan={mergeProps?.colSpan || 1}
                                    rowSpan={mergeProps?.rowSpan || 1}
                                    className={clsx(
                                      "border-r border-slate-800/30 last:border-r-0 text-slate-300 group-hover:text-white transition-colors truncate align-top",
                                      className,
                                      isPresentationMode ? "px-10 py-5 text-base" : "px-6 py-3 text-sm",
                                      
                                      // FROZEN LOGIC
                                      cellIndex < frozenColCount && "sticky z-30 border-r border-slate-700",
                                      cellIndex === frozenColCount - 1 && "shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] border-r-2 border-r-blue-500/30"
                                    )}
                                    style={{
                                      backgroundColor: cellIndex < frozenColCount ? BG_COLOR : undefined, 
                                      ...(cellIndex < frozenColCount ? { left: getStickyLeft(cellIndex) } : {}),
                                      ...style
                                    }}
                                  >
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