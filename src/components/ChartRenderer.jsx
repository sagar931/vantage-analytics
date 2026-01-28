import React from 'react';
import { 
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, 
  Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';

// --- HELPER: PREMIUM SHADE GENERATOR ---
// This ensures multi-line charts look professional, not random.
const getColorPalette = (baseColor, count) => {
  // 1. Define Curated Palettes for your Standard Themes
  const THEMES = {
    '#3b82f6': ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd', '#1d4ed8'], // Blue
    '#ef4444': ['#ef4444', '#f87171', '#dc2626', '#fca5a5', '#b91c1c'], // Red
    '#10b981': ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'], // Green
    '#f59e0b': ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#b45309'], // Orange
    '#8b5cf6': ['#8b5cf6', '#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9'], // Purple
    '#ec4899': ['#ec4899', '#f472b6', '#db2777', '#fbcfe8', '#be185d'], // Pink
  };

  // 2. Return curated shades if available
  if (THEMES[baseColor]) {
    // If we need more colors than available, loop them
    if (count <= 5) return THEMES[baseColor].slice(0, count);
    return Array(count).fill(0).map((_, i) => THEMES[baseColor][i % 5]);
  }

  // 3. Fallback for custom colors (Opacity Variance)
  return Array(count).fill(0).map((_, i) => baseColor); 
};

// HELPER: Convert Excel Serial Date to JS Date String
const formatExcelDate = (serial) => {
   if (typeof serial === 'number' && serial > 35000 && serial < 60000) {
      const date = new Date((serial - 25569) * 86400 * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); 
   }
   return serial;
};

// HELPER: Donut Label Render
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, stroke }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={stroke} fill="none"/>
      <circle cx={sx} cy={sy} r={2} fill={stroke} stroke="none"/>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#94a3b8" fontSize={12} dy={4}>
        {name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#f8fafc" fontSize={12} fontWeight="bold">
        {value.toLocaleString()}
      </text>
    </g>
  );
};

const ChartRenderer = ({ config, data }) => {
  if (!config || !data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm italic">
        No data available
      </div>
    );
  }

  const { type, xAxis, dataKeys, threshold, colors = ['#3b82f6'] } = config;

  // 1. FILTER: Ensure keys exist in data
  const validDataKeys = (dataKeys || []).filter(key => 
    data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], key)
  );

  // 2. PALETTE: Generate Shades if multiple keys exist
  // We use the first color from the prop as the "Base Color"
  const activePalette = getColorPalette(colors[0], validDataKeys.length);

  // 3. PIE/DONUT RENDERER
  if (type === 'donut') {
    const dataKey = validDataKeys[0];
    if (!dataKey) return null;

    // Aggregate data for Pie
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
                 labelLine={false}
               >
                 {pieData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={activePalette[index % activePalette.length]} stroke="rgba(0,0,0,0.2)" />
                 ))}
               </Pie>
               <Tooltip 
                 contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                 itemStyle={{ color: '#94a3b8' }}
                 formatter={(value) => value.toLocaleString()}
               />
             </PieChart>
           </ResponsiveContainer>
         </div>
       </div>
    );
  }

  // 4. MAIN CHART RENDERER (Bar, Line, Area)
  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-2">
         <h3 className="text-white font-bold pl-2 border-l-4 border-blue-500 uppercase tracking-wider text-sm flex items-center gap-2">
            {config.title || 'Untitled Chart'}
         </h3>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
            
            <XAxis 
              dataKey={xAxis} 
              tickFormatter={formatExcelDate}
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              dy={10}
            />
            
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />
            
            {/* --- FIX: HIGH VISIBILITY TOOLTIP --- */}
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ 
                backgroundColor: '#0f172a', // Premium Dark
                borderColor: '#334155', 
                borderRadius: '8px', 
                color: '#f8fafc',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '12px' }}
              itemStyle={{ padding: 0 }}
            />
            
            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />

            {/* Threshold Line */}
            {threshold && (
               <ReferenceLine y={Number(threshold)} stroke="#ef4444" strokeDasharray="3 3">
               </ReferenceLine>
            )}

            {/* Render Series with Premium Shades */}
            {validDataKeys.map((key, index) => {
              // Assign distinct shade from generated palette
              const seriesColor = activePalette[index % activePalette.length];

              // Component Type Selection
              const DataComponent = type === 'bar' ? Bar : (type === 'area' ? Area : Line);
              
              // Special Case: Single Bar Chart with Threshold Alert
              if (type === 'bar' && threshold && validDataKeys.length === 1) {
                return (
                  <Bar key={key} dataKey={key} barSize={40} radius={[4, 4, 0, 0]}>
                    {data.map((entry, i) => (
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
                  fill={seriesColor}    // Use Shade
                  stroke={seriesColor}  // Use Shade
                  fillOpacity={type === 'area' ? 0.2 : 0.8}
                  barSize={validDataKeys.length > 1 ? 12 : 40} // Thinner bars if multiple
                  strokeWidth={2}
                  radius={[4, 4, 0, 0]}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} // White dot on hover for contrast
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