import React, { useState } from 'react';
import { 
  FileText, 
  FolderPlus, 
  Clock, 
  Star, 
  BarChart2, 
  Folder, 
  Plus,
  Settings,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  X
} from 'lucide-react';
import { ViewMode, Tag, Folder as FolderType } from '../types';

interface UserProfile {
  name: string;
  avatar: string;
}

interface SidebarProps {
  currentView: ViewMode;
  user: UserProfile;
  onChangeView: (view: ViewMode) => void;
  tags: Tag[];
  folders: FolderType[];
  onNewNote: () => void;
  onNewFolder: (name: string, parentId?: string) => void;
  onSelectFolder: (folderId: string) => void;
  onDeleteTag: (tagId: string) => void;
  onOpenSettings: () => void;
  activeFolderId?: string;
}

interface FolderTreeItemProps {
  folder: FolderType;
  allFolders: FolderType[];
  depth?: number;
  expandedFolders: Set<string>;
  activeFolderId?: string;
  isCreatingFolder: { parentId?: string } | null;
  newFolderName: string;
  onToggleExpand: (folderId: string, e: React.MouseEvent) => void;
  onSelectFolder: (folderId: string) => void;
  onStartCreateSubfolder: (folderId: string, e: React.MouseEvent) => void;
  onNewFolderNameChange: (val: string) => void;
  onCreateFolder: () => void;
  onCancelCreate: () => void;
}

const FolderTreeItem: React.FC<FolderTreeItemProps> = ({ 
  folder, 
  allFolders, 
  depth = 0,
  expandedFolders,
  activeFolderId,
  isCreatingFolder,
  newFolderName,
  onToggleExpand,
  onSelectFolder,
  onStartCreateSubfolder,
  onNewFolderNameChange,
  onCreateFolder,
  onCancelCreate
}) => {
  const children = allFolders.filter(f => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedFolders.has(folder.id);
  const isActive = activeFolderId === folder.id;

  return (
    <div className="select-none">
       <div 
         className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors rounded-lg group
           ${isActive 
             ? 'bg-orange-50 text-orange-700' 
             : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
           }`}
         style={{ paddingLeft: `${depth * 16 + 12}px` }}
         onClick={() => onSelectFolder(folder.id)}
       >
         {hasChildren ? (
            <button onClick={(e) => onToggleExpand(folder.id, e)} className="p-0.5 hover:bg-slate-200 rounded">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
         ) : (
            <span className="w-4.5" /> // Spacer for alignment
         )}
         
         <Folder size={16} className={isActive ? 'text-orange-500' : 'text-orange-300'} />
         <span className="flex-1 truncate cursor-pointer">{folder.name}</span>
         
         {/* Quick Add Subfolder Button */}
         <button 
            onClick={(e) => onStartCreateSubfolder(folder.id, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-600 transition-all"
            title="Add subfolder"
         >
            <Plus size={14} />
         </button>
       </div>
       
       {isExpanded && (
           <div>
               {children.map(child => (
                   <FolderTreeItem 
                     key={child.id} 
                     folder={child} 
                     allFolders={allFolders}
                     depth={depth + 1}
                     expandedFolders={expandedFolders}
                     activeFolderId={activeFolderId}
                     isCreatingFolder={isCreatingFolder}
                     newFolderName={newFolderName}
                     onToggleExpand={onToggleExpand}
                     onSelectFolder={onSelectFolder}
                     onStartCreateSubfolder={onStartCreateSubfolder}
                     onNewFolderNameChange={onNewFolderNameChange}
                     onCreateFolder={onCreateFolder}
                     onCancelCreate={onCancelCreate}
                   />
               ))}
               {/* Input for Nested Folder */}
               {isCreatingFolder?.parentId === folder.id && (
                   <div className="pr-4 py-1" style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}>
                        <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-2 py-1.5 shadow-sm ring-2 ring-blue-500/10">
                            <CornerDownRight size={14} className="text-slate-400" />
                            <input 
                                autoFocus
                                value={newFolderName}
                                onChange={(e) => onNewFolderNameChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onCreateFolder();
                                    if (e.key === 'Escape') onCancelCreate();
                                }}
                                onBlur={onCancelCreate}
                                placeholder="Subfolder name..."
                                className="w-full text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none bg-transparent min-w-0"
                            />
                        </div>
                    </div>
               )}
           </div>
       )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  user,
  onChangeView, 
  tags, 
  folders,
  onNewNote,
  onNewFolder,
  onSelectFolder,
  onDeleteTag,
  onOpenSettings,
  activeFolderId
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState<{parentId?: string} | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onNewFolder(newFolderName.trim(), isCreatingFolder?.parentId);
      setNewFolderName("");
      setIsCreatingFolder(null);
    } else {
      setIsCreatingFolder(null);
    }
  };

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };
  
  const handleStartCreateSubfolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => new Set(prev).add(folderId));
    setIsCreatingFolder({ parentId: folderId });
    setNewFolderName("");
  };

  const NavItem = ({ 
    icon: Icon, 
    label, 
    view, 
    isActive 
  }: { 
    icon: React.ElementType, 
    label: string, 
    view: ViewMode, 
    isActive?: boolean 
  }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 
        ${isActive 
          ? 'bg-blue-100/80 text-blue-700' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
      {label}
    </button>
  );

  // Get root folders
  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div className="w-64 min-h-screen bg-slate-50 border-r border-slate-200 flex flex-col p-4 flex-shrink-0">
      {/* User Profile */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-slate-800">Hi, {user.name}</h2>
        </div>
        <button 
          onClick={onOpenSettings}
          className="p-1 rounded-full hover:bg-slate-200 transition-colors"
        >
          <Settings size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
        </button>
      </div>

      {/* Primary Actions */}
      <div className="space-y-2 mb-8">
        <button 
          onClick={onNewNote}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-full shadow-sm hover:shadow-md transition-all text-sm font-bold active:scale-95"
        >
          <Plus size={18} />
          New Note
        </button>
        <button 
          onClick={() => {
            setIsCreatingFolder({}); // Empty object means root
            setNewFolderName("");
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-slate-200 text-slate-600 rounded-full hover:bg-slate-100 transition-all text-sm font-medium active:scale-95"
        >
          <FolderPlus size={18} />
          New Folder
        </button>
      </div>

      {/* Main Navigation */}
      <div className="space-y-1 mb-8">
        <NavItem 
          icon={FileText} 
          label="All Notes" 
          view="all-notes" 
          isActive={currentView === 'all-notes' && !activeFolderId} 
        />
        <NavItem 
          icon={Clock} 
          label="Recent" 
          view="recent"
          isActive={currentView === 'recent'} 
        />
        <NavItem 
          icon={Star} 
          label="Favorites" 
          view="favorites"
          isActive={currentView === 'favorites'} 
        />
        <NavItem 
          icon={BarChart2} 
          label="Statistics" 
          view="stats" 
          isActive={currentView === 'stats'} 
        />
      </div>

      {/* Folders */}
      <div className="mb-8 flex-1 overflow-y-auto">
        <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Folders</h3>
        <div className="space-y-0.5">
          {rootFolders.map(folder => (
            <FolderTreeItem 
              key={folder.id} 
              folder={folder} 
              allFolders={folders}
              expandedFolders={expandedFolders}
              activeFolderId={activeFolderId}
              isCreatingFolder={isCreatingFolder}
              newFolderName={newFolderName}
              onToggleExpand={toggleFolderExpand}
              onSelectFolder={onSelectFolder}
              onStartCreateSubfolder={handleStartCreateSubfolder}
              onNewFolderNameChange={setNewFolderName}
              onCreateFolder={handleCreateFolder}
              onCancelCreate={() => setIsCreatingFolder(null)}
            />
          ))}
          
          {/* Root Level Creator */}
          {isCreatingFolder && !isCreatingFolder.parentId && (
            <div className="px-4 py-1 animate-in fade-in zoom-in-95 duration-200">
               <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-2 shadow-sm ring-2 ring-blue-500/10">
                   <Folder size={18} className="text-blue-400" />
                   <input 
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFolder();
                        if (e.key === 'Escape') setIsCreatingFolder(null);
                      }}
                      onBlur={() => setIsCreatingFolder(null)}
                      placeholder="Folder name..."
                      className="w-full text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none bg-transparent min-w-0"
                   />
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2 px-2">
          {tags.map(tag => (
            <div 
                key={tag.id} 
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${tag.color} opacity-80 hover:opacity-100 cursor-default transition-all`}
            >
              <span>#{tag.name}</span>
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTag(tag.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-black/10 rounded p-0.5 transition-opacity"
              >
                  <X size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;