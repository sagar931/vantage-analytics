import React, { useState, useEffect } from 'react';
import { X, Save, BarChart2, TrendingUp, PieChart, AlertCircle, Table, Palette, Plus, Check } from 'lucide-react';

// --- 1. QUICK ACCESS PALETTES (Visible on main screen) ---
const QUICK_PALETTES = {
  /* =======================
     CORE / DEFAULT
  ======================= */
  default: {
    name: "Vantage (Default)",
    colors: [
      "#2563EB", "#16A34A", "#F59E0B",
      "#DC2626", "#7C3AED", "#DB2777",
      "#0891B2"
    ]
  },

  /* =======================
     HIGH-CONTRAST DONUT
  ======================= */
  contrast: {
    name: "High Contrast",
    colors: [
      "#1D4ED8", "#DC2626", "#FACC15",
      "#16A34A", "#9333EA", "#EA580C",
      "#0891B2"
    ]
  },

  /* =======================
     NEON / MODERN
  ======================= */
  neon: {
    name: "Cyberpunk Neon",
    colors: [
      "#00F5D4", "#FF5DA2", "#FEE440",
      "#3A86FF", "#8338EC", "#FB5607",
      "#9B5DE5"
    ]
  },

  electric: {
    name: "Electric Spectrum",
    colors: [
      "#00E5FF", "#2979FF", "#651FFF",
      "#D500F9", "#FF1744", "#FF9100",
      "#00E676"
    ]
  },

  /* =======================
     WARM / COOL MIXES
  ======================= */
  sunset: {
    name: "Sunset Glow",
    colors: [
      "#FF6D00", "#F44336", "#E91E63",
      "#9C27B0", "#673AB7", "#3F51B5",
      "#2196F3"
    ]
  },

  aurora: {
    name: "Aurora Lights",
    colors: [
      "#00C853", "#64DD17", "#AEEA00",
      "#00B0FF", "#651FFF", "#D500F9",
      "#FF4081"
    ]
  },

  /* =======================
     NATURE (NOT SHADES)
  ======================= */
  forest: {
    name: "Emerald Forest",
    colors: [
      "#2E7D32", "#66BB6A", "#9CCC65",
      "#FFB300", "#8D6E63", "#1565C0",
      "#26C6DA"
    ]
  },

  desert: {
    name: "Desert Earth",
    colors: [
      "#C62828", "#EF6C00", "#F9A825",
      "#6D4C41", "#2E7D32", "#0277BD",
      "#8E24AA"
    ]
  },

  /* =======================
     BUSINESS / FINANCE
  ======================= */
  finance: {
    name: "Finance Pro",
    colors: [
      "#003049", "#2A9D8F", "#E9C46A",
      "#F4A261", "#E76F51", "#264653",
      "#6A4C93"
    ]
  },

  executive: {
    name: "Executive Boardroom",
    colors: [
      "#111827", "#1F2933", "#B45309",
      "#CA8A04", "#2563EB", "#059669",
      "#7C3AED"
    ]
  },

  /* =======================
     PASTEL BUT DISTINCT
  ======================= */
  pastel: {
    name: "Soft Spectrum",
    colors: [
      "#FFB5A7", "#FCD5CE", "#CDB4DB",
      "#BDE0FE", "#A8DADC", "#C7EDE6",
      "#FFF1A8"
    ]
  },

  playful: {
    name: "Playful Market",
    colors: [
      "#FF595E", "#FFCA3A", "#8AC926",
      "#1982C4", "#6A4C93", "#FF924C",
      "#4D96FF"
    ]
  },

  /* =======================
     DARK MODE DONUTS
  ======================= */
  darkNeon: {
    name: "Dark Neon",
    colors: [
      "#00E5FF", "#FF4081", "#C77DFF",
      "#FFD60A", "#72EFDD", "#FF9F1C",
      "#80FFDB"
    ]
  },

  /* =======================
     MONO (INTENTIONAL)
  ======================= */
  mono: {
    name: "Slate Minimal",
    colors: [
      "#0F172A", "#334155", "#64748B",
      "#94A3B8", "#CBD5E1", "#E2E8F0",
      "#F8FAFC"
    ]
  }
};

// --- 2. EXTENDED THEME LIBRARY (Inside the "+" Modal) ---
const EXTENDED_THEMES = [
  /* ================================
     DISTINCT & CATEGORICAL (DONUT)
  ================================= */
  {
    category: "Distinct & Categorical",
    themes: [
      {
        id: "vibrant",
        name: "Vibrant Pop",
        colors: [
          "#FF005C",
          "#FFD700",
          "#00E5FF",
          "#2979FF",
          "#651FFF",
          "#00C853",
          "#FF6D00",
        ],
      },
      {
        id: "neon_business",
        name: "Neon Business",
        colors: [
          "#00F5D4",
          "#F15BB5",
          "#FEE440",
          "#3A86FF",
          "#8338EC",
          "#FB5607",
        ],
      },
      {
        id: "traffic_plus",
        name: "Stoplight Plus",
        colors: [
          "#EF4444",
          "#F59E0B",
          "#10B981",
          "#3B82F6",
          "#8B5CF6",
          "#EC4899",
        ],
      },
      {
        id: "bold_contrast",
        name: "Bold Contrast",
        colors: [
          "#0F172A",
          "#DC2626",
          "#FACC15",
          "#2563EB",
          "#22C55E",
          "#FFFFFF",
        ],
      },
    ],
  },

  /* ================================
     GRADIENT-STYLE SHADES (SMOOTH)
  ================================= */
  {
    category: "Gradients & Shades",
    themes: [
      {
        id: "blue_depth",
        name: "Blue Depth",
        colors: [
          "#0B132B",
          "#1C2541",
          "#3A86FF",
          "#5BC0EB",
          "#A9DEF9",
          "#E0FBFC",
        ],
      },
      {
        id: "purple_haze",
        name: "Purple Haze",
        colors: [
          "#2D0F4E",
          "#5A189A",
          "#7B2CBF",
          "#9D4EDD",
          "#C77DFF",
          "#E0AAFF",
        ],
      },
      {
        id: "sunset_heat",
        name: "Sunset Heat",
        colors: [
          "#7F1D1D",
          "#B91C1C",
          "#EF4444",
          "#F97316",
          "#FBBF24",
          "#FDE68A",
        ],
      },
      {
        id: "teal_tides",
        name: "Teal Tides",
        colors: [
          "#042F2E",
          "#115E59",
          "#0D9488",
          "#2DD4BF",
          "#5EEAD4",
          "#CCFBF1",
        ],
      },
    ],
  },

  /* ================================
     PASTEL (FRIENDLY + MODAL SAFE)
  ================================= */
  {
    category: "Pastel Business",
    themes: [
      {
        id: "soft_pastel",
        name: "Soft Pastel",
        colors: [
          "#FFADAD",
          "#FFD6A5",
          "#FDFFB6",
          "#CAFFBF",
          "#9BF6FF",
          "#BDB2FF",
        ],
      },
      {
        id: "calm_ui",
        name: "Calm UI",
        colors: [
          "#E0E7FF",
          "#C7D2FE",
          "#A5B4FC",
          "#93C5FD",
          "#99F6E4",
          "#D1FAE5",
        ],
      },
    ],
  },

  /* ================================
     PROFESSIONAL / FINANCE
  ================================= */
  {
    category: "Professional",
    themes: [
      {
        id: "barclays",
        name: "Barclays Classic",
        colors: [
          "#00AEEF",
          "#00395D",
          "#0077B6",
          "#0096C7",
          "#90E0EF",
          "#FFFFFF",
        ],
      },
      {
        id: "finance_dark",
        name: "Finance Dark",
        colors: [
          "#020617",
          "#0F172A",
          "#1E293B",
          "#334155",
          "#64748B",
          "#94A3B8",
        ],
      },
      {
        id: "executive_gold",
        name: "Executive Gold",
        colors: [
          "#1C1917",
          "#44403C",
          "#78716C",
          "#D4AF37",
          "#F5E6A8",
          "#FAFAF9",
        ],
      },
    ],
  },
];

const CURRENCY_OPTIONS = [
  { id: 'none', label: 'Number (1,000)' },
  { id: 'USD', label: 'USD ($)' },
  { id: 'EUR', label: 'EUR (€)' },
  { id: 'GBP', label: 'GBP (£)' },
  { id: 'INR', label: 'INR (₹)' },
  { id: 'JPY', label: 'JPY (¥)' },
];

const ChartBuilder = ({ isOpen, onClose, columns, onSave, initialConfig }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('bar'); 
  const [xAxis, setXAxis] = useState('');
  const [dataKeys, setDataKeys] = useState([]); 
  const [threshold, setThreshold] = useState(''); 
  const [xAxisAngle, setXAxisAngle] = useState(0);
  const [showDataLabels, setShowDataLabels] = useState(false);

  // Color State
  const [selectedPaletteId, setSelectedPaletteId] = useState('default');
  const [customColors, setCustomColors] = useState(null); // Stores colors if chosen from library
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currency, setCurrency] = useState('none');

  // Reset or Load state when opening
  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        setTitle(initialConfig.title || '');
        setType(initialConfig.type || 'bar');
        setXAxis(initialConfig.xAxis || columns[0] || '');
        setDataKeys(initialConfig.dataKeys || []);
        setThreshold(initialConfig.threshold || '');
        setXAxisAngle(initialConfig.xAxisAngle || 0);
        setShowDataLabels(initialConfig.showDataLabels || false);
        setCurrency(initialConfig.currency || 'none');

        // Restore Palette Logic
        if (initialConfig.colors && initialConfig.colors.length > 1) {
             // 1. Check Quick Palettes
             const quickMatch = Object.keys(QUICK_PALETTES).find(key => 
               JSON.stringify(QUICK_PALETTES[key].colors) === JSON.stringify(initialConfig.colors)
             );
             
             if (quickMatch) {
               setSelectedPaletteId(quickMatch);
               setCustomColors(null);
             } else {
               // 2. Assume it's a custom/library theme
               setSelectedPaletteId('custom');
               setCustomColors(initialConfig.colors);
             }
        } else {
             setSelectedPaletteId('default');
             setCustomColors(null);
        }
      } else {
        // Defaults
        setTitle('');
        setType('bar');
        setXAxis(columns[0] || ''); 
        setDataKeys([]); 
        setThreshold('');
        setXAxisAngle(0);
        setSelectedPaletteId('default');
        setCustomColors(null);
      }
    }
  }, [isOpen, initialConfig, columns]);

  if (!isOpen) return null;

  const toggleDataKey = (col) => {
    if (type === 'donut') {
      setDataKeys([col]);
      return;
    }
    setDataKeys(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleSave = () => {
    if (!title || !xAxis || dataKeys.length === 0) {
      alert("Please fill in Title, X-Axis, and at least one Data Series.");
      return;
    }
    
    // Determine final colors
    let finalColors = QUICK_PALETTES['default'].colors;
    if (selectedPaletteId === 'custom' && customColors) {
      finalColors = customColors;
    } else if (QUICK_PALETTES[selectedPaletteId]) {
      finalColors = QUICK_PALETTES[selectedPaletteId].colors;
    }

    const newChart = {
      id: Date.now().toString(),
      title,
      type,
      xAxis,
      dataKeys,
      xAxisAngle: Number(xAxisAngle),
      threshold: threshold ? parseFloat(threshold) : null,
      colors: finalColors, 
      showDataLabels,
      currency,
    };
    
    onSave(newChart);
    onClose();
  };

  const getActiveColors = () => {
    if (selectedPaletteId === 'custom' && customColors) return customColors;
    return QUICK_PALETTES[selectedPaletteId]?.colors || QUICK_PALETTES['default'].colors;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500"/> Chart Builder
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Row 1: Title & Type */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chart Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-all"
                placeholder="e.g. Volume Comparison"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chart Type</label>
              <div className="flex gap-2">
                  {['bar', 'line', 'area', 'donut', 'table'].map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        type === t 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {t === 'bar' && <BarChart2 className="w-5 h-5" />}
                      {t === 'line' && <TrendingUp className="w-5 h-5" />}
                      {t === 'area' && <TrendingUp className="w-5 h-5 fill-current opacity-50" />}
                      {t === 'donut' && <PieChart className="w-5 h-5" />}
                      {t === 'table' && <Table className="w-5 h-5" />} 
                      <span className="text-xs font-medium uppercase tracking-wider">{t}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Row 2: Axes Configuration */}
          <div className="grid grid-cols-2 gap-6">
            {/* X-Axis */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {type === 'donut' ? 'Segment Label' : 'X-Axis (Category)'}
                </label>
                {type !== 'donut' && type !== 'table' && (
                  <select 
                    value={xAxisAngle}
                    onChange={(e) => setXAxisAngle(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-blue-400 rounded px-2 py-0.5 outline-none focus:border-blue-500"
                  >
                    <option value="0">Horizontal (0°)</option>
                    <option value="-45">Angled (-45°)</option>
                    <option value="-90">Vertical (-90°)</option>
                  </select>
                )}
              </div>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-40 overflow-y-auto custom-scrollbar">
                {columns.map(col => (
                  <button
                    key={col}
                    onClick={() => setXAxis(col)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm mb-1 ${xAxis === col ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'text-slate-400 hover:bg-slate-700'}`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Y-Axis */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                {type === 'donut' ? 'Value Size (Pick 1)' : 'Y-Axis (Select Multiple)'}
              </label>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-40 overflow-y-auto custom-scrollbar">
                {type === 'donut' && (
                  <button
                    onClick={() => setDataKeys(['Frequency (Count)'])}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm mb-1 flex justify-between items-center ${
                      dataKeys.includes('Frequency (Count)') 
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                        : 'text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span className="truncate italic font-medium">Frequency (Row Count)</span>
                    {dataKeys.includes('Frequency (Count)') && <div className="w-2 h-2 rounded-full bg-purple-500"></div>}
                  </button>
                )}

                {columns.map(col => (
                  <button
                    key={col}
                    onClick={() => toggleDataKey(col)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm mb-1 flex justify-between items-center ${dataKeys.includes(col) ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50' : 'text-slate-400 hover:bg-slate-700'}`}
                  >
                    <span className="truncate">{col}</span>
                    {dataKeys.includes(col) && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Palette, Data Labels & Threshold */}
          <div className="grid grid-cols-2 gap-6 items-end">
             {/* PALETTE SELECTOR */}
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Color Theme
                </label>
                {/* ... existing palette code ... */}
                <div className="flex flex-wrap gap-2 items-center"> 
                  {/* ... palette buttons ... */}
                  {Object.keys(QUICK_PALETTES).map(key => (
                    <button
                      key={key}
                      onClick={() => { setSelectedPaletteId(key); setCustomColors(null); }}
                      className={`w-8 h-8 flex-shrink-0 rounded-full border-2 transition-all ${
                        selectedPaletteId === key 
                          ? 'border-white scale-110 shadow-lg shadow-white/20' 
                          : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${QUICK_PALETTES[key].colors[0]} 0%, ${QUICK_PALETTES[key].colors[1]} 100%)` }}
                      title={QUICK_PALETTES[key].name}
                    />
                  ))}
                  {/* ... rest of palette code ... */}
                  <div className="w-px h-6 bg-slate-700"></div>
                  <button
                    onClick={() => setIsThemeModalOpen(true)}
                    className={`w-8 h-8 flex-shrink-0 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 hover:bg-slate-800 transition-all ${selectedPaletteId === 'custom' ? 'border-blue-500 text-blue-400 bg-slate-800' : ''}`}
                    title="More Themes..."
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 font-medium h-4 mt-1">
                  {selectedPaletteId === 'custom' ? 'Custom Selection' : QUICK_PALETTES[selectedPaletteId]?.name}
                </div>
             </div>

             {/* SETTINGS GROUP: Data Labels & Threshold */}
             <div className="space-y-4">
                {/* 1. DATA FORMATTING GROUP */}
                {type !== 'table' && (
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-3">
                    
                    {/* Toggle: Show Labels */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Show Data Labels</span>
                      <button
                        onClick={() => setShowDataLabels(!showDataLabels)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showDataLabels ? 'bg-blue-600' : 'bg-slate-600'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showDataLabels ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-700/50"></div>

                    {/* Dropdown: Currency */}
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Value Format</label>
                       <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                       >
                          {CURRENCY_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                          ))}
                       </select>
                    </div>
                  </div>
                )}

                {/* 2. THRESHOLD INPUT */}
                {type !== 'donut' && type !== 'table' && (
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-red-400" /> Threshold Alert
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.01"
                          value={threshold}
                          onChange={(e) => setThreshold(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                          placeholder="Limit (e.g. 0.1)"
                        />
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save className="w-4 h-4" /> 
            {initialConfig ? "Save Changes" : "Create Widget"}
          </button>
        </div>
      </div>

      {/* --- THEME LIBRARY MODAL (OVERLAY) --- */}
      {isThemeModalOpen && (
        <div className="absolute inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl h-[600px] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0b1121]">
              <div>
                <h3 className="text-xl font-bold text-white">Theme Library</h3>
                <p className="text-slate-400 text-xs mt-1">Select a color palette for your visualization</p>
              </div>
              <button 
                onClick={() => setIsThemeModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Grid of Themes */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {EXTENDED_THEMES.map((category) => (
                <div key={category.category} className="mb-8">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
                    {category.category}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {category.themes.map((theme) => {
                      // Check if this theme is currently active (by comparing color arrays)
                      const isActive = JSON.stringify(theme.colors) === JSON.stringify(getActiveColors());
                      
                      return (
                        <button
                          key={theme.id}
                          onClick={() => {
                            setSelectedPaletteId('custom');
                            setCustomColors(theme.colors);
                            setIsThemeModalOpen(false); // Close on select
                          }}
                          className={`group relative p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${isActive ? 'border-blue-500 bg-slate-800' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}
                        >
                          {/* Color Preview Strip */}
                          <div className="h-8 w-full rounded-lg mb-3 flex overflow-hidden">
                            {theme.colors.map((c, i) => (
                              <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          
                          {/* Name & Checkmark */}
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                              {theme.name}
                            </span>
                            {isActive && <div className="bg-blue-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartBuilder;