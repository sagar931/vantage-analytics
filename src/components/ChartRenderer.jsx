import React from 'react';
import { 
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, 
  Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';

const ChartRenderer = ({ config, data }) => {
  const { title, type, xAxis, dataKeys, colors, threshold } = config;

  // RENDER: DONUT CHART
  if (type === 'donut') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-blue-500/30 transition-colors h-[350px] flex flex-col">
        <h4 className="text-sm font-bold text-slate-300 mb-4 px-2 border-l-4 border-purple-500">{title}</h4>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60} 
                outerRadius={80}
                paddingAngle={5}
                dataKey={dataKeys[0]} 
                nameKey={xAxis}      
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(0,0,0,0.5)" />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                 itemStyle={{ color: '#fff' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ color: '#94a3b8' }}
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
            />
            
            {/* THRESHOLD LINE */}
            {threshold && (
               <ReferenceLine 
                 y={threshold} 
                 stroke="#ef4444" 
                 strokeDasharray="4 4" 
                 label={{ position: 'right', value: 'Threshold', fill: '#ef4444', fontSize: 10 }} 
               />
            )}

            <Legend 
              wrapperStyle={{ paddingTop: '10px' }} 
              iconType="circle"
            />
            
            {dataKeys.map((key, index) => {
              // Custom Bar Logic for Thresholds (Only applies if SINGLE series)
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

              // Standard Logic (Grouped Bars, Line, Area)
              return (
                <DataComponent
                  key={key}
                  type="monotone"
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  stroke={colors[index % colors.length]}
                  fillOpacity={type === 'area' ? 0.2 : 0.8}
                  barSize={dataKeys.length > 1 ? 20 : 40} // Thinner bars if grouped
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