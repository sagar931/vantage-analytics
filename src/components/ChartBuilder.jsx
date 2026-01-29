import React, { useState, useEffect } from 'react';
import { X, Save, BarChart2, TrendingUp, PieChart, AlertCircle, Table, Palette, Plus, Check } from 'lucide-react';

// --- 1. QUICK ACCESS PALETTES (Visible on main screen) ---
const QUICK_PALETTES = {
  default: { name: 'Vantage (Default)', colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'] },
  neon:    { name: 'Cyberpunk Neon',    colors: ['#22d3ee', '#f472b6', '#a78bfa', '#facc15', '#4ade80', '#fb923c', '#e879f9'] },
  sunset:  { name: 'Sunset Glow',       colors: ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#8b5cf6', '#6366f1'] },
  ocean:   { name: 'Deep Ocean',        colors: ['#0ea5e9', '#0284c7', '#0369a1', '#0c4a6e', '#0891b2', '#22d3ee', '#67e8f9'] },
  forest:  { name: 'Emerald Forest',    colors: ['#10b981', '#059669', '#047857', '#84cc16', '#65a30d', '#3b82f6', '#06b6d4'] },
  mono:    { name: 'Slate Minimal',     colors: ['#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#cbd5e1', '#e2e8f0'] },
};

// --- 2. EXTENDED THEME LIBRARY (Inside the "+" Modal) ---
const EXTENDED_THEMES = [
  {
    category: "Distinct & Categorical",
    themes: [
      { id: 'vibrant', name: 'Vibrant Pop', colors: ['#FF005C', '#FFD700', '#00E5FF', '#2979FF', '#651FFF', '#00C853'] },
      { id: 'retro',   name: 'Retro Wave',  colors: ['#3b82f6', '#e11d48', '#fbbf24', '#10b981', '#8b5cf6', '#f472b6'] },
      { id: 'traffic', name: 'Stoplight',   colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#64748b'] }, // R-Y-G-B
      { id: 'bold',    name: 'Bold Contrast', colors: ['#1e293b', '#dc2626', '#facc15', '#2563eb', '#ffffff'] },
    ]
  },
  {
    category: "Gradients & Shades",
    themes: [
      { id: 'blue_grad',   name: 'Blue Depth',   colors: ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'] },
      { id: 'purple_grad', name: 'Purple Haze',  colors: ['#4c1d95', '#5b21b6', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'] },
      { id: 'red_grad',    name: 'Red Heat',     colors: ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171'] },
      { id: 'teal_grad',   name: 'Teal Tides',   colors: ['#134e4a', '#115e59', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'] },
    ]
  },
  {
    category: "Professional",
    themes: [
      { id: 'barclays', name: 'Barclays Classic', colors: ['#00aeef', '#00395d', '#00a4e4', '#434343', '#ffffff'] },
      { id: 'finance',  name: 'Finance Dark',     colors: ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'] },
    ]
  }
];

const ChartBuilder = ({ isOpen, onClose, columns, onSave, initialConfig }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('bar'); 
  const [xAxis, setXAxis] = useState('');
  const [dataKeys, setDataKeys] = useState([]); 
  const [threshold, setThreshold] = useState(''); 
  const [xAxisAngle, setXAxisAngle] = useState(0);
  
  // Color State
  const [selectedPaletteId, setSelectedPaletteId] = useState('default');
  const [customColors, setCustomColors] = useState(null); // Stores colors if chosen from library
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

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

          {/* Row 3: Palette & Threshold */}
          <div className="grid grid-cols-2 gap-6 items-end">
             {/* PALETTE SELECTOR WITH MODAL TRIGGER */}
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Color Theme
                </label>
                {/* FIX: Changed to flex-wrap to remove scrollbar, reduced gap */}
                <div className="flex flex-wrap gap-2 items-center"> 
                  {/* Standard Palettes */}
                  {Object.keys(QUICK_PALETTES).map(key => (
                    <button
                      key={key}
                      onClick={() => { setSelectedPaletteId(key); setCustomColors(null); }}
                      // FIX: Added flex-shrink-0 to prevent squashing
                      className={`w-8 h-8 flex-shrink-0 rounded-full border-2 transition-all ${
                        selectedPaletteId === key 
                          ? 'border-white scale-110 shadow-lg shadow-white/20' 
                          : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ 
                        background: `linear-gradient(135deg, ${QUICK_PALETTES[key].colors[0]} 0%, ${QUICK_PALETTES[key].colors[1]} 100%)` 
                      }}
                      title={QUICK_PALETTES[key].name}
                    />
                  ))}

                  {/* Divider - Removed mx-1 to reduce space */}
                  <div className="w-px h-6 bg-slate-700"></div>

                  {/* ADD BUTTON (Opens Modal) */}
                  <button
                    onClick={() => setIsThemeModalOpen(true)}
                    // FIX: Added flex-shrink-0 to ensure it stays a perfect circle
                    className={`w-8 h-8 flex-shrink-0 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 hover:bg-slate-800 transition-all ${selectedPaletteId === 'custom' ? 'border-blue-500 text-blue-400 bg-slate-800' : ''}`}
                    title="More Themes..."
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Active Theme Name Display */}
                <div className="text-[10px] text-slate-400 font-medium h-4 mt-1">
                  {selectedPaletteId === 'custom' ? 'Custom Selection' : QUICK_PALETTES[selectedPaletteId]?.name}
                </div>
             </div>

             {/* Threshold Input */}
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
                      placeholder="Breach Limit (e.g. 0.1)"
                    />
                  </div>
               </div>
             )}
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