import React, { useState, useEffect } from 'react';
import { X, Save, BarChart2, TrendingUp, PieChart, AlertCircle, Table } from 'lucide-react';

const ChartBuilder = ({ isOpen, onClose, columns, onSave, initialConfig }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('bar'); 
  const [xAxis, setXAxis] = useState('');
  const [dataKeys, setDataKeys] = useState([]); 
  const [threshold, setThreshold] = useState(''); 
  const [xAxisAngle, setXAxisAngle] = useState(0); // Default 0 (Horizontal)

// Reset or Load state when opening
  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        // EDIT MODE: Load existing config
        setTitle(initialConfig.title || '');
        setType(initialConfig.type || 'bar');
        setXAxis(initialConfig.xAxis || columns[0] || '');
        setDataKeys(initialConfig.dataKeys || []);
        setThreshold(initialConfig.threshold || '');
        setXAxisAngle(initialConfig.xAxisAngle || 0);
      } else {
        // CREATE MODE: Reset to defaults
        setTitle('');
        setType('bar');
        setXAxis(columns[0] || ''); 
        setDataKeys([]); 
        setThreshold('');
        setXAxisAngle(0);
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
    
    const newChart = {
      id: Date.now().toString(),
      title,
      type,
      xAxis,
      dataKeys,
      xAxisAngle: Number(xAxisAngle),
      threshold: threshold ? parseFloat(threshold) : null,
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#06b6d4', '#f43f5e'],
      xAxisAngle: Number(xAxisAngle)
    };
    
    onSave(newChart);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500"/> Chart Builder
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chart Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                placeholder="e.g. Volume Comparison"
              />
            </div>
            
            {/* Chart Type Selector */}
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

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {type === 'donut' ? 'Segment Label' : 'X-Axis (Category)'}
                </label>
                
                {/* ROTATION CONTROL */}
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
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-48 overflow-y-auto custom-scrollbar">
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

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                {type === 'donut' ? 'Value Size (Pick 1)' : 'Y-Axis (Select Multiple)'}
              </label>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-48 overflow-y-auto custom-scrollbar">
                
                {/* --- NEW: FREQUENCY OPTION (Only for Donut) --- */}
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

                {/* Existing Columns */}
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

          {/* Threshold Input - Hidden for Donut and Table */}
          {type !== 'donut' && type !== 'table' && (
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-red-400" /> Threshold Alert (Optional)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                    placeholder="e.g. 0.1 (Values above this will turn Red)"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">Breach Limit</span>
                </div>
             </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" /> 
            {initialConfig ? "Save Changes" : "Create Widget"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;