import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, Edit3, Trash2, Pin, Clock, FileText as FileIcon, Star, Check, X } from 'lucide-react';
import { Note, Tag, Folder } from '../types';

interface ListViewProps {
  title: string;
  notes: Note[];
  tags: Tag[];
  folders: Folder[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

type DateFilter = 'all' | '7days' | '30days';

const ListView: React.FC<ListViewProps> = ({ 
  title,
  notes, 
  tags, 
  onEditNote,
  onDeleteNote,
  onTogglePin,
  onToggleFavorite
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Filters
  const [filterDate, setFilterDate] = useState<DateFilter>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]); // Array of Tag IDs

  const getTag = (id: string) => tags.find(t => t.id === id);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // 1. Text Search
      const matchesSearch = 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        note.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Date Filter
      let matchesDate = true;
      if (filterDate !== 'all') {
          const noteDate = new Date(note.updatedAt).getTime();
          const now = new Date().getTime();
          const oneDay = 24 * 60 * 60 * 1000;
          if (filterDate === '7days') {
              matchesDate = (now - noteDate) <= (7 * oneDay);
          } else if (filterDate === '30days') {
              matchesDate = (now - noteDate) <= (30 * oneDay);
          }
      }

      // 3. Tag Filter (OR logic: note must have at least one of the selected tags)
      //    If no tags selected, show all.
      let matchesTags = true;
      if (filterTags.length > 0) {
          matchesTags = note.tags.some(tId => filterTags.includes(tId));
      }

      return matchesSearch && matchesDate && matchesTags;
    });
  }, [notes, searchTerm, filterDate, filterTags]);

  const toggleTagFilter = (tagId: string) => {
      setFilterTags(prev => 
          prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
      );
  };

  const clearFilters = () => {
      setFilterDate('all');
      setFilterTags([]);
      setSearchTerm('');
  };

  const activeFiltersCount = (filterDate !== 'all' ? 1 : 0) + filterTags.length;

  // Heatmap Data Calculation
  const heatmapWeeks = useMemo(() => {
    const weeks = [];
    const today = new Date();
    
    // Determine how many weeks to show (fill the width roughly)
    const weeksToShow = 20; 
    
    // Calculate Start Date: 
    // Go back 'weeksToShow' weeks, then find the Sunday of that week to start the grid cleanly.
    const start = new Date(today);
    start.setDate(today.getDate() - (weeksToShow * 7));
    const dayOfWeek = start.getDay(); // 0 is Sunday
    start.setDate(start.getDate() - dayOfWeek); // Shift to previous Sunday
    
    // Create map for quick lookup of activity counts
    const activityMap = new Map<string, number>();
    notes.forEach(note => {
        // Count both creation and updates using local date string for accuracy
        const cDate = new Date(note.createdAt).toDateString();
        const uDate = new Date(note.updatedAt).toDateString();
        activityMap.set(cDate, (activityMap.get(cDate) || 0) + 1);
        if (cDate !== uDate) {
             activityMap.set(uDate, (activityMap.get(uDate) || 0) + 1);
        }
    });

    let current = new Date(start);
    
    // Generate Grid Data: Weeks > Days
    // We generate weeksToShow + 1 to ensure we cover up to today
    for (let w = 0; w <= weeksToShow; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const dateStr = current.toDateString();
            const count = activityMap.get(dateStr) || 0;
            
            // Logic to handle future dates (don't render a box)
            // Comparison: current > today (ignoring time)
            const isFuture = current.setHours(0,0,0,0) > today.setHours(0,0,0,0);
            
            week.push({
                date: new Date(current),
                count: isFuture ? -1 : count,
                formattedDate: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
            
            // Move to next day
            current.setDate(current.getDate() + 1);
        }
        weeks.push(week);
    }
    return weeks;
  }, [notes]);

  const getIntensityClass = (count: number) => {
      if (count === 0) return 'bg-slate-100';
      if (count === 1) return 'bg-green-200';
      if (count <= 3) return 'bg-green-300';
      if (count <= 5) return 'bg-green-400';
      return 'bg-green-600';
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
            <div className="flex gap-3 relative" ref={filterRef}>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search notes..." 
                        className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white w-64 transition-all shadow-sm text-slate-800 placeholder:text-slate-400"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`p-2.5 border rounded-xl transition-colors shadow-sm flex items-center gap-2 ${isFilterOpen || activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <Filter size={18} />
                    {activeFiltersCount > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem]">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

                {/* Filters Dropdown */}
                {isFilterOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-700">Filter Notes</h3>
                            <button onClick={clearFilters} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Reset</button>
                        </div>
                        
                        {/* Date Filter */}
                        <div className="mb-4">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Date Modified</label>
                            <select 
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value as DateFilter)}
                                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-slate-800"
                            >
                                <option value="all">All Time</option>
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                            </select>
                        </div>

                        {/* Tags Filter */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Tags</label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {tags.map(tag => {
                                    const isSelected = filterTags.includes(tag.id);
                                    return (
                                        <button 
                                            key={tag.id}
                                            onClick={() => toggleTagFilter(tag.id)}
                                            className={`px-2 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1
                                                ${isSelected 
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {isSelected && <Check size={10} />}
                                            #{tag.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Improved Heatmap Section */}
        {title === 'All Notes' && !searchTerm && filterDate === 'all' && filterTags.length === 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Less</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                        </div>
                        <span>More</span>
                    </div>
                </div>
                
                {/* Scrollable Container for the Grid */}
                <div className="overflow-x-auto pb-2">
                    <div className="flex gap-1">
                        {/* Day Labels Column */}
                        <div className="flex flex-col gap-1 justify-between py-[2px] pr-2 text-[10px] text-slate-300 font-medium h-[100px]">
                             <span>Mon</span>
                             <span>Wed</span>
                             <span>Fri</span>
                        </div>

                        {/* Weeks Columns */}
                        {heatmapWeeks.map((week, wIndex) => (
                            <div key={wIndex} className="flex flex-col gap-1">
                                {week.map((day, dIndex) => (
                                   day.count === -1 ? (
                                       <div key={dIndex} className="w-3 h-3" /> // Invisible placeholder for future days
                                   ) : (
                                       <div 
                                          key={dIndex} 
                                          className={`w-3 h-3 rounded-[2px] transition-all hover:ring-2 ring-offset-1 ring-blue-300 cursor-help ${getIntensityClass(day.count)}`}
                                          title={`${day.formattedDate}: ${day.count} activities`}
                                       />
                                   )
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="text-xs text-slate-400 mt-2 px-1 text-right">
                    Last ~5 months
                </div>
            </div>
        )}

        {/* Notes List */}
        <div className="space-y-4 pb-10">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <p>No notes found matching your filters.</p>
                {(filterDate !== 'all' || filterTags.length > 0 || searchTerm) && (
                    <button onClick={clearFilters} className="mt-2 text-blue-600 hover:underline text-sm">
                        Clear all filters
                    </button>
                )}
              </div>
            ) : (
              filteredNotes.map(note => (
                  <div key={note.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                  <FileIcon size={20} />
                              </div>
                              <h3 className="font-bold text-slate-800 text-lg cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onEditNote(note)}>
                                {note.title}
                              </h3>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-1 text-slate-400">
                              <button 
                                onClick={() => onToggleFavorite(note.id)}
                                className={`p-2 rounded-lg hover:bg-slate-50 transition-colors ${note.isFavorite ? 'text-amber-400 fill-current' : 'hover:text-amber-400'}`}
                                title="Favorite"
                              >
                                <Star size={18} className={note.isFavorite ? "fill-current" : ""} />
                              </button>
                              
                              <button 
                                onClick={() => onTogglePin(note.id)}
                                className={`p-2 rounded-lg hover:bg-slate-50 transition-colors ${note.isPinned ? 'text-blue-600' : 'hover:text-blue-600'}`}
                                title="Pin"
                              >
                                <Pin size={18} className={note.isPinned ? "fill-current" : ""} />
                              </button>

                              <button onClick={() => onEditNote(note)} className="p-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors" title="Edit">
                                <Edit3 size={18} />
                              </button>
                              
                              <button onClick={() => onDeleteNote(note.id)} className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                                <Trash2 size={18} />
                              </button>
                          </div>
                      </div>
                      
                      <div onClick={() => onEditNote(note)} className="cursor-pointer">
                        <p className="text-slate-600 text-sm mb-5 line-clamp-2 leading-relaxed pl-1">
                            {note.content}
                        </p>

                        <div className="flex items-center gap-4 text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                <Clock size={12} />
                                {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                            </span>
                            
                            <div className="flex gap-2">
                                {note.tags.map(tagId => {
                                    const tag = getTag(tagId);
                                    if (!tag) return null;
                                    return (
                                        <span key={tagId} className={`px-2 py-1 rounded-md ${tag.color}`}>
                                            #{tag.name}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                      </div>
                  </div>
              ))
            )}
        </div>
    </div>
  );
};

export default ListView;