import React from 'react';
import { 
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, 
  Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Brush 
} from 'recharts';

// HELPER: Convert Excel Serial Date to JS Date String
const formatExcelDate = (serial) => {
   // Excel dates (approx years 1990-2050) fall between 30,000 and 60,000
   if (typeof serial === 'number' && serial > 35000 && serial < 60000) {
      const date = new Date((serial - 25569) * 86400 * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // "Jan 26"
   }
   return serial;
};

// HELPER: Draw "Spider Legs" for Donut Labels
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, stroke }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Coordinates for the line
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 10; 
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={stroke} fill="none" opacity={0.5} />
      <circle cx={ex} cy={ey} r={2} fill={stroke} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill="#94a3b8" fontSize={11} dominantBaseline="central">
        {name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey + 12} textAnchor={textAnchor} fill="#fff" fontSize={11} fontWeight="bold" dominantBaseline="central">
        {value}
      </text>
    </g>
  );
};

const ChartRenderer = ({ config, data }) => {
  const { title, type, xAxis, dataKeys: configDataKeys, colors, threshold } = config;

  // --- AUTO-FIX: GHOST LEGEND REMOVER ---
  // Filter out keys that don't exist in the current sheet's data.
  // This solves the issue where "Report" and "Value" appear on sheets that don't have them.
  const availableKeys = data && data.length > 0 ? Object.keys(data[0]) : [];
  const validDataKeys = configDataKeys.filter(k => availableKeys.includes(k));
  
  // If filtering removed everything (rare edge case), fallback to config to avoid crash
  const activeDataKeys = validDataKeys.length > 0 ? validDataKeys : configDataKeys;

  // CALCULATE TOTAL FOR DONUT CENTER
  const totalValue = type === 'donut' 
    ? data.reduce((sum, item) => sum + (Number(item[activeDataKeys[0]]) || 0), 0)
    : 0;

  // RENDER: DONUT CHART (Aesthetic Upgrade)
  if (type === 'donut') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-blue-500/30 transition-colors h-[350px] flex flex-col">
        <h4 className="text-sm font-bold text-slate-300 mb-4 px-2 border-l-4 border-purple-500">{title}</h4>
        <div className="flex-1 w-full min-h-0 relative">
           {/* Center Text */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total</span>
              <span className="text-white text-2xl font-bold">{totalValue.toLocaleString()}</span>
           </div>
           
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70} 
                outerRadius={85}
                paddingAngle={4}
                cornerRadius={5} // Rounded Ends
                dataKey={activeDataKeys[0]} 
                nameKey={xAxis}      
                label={(props) => renderCustomizedLabel({ ...props, stroke: colors[props.index % colors.length] })}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                 itemStyle={{ color: '#fff' }}
                 separator=": "
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // RENDER: BAR / LINE / AREA
  const DataComponent = type === 'line' ? Line : type === 'area' ? Area : Bar;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-blue-500/30 transition-colors h-[350px] flex flex-col">
      <h4 className="text-sm font-bold text-slate-300 mb-4 px-2 border-l-4 border-blue-500">{title}</h4>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey={xAxis} 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dy={10}
              tickFormatter={formatExcelDate} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dx={-10}
            />
            <Tooltip 
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderColor: '#334155', 
                color: '#fff', 
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: '#fff', padding: '4px 0' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
              labelFormatter={formatExcelDate}
              formatter={(value, name) => [`${Number(value).toFixed(4)}`, name]}
            />
            
            {threshold && (
               <ReferenceLine 
                 y={threshold} 
                 stroke="#ef4444" 
                 strokeDasharray="4 4" 
                 label={{ position: 'right', value: 'Limit', fill: '#ef4444', fontSize: 10 }} 
               />
            )}

            {/* Brush for zooming */}
            <Brush 
              dataKey={xAxis} 
              height={25} 
              stroke="#3b82f6"
              fill="#1e293b"
              travellerWidth={10}
              tickFormatter={formatExcelDate}
            />
            
            {activeDataKeys.map((key, index) => {
              // Single Bar Threshold Logic
              if (type === 'bar' && threshold && activeDataKeys.length === 1) {
                return (
                  <Bar key={key} dataKey={key} barSize={40} radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={Number(entry[key]) > threshold ? '#ef4444' : colors[index % colors.length]} 
                      />
                    ))}
                  </Bar>
                )
              }

              // Grouped Logic
              return (
                <DataComponent
                  key={key}
                  type="monotone"
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  stroke={colors[index % colors.length]}
                  fillOpacity={type === 'area' ? 0.2 : 0.8}
                  // Auto-size: If multiple bars, make them thinner (16px) to fit side-by-side
                  barSize={activeDataKeys.length > 1 ? 16 : 40} 
                  strokeWidth={3}
                  radius={[4, 4, 0, 0]}
                  dot={{ r: 5, strokeWidth: 2, fill: colors[index % colors.length] }}
                  activeDot={{ r: 8, strokeWidth: 3, fill: colors[index % colors.length] }}
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