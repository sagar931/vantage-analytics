import React, { useState, useEffect } from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { readExcelFile, parseSheetData } from '../utils/excelReader';
import { getCellStyle } from '../utils/logicEngine'; 
import RuleBuilder from './RuleBuilder'; 
import { 
  ArrowLeft, Layers, Calendar, Search, Bell, UserCircle, Download, Filter, 
  ChevronLeft, ChevronRight, MonitorPlay, ZoomIn, ZoomOut, Minimize2, 
  Edit3, Save, Snowflake, Ruler, Layout, Maximize, Scan
} from 'lucide-react';
import clsx from 'clsx';

const ModelDetail = () => {
  const { selectedModel, closeModel, manifest, updateManifest } = useFileSystem();
  
  // Data State
  const [activeFile, setActiveFile] = useState(null);
  const [workbookData, setWorkbookData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [sheetMerges, setSheetMerges] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // VIEW STATE
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [viewMode, setViewMode] = useState('compact'); // 'compact' | 'presentation' | 'focus'
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
      setViewMode('presentation'); 
      setZoomLevel(100); 
    } else {
      setIsPresentationMode(false);
      setIsSidebarCollapsed(false);
      setViewMode('compact');
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

  const getMergeProps = (rowIndex, colIndex) => {
    if (!sheetMerges || sheetMerges.length === 0) return null;

    for (const merge of sheetMerges) {
      if (merge.s.r === rowIndex && merge.s.c === colIndex) {
        return {
          rowSpan: merge.e.r - merge.s.r + 1,
          colSpan: merge.e.c - merge.s.c + 1,
          isStart: true
        };
      }
      if (
        rowIndex >= merge.s.r && rowIndex <= merge.e.r &&
        colIndex >= merge.s.c && colIndex <= merge.e.c
      ) {
        return { isHidden: true };
      }
    }
    return null;
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
           <div className="absolute top-0 left-0 w-full h-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 z-[60] flex items-center justify-between px-8 shadow-2xl">
              
              {/* Left: Title Info */}
              <div className="flex items-center gap-4 text-white">
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-xl text-blue-400">{selectedModel.name.replace(/_/g, ' ')}</span>
                    <span className="text-slate-600 text-xl">/</span>
                    <span className="text-lg font-mono text-slate-300">{activeFile?.period}</span>
                 </div>
                 <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-bold uppercase tracking-widest text-emerald-400 shadow-inner">
                    {activeSheet}
                 </div>
              </div>

              {/* Center: View Switcher */}
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <button 
                  onClick={() => setViewMode('compact')}
                  className={clsx("px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all", viewMode === 'compact' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                >
                  <Maximize className="w-3 h-3" /> Full
                </button>
                <button 
                  onClick={() => setViewMode('presentation')}
                  className={clsx("px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all", viewMode === 'presentation' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                >
                  <Layout className="w-3 h-3" /> Present
                </button>
                <button 
                  onClick={() => setViewMode('focus')}
                  className={clsx("px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all", viewMode === 'focus' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                >
                  <Scan className="w-3 h-3" /> Focus
                </button>
              </div>
              
              {/* Right: Exit */}
              <button 
                  onClick={togglePresentation}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
              >
                 <Minimize2 className="w-4 h-4" /> Exit
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
            <div 
              className={clsx(
                "flex-1 overflow-hidden relative transition-colors duration-700",
                // Gradient for Presentation, Flat for Normal
                isPresentationMode ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" : "bg-slate-950"
              )}
            >
              <div 
                className={clsx(
                  "absolute left-0 right-0 bottom-0 overflow-auto custom-scrollbar", 
                  // FIXED: Use top-16 in presentation mode so scrolling starts BELOW the header
                  isPresentationMode ? "top-16" : "top-0"
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
                    className={clsx(
                      "transition-all duration-500 ease-out origin-top", 
                      // Presentation Container Logic
                      viewMode === 'presentation' && isPresentationMode 
                        // CHANGE: Replaced 'overflow-hidden' with 'overflow-x-auto custom-scrollbar'
                        ? "w-[94%] mx-auto mt-4 mb-4 shadow-2xl rounded-xl border border-slate-700/50 overflow-x-auto custom-scrollbar bg-slate-900" 
                        : "min-w-full"
                    )}
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
                                  // Center if Merged
                                  mergeProps?.isStart ? "text-center align-middle" : "text-left align-top",
                                  
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
                      {/* BODY - Z-Index 0 (or 40 if frozen) */}
                      <tbody className="divide-y divide-slate-800/50 bg-slate-900 relative z-0">
                        {sheetData.slice(1).map((row, rowIndex) => {
                          const actualRowIndex = rowIndex + 1; // 0 is header, so data starts at 1
                          
                          // 1. Construct Row Object
                          const rowObject = {};
                          sheetData[0].forEach((header, index) => {
                            rowObject[header] = row[index];
                          });

                          // 2. FOCUS MODE LOGIC: Determine if row should be dimmed
                          let isRowDimmed = false;
                          if (viewMode === 'focus') {
                             // Check if any cell in this row has a "Warning" style (Red or Amber)
                             const hasAlert = row.some((cell, i) => {
                                const colName = sheetData[0][i];
                                // We safely call the engine to check the style
                                const { style } = getCellStyle(
                                  cell, colName, rowObject, selectedModel.id, activeSheet, manifest
                                );
                                // Check for Red (239, 68, 68) or Amber (245, 158, 11) RGB values
                                return style?.backgroundColor && (
                                  style.backgroundColor.includes('239, 68, 68') || 
                                  style.backgroundColor.includes('245, 158, 11')
                                );
                             });
                             // If no alert found, dim this row
                             isRowDimmed = !hasAlert;
                          }

                          return (
                            <tr 
                              key={rowIndex} 
                              className={clsx(
                                "transition-all duration-500 group",
                                // Apply Dimming: 20% opacity for noise, 50% on hover so you can still read it
                                isRowDimmed ? "opacity-20 grayscale hover:opacity-50" : "opacity-100 hover:bg-blue-900/10"
                              )}
                            >
                              
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
                                      "border-r border-slate-800/30 last:border-r-0 text-slate-300 group-hover:text-white transition-colors",
                                      className,
                                      isPresentationMode ? "px-10 py-5 text-base" : "px-6 py-3 text-sm",
                                      
                                      // Center if Merged
                                      mergeProps?.isStart ? "text-center align-middle" : "text-left align-top truncate",

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