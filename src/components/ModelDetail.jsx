import React, { useState, useEffect, useMemo, useRef } from "react";
import { useFileSystem } from "../context/FileSystemContext";
import { readExcelFile, parseSheetData } from "../utils/excelReader";
import { getCellStyle } from "../utils/logicEngine";
import RuleBuilder from "./RuleBuilder";
import ChartBuilder from "./ChartBuilder";
import ChartRenderer from "./ChartRenderer";
import { useAuth } from "../context/AuthContext"; // Add this import
import {
  ArrowLeft,
  Layers,
  Calendar,
  Search,
  Bell,
  UserCircle,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  X,
  Plus,
  Type,
  ZoomIn,
  ZoomOut,
  Minimize2,
  Edit3,
  Save,
  Snowflake,
  Ruler,
  // View Modes
  Layout,
  Maximize,
  Scan,
  // Column Manager
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  BarChart3,
  Table,
  Trash2,
  MoreVertical,
  ArrowUpAZ,
  ArrowDownZA,
  Hash,
  History,
  GitMerge,
  ArrowRightLeft,
  Move,
  GripHorizontal,
  FileSpreadsheet,
  PieChart,
  Palette,
  RotateCcw,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  User,
  Menu,
} from "lucide-react";
import clsx from "clsx";

// --- FIX: SHARED GRID CONSTANTS (Single Source of Truth) ---
const GRID_COLS = 12;
const ROW_HEIGHT = 60;
const GRID_MARGIN = 16;

// --- HELPER: FORMATTING ENGINE ---
const formatCellValue = (value, header, isCompactMode) => {
  if (value === null || value === undefined) return "";

  // 1. DETECT DATE (Excel Serial Numbers like 46023)
  // Added 'year' and 'mon' to catch headers like "YearMon", "Month", "Year", etc.
  const isDateHeader = /date|time|period|cat|year|mon/i.test(header);
  if (
    typeof value === "number" &&
    value > 35000 &&
    value < 60000 &&
    isDateHeader
  ) {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }); // "Jan 26"
  }

  // 2. HANDLE NUMBERS
  if (typeof value === "number") {
    // Check if header implies currency (Amount, Price, Cost, Value, etc.)
    const isCurrency = /amount|price|cost|value|eur|total/i.test(header);
    const currencyCode = "EUR"; // Default to Euro based on your screenshot

    // A. Compact Mode (e.g. €100K)
    if (isCompactMode) {
      return new Intl.NumberFormat("en-US", {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
        ...(isCurrency && { style: "currency", currency: currencyCode }), // Add Symbol
      }).format(value);
    }

    // B. Standard Mode (e.g. €100,000.00)
    if (isCurrency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(value);
    }

    // C. Generic Number (e.g. 100,000)
    const isID = /id|year|code/i.test(header);
    if (!isID) {
      return value.toLocaleString("en-US");
    }
  }

  return value;
};

// --- HELPER: CALCULATE TREND DELTA (SMART HEADER MATCH) ---
// --- HELPER: CALCULATE TREND DELTA (WITH MAPPING) ---
const getTrendDelta = (
  currentVal,
  currentRow,
  colIndex,
  comparisonData,
  currentHeaders,
  columnMapping,
) => {
  // 1. Safety Checks
  if (!comparisonData || !comparisonData.length) return null;
  if (!currentHeaders || !columnMapping) return null;
  if (colIndex === 0) return null;
  if (typeof currentVal !== "number") return null;

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
  const prevRow = comparisonData.find((r) => r[0] === rowKey);

  if (!prevRow) return null;

  // 5. Get Previous Value
  const prevVal = prevRow[prevColIndex];
  if (typeof prevVal !== "number") return null;

  // 6. Calculate Delta
  const delta = currentVal - prevVal;
  if (Math.abs(delta) < 0.0001) return null;

  return {
    delta: delta,
    prev: prevVal,
    direction: delta > 0 ? "up" : "down",
  };
};

// --- NEW: SNAP-TO-GRID WIDGET COMPONENT (WITH COLOR PICKER) ---
const DraggableWidget = ({
  children,
  layout,
  onLayoutChange,
  isEditing,
  onDelete,
  onEdit,
  containerWidth,
  onColorChange,
  activeColor,
  onResetZoom,
  isZoomed,
}) => {
  // Uses global GRID_COLS, GRID_MARGIN, ROW_HEIGHT now
  const colWidthPixel =
    (containerWidth - GRID_MARGIN * (GRID_COLS - 1)) / GRID_COLS;

  const [gridRect, setGridRect] = useState(
    layout || { x: 0, y: 0, w: 6, h: 6 },
  );
  const [pixelRect, setPixelRect] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPixelRef = useRef(null);

  // Aesthetic Color Themes
  const COLORS = [
    { name: "Blue", val: "#3b82f6" },
    { name: "Red", val: "#ef4444" },
    { name: "Green", val: "#10b981" },
    { name: "Orange", val: "#f59e0b" },
    { name: "Purple", val: "#8b5cf6" },
    { name: "Pink", val: "#ec4899" },
  ];

  const getPixelStyle = () => {
    if (pixelRect)
      return {
        left: pixelRect.x,
        top: pixelRect.y,
        width: pixelRect.w,
        height: pixelRect.h,
        zIndex: 50,
      };
    return {
      left: gridRect.x * (colWidthPixel + GRID_MARGIN),
      top: gridRect.y * (ROW_HEIGHT + GRID_MARGIN),
      width: gridRect.w * (colWidthPixel + GRID_MARGIN) - GRID_MARGIN,
      height: gridRect.h * (ROW_HEIGHT + GRID_MARGIN) - GRID_MARGIN,
      transition:
        isDragging || isResizing
          ? "none"
          : "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      zIndex: isDragging || isResizing ? 100 : showPalette ? 60 : 10, // Bring to front when dragging
    };
  };

  const snapToGrid = (pxRect) => {
    // Calculate grid position from pixel position
    const x = Math.max(0, Math.round(pxRect.x / (colWidthPixel + GRID_MARGIN)));
    const y = Math.max(0, Math.round(pxRect.y / (ROW_HEIGHT + GRID_MARGIN)));
    const w = Math.max(
      2,
      Math.round((pxRect.w + GRID_MARGIN) / (colWidthPixel + GRID_MARGIN)),
    );
    const h = Math.max(
      1,

      Math.round((pxRect.h + GRID_MARGIN) / (ROW_HEIGHT + GRID_MARGIN)),
    );

    return { x, y, w, h };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging && !isResizing) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (isDragging) {
        setPixelRect({
          x: initialPixelRef.current.x + dx,
          y: initialPixelRef.current.y + dy,
          w: initialPixelRef.current.w,
          h: initialPixelRef.current.h,
        });
      } else if (isResizing) {
        setPixelRect({
          x: initialPixelRef.current.x,
          y: initialPixelRef.current.y,
          w: Math.max(100, initialPixelRef.current.w + dx),
          h: Math.max(100, initialPixelRef.current.h + dy),
        });
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        const finalGrid = snapToGrid(pixelRect);

        // --- FIX: BETTER BOUNDS CHECKING ---
        // 1. Clamp X (Left Edge)
        if (finalGrid.x < 0) finalGrid.x = 0;

        // 2. Clamp Width (Right Edge)
        // Instead of moving X, we limit the Width so it fits within 12 columns
        if (finalGrid.x + finalGrid.w > GRID_COLS) {
          finalGrid.w = Math.max(2, GRID_COLS - finalGrid.x);
        }

        // 3. Clamp Y (Top Edge)
        if (finalGrid.y < 0) finalGrid.y = 0;

        setGridRect(finalGrid);
        setPixelRect(null);
        setIsDragging(false);
        setIsResizing(false);
        if (onLayoutChange) onLayoutChange(finalGrid);
      }
    };
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, pixelRect, colWidthPixel, onLayoutChange]);

  // Sync external layout changes - ONLY update when layout prop actually changes
  const layoutRef = useRef(layout);
  useEffect(() => {
    const layoutChanged =
      JSON.stringify(layoutRef.current) !== JSON.stringify(layout);
    if (!isDragging && !isResizing && layout && layoutChanged) {
      setGridRect(layout);
      layoutRef.current = layout;
    }
  }, [layout, isDragging, isResizing]);

  if (!containerWidth) return null;

  return (
    <div
      className={clsx(
        "absolute flex flex-col bg-slate-900 border rounded-xl shadow-2xl",
        isDragging
          ? "border-blue-500 shadow-blue-900/50 cursor-grabbing"
          : isResizing
            ? "border-blue-500 shadow-blue-900/50"
            : "border-slate-800 transition-all",
      )}
      style={getPixelStyle()}
    >
      {isEditing && (
        <div
          className="h-8 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing group"
          onMouseDown={(e) => {
            if (e.target.closest(".no-drag")) return; // Don't drag if clicking buttons
            e.preventDefault();
            setIsDragging(true);
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            const rect = e.currentTarget.parentElement.getBoundingClientRect();
            const parent =
              e.currentTarget.parentElement.parentElement.getBoundingClientRect();
            initialPixelRef.current = {
              x: rect.left - parent.left,
              y: rect.top - parent.top,
              w: rect.width,
              h: rect.height,
            };
            setPixelRect(initialPixelRef.current);
          }}
        >
          <Move className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />

          {/* Toolbar */}
          <div className="flex items-center gap-2 no-drag">
            {/* Reset Zoom Button */}
            {isZoomed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResetZoom();
                }}
                className="text-blue-400 hover:text-white p-1 rounded hover:bg-slate-700 mr-1 transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowPalette(!showPalette)}
                className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-700"
              >
                <Palette className="w-3 h-3" />
              </button>
              {showPalette && (
                <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 p-2 rounded-lg shadow-xl grid grid-cols-3 gap-2 z-50 w-24">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        onColorChange(c.val);
                        setShowPalette(false);
                      }}
                      className="w-5 h-5 rounded-full border border-white/10 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.val }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-slate-500 hover:text-blue-400 p-1 rounded hover:bg-slate-700 transition-colors"
                title="Edit Chart Configuration"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-700"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative p-1">{children}</div>

      {isEditing && (
        <div
          className="absolute bottom-1 right-1 cursor-nwse-resize text-slate-600 hover:text-blue-400 p-1 no-drag"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            const rect = e.currentTarget.parentElement.getBoundingClientRect();
            const parent =
              e.currentTarget.parentElement.parentElement.getBoundingClientRect();
            initialPixelRef.current = {
              x: rect.left - parent.left,
              y: rect.top - parent.top,
              w: rect.width,
              h: rect.height,
            };
            setPixelRect(initialPixelRef.current);
          }}
        >
          <GripHorizontal className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

const ModelDetail = () => {
  const {
    selectedModel,
    closeModel,
    manifest,
    saveSheetRules,
    saveChart,
    updateChart,
    removeChart,
  } = useFileSystem();

  const [editingChartIndex, setEditingChartIndex] = useState(null);
  const { user, logout, theme, setTheme } = useAuth();
  const canvasRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  // Data State
  const [activeFile, setActiveFile] = useState(null);
  const [workbookData, setWorkbookData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [sheetMerges, setSheetMerges] = useState([]);

  const [parsedData, setParsedData] = useState(null);

  // --- NEW: GLOBAL FILTER ENGINE ---
  const [globalFilters, setGlobalFilters] = useState([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // NEW: Advanced Filter Modal State
  const [filterModal, setFilterModal] = useState({
    isOpen: false,
    column: null,
    type: "string",
  });

  // --- HELPER: ROBUST TYPE DETECTION ---
  const getColumnType = (colName, data) => {
    if (!data || data.length < 2) return "string";
    const colIdx = data[0].indexOf(colName);
    if (colIdx === -1) return "string";

    // Heuristic: Check header for date keywords
    const isDateHeader = /date|time|period|year|mon/i.test(colName);

    // Scan up to 6 rows
    for (let i = 1; i < Math.min(data.length, 7); i++) {
      const val = data[i][colIdx];
      if (val !== null && val !== undefined && val !== "") {
        // Detect Excel Serial Date (e.g., 45321)
        if (typeof val === 'number' && val > 30000 && val < 60000 && isDateHeader) {
            return 'date';
        }
        if (!isNaN(Number(val)) && typeof val !== "boolean") return "numeric";
        if (!isNaN(Date.parse(val)) && String(val).includes("-")) return "date";
      }
    }
    return "string"; 
  };

  // Helper: Get Unique Values for a Column (for Dropdown)
  const getUniqueValues = (colName) => {
    if (!sheetData || sheetData.length < 2) return [];
    const colIdx = sheetData[0].indexOf(colName);
    if (colIdx === -1) return [];

    const values = new Set();
    sheetData.slice(1).forEach((row) => {
      if (row[colIdx]) values.add(String(row[colIdx]));
    });
    return Array.from(values).sort().slice(0, 50); // Limit to 50 for UI
  };

  // --- HELPER: ROBUST FILTER ENGINE ---
  const checkFilterCondition = (rowValue, operator, filterValue, type) => {
    const safeRowVal = rowValue === null || rowValue === undefined ? "" : rowValue;
    const safeFilterVal = filterValue === null || filterValue === undefined ? "" : String(filterValue).trim();

    // --- DATE HANDLING (Excel Serial & Standard) ---
    if (type === "date") {
        let rowDate = null;
        
        // A. Handle Excel Serial Number (e.g. 45321)
        if (typeof rowValue === 'number') {
            rowDate = new Date(Math.round((rowValue - 25569) * 86400 * 1000));
        } 
        // B. Handle Standard Date String
        else if (typeof rowValue === 'string') {
            rowDate = new Date(rowValue);
        }

        if (rowDate && !isNaN(rowDate.getTime())) {
            // 1. Text-based matching (e.g., User types "Jan 25")
            // We check against multiple formats to be friendly
            if (operator === 'contains' || operator === '==') {
                const dateStrShort = rowDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }); // "Jan 25"
                const dateStrFull = rowDate.toLocaleDateString("en-US"); // "1/31/2026"
                const dateStrISO = rowDate.toISOString().split('T')[0]; // "2026-01-31"
                
                const filterLower = safeFilterVal.toLowerCase();
                
                if (dateStrShort.toLowerCase().includes(filterLower)) return true;
                if (dateStrFull.toLowerCase().includes(filterLower)) return true;
                if (dateStrISO.includes(filterLower)) return true;
            }

            // 2. Logic-based comparison (>, <, >=)
            // Try parsing the user input as a date
            const filterDate = new Date(safeFilterVal);
            if (!isNaN(filterDate.getTime())) {
                // Normalize to midnight for accurate comparison
                const rTime = new Date(rowDate).setHours(0,0,0,0);
                const fTime = new Date(filterDate).setHours(0,0,0,0);

                switch (operator) {
                    case ">": return rTime > fTime;
                    case "<": return rTime < fTime;
                    case ">=": return rTime >= fTime;
                    case "<=": return rTime <= fTime;
                    case "==": return rTime === fTime;
                    case "!=": return rTime !== fTime;
                }
            }
        }
    }

    // --- NUMERIC HANDLING ---
    if (type === "numeric") {
      // Remove currency symbols/commas
      const cleanRowStr = String(safeRowVal).replace(/[€$£,]/g, "");
      const numRow = Number(cleanRowStr);
      const numFilter = Number(safeFilterVal);

      if (isNaN(numRow) || isNaN(numFilter)) return false;

      switch (operator) {
        case ">": return numRow > numFilter;
        case "<": return numRow < numFilter;
        case ">=": return numRow >= numFilter;
        case "<=": return numRow <= numFilter;
        case "==": return Math.abs(numRow - numFilter) < 0.001;
        case "!=": return Math.abs(numRow - numFilter) > 0.001;
        default: return true;
      }
    }

    // --- STRING HANDLING ---
    const strRow = String(safeRowVal).toLowerCase().trim();
    const strFilter = safeFilterVal.toLowerCase();

    switch (operator) {
      case "contains": return strRow.includes(strFilter);
      case "==": return strRow === strFilter;
      case "!=": return strRow !== strFilter;
      case "starts": return strRow.startsWith(strFilter);
      case "ends": return strRow.endsWith(strFilter);
      default: return true;
    }
  };

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

  // --- UI STATE (Moved Up to fix ReferenceError) ---
  const [activeTab, setActiveTab] = useState("table");
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false);
  const [chartToDelete, setChartToDelete] = useState(null);
  const [zoomStates, setZoomStates] = useState({}); // Stores zoom range per chart: { index: { left, right } }
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  // --- NEW: PROFILE DROPDOWN STATE ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- NEW: SYNC BROWSER FULLSCREEN WITH REACT STATE ---
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        // User pressed "Esc" or exited manually -> Exit Presentation Mode
        setIsPresentationMode(false);
        setIsSidebarCollapsed(false);
        setViewMode("compact");
      }
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  // Auto-expand the most recent year on load
  useEffect(() => {
    const years = Object.keys(filesByYear).sort().reverse();
    if (years.length > 0) {
      setExpandedGroups((prev) => ({ ...prev, [years[0]]: true }));
    }
  }, [selectedModel]);

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- HELPER: FIND PREVIOUS FILE (AUTO-DISCOVERY) ---
  // --- HELPER: AUTO-GENERATE COLUMN MAPPING ---
  useEffect(() => {
    if (!sheetData.length || !comparisonData || !comparisonData.length) return;

    const currentHeaders = sheetData[0];
    const prevHeaders = comparisonData[0];
    const newMap = {};

    currentHeaders.forEach((header) => {
      // 1. Try Exact Match
      if (prevHeaders.includes(header)) {
        newMap[header] = header;
      }
      // 2. Try Fuzzy Match (Optional: Remove case sensitivity)
      else {
        const lower = header.toLowerCase();
        const match = prevHeaders.find((ph) => ph.toLowerCase() === lower);
        if (match) newMap[header] = match;
      }
    });

    setColumnMapping(newMap);
  }, [sheetData, comparisonData]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setCanvasWidth(entry.contentRect.width);
      }
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [activeTab]); // Re-measure when switching tabs

  // VIEW STATE
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [viewMode, setViewMode] = useState("compact"); // 'compact' | 'presentation' | 'focus'
  const [zoomLevel, setZoomLevel] = useState(100);

  // FEATURE STATES
  const [isEditMode, setIsEditMode] = useState(false);
  const [showRowNumbers, setShowRowNumbers] = useState(false);
  const [frozenColCount, setFrozenColCount] = useState(0);
  const [selectedColIndex, setSelectedColIndex] = useState(null);

  // --- NEW: Sorting & Formatting State ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [compactColumns, setCompactColumns] = useState([]);
  const [activeMenuCol, setActiveMenuCol] = useState(null);


  // --- DERIVED DATA: FILTERED & SORTED SHEET ---
  const processedSheetData = useMemo(() => {
    if (!sheetData || sheetData.length === 0) return [];

    const headers = sheetData[0];
    let rows = sheetData.slice(1);

    // 1. APPLY GLOBAL FILTERS
    if (globalFilters.length > 0) {
      rows = rows.filter((row) => {
        return globalFilters.every((filter) => {
          const colIndex = headers.indexOf(filter.col);
          if (colIndex === -1) return true; // Ignore if column doesn't exist

          const cellValue = row[colIndex];
          // Use the shared logic engine
          return checkFilterCondition(
            cellValue,
            filter.operator,
            filter.val,
            filter.type
          );
        });
      });
    }

    // 2. APPLY SORTING
    if (sortConfig.key !== null) {
      rows.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return [headers, ...rows];
  }, [sheetData, sortConfig, globalFilters]); // <--- Added globalFilters to dependencies

  const toggleCompactMode = (colIndex) => {
    setCompactColumns((prev) =>
      prev.includes(colIndex)
        ? prev.filter((i) => i !== colIndex)
        : [...prev, colIndex],
    );
  };

  const handleSort = (colIndex, direction) => {
    setSortConfig({ key: colIndex, direction });
    setActiveMenuCol(null);
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuCol(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // --- ADD THESE MISSING LINES BELOW ---
  const [hiddenColumns, setHiddenColumns] = useState([]); // Needed to fix your error
  const [isColManagerOpen, setIsColManagerOpen] = useState(false); // Needed for the dropdown

  // Constants
  const DEFAULT_COLUMN_WIDTH = 192; // 12rem
  const ROW_NUM_WIDTH = 64;
  const BG_COLOR = "#0f172a"; // Slate 900 (Opaque)

  // Column Resize State
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingCol, setResizingCol] = useState(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

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

      const { data: rawData, merges } = parseSheetData(
        data.workbook,
        firstSheet,
      );
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

    const { data: rawData, merges } = parseSheetData(
      workbookData.workbook,
      sheetName,
    );
    setSheetData(rawData);
    setSheetMerges(merges);
    setFrozenColCount(0);
  };

  const navigateSheet = (direction) => {
    if (!workbookData || !activeSheet) return;
    const currentIndex = workbookData.sheetNames.indexOf(activeSheet);
    let newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < workbookData.sheetNames.length) {
      handleSheetSwitch(workbookData.sheetNames[newIndex]);
    }
  };

  const togglePresentation = () => {
    if (!isPresentationMode) {
      setIsPresentationMode(true);
      setIsSidebarCollapsed(true);
      setViewMode("presentation");
      setZoomLevel(100);
    } else {
      setIsPresentationMode(false);
      setIsSidebarCollapsed(false);
      setViewMode("compact");
      setZoomLevel(100);
    }
  };

  const handleCellEdit = (rowIndex, cellIndex, newValue) => {
    const updatedData = [...sheetData];
    const actualRowIndex = rowIndex + 1;
    updatedData[actualRowIndex][cellIndex] = newValue;
    setSheetData(updatedData);
  };

  // Column Resize Handlers
  const handleResizeStart = (e, colIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(colIndex);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = getColumnWidth(colIndex);
  };

  useEffect(() => {
    if (resizingCol === null) return;

    const handleMouseMove = (e) => {
      const diff = e.clientX - resizeStartX.current;
      const newWidth = Math.max(80, resizeStartWidth.current + diff); // Min width 80px
      setColumnWidths((prev) => ({ ...prev, [resizingCol]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingCol]);

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
    setHiddenColumns((prev) => {
      if (prev.includes(colName)) {
        return prev.filter((c) => c !== colName); // Unhide
      } else {
        return [...prev, colName]; // Hide
      }
    });
  };

  const getColumnWidth = (index) => {
    return columnWidths[index] || DEFAULT_COLUMN_WIDTH;
  };

  const getStickyLeft = (index) => {
    let left = 0;
    if (showRowNumbers) left += ROW_NUM_WIDTH;

    // Only add widths of visible columns before this index
    const headers = sheetData[0] || [];
    for (let i = 0; i < index; i++) {
      // Skip hidden columns in the calculation
      if (!hiddenColumns.includes(headers[i])) {
        left += getColumnWidth(i);
      }
    }
    return left;
  };

  const getMergeProps = (rowIndex, colIndex) => {
    if (!sheetMerges || sheetMerges.length === 0) return null;

    for (const merge of sheetMerges) {
      if (merge.s.r === rowIndex && merge.s.c === colIndex) {
        return {
          rowSpan: merge.e.r - merge.s.r + 1,
          colSpan: merge.e.c - merge.s.c + 1,
          isStart: true,
        };
      }
      if (
        rowIndex >= merge.s.r &&
        rowIndex <= merge.e.r &&
        colIndex >= merge.s.c &&
        colIndex <= merge.e.c
      ) {
        return { isHidden: true };
      }
    }
    return null;
  };

  // --- NEW: DYNAMIC HEIGHT CALCULATION ---
  const currentCharts =
    manifest?.visualizations?.[selectedModel?.id]?.[activeSheet] || [];

  // Find the lowest widget (Y position + Height)
  // Find the lowest widget (Y position + Height)
  const bottomMostRow = currentCharts.reduce((max, chart, idx) => {
    // FIX: Use the same default layout logic as the render loop
    // This ensures new charts (without saved layout) are counted in height
    const defaultLayout = {
      y: Math.floor(idx / 2) * 7, // Matches your loop's default row spacing
      h: 6,
    };
    const layout = chart.layout || defaultLayout;
    return Math.max(max, layout.y + layout.h);
  }, 0);

  // --- DYNAMIC HEIGHT (Using Shared Constants) ---
  const contentHeight = bottomMostRow * (ROW_HEIGHT + GRID_MARGIN);

  // Buffer Logic:
  // - If empty: 0 buffer (Compact view)
  // - If content exists: +800px (Allows dragging down to create space)
  const dragBuffer = currentCharts.length > 0 ? 800 : 0;

  // Minimum 600px ensures the screen isn't "broken" when empty
  const dynamicHeight = Math.max(600, contentHeight + dragBuffer);

  return (
    <div className="h-screen w-full flex bg-slate-950 text-white overflow-hidden font-sans relative selection:bg-blue-500/30">
      {/* 1. CINEMATIC SIDEBAR (Parallax Slide Animation) */}
      <div
        // FIX: Added 'overflow-hidden' to mask the fixed-width inner content when collapsed
        className="relative flex-shrink-0 z-40 h-full transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden"
        style={{ width: isSidebarCollapsed ? 0 : 320 }}
      >
        <div className="absolute inset-0 bg-[#0b1121] border-r border-slate-800 flex flex-col overflow-hidden w-[320px]">
          {/* Brand Header */}
          <div className="h-20 flex items-center px-6 border-b border-slate-800/50 bg-[#0b1121] whitespace-nowrap shrink-0 relative">
            <div
              className={clsx(
                "flex items-center gap-3 transition-opacity duration-300",
                isSidebarCollapsed ? "opacity-0" : "opacity-100",
              )}
            >
              <img
                src="/barclays_logo.png"
                alt="Barclays"
                className="h-9 w-auto object-contain brightness-110"
              />
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-xl text-white leading-none">
                  BARCLAYS
                </span>
                <span className="text-[9px] font-bold text-blue-500 tracking-[0.2em] uppercase mt-1">
                  Fraud Analytics
                </span>
              </div>
            </div>

            {/* Collapse Icon (Hidden inside header) */}
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="absolute right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation & Info */}
          <div
            className={clsx(
              "p-5 space-y-4 shrink-0 transition-all duration-500 delay-75",
              isSidebarCollapsed
                ? "opacity-0 -translate-x-4"
                : "opacity-100 translate-x-0",
            )}
          >
            <button
              onClick={closeModel}
              className="group w-full flex items-center gap-3 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 px-4 py-3 rounded-xl transition-all text-sm font-medium border border-slate-700/50 hover:border-slate-600 hover:shadow-lg shadow-black/20"
            >
              <div className="bg-slate-700 p-1.5 rounded-lg group-hover:bg-blue-600 transition-colors shadow-inner">
                <ArrowLeft className="w-4 h-4 text-white" />
              </div>
              Return to Grid
            </button>

            <div className="px-1">
              <h2 className="text-xl font-bold text-white leading-tight tracking-tight">
                {selectedModel.name.replace(/_/g, " ")}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-semibold">
                  ID: {selectedModel.id}
                </span>
              </div>
            </div>
          </div>

          {/* File List (Scrollable Area) */}
          <div
            className={clsx(
              "flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar transition-all duration-500 delay-100",
              isSidebarCollapsed ? "opacity-0" : "opacity-100",
            )}
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2 mt-2 flex items-center gap-2">
              <History className="w-3 h-3" /> Historical Data
            </div>

            {/* --- EXISTING FILE LIST LOGIC PRESERVED --- */}
            {Object.keys(filesByYear)
              .sort()
              .reverse()
              .map((year) => {
                // 1. Group files by Quarter (Q1-Q4) and Special (Q5/Q6/Agg)
                const groups = { Specials: [], Q4: [], Q3: [], Q2: [], Q1: [] };

                filesByYear[year].forEach((file) => {
                  const p = file.period;
                  // Detect "Special" quarters (Q5, Q6, etc.) or Aggregates
                  if (/Q[5-9]/i.test(p) || /Agg/i.test(p) || /Year/i.test(p)) {
                    groups.Specials.push(file);
                  } else if (p.includes("Q4") || /Oct|Nov|Dec/i.test(p))
                    groups.Q4.push(file);
                  else if (p.includes("Q3") || /Jul|Aug|Sep/i.test(p))
                    groups.Q3.push(file);
                  else if (p.includes("Q2") || /Apr|May|Jun/i.test(p))
                    groups.Q2.push(file);
                  else groups.Q1.push(file); // Default to Q1 for Jan/Feb/Mar or catch-all
                });

                // Define display order and labels
                const displayGroups = [
                  {
                    key: "Specials",
                    label: "Summary & Reports",
                    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
                  },
                  {
                    key: "Q4",
                    label: "Q4 (Oct - Dec)",
                    icon: (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    ),
                  },
                  {
                    key: "Q3",
                    label: "Q3 (Jul - Sep)",
                    icon: (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    ),
                  },
                  {
                    key: "Q2",
                    label: "Q2 (Apr - Jun)",
                    icon: (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ),
                  },
                  {
                    key: "Q1",
                    label: "Q1 (Jan - Mar)",
                    icon: (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    ),
                  },
                ].filter((g) => groups[g.key].length > 0);

                return (
                  <div key={year} className="mb-3">
                    {/* LEVEL 1: YEAR TOGGLE */}
                    <button
                      onClick={() => toggleGroup(year)}
                      className="w-full flex items-center justify-between px-3 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all group border border-transparent hover:border-slate-700"
                    >
                      <span className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        {year}
                      </span>
                      <ChevronRight
                        className={clsx(
                          "w-4 h-4 transition-transform duration-300",
                          expandedGroups[year]
                            ? "rotate-90 text-white"
                            : "text-slate-600",
                        )}
                      />
                    </button>

                    {/* LEVEL 2: QUARTER LIST (Animated) */}
                    <div
                      className={clsx(
                        "overflow-hidden transition-all duration-500 ease-in-out",
                        expandedGroups[year]
                          ? "max-h-[1200px] opacity-100"
                          : "max-h-0 opacity-0",
                      )}
                    >
                      <div className="pt-1 pb-2 pl-3 space-y-1 relative">
                        {/* Vertical connector line */}
                        <div className="absolute left-[22px] top-0 bottom-4 w-px bg-slate-800"></div>

                        {displayGroups.map((group) => {
                          const groupKey = `${year}-${group.key}`; // Unique ID for state
                          const isGroupExpanded = expandedGroups[groupKey];

                          return (
                            <div key={groupKey} className="relative pl-6 pt-1">
                              {/* Horizontal connector */}
                              <div className="absolute left-0 top-[18px] w-4 h-px bg-slate-800"></div>

                              {/* QUARTER TOGGLE */}
                              <button
                                onClick={() => toggleGroup(groupKey)}
                                className={clsx(
                                  "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors border select-none",
                                  isGroupExpanded
                                    ? "bg-slate-800/80 text-white border-slate-700"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/30 border-transparent",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {group.icon}
                                  {group.label}
                                </div>
                                <ChevronRight
                                  className={clsx(
                                    "w-3 h-3 transition-transform",
                                    isGroupExpanded ? "rotate-90" : "",
                                  )}
                                />
                              </button>

                              {/* LEVEL 3: FILES (Animated) */}
                              <div
                                className={clsx(
                                  "overflow-hidden transition-all duration-300",
                                  isGroupExpanded
                                    ? "max-h-[500px] opacity-100 mt-1"
                                    : "max-h-0 opacity-0",
                                )}
                              >
                                <div className="pl-2 space-y-1 border-l border-slate-800/50 ml-3 my-1">
                                  {groups[group.key].map((file) => (
                                    <button
                                      key={file.originalName}
                                      onClick={() => handleFileClick(file)}
                                      className={clsx(
                                        "w-full text-left pl-4 pr-3 py-2 rounded-md text-xs flex items-center justify-between group transition-all relative overflow-hidden",
                                        activeFile?.originalName ===
                                          file.originalName
                                          ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-900/20"
                                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                                      )}
                                    >
                                      <span className="relative z-10">
                                        {file.period.replace(/\d{4}/, "")}
                                      </span>
                                      {/* Frequency Badge */}
                                      {(file.frequency === "Quarterly" ||
                                        group.key === "Specials") && (
                                        <span
                                          className={clsx(
                                            "text-[9px] px-1.5 rounded uppercase font-bold",
                                            activeFile?.originalName ===
                                              file.originalName
                                              ? "bg-white/20 text-white"
                                              : "bg-slate-900 text-slate-500",
                                          )}
                                        >
                                          AGG
                                        </span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Sidebar Footer - Sign Out */}
          <div
            className={clsx(
              "p-4 border-t border-slate-800 bg-[#0b1121] transition-all duration-500",
              isSidebarCollapsed ? "opacity-0" : "opacity-100",
            )}
          >
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-4 py-3 rounded-xl transition-all text-sm font-bold group"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE NEW "GHOST" TRIGGER (Refined) */}
      {/* FIX: Changed top-0 to top-16 to avoid blocking header. Changed z-[100] to z-[50] to stay below Nav (z-70). */}
      {!isPresentationMode && isSidebarCollapsed && (
        <div
          className="absolute left-0 top-16 bottom-0 w-2 hover:w-6 z-[50] group flex items-center justify-center cursor-pointer hover:bg-blue-500/10 transition-all duration-300 delay-100"
          onClick={() => setIsSidebarCollapsed(false)}
          title="Click to Expand"
        >
          {/* The Glowing Line */}
          <div className="h-16 w-0.5 rounded-full bg-slate-600/50 group-hover:bg-blue-500 group-hover:h-24 group-hover:w-1 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-300"></div>
        </div>
      )}

      {/* COLLAPSE TRIGGER */}
      {!isPresentationMode && (
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-blue-600 p-1 rounded-r-lg shadow-lg transition-all"
          style={{ left: isSidebarCollapsed ? "0px" : "288px" }}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full relative bg-slate-950 transition-all duration-500">
        {/* PRESENTATION HEADER */}
        {isPresentationMode && (
          // FIX: Increased z-index to 70 to sit ABOVE the filter toolbar (z-65)
          <div className="absolute top-0 left-0 w-full h-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 z-[70] flex items-center justify-between px-8 shadow-2xl">
            {/* Left: Title Info */}
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-blue-400">
                  {selectedModel.name.replace(/_/g, " ")}
                </span>
                <span className="text-slate-600 text-xl">/</span>
                <span className="text-lg font-mono text-slate-300">
                  {activeFile?.period}
                </span>
              </div>
              <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-bold uppercase tracking-widest text-emerald-400 shadow-inner">
                {activeSheet}
              </div>
            </div>

            {/* Center: Controls Group */}
            <div className="flex items-center gap-4">
              {/* 1. Sheet Navigation */}
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <button
                  onClick={() => navigateSheet("prev")}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateSheet("next")}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 1.5 Data/Visual Toggle (NEW) */}
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab("table")}
                  className={clsx(
                    "px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all",
                    activeTab === "table"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Data
                </button>
                <button
                  onClick={() => setActiveTab("charts")}
                  className={clsx(
                    "px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all",
                    activeTab === "charts"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  <PieChart className="w-3.5 h-3.5" /> Visuals
                </button>
              </div>

              {/* 2. View Switcher (Existing) */}
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <button
                  onClick={() => setViewMode("compact")}
                  className={clsx(
                    "px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all",
                    viewMode === "compact"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  <Maximize className="w-3 h-3" /> Full
                </button>
                <button
                  onClick={() => setViewMode("presentation")}
                  className={clsx(
                    "px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all",
                    viewMode === "presentation"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  <Layout className="w-3 h-3" /> Present
                </button>
                <button
                  onClick={() => setViewMode("focus")}
                  className={clsx(
                    "px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all",
                    viewMode === "focus"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  <Scan className="w-3 h-3" /> Focus
                </button>
              </div>

              {/* 3. Zoom Controls */}
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400 flex items-center px-2">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Exit */}
            <button
              onClick={() => {
                togglePresentation();
                // Exit Native Browser Fullscreen
                if (document.fullscreenElement)
                  document.exitFullscreen().catch((e) => console.log(e));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
            >
              <Minimize2 className="w-4 h-4" /> Exit
            </button>
          </div>
        )}

        {/* STANDARD NAV */}
        {!isPresentationMode && (
          <div className="h-16 bg-[#0b1121] border-b border-slate-800 flex items-center justify-between px-6 z-[70] transition-all duration-500">
            <div className="flex items-center gap-4">
              {/* NEW: Sidebar Toggle Button (Visible only when collapsed) */}
              <div
                className={clsx(
                  "transition-all duration-500 ease-out overflow-hidden flex items-center",
                  isSidebarCollapsed
                    ? "w-10 opacity-100 mr-2"
                    : "w-0 opacity-0",
                )}
              >
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Expand Sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Fraud Analytics</span>
                <span className="text-slate-600">/</span>
                <span className="text-white font-medium">
                  {selectedModel.name}
                </span>
                {activeFile && (
                  <>
                    <span className="text-slate-600">/</span>
                    <span className="text-blue-400">{activeFile.period}</span>
                  </>
                )}
              </div>

              {/* --- COMPARISON CONTROLS (Auto or Manual) --- */}
              <div className="flex items-center gap-2">
                {comparisonFile ? (
                  // CASE A: File Found (Show Badge)
                  <div
                    onClick={() => setIsComparing(!isComparing)}
                    className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-xs transition-all hover:border-blue-500 cursor-pointer group select-none"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${isComparing ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}
                    ></div>
                    <span className="text-slate-300 group-hover:text-white font-medium">
                      vs {comparisonFile.period}
                    </span>
                    {isComparing && (
                      <History className="w-3 h-3 text-slate-500" />
                    )}
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
                    comparisonFile
                      ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                      : "bg-transparent border-transparent opacity-0 pointer-events-none",
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
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-slate-800 border border-slate-700 text-sm rounded-full pl-9 pr-4 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500 w-48"
                />
              </div>
              <div className="h-8 w-px bg-slate-800 mx-2"></div>
              <button
                onClick={() => {
                  togglePresentation();
                  // Trigger Native Browser Fullscreen
                  document.documentElement
                    .requestFullscreen()
                    .catch((e) => console.log(e));
                }}
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Enter Full Screen"
              >
                <MonitorPlay className="w-5 h-5" />
              </button>

              <Bell className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
              {/* --- USER PROFILE DROPDOWN (CLICK ACTIVATED) --- */}
              <div className="relative ml-2" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={clsx(
                    "flex items-center gap-3 pl-3 pr-1 py-1 rounded-full transition-all border",
                    isProfileOpen
                      ? "bg-slate-800 border-slate-700"
                      : "hover:bg-slate-800/50 border-transparent hover:border-slate-700/50",
                  )}
                >
                  <div className="text-right hidden lg:block mr-2">
                    <div className="text-sm font-bold text-white leading-tight tracking-tight">
                      {user?.name || "Admin User"}
                    </div>
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-tight mt-0.5">
                      {user?.department || "Analytics"}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-white dark:ring-slate-900 relative">
                    {user?.name ? user.name.charAt(0) : "A"}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                  </div>

                  <ChevronDown
                    className={clsx(
                      "w-3 h-3 text-slate-500 transition-transform duration-200",
                      isProfileOpen ? "rotate-180 text-white" : "",
                    )}
                  />
                </button>

                {/* DROPDOWN MENU (Fixed: Dark Aesthetic) */}
                {isProfileOpen && (
                  <div className="absolute top-full right-0 mt-3 w-72 bg-[#0b1121] border border-slate-700 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 z-[100] ring-1 ring-white/10">
                    {/* User Header */}
                    <div className="px-4 py-4 mb-2 bg-slate-800/30 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                          <span className="font-bold text-sm">
                            {user?.name ? user.name.charAt(0) : "A"}
                          </span>
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-sm font-bold text-white truncate">
                            {user?.name || "Guest"}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate uppercase tracking-wider font-medium">
                            {user?.barclaysId || "No ID"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Settings */}
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all group">
                      <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-blue-600/20 text-slate-400 group-hover:text-blue-400 transition-colors">
                        <UserCircle className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Account Settings</span>
                    </button>

                    <div className="h-px bg-slate-800 my-2 mx-2"></div>

                    {/* Logout */}
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-red-500/20 text-red-400 transition-colors">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="font-bold">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE */}
        {activeFile ? (
          <>
            {/* Toolbar */}
            {/* --- PREMIUM DASHBOARD HEADER & FILTER BAR --- */}
            {/* FIX: Completely hide in Presentation Mode to remove gap/bar */}
            {!isPresentationMode && (
              <div className="flex flex-col relative z-[65]">
                {/* 1. SHEET TABS (Visible only in Edit Mode & Data View) */}
                {activeTab === "table" && (
                  <div className="flex items-end px-4 gap-1 overflow-x-auto custom-scrollbar">
                    {workbookData?.sheetNames.map((sheet) => (
                      <button
                        key={sheet}
                        onClick={() => handleSheetSwitch(sheet)}
                        className={clsx(
                          "px-5 py-2.5 rounded-t-lg text-sm font-medium transition-all relative whitespace-nowrap",
                          activeSheet === sheet
                            ? "bg-slate-950 text-blue-400 border-t border-x border-slate-800 z-10"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-900",
                        )}
                      >
                        {sheet}
                        {activeSheet === sheet && (
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. CONTROL BAR (Tools & Filters) */}
                <div className="px-4 py-1 flex items-center justify-between gap-4">
                  {/* LEFT: CONTROLS */}
                  <div className="flex items-center gap-2 text-slate-400">
                    {/* A. View Toggles */}
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                      <button
                        onClick={() => setActiveTab("table")}
                        className={clsx(
                          "p-1.5 rounded transition-all",
                          activeTab === "table"
                            ? "bg-slate-700 text-white shadow-sm ring-1 ring-white/10"
                            : "text-slate-400 hover:text-white",
                        )}
                        title="Data Table"
                      >
                        <Table className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveTab("charts")}
                        className={clsx(
                          "p-1.5 rounded transition-all",
                          activeTab === "charts"
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-900/50"
                            : "text-slate-400 hover:text-white",
                        )}
                        title="Visual Charts"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* B. TABLE SPECIFIC TOOLS */}
                    {activeTab === "table" && (
                      <div className="flex items-center gap-2 animate-in fade-in">
                        <button
                          onClick={() => setIsMapperOpen(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg border border-slate-700 transition-all"
                        >
                          <GitMerge className="w-3.5 h-3.5 text-blue-400" /> Map
                          Columns
                        </button>

                        <button
                          onClick={() => setIsRuleModalOpen(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg border border-slate-700 transition-all"
                        >
                          <Filter className="w-3.5 h-3.5 text-cyan-400" /> Add
                          Rule
                        </button>

                        {/* Grid Controls */}
                        <div className="flex bg-slate-800 rounded-lg border border-slate-700 ml-2 relative">
                          <button
                            onClick={handleFreeze}
                            disabled={selectedColIndex === null}
                            className={clsx(
                              "p-1.5 rounded hover:text-white flex items-center gap-1",
                              frozenColCount > 0 ? "text-blue-400" : "",
                              selectedColIndex === null &&
                                "opacity-50 cursor-not-allowed",
                            )}
                            title="Freeze Column"
                          >
                            <Snowflake className="w-4 h-4" />
                            {selectedColIndex !== null && (
                              <span className="text-[10px] font-bold">
                                {selectedColIndex + 1}
                              </span>
                            )}
                          </button>

                          {/* Column Manager */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsColManagerOpen(!isColManagerOpen);
                              }}
                              className={clsx(
                                "p-1.5 rounded hover:text-white transition-colors",
                                hiddenColumns.length > 0
                                  ? "text-amber-500 bg-amber-500/10"
                                  : "text-slate-400",
                              )}
                              title="Hide/Show Columns"
                            >
                              {hiddenColumns.length > 0 ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>

                            {/* DROPDOWN MENU */}
                            {isColManagerOpen && (
                              <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[150] p-4 text-left">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex justify-between items-center">
                                  <span>Toggle Visibility</span>
                                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                                    {hiddenColumns.length} Hidden
                                  </span>
                                </h4>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                                  {sheetData[0]?.map((col, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() =>
                                        toggleColumnVisibility(col)
                                      }
                                      className="w-full flex items-center justify-between text-left px-2 py-1.5 hover:bg-slate-800 rounded text-xs text-slate-300 transition-colors"
                                    >
                                      <span
                                        className={clsx(
                                          "truncate w-40",
                                          hiddenColumns.includes(col) &&
                                            "opacity-50 line-through",
                                        )}
                                      >
                                        {col || `Col ${idx + 1}`}
                                      </span>
                                      {hiddenColumns.includes(col) ? (
                                        <Square className="w-3.5 h-3.5 text-slate-600" />
                                      ) : (
                                        <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between">
                                  <button
                                    onClick={() => setHiddenColumns([])}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                  >
                                    Show All
                                  </button>
                                  <button
                                    onClick={() => setIsColManagerOpen(false)}
                                    className="text-xs text-slate-500 hover:text-slate-300"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: GLOBAL FILTERS (Visible only in Edit Mode per request) */}
                  <div className="flex items-center gap-2 animate-in fade-in">
                    {/* Active Filter Pills */}
                    {globalFilters.map((filter, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-500/30 rounded-full text-xs font-bold text-blue-200 animate-in fade-in slide-in-from-top-2"
                      >
                        <span className="opacity-50 uppercase text-[9px] tracking-wider">
                          {filter.operator === "==" ? ":" : filter.operator}
                        </span>
                        <span>
                          {filter.col}{" "}
                          <span className="text-white">{filter.val}</span>
                        </span>
                        <button
                          onClick={() =>
                            setGlobalFilters((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add Filter Button */}
                    <div className="relative">
                      <button
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-xs font-bold text-white rounded-full border border-slate-600 transition-all hover:border-blue-500 shadow-sm"
                      >
                        <Filter className="w-3.5 h-3.5" /> Filter{" "}
                        <Plus className="w-3 h-3 opacity-50" />
                      </button>

                      {/* Column Selection Dropdown */}
                      {isFilterMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-[100] animate-in zoom-in-95 text-left">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
                            Select Column
                          </div>
                          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                            {sheetData?.[0]?.map((col) => {
                              const type = getColumnType(col, sheetData);
                              return (
                                <button
                                  key={col}
                                  onClick={() => {
                                    setFilterModal({
                                      isOpen: true,
                                      column: col,
                                      type,
                                    });
                                    setIsFilterMenuOpen(false);
                                  }}
                                  className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                                >
                                  <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-500">
                                    {type === "numeric" && (
                                      <Hash className="w-3 h-3" />
                                    )}
                                    {type === "date" && (
                                      <Calendar className="w-3 h-3" />
                                    )}
                                    {type === "string" && (
                                      <Type className="w-3 h-3" />
                                    )}
                                  </div>
                                  {col}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- NEW: FILTER CONFIG MODAL (Replaces Prompt) --- */}
            {filterModal.isOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden scale-100">
                  <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-500" /> Filter:{" "}
                      {filterModal.column}
                    </h3>
                    <button
                      onClick={() =>
                        setFilterModal({ ...filterModal, isOpen: false })
                      }
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const operator = formData.get("operator");
                        const value = formData.get("value");

                        if (value) {
                          setGlobalFilters((prev) => [
                            ...prev,
                            {
                              col: filterModal.column,
                              val: value,
                              operator,
                              type: filterModal.type,
                            },
                          ]);
                          setFilterModal({ ...filterModal, isOpen: false });
                        }
                      }}
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">
                            Condition
                          </label>
                          <select
                            name="operator"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                          >
                            {filterModal.type === "numeric" ||
                            filterModal.type === "date" ? (
                              <>
                                <option value=">">Greater than (&gt;)</option>
                                <option value="<">Less than (&lt;)</option>
                                <option value=">=">
                                  Greater or equal (&gt;=)
                                </option>
                                <option value="<=">
                                  Less or equal (&lt;=)
                                </option>
                                <option value="==">Equals (=)</option>
                              </>
                            ) : (
                              <>
                                <option value="contains">Contains</option>
                                <option value="==">Exact Match</option>
                                <option value="starts">Starts With</option>
                                <option value="!=">Does Not Equal</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">
                            Value
                          </label>
                          <input
                            name="value"
                            autoFocus
                            type={
                              filterModal.type === "numeric" ? "number" : "text"
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                            placeholder="Enter value..."
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setFilterModal({ ...filterModal, isOpen: false })
                          }
                          className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Apply Filter
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT AREA (Table & Charts) */}
            <div
              className={clsx(
                "flex-1 overflow-hidden relative transition-colors duration-700",
                isPresentationMode
                  ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"
                  : "bg-slate-950",
              )}
            >
              {/* --- VIEW 1: DATA TABLE --- */}
              {activeTab === "table" && (
                <div
                  className={clsx(
                    "absolute left-0 right-0 bottom-0 overflow-auto custom-scrollbar",
                    isPresentationMode ? "top-16" : "top-0",
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
                        viewMode === "presentation" && isPresentationMode
                          ? "w-[94%] mx-auto mt-4 mb-4 shadow-2xl rounded-xl border border-slate-700/50 overflow-x-auto custom-scrollbar bg-slate-900"
                          : "min-w-full",
                      )}
                    >
                      <table className="table-fixed min-w-full text-left border-collapse relative">
                        {/* HEADER */}
                        <thead className="text-slate-400 uppercase sticky top-0 z-50 shadow-xl">
                          <tr>
                            {showRowNumbers && (
                              <th
                                className="px-4 py-4 border-b border-r border-slate-700 font-bold sticky left-0 z-[60] bg-slate-900 text-center"
                                style={{ width: ROW_NUM_WIDTH }}
                              >
                                #
                              </th>
                            )}
                            {processedSheetData[0]?.map((head, i) => {
                              if (hiddenColumns.includes(head)) return null;
                              const mergeProps = getMergeProps(0, i);
                              if (mergeProps?.isHidden) return null;

                              return (
                                <th
                                  key={i}
                                  onClick={(e) => {
                                    if (!e.target.closest(".col-menu-trigger"))
                                      setSelectedColIndex(
                                        selectedColIndex === i ? null : i,
                                      );
                                  }}
                                  colSpan={mergeProps?.colSpan || 1}
                                  rowSpan={mergeProps?.rowSpan || 1}
                                  className={clsx(
                                    "border-b border-slate-700 font-semibold tracking-wider whitespace-nowrap cursor-pointer transition-colors relative group",
                                    selectedColIndex === i
                                      ? "text-blue-200 border-blue-500"
                                      : "hover:bg-slate-800",
                                    isPresentationMode
                                      ? "px-10 py-6 text-sm"
                                      : "px-6 py-4 text-xs",
                                    i < frozenColCount &&
                                      "sticky z-[60] border-r border-slate-700",
                                  )}
                                  style={{
                                    width:
                                      getColumnWidth(i) *
                                      (mergeProps?.colSpan || 1),
                                    backgroundColor:
                                      selectedColIndex === i
                                        ? "#172554"
                                        : BG_COLOR,
                                    ...(i < frozenColCount
                                      ? { left: getStickyLeft(i) }
                                      : {}),
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{head || `Col ${i + 1}`}</span>

                                    {/* SORT INDICATOR */}
                                    {sortConfig.key === i && (
                                      <span className="ml-1 text-blue-400">
                                        {sortConfig.direction === "asc" ? (
                                          <ArrowUpAZ className="w-3.5 h-3.5" />
                                        ) : (
                                          <ArrowDownZA className="w-3.5 h-3.5" />
                                        )}
                                      </span>
                                    )}

                                    {/* COLUMN MENU TRIGGER */}
                                    <button
                                      className={clsx(
                                        "col-menu-trigger p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-opacity",
                                        activeMenuCol === i
                                          ? "opacity-100 bg-slate-700 text-white"
                                          : "opacity-0 group-hover:opacity-100",
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuCol(
                                          activeMenuCol === i ? null : i,
                                        );
                                      }}
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* DROPDOWN MENU */}
                                  {activeMenuCol === i && (
                                    <div
                                      className="absolute top-full right-2 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-[70] py-1 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-100"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => handleSort(i, "asc")}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                      >
                                        <ArrowUpAZ className="w-3.5 h-3.5 text-slate-500" />{" "}
                                        Sort A to Z
                                      </button>
                                      <button
                                        onClick={() => handleSort(i, "desc")}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                      >
                                        <ArrowDownZA className="w-3.5 h-3.5 text-slate-500" />{" "}
                                        Sort Z to A
                                      </button>
                                      <div className="h-px bg-slate-800 my-1"></div>
                                      <button
                                        onClick={() => toggleCompactMode(i)}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Hash className="w-3.5 h-3.5 text-slate-500" />{" "}
                                          Short Form (100K)
                                        </div>
                                        {compactColumns.includes(i) && (
                                          <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                                        )}
                                      </button>
                                    </div>
                                  )}

                                  {/* RESIZE HANDLE */}
                                  {!isPresentationMode && (
                                    <div
                                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all z-[70] group/resize"
                                      onMouseDown={(e) =>
                                        handleResizeStart(e, i)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="absolute inset-y-0 -left-1 -right-1" />
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
                            processedSheetData[0].forEach((header, index) => {
                              rowObject[header] = row[index];
                            });

                            let isRowDimmed = false;
                            if (viewMode === "focus") {
                              const hasAlert = row.some((cell, i) => {
                                const colName = processedSheetData[0][i];
                                const { style } = getCellStyle(
                                  cell,
                                  colName,
                                  rowObject,
                                  selectedModel.id,
                                  activeSheet,
                                  manifest,
                                );
                                return (
                                  style?.backgroundColor &&
                                  (style.backgroundColor.includes(
                                    "239, 68, 68",
                                  ) ||
                                    style.backgroundColor.includes(
                                      "245, 158, 11",
                                    ))
                                );
                              });
                              isRowDimmed = !hasAlert;
                            }

                            return (
                              <tr
                                key={rowIndex}
                                className={clsx(
                                  "transition-all duration-500 group",
                                  isRowDimmed
                                    ? "opacity-20 grayscale hover:opacity-50"
                                    : "opacity-100 hover:bg-blue-900/10",
                                )}
                              >
                                {showRowNumbers && (
                                  <td className="px-2 py-3 border-r border-slate-700/50 sticky left-0 z-[30] text-center font-mono text-xs text-slate-500 bg-slate-900">
                                    {actualRowIndex}
                                  </td>
                                )}

                                {row.map((cell, cellIndex) => {
                                  const columnName =
                                    processedSheetData[0][cellIndex];
                                  if (hiddenColumns.includes(columnName))
                                    return null;
                                  const mergeProps = getMergeProps(
                                    actualRowIndex,
                                    cellIndex,
                                  );
                                  if (mergeProps?.isHidden) return null;

                                  const { className, style } = getCellStyle(
                                    cell,
                                    columnName,
                                    rowObject,
                                    selectedModel.id,
                                    activeSheet,
                                    manifest,
                                    activeFile?.originalName,
                                  );

                                  // --- APPLY FORMATTING ---
                                  const formattedValue = formatCellValue(
                                    cell,
                                    columnName,
                                    compactColumns.includes(cellIndex),
                                  );

                                  return (
                                    <td
                                      key={cellIndex}
                                      colSpan={mergeProps?.colSpan || 1}
                                      rowSpan={mergeProps?.rowSpan || 1}
                                      // TOOLTIP: Show formatted value + History context
                                      title={
                                        typeof cell === "number"
                                          ? `${cell.toLocaleString("en-US")}${
                                              isComparing
                                                ? getTrendDelta(
                                                    cell,
                                                    row,
                                                    cellIndex,
                                                    comparisonData,
                                                    processedSheetData[0],
                                                    columnMapping,
                                                  )
                                                  ? ` (Prev: ${getTrendDelta(cell, row, cellIndex, comparisonData, processedSheetData[0], columnMapping).prev.toLocaleString("en-US")})`
                                                  : ""
                                                : ""
                                            }`
                                          : cell
                                      }
                                      className={clsx(
                                        "border-r border-slate-800/30 last:border-r-0 text-slate-300 group-hover:text-white transition-colors relative",
                                        className,
                                        isPresentationMode
                                          ? "px-10 py-5 text-base"
                                          : "px-6 py-3 text-sm",
                                        mergeProps?.isStart
                                          ? "text-center align-middle"
                                          : "text-left align-top truncate",
                                        cellIndex < frozenColCount &&
                                          "sticky z-30 border-r border-slate-700",
                                      )}
                                      style={{
                                        ...(cellIndex < frozenColCount
                                          ? { left: getStickyLeft(cellIndex) }
                                          : {}),
                                        width: getColumnWidth(cellIndex),
                                        ...style,
                                        // Force solid background on frozen columns - convert rgba to opaque
                                        ...(cellIndex < frozenColCount && {
                                          backgroundColor:
                                            style?.backgroundColor
                                              ? style.backgroundColor.includes(
                                                  "rgba",
                                                )
                                                ? style.backgroundColor.replace(
                                                    /,\s*[\d.]+\)/,
                                                    ", 1)",
                                                  )
                                                : style.backgroundColor
                                              : BG_COLOR,
                                        }),
                                      }}
                                    >
                                      {isEditMode ? (
                                        <input
                                          type="text"
                                          defaultValue={cell}
                                          className="bg-slate-800 border border-blue-500/50 text-white px-2 py-1 rounded w-full"
                                        />
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          {/* The Main Value */}
                                          <span>{formattedValue}</span>

                                          {/* --- TREND INDICATOR (With Mapping) --- */}
                                          {isComparing &&
                                            (() => {
                                              const trend = getTrendDelta(
                                                cell,
                                                row,
                                                cellIndex,
                                                comparisonData,
                                                processedSheetData[0],
                                                columnMapping,
                                              );
                                              if (!trend) return null;

                                              const isUp =
                                                trend.direction === "up";

                                              return (
                                                <span
                                                  className={clsx(
                                                    "text-[10px] font-bold flex items-center ml-1",
                                                    isUp
                                                      ? "text-red-400"
                                                      : "text-emerald-400",
                                                  )}
                                                >
                                                  {isUp ? "↑" : "↓"}
                                                  {Math.abs(
                                                    trend.delta,
                                                  ).toLocaleString("en-US", {
                                                    maximumFractionDigits: 1,
                                                  })}
                                                </span>
                                              );
                                            })()}
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
              {activeTab === "charts" && (
                <div className="absolute inset-0 overflow-y-auto p-8 custom-scrollbar">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Visual Analysis
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Dashboard for {activeSheet}
                      </p>
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

                  {/* Canvas (Relative for Drag & Drop & Auto-Fit) */}
                  {/* Canvas (Relative for Drag & Drop & Auto-Fit) */}
                  <div
                    ref={canvasRef}
                    className="relative w-full bg-slate-950/50 rounded-xl border border-slate-800/50 transition-all duration-300 ease-out"
                    style={{ height: `${dynamicHeight}px` }}
                  >
                    {/* 1. Visual Grid Lines (Only in Edit Mode) */}
                    {!isPresentationMode && (
                      <div
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                          backgroundSize: `${(canvasWidth - 16 * 11) / 12 + 16}px 76px`,
                          backgroundImage:
                            "linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)",
                        }}
                      />
                    )}

                    {/* 2. WIDGET RENDER LOOP (Single, Corrected Loop) */}
                    {manifest?.visualizations?.[selectedModel.id]?.[
                      activeSheet
                    ]?.map((chartConfig, idx) => {
                      // A. Default Layout - All charts same size, just positioned to avoid overlap
                      // User can freely resize/reposition any chart
                      const getDefaultLayout = (index) => {
                        return {
                          x: (index % 2) * 6,
                          y: Math.floor(index / 2) * 7,
                          w: 6,
                          // FIX: Text widgets default to smaller height (2), others stay large (6)
                          h: chartConfig.type === "text" ? 2 : 6,
                        };
                      };

                      const effectiveLayout =
                        chartConfig.layout || getDefaultLayout(idx);

                      // B. Extract Active Color
                      const activeColor =
                        chartConfig.colors && chartConfig.colors.length > 0
                          ? chartConfig.colors[0]
                          : "#3b82f6";

                      // --- LOGIC: APPLY GLOBAL FILTERS ---
                      let activeRenderData = sheetData; // Default: Current Sheet

                      // 1. Check for Cross-Sheet Source (If you decide to use it later)
                      const targetSheetName =
                        chartConfig.sourceSheet || activeSheet;
                      if (
                        targetSheetName !== activeSheet &&
                        parsedData &&
                        parsedData[targetSheetName]
                      ) {
                        activeRenderData = parsedData[targetSheetName];
                      }

                      // 2. APPLY FILTERS (Context Aware)
                      // 2. APPLY FILTERS (Context Aware with Operators)
                      if (
                        globalFilters.length > 0 &&
                        activeRenderData &&
                        activeRenderData.length > 0
                      ) {
                        const headers = activeRenderData[0];
                        const rows = activeRenderData.slice(1);

                        const filteredRows = rows.filter((row) => {
                          return globalFilters.every((filter) => {
                            const colIndex = headers.indexOf(filter.col);
                            if (colIndex === -1) return true; // Ignore if column doesn't exist in this widget

                            const cellValue = row[colIndex];

                            // Use the new Logic Engine
                            return checkFilterCondition(
                              cellValue,
                              filter.operator,
                              filter.val,
                              filter.type,
                            );
                          });
                        });

                        activeRenderData = [headers, ...filteredRows];
                      }

                      return (
                        <DraggableWidget
                          key={idx}
                          layout={effectiveLayout}
                          containerWidth={canvasWidth}
                          isEditing={!isPresentationMode}
                          activeColor={activeColor}
                          onDelete={() => setChartToDelete(idx)}
                          // NEW: Pass Edit Handler
                          onEdit={() => {
                            setEditingChartIndex(idx);
                            setIsChartBuilderOpen(true);
                          }}
                          // --- NEW: ZOOM PROPS ---
                          isZoomed={!!zoomStates[idx]}
                          onResetZoom={() => {
                            const newZooms = { ...zoomStates };
                            delete newZooms[idx];
                            setZoomStates(newZooms);
                          }}
                          // Layout Save
                          // FIX: Use 'updateChart' to save specific properties (layout/colors)
                          // This ensures the position writes to disk and persists after refresh

                          onLayoutChange={(newLayout) => {
                            updateChart(selectedModel.id, activeSheet, idx, {
                              layout: newLayout,
                            });
                          }}
                          onColorChange={(newColor) => {
                            updateChart(selectedModel.id, activeSheet, idx, {
                              colors: [newColor],
                            });
                          }}
                        >
                          {/* FIX: Removed pointer-events-none */}
                          <div className="w-full h-full select-none">
                            <ChartRenderer
                              // FIX: Pass the full config so the palette array (7 colors) is preserved
                              config={chartConfig}
                              data={activeRenderData.slice(1).map((row) => {
                                const obj = {};
                                activeRenderData[0].forEach(
                                  (key, i) => (obj[key] = row[i]),
                                );
                                return obj;
                              })}
                              // --- NEW: ZOOM HANDLERS ---
                              zoomDomain={zoomStates[idx]}
                              onZoom={(left, right) =>
                                setZoomStates((prev) => ({
                                  ...prev,
                                  [idx]: { left, right },
                                }))
                              }
                            />
                          </div>
                        </DraggableWidget>
                      );
                    })}

                    {/* 3. EMPTY STATE (Restored) */}
                    {(!manifest?.visualizations?.[selectedModel.id]?.[
                      activeSheet
                    ] ||
                      manifest.visualizations[selectedModel.id][activeSheet]
                        .length === 0) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <BarChart3 className="w-12 h-12 text-slate-800 mb-4" />
                        <p className="text-slate-600 font-medium">
                          No charts defined. Create a new widget to begin.
                        </p>
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
              existingRules={
                manifest?.conditional_formatting?.[selectedModel.id]?.[
                  activeSheet
                ] || []
              } // Pass existing rules
              currentFileName={activeFile?.originalName} // Pass current filename for scoping
              onSave={
                (updatedRules) =>
                  saveSheetRules(selectedModel.id, activeSheet, updatedRules) // Use new save function
              }
            />

            <ChartBuilder
              isOpen={isChartBuilderOpen}
              onClose={() => {
                setIsChartBuilderOpen(false);
                setEditingChartIndex(null); // Reset on close
              }}
              columns={sheetData[0] || []}
              // Pass the config if we are editing
              initialConfig={
                editingChartIndex !== null
                  ? manifest?.visualizations?.[selectedModel.id]?.[
                      activeSheet
                    ]?.[editingChartIndex]
                  : null
              }
              onSave={(config) => {
                if (editingChartIndex !== null) {
                  // UPDATE EXISTING CHART
                  updateChart(
                    selectedModel.id,
                    activeSheet,
                    editingChartIndex,
                    config,
                  );
                } else {
                  // CREATE NEW CHART
                  saveChart(selectedModel.id, activeSheet, config);
                }
                setEditingChartIndex(null); // Reset
              }}
            />

            {/* DELETE CONFIRMATION MODAL - CORRECTLY PLACED */}
            {chartToDelete !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-w-sm w-full transform transition-all scale-100">
                  <h3 className="text-lg font-bold text-white mb-2">
                    Delete Widget?
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Are you sure you want to remove this chart? This action
                    cannot be undone.
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
                        removeChart(
                          selectedModel.id,
                          activeSheet,
                          chartToDelete,
                        );
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
                        <GitMerge className="w-5 h-5 text-purple-500" />{" "}
                        Comparison Setup
                      </h3>
                      <button
                        onClick={() => setIsMapperOpen(false)}
                        className="text-slate-500 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* FILE SELECTOR (The Fix) */}
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Compare {activeFile?.period} with:
                        </label>
                        <select
                          className="w-full bg-slate-800 text-white text-sm border border-slate-700 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                          onChange={(e) => {
                            const file = selectedModel.files.find(
                              (f) => f.originalName === e.target.value,
                            );
                            if (file) {
                              setComparisonFile(file);
                              setIsComparing(true);
                              // Load Data
                              readExcelFile(file.handle).then((data) => {
                                setComparisonWorkbook(data); // Save Workbook

                                // Default to matching sheet name or first sheet
                                const sheetToLoad = data.sheetNames.includes(
                                  activeSheet,
                                )
                                  ? activeSheet
                                  : data.sheetNames[0];
                                setComparisonSheet(sheetToLoad);

                                const { data: rawData } = parseSheetData(
                                  data.workbook,
                                  sheetToLoad,
                                );
                                setComparisonData(rawData);
                              });
                            }
                          }}
                          value={comparisonFile?.originalName || ""}
                        >
                          <option value="">-- Select a File --</option>
                          {selectedModel.files
                            .filter(
                              (f) =>
                                f.originalName !== activeFile?.originalName,
                            )
                            .map((f) => (
                              <option
                                key={f.originalName}
                                value={f.originalName}
                              >
                                {f.period} ({f.originalName})
                              </option>
                            ))}
                        </select>
                      </div>
                      {comparisonFile && (
                        <div className="text-emerald-400 text-xs font-bold flex items-center gap-1 mt-4">
                          <CheckSquare className="w-3 h-3" /> Linked
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
                              const { data: rawData } = parseSheetData(
                                comparisonWorkbook.workbook,
                                newSheet,
                              );
                              setComparisonData(rawData);
                            }}
                          >
                            {comparisonWorkbook.sheetNames.map((sheet) => (
                              <option key={sheet} value={sheet}>
                                {sheet}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="text-slate-500 text-xs italic mt-4">
                          Matching against:{" "}
                          <span className="text-blue-400 font-bold">
                            {activeSheet}
                          </span>
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
                          <div
                            key={col}
                            className={clsx(
                              "grid grid-cols-[auto_1fr_auto_1fr] gap-3 items-center mb-3 transition-opacity",
                              isMapped ? "opacity-100" : "opacity-50 grayscale",
                            )}
                          >
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
                                  const match =
                                    comparisonData?.[0]?.find(
                                      (c) => c === col,
                                    ) || "";
                                  setColumnMapping((prev) => ({
                                    ...prev,
                                    [col]: match,
                                  }));
                                }
                              }}
                              className={clsx(
                                "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                isMapped
                                  ? "bg-blue-600 border-blue-500 text-white"
                                  : "bg-slate-800 border-slate-700 text-transparent hover:border-slate-500",
                              )}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. Current Column Name */}
                            <div
                              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 truncate font-medium"
                              title={col}
                            >
                              {col}
                            </div>

                            {/* 3. Arrow Icon */}
                            <ArrowRightLeft className="w-4 h-4 text-slate-600" />

                            {/* 4. Target Column Dropdown */}
                            <select
                              value={columnMapping[col] || ""}
                              disabled={!isMapped}
                              onChange={(e) =>
                                setColumnMapping((prev) => ({
                                  ...prev,
                                  [col]: e.target.value,
                                }))
                              }
                              className={clsx(
                                "bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none w-full transition-all",
                                !isMapped && "cursor-not-allowed opacity-50",
                              )}
                            >
                              <option value="">(No Match / Skip)</option>
                              {comparisonData?.[0]?.map((prevCol) => (
                                <option key={prevCol} value={prevCol}>
                                  {prevCol}
                                </option>
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
                    <button
                      onClick={() => setIsMapperOpen(false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
                    >
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
