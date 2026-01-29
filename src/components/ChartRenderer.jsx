import React, { useState } from 'react';
import { 
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, 
  Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea, Sector,
  LabelList 
} from 'recharts';

// --- HELPER: DISTINCT COLORS FOR DONUTS ---
const DISTINCT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

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
  return Array.from({ length: count }, (_, i) => theme[i % theme.length]);
};

// --- HELPER 2: EXCEL DATE FORMATTER ---
const formatExcelDate = (serial) => {
  if (typeof serial === 'string') return serial;
  if (typeof serial === 'number') {
     const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
     return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return serial;
};

// --- HELPER 3: PREMIUM CALLOUT LABELS (The "Spider Legs") ---
const renderSmartLabel = (props) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, name, fill, formatter } = props;
  const RADIAN = Math.PI / 180;
  
  // 1. Calculate positions
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Points for the line
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 25) * cos;
  const my = cy + (outerRadius + 25) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 15; // Horizontal extension
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  // Only show label if slice is big enough (> 2%) to prevent clutter
  if (percent < 0.02) return null;

  return (
    <g>
      {/* Connector Line */}
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} opacity={0.6} />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      
      {/* Category Name */}
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#94a3b8" fontSize={10} fontWeight={600} dy={-4}>
        {name}
      </text>
      
      {/* Value & Percent */}
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#e2e8f0" fontSize={11} fontWeight={700} dy={10}>
        {`${(percent * 100).toFixed(0)}% (${formatter ? formatter(value) : value.toLocaleString()})`}
      </text>
    </g>
  );
};


// --- HELPER: PREMIUM TOOLTIP ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#0b1121]/95 backdrop-blur-xl border border-slate-700 p-3 rounded-xl shadow-2xl min-w-[150px]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.fill }}></div>
          <span className="text-sm font-bold text-white">{data.name}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-xs text-slate-400">Value:</span>
          <span className="text-lg font-mono font-bold text-blue-400">
            {data.value.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// --- MAIN COMPONENT ---
const ChartRenderer = ({ config, data, onZoom, zoomDomain }) => {
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');

  if (!config || !data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm italic">
        No data available
      </div>
    );
  }

  const { type, xAxis, dataKeys, threshold, colors = ['#3b82f6'], xAxisAngle = 0, showDataLabels = false } = config;

  // --- HELPER: CURRENCY FORMATTER (Moved Inside) ---
  const formatValue = (val) => {
    if (val === null || val === undefined) return '';
    // If no currency is selected, just use comma separators
    if (!config.currency || config.currency === 'none') return val.toLocaleString();
    
    // Use Intl for robust currency formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: 0, // Clean look (no cents) for charts
      notation: val > 1000000 ? 'compact' : 'standard' // Smart compacting for huge numbers
    }).format(val);
  };

  const validDataKeys = (dataKeys || []).filter(key => 
    data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], key)
  );

  const activePalette = getColorPalette(colors[0], validDataKeys.length);

  // Zoom / Filter Data Logic
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

  // Smart X-Axis Rotation
  const isDenseData = visibleData.length > 6;
  const autoAxisAngle = isDenseData ? -45 : 0;
  const autoAxisAnchor = isDenseData ? "end" : "middle";
  const autoAxisHeight = isDenseData ? 60 : 30;
  const autoDy = isDenseData ? 5 : 10;

  const handleZoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }
    let left = refAreaLeft;
    let right = refAreaRight;
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
                     <th className="px-4 py-3 font-semibold text-slate-400 border-b border-slate-700 whitespace-nowrap">{xAxis}</th>
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
                        <td className="px-4 py-2 text-slate-300 font-mono text-xs border-r border-slate-800/50">{formatExcelDate(row[xAxis])}</td>
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

  // --- 2. PIE / DONUT (PREMIUM UPGRADE) ---
  if (type === 'donut') {
    const isFrequency = dataKeys.includes('Frequency (Count)');
    const dataKey = isFrequency ? 'Frequency (Count)' : validDataKeys[0];
    
    if (!dataKey) return <div className="text-slate-500 flex items-center justify-center h-full">Select a Value</div>;

    const pieData = data.reduce((acc, row) => {
      const name = row[xAxis] || 'Unknown';
      const value = isFrequency ? 1 : (Number(row[dataKey]) || 0);
      const existing = acc.find(i => i.name === name);
      if (existing) existing.value += value;
      else acc.push({ name, value, fill: '' }); 
      return acc;
    }, []).sort((a, b) => b.value - a.value);

    // --- IMPROVED COLOR LOGIC ---
    let activeColors = DISTINCT_COLORS; // Default to Rainbow
    
    if (config.colors && config.colors.length > 0) {
       if (config.colors.length === 1) {
          // Case A: Single Color Selected (e.g. from Widget Toolbar) -> Generate Shades
          activeColors = getColorPalette(config.colors[0], pieData.length);
       } else {
          // Case B: Full Palette Selected (e.g. from Chart Builder) -> Use Palette
          activeColors = config.colors;
       }
    }

    pieData.forEach((entry, index) => {
      entry.fill = activeColors[index % activeColors.length];
    });


    const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);

    return (
       <div className="w-full h-full p-2 flex flex-col relative">
         <h3 className="text-white font-bold mb-1 pl-2 border-l-4 border-blue-500 uppercase tracking-wider text-sm z-10">
            {config.title || (isFrequency ? `${xAxis} Distribution` : dataKey)}
         </h3>
         <div className="flex-1 w-full min-h-0 relative">
           {/* Center Text (Total) */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total</span>
              <span className="text-3xl font-black text-white">{formatValue(totalValue)}</span>
           </div>

           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={pieData}
                 cx="50%"
                 cy="50%"
                 innerRadius="60%" // Thicker ring (60-80%)
                 outerRadius="80%"
                 paddingAngle={5}
                 cornerRadius={6} // Rounded corners for premium feel
                 dataKey="value"
                 stroke="none"
                 label={(props) => renderSmartLabel({ ...props, formatter: formatValue })}
                 labelLine={false} // We draw our own lines in renderSmartLabel
               >
                 {pieData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.fill} />
                 ))}
               </Pie>
               <Tooltip content={<CustomTooltip />} />
             </PieChart>
           </ResponsiveContainer>
         </div>
       </div>
    );
  }

  // --- 3. BAR / LINE / AREA ---
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
             margin={{ top: showDataLabels ? 40 : 10, right: 30, left: 0, bottom: 0 }}
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
              angle={xAxisAngle} 
              textAnchor={xAxisAngle !== 0 ? "end" : "middle"} 
              height={xAxisAngle !== 0 ? 60 : 30} 
              dy={xAxisAngle !== 0 ? 10 : 5} 
              interval={0} 
            />
            <YAxis 
              padding={{ top: 20 }}
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
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
              itemStyle={{ color: '#e2e8f0' }} // <--- FIX: Forces value text to be light
              labelFormatter={formatExcelDate}
              formatter={(value) => [formatValue(value), ""]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }} 
              iconType="circle" 
              formatter={(value) => <span className="text-slate-300 font-medium text-xs">{value}</span>}
            />
            
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
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    name={key} 
                    fill={seriesColor} 
                    barSize={40} 
                    radius={[4, 4, 0, 0]}
                  >
                    {visibleData.map((entry, i) => (
                      <Cell 
                        key={`cell-${i}`} 
                        fill={Number(entry[key]) > threshold ? '#ef4444' : seriesColor} 
                      />
                    ))}
                    {/* NEW: Data Labels for Threshold Bars */}
                    {showDataLabels && (
                      <LabelList 
                        dataKey={key} 
                        position="top" 
                        fill="#94a3b8" 
                        fontSize={10} 
                        formatter={formatValue}
                      />
                    )}
                  </Bar>
                )
              }

              // Standard Charts (Line, Area, Multi-Bar)
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
                >
                   {/* NEW: Data Labels for Standard Charts */}
                   {showDataLabels && (
                      <LabelList 
                        dataKey={key} 
                        position="top" 
                        offset={10}
                        fill="#94a3b8" 
                        fontSize={10} 
                        formatter={formatValue}
                      />
                   )}
                </DataComponent>
              )
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartRenderer;