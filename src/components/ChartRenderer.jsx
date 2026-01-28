import React, { useState } from 'react';
import { 
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, 
  Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea 
} from 'recharts';

// --- HELPER 1: PREMIUM SHADE GENERATOR ---
const getColorPalette = (baseColor, count) => {
  const THEMES = {
    '#3b82f6': ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd', '#1d4ed8'], // Blue
    '#ef4444': ['#ef4444', '#f87171', '#dc2626', '#fca5a5', '#b91c1c'], // Red
    '#10b981': ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'], // Green
    '#f59e0b': ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#b45309'], // Orange
    '#8b5cf6': ['#8b5cf6', '#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9'], // Purple
    '#ec4899': ['#ec4899', '#f472b6', '#db2777', '#fbcfe8', '#be185d'], // Pink
  };

  if (THEMES[baseColor]) {
    if (count <= 5) return THEMES[baseColor].slice(0, count);
    return Array(count).fill(0).map((_, i) => THEMES[baseColor][i % 5]);
  }
  return Array(count).fill(0).map((_, i) => baseColor); 
};

// --- HELPER 2: DATE FORMATTER ---
const formatExcelDate = (serial) => {
   if (typeof serial === 'number' && serial > 35000 && serial < 60000) {
      const date = new Date((serial - 25569) * 86400 * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); 
   }
   return serial;
};

// --- HELPER 3: DONUT LABELS ---
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, stroke }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const ex = cx + (outerRadius + 20) * cos;
  const ey = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#94a3b8" fontSize={12} dy={4}>
        {name} ({value.toLocaleString()})
      </text>
    </g>
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

  const { type, xAxis, dataKeys, threshold, colors = ['#3b82f6'] } = config;

  const validDataKeys = (dataKeys || []).filter(key => 
    data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], key)
  );

  const activePalette = getColorPalette(colors[0], validDataKeys.length);

  // --- ZOOM LOGIC: DATA SLICING ---
  // Instead of relying on Axis Domain, we physically slice the data array.
  // This guarantees granularity even for Categorical data (Strings).
  const getVisibleData = () => {
    if (!zoomDomain || !zoomDomain.left || !zoomDomain.right) return data;

    const leftIndex = data.findIndex(item => item[xAxis] === zoomDomain.left);
    const rightIndex = data.findIndex(item => item[xAxis] === zoomDomain.right);

    if (leftIndex === -1 || rightIndex === -1) return data;

    const start = Math.min(leftIndex, rightIndex);
    const end = Math.max(leftIndex, rightIndex);

    return data.slice(start, end + 1);
  };

  const visibleData = getVisibleData(); // Use this for rendering!

  // --- EVENT HANDLERS ---
  const handleZoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    // Identify indices to ensure correct order
    let left = refAreaLeft;
    let right = refAreaRight;
    
    // Check indices to handle Right-to-Left drag
    const leftIdx = data.findIndex(i => i[xAxis] === left);
    const rightIdx = data.findIndex(i => i[xAxis] === right);

    if (leftIdx > rightIdx) [left, right] = [right, left];

    if (onZoom) onZoom(left, right);
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  // --- PIE / DONUT ---
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

  // --- BAR / LINE / AREA ---
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
             data={visibleData} // <--- FIX: Use sliced data
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
              dy={10}
              // Removed 'domain' prop here because we are physically slicing the data
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
            />
            
            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />

            {threshold && (
               <ReferenceLine y={Number(threshold)} stroke="#ef4444" strokeDasharray="3 3" />
            )}

            {/* Drag Selection Box - Show it on FULL data context if needed, but here simple box is fine */}
            {refAreaLeft && refAreaRight && (
              <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#3b82f6" fillOpacity={0.3} />
            )}

            {validDataKeys.map((key, index) => {
              const seriesColor = activePalette[index % activePalette.length];
              const DataComponent = type === 'bar' ? Bar : (type === 'area' ? Area : Line);
              
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
                  barSize={validDataKeys.length > 1 ? 12 : 40}
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