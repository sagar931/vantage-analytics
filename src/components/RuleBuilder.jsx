import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, Globe, File, List, AlertTriangle } from 'lucide-react';
import { STYLE_PRESETS } from '../utils/logicEngine';
import clsx from 'clsx';

const RuleBuilder = ({ isOpen, onClose, columns, onSave, existingRules, currentFileName }) => {
  const [mode, setMode] = useState('create'); // 'create' | 'manage'
  
  // Create State
  const [targetColumn, setTargetColumn] = useState(columns[0] || '');
  const [selectedPreset, setSelectedPreset] = useState("Red Alert");
  const [scope, setScope] = useState('global'); // 'global' | 'local'
  const [conditions, setConditions] = useState([
    { column: columns[0] || '', operator: '>', value: '' }
  ]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setMode('create');
      setConditions([{ column: columns[0] || '', operator: '>', value: '' }]);
    }
  }, [isOpen, columns]);

  if (!isOpen) return null;

  // --- ACTIONS ---
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

  const handleCreate = () => {
    const newRule = {
      id: Date.now().toString(),
      target_column: targetColumn,
      style: selectedPreset,
      fileFilter: scope === 'local' ? currentFileName : null, // THE KEY CHANGE
      conditions: conditions.map(c => ({
        column: c.column,
        operator: c.operator,
        value: !isNaN(c.value) && c.value !== '' ? Number(c.value) : c.value
      }))
    };
    
    // Add to existing rules and save
    const updatedRules = [...(existingRules || []), newRule];
    onSave(updatedRules);
    onClose();
  };

  const handleDelete = (ruleId) => {
    const updatedRules = existingRules.filter(r => r.id !== ruleId);
    onSave(updatedRules);
  };

  const handleToggleException = (rule) => {
    // This toggles the current file as an "Exception" for a Global Rule
    const exceptions = rule.exceptions || [];
    let newExceptions;
    
    if (exceptions.includes(currentFileName)) {
        newExceptions = exceptions.filter(f => f !== currentFileName); // Remove exception (Re-enable)
    } else {
        newExceptions = [...exceptions, currentFileName]; // Add exception (Disable)
    }

    const updatedRules = existingRules.map(r => 
        r.id === rule.id ? { ...r, exceptions: newExceptions } : r
    );
    onSave(updatedRules);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950">
            <button 
                onClick={() => setMode('create')}
                className={clsx("flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors", mode === 'create' ? "text-blue-400 border-b-2 border-blue-500 bg-slate-900" : "text-slate-500 hover:text-slate-300")}
            >
                <Plus className="w-4 h-4 inline-block mb-1 mr-2" /> New Rule
            </button>
            <button 
                onClick={() => setMode('manage')}
                className={clsx("flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors", mode === 'manage' ? "text-blue-400 border-b-2 border-blue-500 bg-slate-900" : "text-slate-500 hover:text-slate-300")}
            >
                <List className="w-4 h-4 inline-block mb-1 mr-2" /> Manage Rules ({existingRules?.length || 0})
            </button>
            <button onClick={onClose} className="px-6 text-slate-500 hover:text-white border-l border-slate-800">
                <X className="w-5 h-5"/>
            </button>
        </div>

        {/* --- MODE: CREATE --- */}
        {mode === 'create' && (
            <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Apply To Column</label>
                        <select value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none">
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Style</label>
                        <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none">
                            {Object.keys(STYLE_PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                {/* SCOPE SELECTOR */}
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="scope" value="global" checked={scope === 'global'} onChange={() => setScope('global')} className="accent-blue-500" />
                        <span className="text-sm text-slate-300 flex items-center gap-1"><Globe className="w-3 h-3 text-blue-400"/> All Files (Global)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="scope" value="local" checked={scope === 'local'} onChange={() => setScope('local')} className="accent-blue-500" />
                        <span className="text-sm text-slate-300 flex items-center gap-1"><File className="w-3 h-3 text-emerald-400"/> This File Only</span>
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Conditions</label>
                    <div className="space-y-3">
                        {conditions.map((cond, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                                <span className="text-xs font-mono text-blue-400 w-8">{idx === 0 ? 'IF' : 'AND'}</span>
                                <select value={cond.column} onChange={(e) => updateCondition(idx, 'column', e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={cond.operator} onChange={(e) => updateCondition(idx, 'operator', e.target.value)} className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono">
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                    <option value="==">==</option>
                                    <option value="!=">!=</option>
                                    <option value="contains">contains</option>
                                </select>
                                <input type="text" value={cond.value} onChange={(e) => updateCondition(idx, 'value', e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Value..." />
                                {conditions.length > 1 && (
                                    <button onClick={() => removeCondition(idx)} className="text-red-400 hover:bg-red-900/20 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button onClick={addCondition} className="mt-3 flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300"><Plus className="w-4 h-4" /> ADD CONDITION</button>
                </div>

                <button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold shadow-lg mt-4 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Save Rule
                </button>
            </div>
        )}

        {/* --- MODE: MANAGE --- */}
        {mode === 'manage' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-900">
                {(!existingRules || existingRules.length === 0) ? (
                    <div className="text-center text-slate-500 py-10 italic">No active rules for this sheet.</div>
                ) : (
                    <div className="space-y-3">
                        {existingRules.map((rule, i) => {
                            const isGlobal = !rule.fileFilter;
                            const isExcluded = rule.exceptions && rule.exceptions.includes(currentFileName);
                            const isHiddenHere = !isGlobal && rule.fileFilter !== currentFileName;

                            // Skip showing rules meant for OTHER specific files
                            if (isHiddenHere) return null;

                            return (
                                <div key={i} className={clsx("p-4 rounded-lg border flex items-center justify-between", isExcluded ? "bg-slate-900 border-slate-800 opacity-60" : "bg-slate-800/50 border-slate-700")}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white text-sm">{rule.target_column}</span>
                                            <span className={clsx("text-[10px] px-1.5 rounded border", isGlobal ? "border-blue-500/30 text-blue-400" : "border-emerald-500/30 text-emerald-400")}>
                                                {isGlobal ? "GLOBAL" : "LOCAL"}
                                            </span>
                                            {isExcluded && <span className="text-[10px] px-1.5 rounded border border-red-500/30 text-red-400">IGNORED</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono">
                                            {rule.conditions.map(c => `${c.column} ${c.operator} ${c.value}`).join(' AND ')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Toggle Exclusion Button (Only for Global Rules) */}
                                        {isGlobal && (
                                            <button 
                                                onClick={() => handleToggleException(rule)}
                                                className={clsx("p-2 rounded hover:bg-slate-700", isExcluded ? "text-slate-500" : "text-amber-400")}
                                                title={isExcluded ? "Enable for this file" : "Disable for this file (Add Exception)"}
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-2 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/20"
                                            title="Delete Rule"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default RuleBuilder;