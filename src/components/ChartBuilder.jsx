import React, { useState } from 'react';
import { X, Save, BarChart2, TrendingUp, PieChart, AlertCircle } from 'lucide-react';

const ChartBuilder = ({ isOpen, onClose, columns, onSave }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('bar'); // bar, line, area, donut
  const [xAxis, setXAxis] = useState(columns[0] || '');
  const [dataKeys, setDataKeys] = useState([]); // Array of columns to plot
  const [threshold, setThreshold] = useState(''); // NEW: Threshold State

  if (!isOpen) return null;

  const toggleDataKey = (col) => {
    // For Donut, we typically only want ONE value series
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
      threshold: threshold ? parseFloat(threshold) : null, // Save Threshold
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] 
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
          
          {/* 1. Title & Type */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chart Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                placeholder="e.g. PSI Distribution"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chart Type</label>
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                {['bar', 'line', 'area', 'donut'].map(t => (
                  <button 
                    key={t}
                    onClick={() => {
                       setType(t);
                       // Reset data keys if switching to donut to prevent multi-select confusion
                       if(t === 'donut') setDataKeys([]); 
                    }}
                    className={`flex-1 capitalize text-sm py-1 rounded ${type === t ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Axes Configuration */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* X-Axis (Category) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                {type === 'donut' ? 'Segment Label (e.g. Band)' : 'X-Axis (Category)'}
              </label>
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

            {/* Y-Axis (Values) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                {type === 'donut' ? 'Value Size (Pick 1)' : 'Y-Axis (Values)'}
              </label>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-48 overflow-y-auto custom-scrollbar">
                {columns.map(col => (
                  <button
                    key={col}
                    onClick={() => toggleDataKey(col)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm mb-1 flex justify-between items-center ${dataKeys.includes(col) ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50' : 'text-slate-400 hover:bg-slate-700'}`}
                  >
                    <span>{col}</span>
                    {dataKeys.includes(col) && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 3. Threshold Configuration (Hidden for Donut) */}
          {type !== 'donut' && (
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

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" /> Create Widget
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;