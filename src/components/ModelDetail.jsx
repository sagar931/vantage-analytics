import React, { useState, useEffect, useMemo } from 'react';
import { useFileSystem } from '../context/FileSystemContext';
import { readExcelFile, parseSheetData } from '../utils/excelReader';
import { getCellStyle } from '../utils/logicEngine'; 
import RuleBuilder from './RuleBuilder'; 
import ChartBuilder from './ChartBuilder';
import ChartRenderer from './ChartRenderer';
import { 
  ArrowLeft, Layers, Calendar, Search, Bell, UserCircle, Download, Filter, 
  ChevronLeft, ChevronRight, MonitorPlay, ZoomIn, ZoomOut, Minimize2, 
  Edit3, Save, Snowflake, Ruler, 
  // View Modes
  Layout, Maximize, Scan, 
  // Column Manager
  Eye, EyeOff, CheckSquare, Square,
  BarChart3, Table, Trash2, MoreVertical, ArrowUpAZ, ArrowDownZA, Hash, History, GitMerge, ArrowRightLeft
} from 'lucide-react';
import clsx from 'clsx';

  
// --- HELPER: FORMATTING ENGINE ---
const formatCellValue = (value, header, isCompactMode) => {
  if (value === null || value === undefined) return '';

  // 1. DETECT DATE (Excel Serial Numbers like 46023)
  const isDateHeader = /date|time|period|cat/i.test(header);
  if (typeof value === 'number' && value > 35000 && value < 60000 && isDateHeader) {
     const date = new Date((value - 25569) * 86400 * 1000);
     return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // "Jan 26"
  }

  // 2. HANDLE NUMBERS
  if (typeof value === 'number') {
     // Check if header implies currency (Amount, Price, Cost, Value, etc.)
     const isCurrency = /amount|price|cost|value|eur|total/i.test(header);
     const currencyCode = 'EUR'; // Default to Euro based on your screenshot

     // A. Compact Mode (e.g. €100K)
     if (isCompactMode) {
        return new Intl.NumberFormat('en-US', {
           notation: "compact",
           compactDisplay: "short",
           maximumFractionDigits: 1,
           ...(isCurrency && { style: 'currency', currency: currencyCode }) // Add Symbol
        }).format(value);
     }

     // B. Standard Mode (e.g. €100,000.00)
     if (isCurrency) {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: currencyCode 
        }).format(value);
     }

     // C. Generic Number (e.g. 100,000)
     const isID = /id|year|code/i.test(header);
     if (!isID) {
        return value.toLocaleString('en-US');
     }
  }

  return value;
};

// --- HELPER: CALCULATE TREND DELTA (SMART HEADER MATCH) ---
// --- HELPER: CALCULATE TREND DELTA (WITH MAPPING) ---
const getTrendDelta = (currentVal, currentRow, colIndex, comparisonData, currentHeaders, columnMapping) => {
  // 1. Safety Checks
  if (!comparisonData || !comparisonData.length) return null;
  if (!currentHeaders || !columnMapping) return null;
  if (colIndex === 0) return null; 
  if (typeof currentVal !== 'number') return null;

  // 2. Identify the Column Name & Mapped Target
  const colName = currentHeaders[colIndex];
  const targetColName = columnMapping[colName]; // <--- LOOKUP MAPPING

  if (!targetColName) return null; // No mapping exists for this column

  // 3. Find that Target Column in the Previous File
  const prevHeaders = comparisonData[0];
  const prevColIndex = prevHeaders.indexOf(targetColName);

  if (prevColIndex === -1) return null; 

  // 4. Find Matching Row (Using Key in Column 0)
  const rowKey = currentRow[0]; 
  const prevRow = comparisonData.find(r => r[0] === rowKey);

  if (!prevRow) return null; 

  // 5. Get Previous Value
  const prevVal = prevRow[prevColIndex];
  if (typeof prevVal !== 'number') return null;

  // 6. Calculate Delta
  const delta = currentVal - prevVal;
  if (Math.abs(delta) < 0.0001) return null;

  return {
    delta: delta,
    prev: prevVal,
    direction: delta > 0 ? 'up' : 'down'
  };
};


const ModelDetail = () => {

  const { selectedModel, closeModel, manifest, updateManifest, saveChart, removeChart } = useFileSystem();
  
  // Data State
  const [activeFile, setActiveFile] = useState(null);
  const [workbookData, setWorkbookData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [sheetMerges, setSheetMerges] = useState([]); 
  
  // --- NEW: TREND ANALYSIS STATE ---
  const [comparisonFile, setComparisonFile] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  const [comparisonWorkbook, setComparisonWorkbook] = useState(null); 
  const [comparisonSheet, setComparisonSheet] = useState(null);

  const [isComparing, setIsComparing] = useState(false);

  const [columnMapping, setColumnMapping] = useState({}); // { "CurrentCol": "PrevCol" }
  const [isMapperOpen, setIsMapperOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // --- HELPER: FIND PREVIOUS FILE (AUTO-DISCOVERY) ---
// --- HELPER: AUTO-GENERATE COLUMN MAPPING ---
  useEffect(() => {
    if (!sheetData.length || !comparisonData || !comparisonData.length) return;

    const currentHeaders = sheetData[0];
    const prevHeaders = comparisonData[0];
    const newMap = {};

    currentHeaders.forEach(header => {
       // 1. Try Exact Match
       if (prevHeaders.includes(header)) {
          newMap[header] = header;
       } 
       // 2. Try Fuzzy Match (Optional: Remove case sensitivity)
       else {
          const lower = header.toLowerCase();
          const match = prevHeaders.find(ph => ph.toLowerCase() === lower);
          if (match) newMap[header] = match;
       }
    });

    setColumnMapping(newMap);
  }, [sheetData, comparisonData]);

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

  // --- NEW: Sorting & Formatting State ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [compactColumns, setCompactColumns] = useState([]); 
  const [activeMenuCol, setActiveMenuCol] = useState(null); 

  // --- DERIVED DATA: SORTED SHEET ---
  const processedSheetData = useMemo(() => {
    if (!sheetData || sheetData.length === 0) return [];
    
    const headers = sheetData[0];
    const rows = sheetData.slice(1);

    if (sortConfig.key !== null) {
       rows.sort((a, b) => {
          const valA = a[sortConfig.key];
          const valB = b[sortConfig.key];
          
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
       });
    }
    return [headers, ...rows];
  }, [sheetData, sortConfig]);

  const toggleCompactMode = (colIndex) => {
     setCompactColumns(prev => prev.includes(colIndex) ? prev.filter(i => i !== colIndex) : [...prev, colIndex]);
  };

  const handleSort = (colIndex, direction) => {
     setSortConfig({ key: colIndex, direction });
     setActiveMenuCol(null); 
  };
  
  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuCol(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // --- ADD THESE MISSING LINES BELOW ---
  const [hiddenColumns, setHiddenColumns] = useState([]); // Needed to fix your error
  const [isColManagerOpen, setIsColManagerOpen] = useState(false); // Needed for the dropdown

  // Add this near other states
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'charts'
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false);
  const [chartToDelete, setChartToDelete] = useState(null); 

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

  // NEW: Toggle Column Visibility
  const toggleColumnVisibility = (colName) => {
    setHiddenColumns(prev => {
      if (prev.includes(colName)) {
        return prev.filter(c => c !== colName); // Unhide
      } else {
        return [...prev, colName]; // Hide
      }
    });
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
              
                {/* Center: Controls Group */}
              <div className="flex items-center gap-4">
                 
                 {/* 1. Sheet Navigation */}
                 <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                    <button onClick={() => navigateSheet('prev')} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                    <button onClick={() => navigateSheet('next')} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><ChevronRight className="w-4 h-4"/></button>
                 </div>

                 {/* 2. View Switcher (Existing) */}
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

                 {/* 3. Zoom Controls */}
                 <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                    <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><ZoomOut className="w-4 h-4"/></button>
                    <span className="text-xs font-mono text-slate-400 flex items-center px-2">{zoomLevel}%</span>
                    <button onClick={() => setZoomLevel(z => Math.min(200, z + 10))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><ZoomIn className="w-4 h-4"/></button>
                 </div>
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
             <div className="flex items-center gap-4">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Fraud Analytics</span><span className="text-slate-600">/</span><span className="text-white font-medium">{selectedModel.name}</span>
                    {activeFile && <><span className="text-slate-600">/</span><span className="text-blue-400">{activeFile.period}</span></>}
                </div>

                {/* --- COMPARISON CONTROLS (Auto or Manual) --- */}
                <div className="flex items-center gap-2">
                   {comparisonFile ? (
                      // CASE A: File Found (Show Badge)
                      <div 
                         onClick={() => setIsComparing(!isComparing)}
                         className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-xs transition-all hover:border-blue-500 cursor-pointer group select-none"
                      >
                         <div className={`w-2 h-2 rounded-full ${isComparing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                         <span className="text-slate-300 group-hover:text-white font-medium">
                            vs {comparisonFile.period}
                         </span>
                         {isComparing && <History className="w-3 h-3 text-slate-500" />}
                      </div>
                   ) : (
                      // CASE B: No Match (Show "Add" Button)
                      <button 
                         onClick={() => setIsMapperOpen(true)}
                         className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-slate-400 border border-dashed border-slate-700 rounded-full hover:text-white hover:border-blue-500 transition-all"
                      >
                         <GitMerge className="w-3.5 h-3.5" /> Compare
                      </button>
                   )}

                   {/* Mapper/Settings Button (Always Visible) */}
                   <button 
                      onClick={() => setIsMapperOpen(true)}
                      className={clsx(
                        "p-1.5 rounded-full transition-colors border",
                        comparisonFile ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white" : "bg-transparent border-transparent opacity-0 pointer-events-none" 
                      )}
                      title="Comparison Settings"
                   >
                      <GitMerge className="w-3.5 h-3.5" />
                   </button>
                </div>
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
              <div className="bg-slate-900/50 border-b border-slate-800 px-4 flex items-end justify-between pt-2 relative z-50">
                 
                 {/* 1. SCROLLABLE TABS (Wrapped so they scroll without clipping the dropdowns) */}
                 <div className="flex items-end gap-1 overflow-x-auto custom-scrollbar flex-1 mr-4">
                   {workbookData?.sheetNames.map(sheet => (
                     <button 
                       key={sheet} 
                       onClick={() => handleSheetSwitch(sheet)} 
                       className={clsx(
                         "px-5 py-2.5 rounded-t-lg text-sm font-medium transition-all relative whitespace-nowrap", // Added whitespace-nowrap
                         activeSheet === sheet ? "bg-slate-950 text-blue-400 border-t border-x border-slate-800 z-10" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                       )}
                     >
                       {sheet}
                       {activeSheet === sheet && <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>}
                     </button>
                   ))}
                 </div>

                 {/* 2. FIXED CONTROLS (No overflow clipping here!) */}
                 <div className="pb-2 flex gap-2 items-center flex-shrink-0">
                   
                   {/* COLUMN MANAGER BUTTON */}
                   <div className="relative inline-block">
                     <button 
                       onClick={() => setIsColManagerOpen(!isColManagerOpen)}
                       className={clsx("p-1.5 rounded transition-colors border mr-2", isColManagerOpen || hiddenColumns.length > 0 ? "bg-blue-600 border-blue-500 text-white" : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-white")}
                       title="Hide/Show Columns"
                     >
                       {hiddenColumns.length > 0 ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                     </button>
                     
                     {/* DROPDOWN MENU */}
                     {isColManagerOpen && (
                       <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] p-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Toggle Visibility</h4>
                          <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                            {sheetData[0]?.map((col, idx) => (
                              <button 
                                key={idx}
                                onClick={() => toggleColumnVisibility(col)}
                                className="w-full flex items-center justify-between text-left px-2 py-1.5 hover:bg-slate-800 rounded text-sm text-slate-300"
                              >
                                <span className="truncate w-40">{col || `Col ${idx+1}`}</span>
                                {hiddenColumns.includes(col) ? <Square className="w-4 h-4 text-slate-600" /> : <CheckSquare className="w-4 h-4 text-blue-500" />}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between">
                             <button onClick={() => setHiddenColumns([])} className="text-xs text-blue-400 hover:text-blue-300">Show All</button>
                             <button onClick={() => setIsColManagerOpen(false)} className="text-xs text-slate-500 hover:text-slate-300">Close</button>
                          </div>
                       </div>
                     )}
                   </div>

                   <button onClick={() => setShowRowNumbers(!showRowNumbers)} className={clsx("p-1.5 rounded transition-colors border", showRowNumbers ? "bg-purple-600 border-purple-500 text-white" : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-white")}><Ruler className="w-4 h-4"/></button>
                   <button onClick={handleFreeze} disabled={selectedColIndex === null} className={clsx("p-1.5 rounded transition-colors border flex items-center gap-1", frozenColCount > 0 ? "bg-blue-600 border-blue-500 text-white" : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-white", selectedColIndex === null && "opacity-50 cursor-not-allowed")}><Snowflake className="w-4 h-4"/>{selectedColIndex !== null && <span className="text-[10px] font-bold">{selectedColIndex + 1}</span>}</button>
                   <div className="w-px h-6 bg-slate-700 mx-1"></div>
                   <button onClick={() => setIsEditMode(!isEditMode)} className={clsx("flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors border", isEditMode ? "bg-amber-600 border-amber-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white")}>{isEditMode ? <><Save className="w-3 h-3"/></> : <><Edit3 className="w-3 h-3"/></>}</button>
                   <div className="w-px h-6 bg-slate-700 mx-1"></div>
                   <button onClick={() => setIsRuleModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"><Filter className="w-3 h-3" /> Add Rule</button>
                   
                   <div className="w-px h-6 bg-slate-700 mx-1"></div>
                   
                   {/* VIEW MODE TOGGLE */}
                   <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700">
                      <button 
                        onClick={() => setActiveTab('table')}
                        className={clsx(
                          "p-1.5 rounded transition-all", 
                          activeTab === 'table' 
                            ? "bg-slate-700 text-white shadow-sm ring-1 ring-white/10" 
                            : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                        )}
                        title="Table Data"
                      >
                        <Table className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setActiveTab('charts')}
                        className={clsx(
                          "p-1.5 rounded transition-all", 
                          activeTab === 'charts' 
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-900/50" 
                            : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                        )}
                        title="Visual Charts"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                   </div>
                 </div>

              </div>
            )}

            {/* CONTENT AREA (Table & Charts) */}
            <div className={clsx("flex-1 overflow-hidden relative transition-colors duration-700", isPresentationMode ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" : "bg-slate-950")}>
              
              {/* --- VIEW 1: DATA TABLE --- */}
              {activeTab === 'table' && (
                <div className={clsx("absolute left-0 right-0 bottom-0 overflow-auto custom-scrollbar", isPresentationMode ? "top-16" : "top-0")}> 
                  
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
                        viewMode === 'presentation' && isPresentationMode 
                          ? "w-[94%] mx-auto mt-4 mb-4 shadow-2xl rounded-xl border border-slate-700/50 overflow-x-auto custom-scrollbar bg-slate-900" 
                          : "min-w-full"
                      )}
                    >
                      <table className="table-fixed min-w-full text-left border-collapse relative">
                        
                        {/* HEADER */}
                        <thead className="text-slate-400 uppercase sticky top-0 z-50 shadow-xl">
                          <tr>
                            {showRowNumbers && <th className="px-4 py-4 border-b border-r border-slate-700 font-bold sticky left-0 z-[60] bg-slate-900 text-center" style={{ width: ROW_NUM_WIDTH }}>#</th>}
                            {processedSheetData[0]?.map((head, i) => {
                              if (hiddenColumns.includes(head)) return null;
                              const mergeProps = getMergeProps(0, i);
                              if (mergeProps?.isHidden) return null;

                              return (
                                <th 
                                  key={i} 
                                  onClick={(e) => {
                                      if(!e.target.closest('.col-menu-trigger')) setSelectedColIndex(selectedColIndex === i ? null : i)
                                  }}
                                  colSpan={mergeProps?.colSpan || 1}
                                  rowSpan={mergeProps?.rowSpan || 1}
                                  className={clsx(
                                    "border-b border-slate-700 font-semibold tracking-wider whitespace-nowrap cursor-pointer transition-colors relative group",
                                    selectedColIndex === i ? "text-blue-200 border-blue-500" : "hover:bg-slate-800",
                                    isPresentationMode ? "px-10 py-6 text-sm" : "px-6 py-4 text-xs",
                                    i < frozenColCount && "sticky z-[60] border-r border-slate-700"
                                  )}
                                  style={{ 
                                    width: (mergeProps?.colSpan || 1) * COLUMN_WIDTH, 
                                    backgroundColor: selectedColIndex === i ? '#172554' : BG_COLOR,
                                    ...(i < frozenColCount ? { left: getStickyLeft(i) } : {})
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{head || `Col ${i+1}`}</span>
                                    
                                    {/* SORT INDICATOR */}
                                    {sortConfig.key === i && (
                                       <span className="ml-1 text-blue-400">
                                          {sortConfig.direction === 'asc' ? <ArrowUpAZ className="w-3.5 h-3.5"/> : <ArrowDownZA className="w-3.5 h-3.5"/>}
                                       </span>
                                    )}

                                    {/* COLUMN MENU TRIGGER */}
                                    <button 
                                       className={clsx("col-menu-trigger p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-opacity", activeMenuCol === i ? "opacity-100 bg-slate-700 text-white" : "opacity-0 group-hover:opacity-100")}
                                       onClick={(e) => { e.stopPropagation(); setActiveMenuCol(activeMenuCol === i ? null : i); }}
                                    >
                                       <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* DROPDOWN MENU */}
                                  {activeMenuCol === i && (
                                     <div className="absolute top-full right-2 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-[70] py-1 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => handleSort(i, 'asc')} className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"><ArrowUpAZ className="w-3.5 h-3.5 text-slate-500"/> Sort A to Z</button>
                                        <button onClick={() => handleSort(i, 'desc')} className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"><ArrowDownZA className="w-3.5 h-3.5 text-slate-500"/> Sort Z to A</button>
                                        <div className="h-px bg-slate-800 my-1"></div>
                                        <button onClick={() => toggleCompactMode(i)} className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between">
                                           <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-500"/> Short Form (100K)</div>
                                           {compactColumns.includes(i) && <CheckSquare className="w-3.5 h-3.5 text-blue-500"/>}
                                        </button>
                                     </div>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>

                        {/* BODY */}
                        <tbody className="divide-y divide-slate-800/50 bg-slate-900 relative z-0">
                          {processedSheetData.slice(1).map((row, rowIndex) => {
                            const actualRowIndex = rowIndex + 1;
                            const rowObject = {};
                            processedSheetData[0].forEach((header, index) => { rowObject[header] = row[index]; });

                            let isRowDimmed = false;
                            if (viewMode === 'focus') {
                               const hasAlert = row.some((cell, i) => {
                                  const colName = processedSheetData[0][i];
                                  const { style } = getCellStyle(cell, colName, rowObject, selectedModel.id, activeSheet, manifest);
                                  return style?.backgroundColor && (style.backgroundColor.includes('239, 68, 68') || style.backgroundColor.includes('245, 158, 11'));
                               });
                               isRowDimmed = !hasAlert;
                            }

                            return (
                              <tr key={rowIndex} className={clsx("transition-all duration-500 group", isRowDimmed ? "opacity-20 grayscale hover:opacity-50" : "opacity-100 hover:bg-blue-900/10")}>
                                {showRowNumbers && <td className="px-2 py-3 border-r border-slate-700/50 sticky left-0 z-[30] text-center font-mono text-xs text-slate-500 bg-slate-900">{actualRowIndex}</td>}
                                
                                {row.map((cell, cellIndex) => {
                                  const columnName = processedSheetData[0][cellIndex];
                                  if (hiddenColumns.includes(columnName)) return null;
                                  const mergeProps = getMergeProps(actualRowIndex, cellIndex);
                                  if (mergeProps?.isHidden) return null;

                                  const { className, style } = getCellStyle(cell, columnName, rowObject, selectedModel.id, activeSheet, manifest);
                                  
                                  // --- APPLY FORMATTING ---
                                  const formattedValue = formatCellValue(cell, columnName, compactColumns.includes(cellIndex));

                                  return (
                                    <td 
                                      key={cellIndex} 
                                      colSpan={mergeProps?.colSpan || 1}
                                      rowSpan={mergeProps?.rowSpan || 1}
                                      // TOOLTIP: Show formatted value + History context
                                      title={
                                        typeof cell === 'number' 
                                          ? `${cell.toLocaleString('en-US')}${
                                              isComparing 
                                                ? (getTrendDelta(cell, row, cellIndex, comparisonData, processedSheetData[0], columnMapping)
                                                    ? ` (Prev: ${getTrendDelta(cell, row, cellIndex, comparisonData, processedSheetData[0], columnMapping).prev.toLocaleString('en-US')})` 
                                                    : '') 
                                                : ''
                                            }` 
                                          : cell
                                      }
                                      className={clsx(
                                        "border-r border-slate-800/30 last:border-r-0 text-slate-300 group-hover:text-white transition-colors relative",
                                        className,
                                        isPresentationMode ? "px-10 py-5 text-base" : "px-6 py-3 text-sm",
                                        mergeProps?.isStart ? "text-center align-middle" : "text-left align-top truncate",
                                        cellIndex < frozenColCount && "sticky z-30 border-r border-slate-700"
                                      )}
                                      style={{
                                        backgroundColor: cellIndex < frozenColCount ? BG_COLOR : undefined, 
                                        ...(cellIndex < frozenColCount ? { left: getStickyLeft(cellIndex) } : {}),
                                        ...style
                                      }}
                                    >
                                      {isEditMode ? (
                                        <input type="text" defaultValue={cell} className="bg-slate-800 border border-blue-500/50 text-white px-2 py-1 rounded w-full"/>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                           {/* The Main Value */}
                                           <span>{formattedValue}</span>
                                           
                                           {/* --- TREND INDICATOR (With Mapping) --- */}
                                           {isComparing && (
                                              (() => {
                                                const trend = getTrendDelta(cell, row, cellIndex, comparisonData, processedSheetData[0], columnMapping);
                                                if (!trend) return null;
                                                
                                                const isUp = trend.direction === 'up'; 
                                                
                                                return (
                                                   <span className={clsx("text-[10px] font-bold flex items-center ml-1", isUp ? "text-red-400" : "text-emerald-400")}>
                                                      {isUp ? '↑' : '↓'} 
                                                      {Math.abs(trend.delta).toLocaleString('en-US', { maximumFractionDigits: 1 })}
                                                   </span>
                                                )
                                              })()
                                           )}
                                        </div>
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
              )}

              {/* --- VIEW 2: CHART CANVAS --- */}
              {activeTab === 'charts' && (
                <div className="absolute inset-0 overflow-y-auto p-8 custom-scrollbar">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Visual Analysis</h2>
                      <p className="text-slate-400 text-sm">Dashboard for {activeSheet}</p>
                    </div>
                    
                    {/* HIDE BUTTON IN PRESENTATION MODE */}
                    {!isPresentationMode && (
                      <button 
                        onClick={() => setIsChartBuilderOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
                      >
                        <BarChart3 className="w-4 h-4" /> Create New Widget
                      </button>
                    )}
                  </div>

                  {/* Canvas Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {manifest?.visualizations?.[selectedModel.id]?.[activeSheet]?.map((chartConfig, idx) => (
                      <div key={idx} className="relative group">
                        <ChartRenderer 
                          config={chartConfig} 
                          data={sheetData.slice(1).map(row => {
                             const obj = {};
                             sheetData[0].forEach((key, i) => obj[key] = row[i]);
                             return obj;
                          })} 
                        />
                        
                        {/* DELETE BUTTON */}
                        {!isPresentationMode && (
                          <button 
                            onClick={() => setChartToDelete(idx)} // <--- UPDATED: Triggers Modal
                            className="absolute top-4 right-4 p-2 bg-slate-800/80 backdrop-blur text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-slate-700 shadow-sm"
                            title="Delete Widget"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Empty State */}
                    {(!manifest?.visualizations?.[selectedModel.id]?.[activeSheet] || manifest.visualizations[selectedModel.id][activeSheet].length === 0) && (
                      <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                        <BarChart3 className="w-12 h-12 text-slate-700 mb-4" />
                        <p className="text-slate-500 font-medium">No charts defined for this sheet yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
            
            {/* MODALS */}
            <RuleBuilder 
              isOpen={isRuleModalOpen}
              onClose={() => setIsRuleModalOpen(false)}
              columns={sheetData[0] || []}
              activeSheet={activeSheet}
              onSave={(newRule) => updateManifest(selectedModel.id, activeSheet, newRule)}
            />

            <ChartBuilder 
              isOpen={isChartBuilderOpen}
              onClose={() => setIsChartBuilderOpen(false)}
              columns={sheetData[0] || []}
              onSave={(config) => saveChart(selectedModel.id, activeSheet, config)}
            />
            
            {/* DELETE CONFIRMATION MODAL - CORRECTLY PLACED */}
            {chartToDelete !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-w-sm w-full transform transition-all scale-100">
                  <h3 className="text-lg font-bold text-white mb-2">Delete Widget?</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Are you sure you want to remove this chart? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setChartToDelete(null)}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        removeChart(selectedModel.id, activeSheet, chartToDelete);
                        setChartToDelete(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* COLUMN MAPPING & FILE SELECTION MODAL */}
            {isMapperOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                     
                     {/* Header */}
                     <div className="px-6 py-4 border-b border-slate-800 bg-slate-950">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <GitMerge className="w-5 h-5 text-purple-500" /> Comparison Setup
                           </h3>
                           <button onClick={() => setIsMapperOpen(false)} className="text-slate-500 hover:text-white">✕</button>
                        </div>

                        {/* FILE SELECTOR (The Fix) */}
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-4">
                           <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Compare {activeFile?.period} with:</label>
                              <select 
                                 className="w-full bg-slate-800 text-white text-sm border border-slate-700 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                                 onChange={(e) => {
                                    const file = selectedModel.files.find(f => f.originalName === e.target.value);
                                    if (file) {
                                       setComparisonFile(file);
                                       setIsComparing(true);
                                       // Load Data
                                       readExcelFile(file.handle).then(data => {
                                          setComparisonWorkbook(data); // Save Workbook
                                          
                                          // Default to matching sheet name or first sheet
                                          const sheetToLoad = data.sheetNames.includes(activeSheet) ? activeSheet : data.sheetNames[0];
                                          setComparisonSheet(sheetToLoad);

                                          const { data: rawData } = parseSheetData(data.workbook, sheetToLoad);
                                          setComparisonData(rawData);
                                       });
                                    }
                                 }}
                                 value={comparisonFile?.originalName || ""}
                              >
                                 <option value="">-- Select a File --</option>
                                 {selectedModel.files
                                    .filter(f => f.originalName !== activeFile?.originalName)
                                    .map(f => (
                                    <option key={f.originalName} value={f.originalName}>
                                       {f.period} ({f.originalName})
                                    </option>
                                 ))}
                              </select>
                           </div>
                           {comparisonFile && (
                              <div className="text-emerald-400 text-xs font-bold flex items-center gap-1 mt-4">
                                 <CheckSquare className="w-3 h-3"/> Linked
                              </div>
                           )}
                        </div>

                        {/* SHEET SELECTOR (The Fix) */}
                        {comparisonWorkbook && (
                           <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-4 mt-2">
                              <div className="flex-1">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                    Sheet in Previous File:
                                 </label>
                                 <select 
                                    className="w-full bg-slate-800 text-white text-sm border border-slate-700 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                                    value={comparisonSheet || ""}
                                    onChange={(e) => {
                                       const newSheet = e.target.value;
                                       setComparisonSheet(newSheet);
                                       // Parse the new sheet data
                                       const { data: rawData } = parseSheetData(comparisonWorkbook.workbook, newSheet);
                                       setComparisonData(rawData);
                                    }}
                                 >
                                    {comparisonWorkbook.sheetNames.map(sheet => (
                                       <option key={sheet} value={sheet}>{sheet}</option>
                                    ))}
                                 </select>
                              </div>
                              <div className="text-slate-500 text-xs italic mt-4">
                                 Matching against: <span className="text-blue-400 font-bold">{activeSheet}</span>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Body: Column Mapper (Only show if file selected) */}
                     {comparisonData ? (
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900">
                           <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                              <div>Current ({activeFile?.period})</div>
                              <div className="px-2"></div>
                              <div>Previous ({comparisonFile?.period})</div>
                           </div>

                           {sheetData[0]?.map((col, idx) => {
                              if (idx === 0) return null; 
                              
                              // Check if currently mapped
                              const isMapped = !!columnMapping[col];
                              
                              return (
                                 <div key={col} className={clsx("grid grid-cols-[auto_1fr_auto_1fr] gap-3 items-center mb-3 transition-opacity", isMapped ? "opacity-100" : "opacity-50 grayscale")}>
                                    
                                    {/* 1. SELECTION CHECKBOX */}
                                    <button 
                                       onClick={() => {
                                          if (isMapped) {
                                             // Disable: Remove from mapping
                                             const newMap = { ...columnMapping };
                                             delete newMap[col];
                                             setColumnMapping(newMap);
                                          } else {
                                             // Enable: Try to find match or default to empty string
                                             const match = comparisonData?.[0]?.find(c => c === col) || "";
                                             setColumnMapping(prev => ({ ...prev, [col]: match }));
                                          }
                                       }}
                                       className={clsx("w-5 h-5 rounded border flex items-center justify-center transition-colors", isMapped ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-transparent hover:border-slate-500")}
                                    >
                                       <CheckSquare className="w-3.5 h-3.5" />
                                    </button>

                                    {/* 2. Current Column Name */}
                                    <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 truncate font-medium" title={col}>
                                       {col}
                                    </div>

                                    {/* 3. Arrow Icon */}
                                    <ArrowRightLeft className="w-4 h-4 text-slate-600" />

                                    {/* 4. Target Column Dropdown */}
                                    <select 
                                       value={columnMapping[col] || ""}
                                       disabled={!isMapped}
                                       onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                                       className={clsx(
                                          "bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none w-full transition-all",
                                          !isMapped && "cursor-not-allowed opacity-50"
                                       )}
                                    >
                                       <option value="">(No Match / Skip)</option>
                                       {comparisonData?.[0]?.map(prevCol => (
                                          <option key={prevCol} value={prevCol}>{prevCol}</option>
                                       ))}
                                    </select>
                                 </div>
                              );
                           })}
                        </div>
                     ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                           <p>Please select a file above to begin comparison.</p>
                        </div>
                     )}

                     {/* Footer */}
                     <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                        <button onClick={() => setIsMapperOpen(false)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
                           Done
                        </button>
                     </div>
                  </div>
               </div>
            )}

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