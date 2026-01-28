import React from 'react';
import { 
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, 
  Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';

// HELPER: Convert Excel Serial Date to JS Date String
const formatExcelDate = (serial) => {
   // Excel dates (approx years 1990-2050) fall between 30,000 and 60,000
   if (typeof serial === 'number' && serial > 35000 && serial < 60000) {
      // Excel base date delta
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
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 15; // Horizontal extension
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={stroke} fill="none" opacity={0.6} />
      <circle cx={ex} cy={ey} r={2} fill={stroke} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#94a3b8" fontSize={11} dominantBaseline="central">
        {name}: {value}
      </text>
    </g>
  );
};

const ChartRenderer = ({ config, data }) => {
  const { title, type, xAxis, dataKeys, colors, threshold } = config;

  // RENDER: DONUT CHART (Aesthetic Upgrade)
  if (type === 'donut') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-blue-500/30 transition-colors h-[350px] flex flex-col">
        <h4 className="text-sm font-bold text-slate-300 mb-4 px-2 border-l-4 border-purple-500">{title}</h4>
        <div className="flex-1 w-full min-h-0 relative">
           {/* Center Text */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-600 text-xs font-mono opacity-50">TOTAL</span>
           </div>
           
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65} // Thin Donut
                outerRadius={80}
                paddingAngle={4}
                dataKey={dataKeys[0]} 
                nameKey={xAxis}      
                label={(props) => renderCustomizedLabel({ ...props, stroke: colors[props.index % colors.length] })}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              {/* Tooltip for precise data */}
              <Tooltip 
                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                 itemStyle={{ color: '#fff' }}
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
          <ComposedChart data={data} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey={xAxis} 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dy={10}
              // FIX: Auto-Format Excel Dates
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
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              labelFormatter={formatExcelDate} // Format Date in Tooltip too
            />
            
            {threshold && (
               <ReferenceLine 
                 y={threshold} 
                 stroke="#ef4444" 
                 strokeDasharray="4 4" 
                 label={{ position: 'right', value: 'Limit', fill: '#ef4444', fontSize: 10 }} 
               />
            )}

            <Legend wrapperStyle={{ paddingTop: '15px' }} iconType="circle" />
            
            {dataKeys.map((key, index) => {
              // Threshold Red Logic (Single Bar)
              if (type === 'bar' && threshold && dataKeys.length === 1) {
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
                  barSize={dataKeys.length > 1 ? 12 : 40} // Thinner bars for Side-by-Side
                  strokeWidth={3}
                  radius={[4, 4, 0, 0]}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
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