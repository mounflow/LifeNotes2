
import React, { useState, useEffect, useRef } from 'react';
import { 
    ChevronDown, 
    Plus, 
    Wand2, 
    Check, 
    Eye, 
    PenLine, 
    Bold, 
    Italic, 
    List, 
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Code,
    CheckSquare,
    Link as LinkIcon,
    Strikethrough,
    Image as ImageIcon,
    Table as TableIcon,
    Minus,
    Undo,
    Redo
} from 'lucide-react';
import { Note, Folder, Tag } from '../types';
import { generateNoteSummary, suggestTags } from '../services/geminiService';

interface EditorViewProps {
  note?: Note | null;
  folders: Folder[];
  tags: Tag[];
  onSave: (note: Partial<Note>) => void;
  onCancel: () => void;
  onAddTag: (name: string) => void;
}

const EditorView: React.FC<EditorViewProps> = ({ note, folders, tags, onSave, onCancel, onAddTag }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  
  // Undo/Redo History
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Tag creation state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  
  // Editor mode
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write');

  // Load Note Data
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSelectedFolder(note.folderId);
      setSelectedTags(note.tags);
      // Initialize history
      setHistory([note.content]);
      setHistoryIndex(0);
    } else {
      setTitle('');
      setContent('');
      setSelectedFolder(folders[0]?.id || '');
      setSelectedTags([]);
      setHistory(['']);
      setHistoryIndex(0);
    }
  }, [note, folders]);

  // Handle History Updates
  useEffect(() => {
      if (!isUndoRedoAction.current) {
          if (content !== history[historyIndex]) {
              const newHistory = history.slice(0, historyIndex + 1);
              newHistory.push(content);
              // Limit history size to 50
              if (newHistory.length > 50) newHistory.shift();
              setHistory(newHistory);
              setHistoryIndex(newHistory.length - 1);
          }
      }
      isUndoRedoAction.current = false;
  }, [content]);

  const undo = () => {
      if (historyIndex > 0) {
          isUndoRedoAction.current = true;
          setHistoryIndex(historyIndex - 1);
          setContent(history[historyIndex - 1]);
      }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          isUndoRedoAction.current = true;
          setHistoryIndex(historyIndex + 1);
          setContent(history[historyIndex + 1]);
      }
  };

  const handleSave = () => {
    onSave({
      id: note?.id,
      title: title || 'Untitled Note',
      content,
      folderId: selectedFolder,
      tags: selectedTags,
      updatedAt: new Date().toISOString(),
      createdAt: note?.createdAt || new Date().toISOString(),
      isPinned: note?.isPinned || false,
      isFavorite: note?.isFavorite || false,
    });
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const createNewTag = () => {
      if (newTagName.trim()) {
          onAddTag(newTagName.trim());
          setNewTagName("");
          setIsAddingTag(false);
      } else {
          setIsAddingTag(false);
      }
  };

  const handleMagic = async () => {
    if (!content) return;
    setIsGenerating(true);
    
    // 1. Suggest Tags
    const suggestedTagNames = await suggestTags(content, tags.map(t => t.name));
    const newSelectedTags = [...selectedTags];
    suggestedTagNames.forEach(name => {
      const tag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (tag && !newSelectedTags.includes(tag.id)) {
        newSelectedTags.push(tag.id);
      }
    });
    setSelectedTags(newSelectedTags);

    // 2. Auto Title if empty
    if (!title || title === 'Untitled Note') {
      const summary = await generateNoteSummary(content);
      if (summary) setTitle(summary);
    }

    setIsGenerating(false);
  };
  
  const insertFormatting = (type: string) => {
      const textarea = document.querySelector('textarea');
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      let before = content.substring(0, start);
      let after = content.substring(end);
      let insertion = '';
      let cursorOffset = 0;

      switch (type) {
          case 'bold':
              insertion = `**${selectedText || 'bold text'}**`;
              cursorOffset = selectedText ? insertion.length : 2; 
              break;
          case 'italic':
              insertion = `*${selectedText || 'italic text'}*`;
              cursorOffset = selectedText ? insertion.length : 1;
              break;
          case 'strike':
              insertion = `~~${selectedText || 'text'}~~`;
              cursorOffset = selectedText ? insertion.length : 2;
              break;
          case 'h1':
              insertion = `\n# ${selectedText || 'Heading 1'}\n`;
              break;
          case 'h2':
              insertion = `\n## ${selectedText || 'Heading 2'}\n`;
              break;
          case 'h3':
              insertion = `\n### ${selectedText || 'Heading 3'}\n`;
              break;
          case 'list':
              insertion = `\n- ${selectedText || 'List item'}`;
              break;
          case 'check':
              insertion = `\n- [ ] ${selectedText || 'To-do item'}`;
              break;
          case 'quote':
              insertion = `\n> ${selectedText || 'Blockquote'}\n`;
              break;
          case 'code':
              insertion = `\n\`\`\`\n${selectedText || 'code block'}\n\`\`\`\n`;
              break;
          case 'link':
              insertion = `[${selectedText || 'Link Text'}](url)`;
              break;
          case 'image':
              insertion = `\n![Alt Text](https://via.placeholder.com/600x400)\n`;
              break;
          case 'hr':
              insertion = `\n---\n`;
              break;
          case 'table':
              insertion = `\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n`;
              break;
      }
      
      const newContent = before + insertion + after;
      setContent(newContent);
      
      // Need a timeout to set selection after render
      setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }, 0);
  };

  // Helper function to process inline formatting (moved outside loop for performance)
  const processInlineFormatting = (text: string) => {
    const nodes: React.ReactNode[] = [];
    const regex = /(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(\*.*?\*)|(~~.*?~~)/g;
    let match;
    let cursor = 0;
    let keyIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
        if (match.index > cursor) {
            nodes.push(text.substring(cursor, match.index));
        }
        
        const m = match[0];
        if (m.startsWith('[')) {
            // Link
            const linkMatch = m.match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
                 nodes.push(
                    <a key={`link-${keyIndex}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {linkMatch[1]}
                    </a>
                 );
            } else {
                nodes.push(m); // Fallback
            }
        } else if (m.startsWith('**')) {
            nodes.push(<strong key={`bold-${keyIndex}`} className="font-bold text-slate-900">{m.slice(2, -2)}</strong>);
        } else if (m.startsWith('~~')) {
            nodes.push(<span key={`strike-${keyIndex}`} className="line-through text-slate-400">{m.slice(2, -2)}</span>);
        } else if (m.startsWith('*')) {
             nodes.push(<em key={`italic-${keyIndex}`} className="italic">{m.slice(1, -1)}</em>);
        }
        
        keyIndex++;
        cursor = match.index + m.length;
    }
    
    if (cursor < text.length) {
        nodes.push(text.substring(cursor));
    }
    
    return nodes.length > 0 ? nodes : [text];
  };

  const renderMarkdown = (text: string) => {
      if (!text) return <p className="text-slate-300 italic">Nothing to preview...</p>;
      
      const lines = text.split('\n');
      const renderedElements: React.ReactNode[] = [];
      let inCodeBlock = false;
      let inTable = false;
      let tableRows: string[][] = [];

      // Helper to flush table if pending
      const flushTable = () => {
          if (tableRows.length > 0) {
              const headerRow = tableRows[0];
              // Filter out separator row (e.g. |---|---|)
              const bodyRows = tableRows.slice(1).filter(row => {
                  const rowStr = row.join('');
                  // Check if row contains only -, |, and whitespace
                  return !/^[\s\-\|]+$/.test(rowStr);
              });

              renderedElements.push(
                  <div key={`table-${renderedElements.length}`} className="overflow-x-auto my-4 border border-slate-200 rounded-lg">
                      <table className="min-w-full divide-y divide-slate-200">
                          <thead>
                              <tr className="bg-slate-50">
                                  {headerRow.map((h, hi) => <th key={hi} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>)}
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                              {bodyRows.map((row, ri) => (
                                  <tr key={ri}>
                                      {row.map((cell, ci) => <td key={ci} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{cell}</td>)}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              );
              tableRows = [];
              inTable = false;
          }
      };

      for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Code Blocks
          if (line.trim().startsWith('```')) {
              if (inCodeBlock) {
                  // End code block
                  inCodeBlock = false;
              } else {
                  // Start code block
                  inCodeBlock = true;
              }
              continue; 
          }
          if (inCodeBlock) {
              renderedElements.push(<div key={`code-${i}`} className="bg-slate-800 text-slate-100 px-4 py-1 font-mono text-sm min-h-[1.5em]">{line}</div>);
              continue;
          }

          // Tables
          if (line.trim().startsWith('|')) {
              if (!inTable) inTable = true;
              tableRows.push(line.split('|').filter(c => c.trim() !== '').map(c => c.trim()));
              continue;
          } else if (inTable) {
              flushTable();
          }

          // Block Images: ![Alt](Url) at start of line
          if (line.trim().startsWith('![')) {
              const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
              if (imgMatch) {
                  renderedElements.push(
                      <div key={`img-${i}`} className="my-4 flex flex-col items-center">
                          <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-lg shadow-sm max-h-96 object-cover border border-slate-200" />
                          {imgMatch[1] && <p className="text-center text-xs text-slate-400 mt-2 bg-slate-50 px-2 py-1 rounded">{imgMatch[1]}</p>}
                      </div>
                  );
                  continue;
              }
          }

          // Horizontal Rule
          if (line.trim() === '---' || line.trim() === '***') {
              renderedElements.push(<hr key={`hr-${i}`} className="my-8 border-slate-200" />);
              continue;
          }

          // Headers
          if (line.startsWith('# ')) { renderedElements.push(<h1 key={i} className="text-4xl font-extrabold text-slate-900 mb-6 mt-10 border-b border-slate-100 pb-4">{processInlineFormatting(line.substring(2))}</h1>); continue; }
          if (line.startsWith('## ')) { renderedElements.push(<h2 key={i} className="text-2xl font-bold text-slate-800 mb-4 mt-8">{processInlineFormatting(line.substring(3))}</h2>); continue; }
          if (line.startsWith('### ')) { renderedElements.push(<h3 key={i} className="text-xl font-bold text-slate-700 mb-3 mt-6">{processInlineFormatting(line.substring(4))}</h3>); continue; }
          
          // Blockquotes
          if (line.startsWith('> ')) {
              renderedElements.push(
                <div key={i} className="flex gap-4 my-6">
                    <div className="w-1 rounded-full bg-blue-400/50 flex-shrink-0" />
                    <div className="text-lg text-slate-600 italic leading-relaxed py-1">{processInlineFormatting(line.substring(2))}</div>
                </div>
              );
              continue;
          }

          // Lists
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
              const content = line.trim().substring(2);
              if (content.startsWith('[ ] ')) {
                  renderedElements.push(<div key={i} className="flex items-start gap-3 my-2 ml-1 text-slate-700"><div className="w-5 h-5 border-2 border-slate-300 rounded flex-shrink-0 mt-0.5" /><span>{processInlineFormatting(content.substring(4))}</span></div>);
              } else if (content.startsWith('[x] ') || content.startsWith('[X] ')) {
                 renderedElements.push(<div key={i} className="flex items-start gap-3 my-2 ml-1 text-slate-400 line-through"><div className="w-5 h-5 bg-blue-500 border-2 border-blue-500 rounded flex-shrink-0 flex items-center justify-center mt-0.5"><Check size={12} className="text-white" strokeWidth={4} /></div><span>{processInlineFormatting(content.substring(4))}</span></div>);
              } else {
                  renderedElements.push(<div key={i} className="flex items-start gap-3 my-1.5 ml-4"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" /><div className="text-slate-700">{processInlineFormatting(content)}</div></div>);
              }
              continue;
          }

          // Paragraphs
          if (line.trim() === '') {
              renderedElements.push(<br key={i} />);
          } else {
              renderedElements.push(<p key={i} className="text-lg text-slate-700 leading-relaxed mb-4">{processInlineFormatting(line)}</p>);
          }
      }

      // Flush any remaining table
      if (inTable) {
          flushTable();
      }

      return <div className="pb-32 max-w-4xl mx-auto">{renderedElements}</div>;
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white relative animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="relative">
          <button 
            onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors bg-white shadow-sm"
          >
            <span className="text-slate-400 font-medium">Folder:</span>
            <span className="font-semibold">{folders.find(f => f.id === selectedFolder)?.name || 'Select Folder'}</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </button>
          
          {isFolderMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1 z-20 max-h-64 overflow-y-auto">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setIsFolderMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between
                    ${selectedFolder === folder.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}
                  `}
                >
                  <span className={folder.parentId ? "pl-4" : ""}>{folder.name}</span>
                  {selectedFolder === folder.id && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
             <button 
                onClick={() => setViewMode('write')}
                className={`p-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'write' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <PenLine size={16} /> Write
             </button>
             <button 
                onClick={() => setViewMode('preview')}
                className={`p-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <Eye size={16} /> Preview
             </button>
          </div>

          <button 
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
              onClick={handleMagic}
              disabled={isGenerating || !content}
              className="px-3 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 border border-purple-100"
              title="AI Auto-tag & Title"
          >
              <Wand2 size={18} className={isGenerating ? "animate-pulse" : ""} />
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            Save Note
          </button>
        </div>
      </div>

      {/* Toolbar (Only in Write Mode) */}
      {viewMode === 'write' && (
          <div className="px-8 py-2 border-b border-slate-100 flex justify-center bg-slate-50/50">
             <div className="flex gap-1 flex-wrap justify-center max-w-5xl">
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"><Undo size={16} /></button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"><Redo size={16} /></button>
                </div>

                <div className="w-px h-8 bg-slate-300 mx-2 self-center opacity-50" />

                <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => insertFormatting('h1')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="H1"><Heading1 size={16} /></button>
                    <button onClick={() => insertFormatting('h2')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="H2"><Heading2 size={16} /></button>
                    <button onClick={() => insertFormatting('h3')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="H3"><Heading3 size={16} /></button>
                </div>
                
                <div className="w-px h-8 bg-slate-300 mx-2 self-center opacity-50" />
                
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => insertFormatting('bold')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Bold"><Bold size={16} /></button>
                    <button onClick={() => insertFormatting('italic')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Italic"><Italic size={16} /></button>
                    <button onClick={() => insertFormatting('strike')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Strikethrough"><Strikethrough size={16} /></button>
                </div>

                <div className="w-px h-8 bg-slate-300 mx-2 self-center opacity-50" />

                <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => insertFormatting('list')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Bullet List"><List size={16} /></button>
                    <button onClick={() => insertFormatting('check')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Checklist"><CheckSquare size={16} /></button>
                    <button onClick={() => insertFormatting('quote')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Quote"><Quote size={16} /></button>
                    <button onClick={() => insertFormatting('code')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Code"><Code size={16} /></button>
                </div>

                <div className="w-px h-8 bg-slate-300 mx-2 self-center opacity-50" />

                <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => insertFormatting('link')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Link"><LinkIcon size={16} /></button>
                    <button onClick={() => insertFormatting('image')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Image"><ImageIcon size={16} /></button>
                    <button onClick={() => insertFormatting('table')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Table"><TableIcon size={16} /></button>
                    <button onClick={() => insertFormatting('hr')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Horizontal Line"><Minus size={16} /></button>
                </div>
             </div>
          </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto px-16 py-10 max-w-5xl mx-auto w-full">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note"
          className="w-full text-5xl font-bold text-slate-900 placeholder-slate-300 border-none focus:outline-none focus:ring-0 bg-transparent mb-8 tracking-tight"
        />
        
        {viewMode === 'write' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing here..."
              className="w-full h-[calc(100%-120px)] resize-none text-lg text-slate-700 placeholder-slate-300 border-none focus:outline-none focus:ring-0 bg-transparent leading-relaxed font-mono"
            />
        ) : (
            <div className="prose prose-lg max-w-none text-slate-700 pb-20">
                {renderMarkdown(content)}
            </div>
        )}
      </div>

      {/* Footer Tags */}
      <div className="px-16 py-6 border-t border-slate-100 bg-white/90 backdrop-blur-sm absolute bottom-0 w-full z-10">
         <div className="flex flex-wrap gap-2 max-w-5xl mx-auto items-center">
            {isAddingTag ? (
                <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-full px-3 py-1 shadow-sm ring-2 ring-blue-500/10 animate-in fade-in zoom-in-95">
                   <input 
                      autoFocus
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') createNewTag();
                        if (e.key === 'Escape') setIsAddingTag(false);
                      }}
                      onBlur={() => setIsAddingTag(false)}
                      placeholder="Tag name..."
                      className="w-24 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none bg-transparent min-w-0"
                   />
                </div>
            ) : (
                <button 
                    onClick={() => {
                        setIsAddingTag(true);
                        setNewTagName("");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 border-dashed rounded-full text-sm text-slate-500 hover:bg-slate-50 bg-white transition-colors"
                >
                    <Plus size={14} /> Add Tag
                </button>
            )}
            
            {tags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                    <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                            isSelected 
                              ? `${tag.color} border-transparent shadow-sm scale-105` 
                              : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                        }`}
                    >
                        #{tag.name}
                    </button>
                )
            })}
         </div>
      </div>
    </div>
  );
};

export default EditorView;
