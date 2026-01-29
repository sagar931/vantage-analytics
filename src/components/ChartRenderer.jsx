import React, { useState } from 'react';
import { 
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, 
  Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea 
} from 'recharts';

// --- HELPER 1: PREMIUM SHADE GENERATOR ---
const getColorPalette = (baseColor, count) => {
  const THEMES = {
    '#3b82f6': ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd', '#1d4ed8'], 
    '#ef4444': ['#ef4444', '#f87171', '#dc2626', '#fca5a5', '#b91c1c'], 
    '#10b981': ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'], 
    '#f59e0b': ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#b45309'], 
    '#8b5cf6': ['#8b5cf6', '#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9'], 
  };
  
  const theme = THEMES[baseColor] || THEMES['#3b82f6'];
  if (count <= 1) return [baseColor];
  
  // Generate palette by cycling through the theme shades
  return Array.from({ length: count }, (_, i) => theme[i % theme.length]);
};

// --- HELPER 2: EXCEL DATE FORMATTER ---
const formatExcelDate = (serial) => {
  // If it's already a string like "Jan-25", return it
  if (typeof serial === 'string') return serial;
  // If it's a number (Excel Serial Date)
  if (typeof serial === 'number') {
     const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
     // Return short month format (e.g., "Jan 25")
     return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return serial;
};

// --- HELPER 3: DONUT LABELS ---
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// --- MAIN COMPONENT ---
const ChartRenderer = ({ config, data, onZoom, zoomDomain }) => {
  // Internal state for dragging visual selection
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');

  if (!config || !data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm italic">
        No data available
      </div>
    );
  }

  // Destructure config (Removed manual xAxisAngle)
  const { type, xAxis, dataKeys, threshold, colors = ['#3b82f6'], xAxisAngle = 0 } = config;

  const validDataKeys = (dataKeys || []).filter(key => 
    data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], key)
  );

  const activePalette = getColorPalette(colors[0], validDataKeys.length);

  // --- ZOOM LOGIC: DATA SLICING ---
  const getVisibleData = () => {
    if (!zoomDomain || !zoomDomain.left || !zoomDomain.right) return data;
    const leftIndex = data.findIndex(item => item[xAxis] === zoomDomain.left);
    const rightIndex = data.findIndex(item => item[xAxis] === zoomDomain.right);
    if (leftIndex === -1 || rightIndex === -1) return data;
    const start = Math.min(leftIndex, rightIndex);
    const end = Math.max(leftIndex, rightIndex);
    return data.slice(start, end + 1);
  };

  const visibleData = getVisibleData(); 

  // --- SMART LOGIC: AUTO-ROTATE LABELS ---
  // If visible data points > 6, rotate labels to prevent overlap
  const isDenseData = visibleData.length > 6;
  const autoAxisAngle = isDenseData ? -45 : 0;
  const autoAxisAnchor = isDenseData ? "end" : "middle";
  const autoAxisHeight = isDenseData ? 60 : 30; // Extra height for angled text
  const autoDy = isDenseData ? 5 : 10;

  // --- EVENT HANDLERS ---
  const handleZoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }
    let left = refAreaLeft;
    let right = refAreaRight;
    // Ensure correct order based on data index
    const leftIdx = data.findIndex(i => i[xAxis] === left);
    const rightIdx = data.findIndex(i => i[xAxis] === right);
    if (leftIdx > rightIdx) [left, right] = [right, left];
    
    if (onZoom) onZoom(left, right);
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  // --- 1. TABLE VIEW ---
  if (type === 'table') {
    return (
      <div className="w-full h-full flex flex-col p-4 overflow-hidden">
         <h3 className="text-white font-bold mb-3 pl-2 border-l-4 border-blue-500 uppercase tracking-wider text-sm flex-shrink-0">
            {config.title || 'Data Table'}
         </h3>
         <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/50 custom-scrollbar">            
            <table className="w-full text-left text-sm border-collapse">
               <thead className="sticky top-0 bg-slate-900 z-10 shadow-lg shadow-slate-950/50">
                  <tr>
                     <th className="px-4 py-3 font-semibold text-slate-400 border-b border-slate-700 whitespace-nowrap">
                        {xAxis}
                     </th>
                     {validDataKeys.map((key, i) => (
                        <th key={key} className="px-4 py-3 font-semibold text-slate-300 border-b border-slate-700 whitespace-nowrap text-right">
                           <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: activePalette[i % activePalette.length] }}></span>
                           {key}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {visibleData.map((row, idx) => (
                     <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-2 text-slate-300 font-mono text-xs border-r border-slate-800/50">
                           {formatExcelDate(row[xAxis])}
                        </td>
                        {validDataKeys.map((key) => (
                           <td key={key} className="px-4 py-2 text-slate-200 text-right font-mono text-xs">
                              {Number(row[key])?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '-'}
                           </td>
                        ))}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         </div>
    );
  }

  // --- 2. PIE / DONUT ---
  if (type === 'donut') {
    const dataKey = validDataKeys[0];
    if (!dataKey) return null;

    const pieData = data.reduce((acc, row) => {
      const name = row[xAxis] || 'Unknown';
      const value = Number(row[dataKey]) || 0;
      const existing = acc.find(i => i.name === name);
      if (existing) existing.value += value;
      else acc.push({ name, value });
      return acc;
    }, []);

    return (
       <div className="w-full h-full p-2">
         <h3 className="text-white font-bold mb-2 pl-2 border-l-4 border-blue-500 uppercase tracking-wider text-sm">
            {config.title || dataKey}
         </h3>
         <div className="w-full h-[calc(100%-2rem)]">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={pieData}
                 cx="50%"
                 cy="50%"
                 innerRadius={60}
                 outerRadius={80}
                 paddingAngle={5}
                 dataKey="value"
                 label={renderCustomizedLabel}
               >
                 {pieData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={activePalette[index % activePalette.length]} stroke="rgba(0,0,0,0.2)" />
                 ))}
               </Pie>
               <Tooltip 
                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                 itemStyle={{ color: '#94a3b8' }}
                 formatter={(value) => value.toLocaleString()}
               />
             </PieChart>
           </ResponsiveContainer>
         </div>
       </div>
    );
  }

  // --- 3. STANDARD CHARTS (Bar, Line, Area) ---
  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-2">
         <h3 className="text-white font-bold pl-2 border-l-4 border-blue-500 uppercase tracking-wider text-sm">
            {config.title || 'Untitled Chart'}
         </h3>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
             data={visibleData} 
             margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
             onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
             onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
             onMouseUp={handleZoom}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
            
            <XAxis 
              dataKey={xAxis} 
              tickFormatter={formatExcelDate}
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              
              // FIX: Connect the angle from config
              angle={xAxisAngle} 
              
              // Dynamic Alignment: If rotated, align text to end so it looks neat
              textAnchor={xAxisAngle !== 0 ? "end" : "middle"} 
              
              // Dynamic Height: Give more space if rotated (60px vs 30px)
              height={xAxisAngle !== 0 ? 60 : 30} 
              
              // Dynamic Vertical Offset: Push down slightly if rotated
              dy={xAxisAngle !== 0 ? 10 : 5} 
              
              interval={0} // Force show all labels
            />
            
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />
            
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderColor: '#334155', 
                borderRadius: '8px', 
                color: '#f8fafc',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '12px' }}
              
              // FIX: Apply the same Excel Date Formatting to the Tooltip Header
              labelFormatter={formatExcelDate}
            />
            
            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />

            {threshold && (
               <ReferenceLine y={Number(threshold)} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Threshold', fill: '#ef4444', fontSize: 10 }} />
            )}

            {refAreaLeft && refAreaRight && (
              <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#3b82f6" fillOpacity={0.3} />
            )}

            {validDataKeys.map((key, index) => {
              const seriesColor = activePalette[index % activePalette.length];
              const DataComponent = type === 'bar' ? Bar : (type === 'area' ? Area : Line);
              
              // Special case for single-series Bar chart with threshold
              if (type === 'bar' && threshold && validDataKeys.length === 1) {
                return (
                  <Bar key={key} dataKey={key} barSize={40} radius={[4, 4, 0, 0]}>
                    {visibleData.map((entry, i) => (
                      <Cell 
                        key={`cell-${i}`} 
                        fill={Number(entry[key]) > threshold ? '#ef4444' : seriesColor} 
                      />
                    ))}
                  </Bar>
                )
              }

              return (
                <DataComponent
                  key={key}
                  type="monotone"
                  dataKey={key}
                  fill={seriesColor}    
                  stroke={seriesColor}  
                  fillOpacity={type === 'area' ? 0.2 : 0.8}
                  barSize={validDataKeys.length > 1 ? 12 : 40} // Thinner bars if multiple series
                  strokeWidth={2}
                  radius={[4, 4, 0, 0]}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} 
                />
              )
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartRenderer;