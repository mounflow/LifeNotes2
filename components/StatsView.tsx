
import React, { useMemo } from 'react';
import { FileText, Calendar, Lightbulb, Trophy } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Note, Tag } from '../types';
import { TAGS } from '../constants';

interface StatsViewProps {
  notes: Note[];
}

// Custom Label Component for Pie Chart matching the specific design
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, stroke, index, name } = props;
  const RADIAN = Math.PI / 180;
  
  // Calculate positions
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  
  // Start point (edge of slice)
  const sx = cx + (outerRadius) * cos;
  const sy = cy + (outerRadius) * sin;
  
  // End point (Straight line out)
  const labelRadius = outerRadius + 20; 
  const ex = cx + labelRadius * cos;
  const ey = cy + labelRadius * sin;
  
  // Pill Dimensions
  const pillWidth = 76;
  const pillHeight = 26;
  
  // Label Position logic:
  // If on right side (cos >= 0), pill starts at the end of the line
  // If on left side (cos < 0), pill ends at the end of the line (x - width)
  const x = cos >= 0 ? ex : ex - pillWidth;
  const y = ey - (pillHeight / 2);

  return (
    <g className="pointer-events-none">
      {/* Straight Line */}
      <path d={`M${sx},${sy}L${ex},${ey}`} stroke="#cbd5e1" strokeWidth={1.5} fill="none" />
      
      {/* Label Pill */}
      <foreignObject x={x} y={y} width={pillWidth} height={pillHeight}>
        <div className={`w-full h-full bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center ${cos >= 0 ? 'ml-1' : 'mr-1'}`}>
            <span className="text-[11px] font-bold text-slate-600 truncate px-2">#{name}</span>
        </div>
      </foreignObject>
    </g>
  );
};

const StatsView: React.FC<StatsViewProps> = ({ notes }) => {
  // 1. Calculate Basic KPIs
  const totalNotes = notes.length;
  const activeDays = new Set(notes.map(n => new Date(n.createdAt).toDateString())).size;
  const thoughtsRecorded = notes.reduce((acc, note) => acc + note.content.split(/\s+/).length, 0);

  // 2. Weekly Activity Grid Data (Last 4 Weeks)
  const activityGrid = useMemo(() => {
    const grid = [];
    const today = new Date();
    // Normalize to start of today
    today.setHours(0, 0, 0, 0);

    // Find the Monday of the current week
    const currentDay = today.getDay(); // 0 is Sun
    const distanceToMon = currentDay === 0 ? 6 : currentDay - 1;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - distanceToMon);

    // Generate 4 weeks back
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(weekStart.getDate() - (w * 7));
      
      const weekData = {
        label: weekStart.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        days: [] as { date: Date, count: number, intensity: number }[]
      };

      // Generate Mon-Sun for this week
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + d);
        
        const dateStr = dayDate.toDateString();
        // Count activity for this day
        const count = notes.filter(n => 
          new Date(n.createdAt).toDateString() === dateStr || 
          new Date(n.updatedAt).toDateString() === dateStr
        ).length;

        // Calculate intensity (0-1)
        let intensity = 0;
        if (count > 0) intensity = 0.4;
        if (count > 2) intensity = 0.7;
        if (count > 4) intensity = 1.0;

        weekData.days.push({
          date: dayDate,
          count,
          intensity
        });
      }
      grid.push(weekData);
    }
    return grid;
  }, [notes]);

  // 3. Top Tags Data (Dynamic)
  const pieData = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    
    notes.forEach(note => {
      note.tags.forEach(tagId => {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
      });
    });

    const data = Object.entries(tagCounts)
      .map(([tagId, count]) => {
        const tagDef = TAGS.find(t => t.id === tagId);
        
        // VISUAL DESIGN OVERRIDE:
        // Enforce specific colors for specific tag logic to match the requested design
        let fill = '#60a5fa'; // Default Blue
        
        if (tagId === 'family') fill = '#4ade80';      // Light Green
        else if (tagId === 'personal') fill = '#15803d'; // Dark Green
        else if (tagId === 'work') fill = '#f87171';     // Red/Pink
        else if (tagId === 'renro') fill = '#facc15';    // Yellow
        else if (tagDef) {
             // Fallback to class mapping if not a primary tag
            if (tagDef.color.includes('red')) fill = '#f87171';
            else if (tagDef.color.includes('blue')) fill = '#60a5fa';
            else if (tagDef.color.includes('green')) fill = '#4ade80';
            else if (tagDef.color.includes('yellow')) fill = '#facc15';
            else if (tagDef.color.includes('purple')) fill = '#c084fc';
            else if (tagDef.color.includes('pink')) fill = '#f472b6';
            else if (tagDef.color.includes('indigo')) fill = '#818cf8';
            else if (tagDef.color.includes('orange')) fill = '#fb923c';
        }

        return {
          name: tagDef?.name || tagId,
          value: count,
          fill: fill,
          id: tagId
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    // If no data, show placeholder
    if (data.length === 0) {
      return [{ name: 'No Tags', value: 1, fill: '#f1f5f9', id: 'none' }];
    }
    
    return data;
  }, [notes]);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-white">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Weekly Statistics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-2xl flex items-center gap-4 border border-blue-100 shadow-sm transition-transform hover:scale-[1.02]">
          <div className="w-12 h-12 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center shadow-inner">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Notes Created:</p>
            <p className="text-2xl font-bold text-slate-800">{totalNotes}</p>
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-2xl flex items-center gap-4 border border-green-100 shadow-sm transition-transform hover:scale-[1.02]">
          <div className="w-12 h-12 rounded-full bg-green-200 text-green-700 flex items-center justify-center shadow-inner">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Days:</p>
            <p className="text-2xl font-bold text-slate-800">{activeDays}</p>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-2xl flex items-center gap-4 border border-amber-100 shadow-sm transition-transform hover:scale-[1.02]">
          <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center shadow-inner">
            <Lightbulb size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Thoughts Recorded:</p>
            <p className="text-2xl font-bold text-slate-800">{thoughtsRecorded}</p>
          </div>
        </div>
      </div>

      {/* Charts Section - Unified Card Background matching original image */}
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Weekly Activity Grid */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Activity & Tags</h3>
            
            <div className="flex gap-4">
               {/* Y Axis Labels (Days) */}
               <div className="flex flex-col justify-between py-[2px] mt-6 h-48 text-xs text-slate-400 font-medium w-8">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
               </div>
               
               {/* Columns (Weeks) */}
               <div className="flex justify-between flex-1 max-w-md px-2">
                   {activityGrid.map((week, wIndex) => (
                     <div key={wIndex} className="flex flex-col gap-2">
                        {/* X Axis Label (Date) */}
                        <span className="text-xs text-slate-400 text-center font-medium h-4 tracking-tight">{week.label}</span>
                        
                        {/* Day Cells */}
                        <div className="flex flex-col gap-2 h-48 justify-between">
                          {week.days.map((day, dIndex) => (
                            <div 
                                key={dIndex}
                                className={`w-12 h-5 rounded-md transition-all duration-300 hover:scale-110 cursor-help
                                  ${day.count === 0 ? 'bg-slate-200/50' : ''}
                                `}
                                style={{ 
                                  backgroundColor: day.count > 0 ? '#4ade80' : undefined,
                                  opacity: day.count === 0 ? 1 : Math.max(0.5, day.intensity)
                                }}
                                title={`${day.date.toDateString()}: ${day.count} activities`}
                            />
                          ))}
                        </div>
                     </div>
                   ))}
               </div>
            </div>
          </div>

          {/* Top Tags Pie Chart - Styled to match screenshot */}
          <div className="flex-1 lg:border-l border-slate-200 lg:pl-8 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2 pl-2">Top Tags</h3>
            <div className="flex-1 flex items-center justify-center relative min-h-[250px]">
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40} // Thicker Ring
                      outerRadius={80}
                      paddingAngle={2} // Small Gap
                      dataKey="value"
                      stroke="none"
                      cornerRadius={0} // Sharp right angles as requested
                      label={renderCustomizedLabel}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl flex items-center gap-6 border border-blue-100 shadow-sm">
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <Trophy className="text-amber-400 drop-shadow-sm" size={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Keep it up!</h3>
          <p className="text-slate-600">Consistency is key to growth. You're doing great this week.</p>
        </div>
      </div>
    </div>
  );
};

export default StatsView;
