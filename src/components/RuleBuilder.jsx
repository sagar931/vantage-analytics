import React, { useState } from 'react';
import { X, Plus, Save, Trash2 } from 'lucide-react';
import { STYLE_PRESETS } from '../utils/logicEngine';

const RuleBuilder = ({ isOpen, onClose, columns, onSave, activeSheet }) => {
  const [targetColumn, setTargetColumn] = useState(columns[0] || '');
  const [selectedPreset, setSelectedPreset] = useState("Red Alert");
  
  // State for conditions (start with one)
  const [conditions, setConditions] = useState([
    { column: columns[0] || '', operator: '>', value: '' }
  ]);

  if (!isOpen) return null;

  const addCondition = () => {
    setConditions([...conditions, { column: columns[0] || '', operator: '>', value: '' }]);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, field, val) => {
    const newConds = [...conditions];
    newConds[index][field] = val;
    setConditions(newConds);
  };

  const handleSave = () => {
    // Construct the rule object
    const newRule = {
      id: Date.now().toString(), // simple ID
      target_column: targetColumn,
      style: selectedPreset, // We save the Preset Name
      conditions: conditions.map(c => ({
        column: c.column,
        operator: c.operator,
        value: !isNaN(c.value) && c.value !== '' ? Number(c.value) : c.value
      }))
    };
    onSave(newRule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-lg font-bold text-white">Add Formatting Rule</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* 1. Target & Style */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Apply To Column</label>
              <select 
                value={targetColumn} 
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Formatting Style</label>
              <select 
                value={selectedPreset} 
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.keys(STYLE_PRESETS).map(preset => <option key={preset} value={preset}>{preset}</option>)}
              </select>
            </div>
          </div>

          {/* 2. Conditions */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">When (Conditions)</label>
            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <span className="text-xs font-mono text-blue-400 w-8">{idx === 0 ? 'IF' : 'AND'}</span>
                  
                  <select 
                    value={cond.column}
                    onChange={(e) => updateCondition(idx, 'column', e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <select 
                    value={cond.operator}
                    onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                    className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="==">==</option>
                    <option value="!=">!=</option>
                    <option value="contains">contains</option>
                  </select>

                  <input 
                    type="text" 
                    value={cond.value}
                    onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                    placeholder="Value..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />

                  {conditions.length > 1 && (
                    <button onClick={() => removeCondition(idx)} className="text-red-400 hover:bg-red-900/20 p-2 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button onClick={addCondition} className="mt-3 flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300">
              <Plus className="w-4 h-4" /> ADD CONDITION
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" /> Save Rule to Manifest
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleBuilder;