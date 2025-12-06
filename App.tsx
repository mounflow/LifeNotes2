import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import StatsView from './components/StatsView';
import ListView from './components/ListView';
import EditorView from './components/EditorView';
import AuthView from './components/AuthView';
import { Note, ViewMode, Folder, Tag } from './types';
import { api } from './services/api';
import { X, Save, LogOut, Loader2 } from 'lucide-react';

interface UserProfile {
  name: string;
  avatar: string;
  email?: string;
  id?: string;
}

const SettingsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  user: UserProfile; 
  onSave: (u: UserProfile) => void;
  onLogout: () => void;
}> = ({ isOpen, onClose, user, onSave, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setAvatar(user.avatar);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <h2 className="text-lg font-bold text-slate-800">Settings</h2>
           <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
           </button>
        </div>
        
        <div className="p-6 space-y-6">
           <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-sm relative group">
                 <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-slate-400">Profile Preview</p>
           </div>

           <div className="space-y-4">
              <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Display Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white text-slate-900"
                  />
              </div>
              <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Avatar URL</label>
                  <input 
                    type="text" 
                    value={avatar} 
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono text-slate-900 bg-white"
                  />
              </div>
           </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center gap-3">
            <button 
              onClick={onLogout}
              className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut size={16} /> Log Out
            </button>
            <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onSave({ ...user, name, avatar });
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-2"
                >
                  <Save size={16} /> Save
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('stats');
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Initialize Session
  useEffect(() => {
    const userJson = localStorage.getItem('lifeNotes-currentUser');
    const token = localStorage.getItem('token');
    if (userJson && token) {
        try {
            setCurrentUser(JSON.parse(userJson));
        } catch(e) { console.error(e); }
    }
  }, []);

  // Fetch Data when User Logs in
  useEffect(() => {
      const fetchData = async () => {
          if (currentUser) {
              try {
                  const data = await api.getInitialData();
                  setNotes(data.notes);
                  setFolders(data.folders);
                  setTags(data.tags);
                  setIsDataLoaded(true);
              } catch (e) {
                  console.error("Failed to load data", e);
                  // Optional: handle token expiration here
              }
          }
      };
      fetchData();
  }, [currentUser]);

  const handleLogin = (user: UserProfile) => {
      localStorage.setItem('lifeNotes-currentUser', JSON.stringify(user));
      setCurrentUser(user);
  };

  const handleLogout = () => {
      if (window.confirm("Are you sure you want to log out?")) {
          localStorage.removeItem('lifeNotes-currentUser');
          localStorage.removeItem('token');
          setCurrentUser(null);
          setIsSettingsOpen(false);
          setIsDataLoaded(false);
      }
  };

  const [currentNote, setCurrentNote] = useState<Note | null>(null);

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    try {
        await api.updateUser(updatedUser.name, updatedUser.avatar);
        setCurrentUser(updatedUser);
        localStorage.setItem('lifeNotes-currentUser', JSON.stringify(updatedUser));
    } catch (e) {
        alert("Failed to update profile");
    }
  };

  const handleNewNote = () => {
    setCurrentNote(null);
    setCurrentView('editor');
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setCurrentView('editor');
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
        await api.deleteNote(id);
        setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleTogglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updated = { ...note, isPinned: !note.isPinned };
    await api.saveNote(updated);
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
  };

  const handleToggleFavorite = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updated = { ...note, isFavorite: !note.isFavorite };
    await api.saveNote(updated);
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    // If it's a new note, assign temp ID for UI until refresh, or rely on API response
    const res = await api.saveNote(noteData);
    
    if (noteData.id) {
        setNotes(prev => prev.map(n => n.id === noteData.id ? { ...n, ...noteData } as Note : n));
    } else {
        const newNote = { ...noteData, id: res.id, createdAt: new Date().toISOString() } as Note;
        setNotes(prev => [newNote, ...prev]);
    }
    setCurrentView('all-notes');
  };

  const handleNewFolder = async (name: string, parentId?: string) => {
    if (name) {
        const newFolder: Folder = { 
            id: Math.random().toString(36).substr(2, 9), 
            name, 
            parentId 
        };
        await api.saveFolder(newFolder);
        setFolders([...folders, newFolder]);
    }
  };

  const handleAddTag = async (name: string) => {
    if (!tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        const colors = [
            'bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 
            'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newTag: Tag = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            color: randomColor
        };
        await api.saveTag(newTag);
        setTags([...tags, newTag]);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (window.confirm('Delete this tag?')) {
        await api.deleteTag(tagId);
        setTags(prev => prev.filter(t => t.id !== tagId));
        setNotes(prev => prev.map(note => ({
            ...note,
            tags: note.tags.filter(t => t !== tagId)
        })));
    }
  };
  
  const handleSelectFolder = (folderId: string) => {
      setActiveFolderId(folderId);
      setCurrentView('all-notes');
  };

  const handleViewChange = (view: ViewMode) => {
      setCurrentView(view);
      if (view !== 'all-notes') {
          setActiveFolderId(undefined);
      }
  };

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (currentView === 'recent') {
        return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (currentView === 'favorites') {
        filtered = filtered.filter(n => n.isFavorite);
    } else if (currentView === 'all-notes') {
        if (activeFolderId) {
            const getAllChildFolderIds = (parentId: string): string[] => {
                const children = folders.filter(f => f.parentId === parentId);
                let ids = children.map(c => c.id);
                children.forEach(c => {
                    ids = [...ids, ...getAllChildFolderIds(c.id)];
                });
                return ids;
            };
            const relevantFolderIds = [activeFolderId, ...getAllChildFolderIds(activeFolderId)];
            filtered = filtered.filter(n => relevantFolderIds.includes(n.folderId));
        }
    }
    return filtered.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, currentView, activeFolderId, folders]);

  const renderContent = () => {
    switch (currentView) {
      case 'stats':
        return <StatsView notes={notes} />;
      case 'all-notes':
      case 'recent':
      case 'favorites':
        const currentFolderName = folders.find(f => f.id === activeFolderId)?.name;
        const title = currentView === 'recent' ? 'Recent Notes' : currentView === 'favorites' ? 'Favorites' : activeFolderId ? `Folder: ${currentFolderName}` : 'All Notes';
        return (
          <ListView 
            title={title}
            notes={filteredNotes} 
            tags={tags} 
            folders={folders} 
            onEditNote={handleEditNote} 
            onDeleteNote={handleDeleteNote}
            onTogglePin={handleTogglePin}
            onToggleFavorite={handleToggleFavorite}
          />
        );
      case 'editor':
        return (
          <EditorView 
            note={currentNote} 
            folders={folders} 
            tags={tags} 
            onSave={handleSaveNote} 
            onCancel={() => setCurrentView('all-notes')}
            onAddTag={handleAddTag}
          />
        );
      default:
        return <StatsView notes={notes} />;
    }
  };

  if (!currentUser) return <AuthView onLogin={handleLogin} />;
  
  if (!isDataLoaded) return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
  );

  return (
    <div className="flex w-full h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        user={currentUser}
        onChangeView={handleViewChange}
        tags={tags}
        folders={folders}
        onNewNote={handleNewNote}
        onNewFolder={handleNewFolder}
        onSelectFolder={handleSelectFolder}
        onDeleteTag={handleDeleteTag}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeFolderId={activeFolderId}
      />
      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-xl rounded-l-3xl overflow-hidden my-2 mr-2 border border-slate-100">
        {renderContent()}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={currentUser}
        onSave={handleUpdateUser}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;