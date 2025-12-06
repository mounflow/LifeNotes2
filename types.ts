
export interface Tag {
  id: string;
  name: string;
  color: string; // Tailwind class compatible string (e.g. 'bg-red-100 text-red-600')
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string; // Optional parent ID for nested folders
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  tags: string[]; // Tag IDs
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isPinned: boolean;
  isFavorite: boolean;
}

export type ViewMode = 'stats' | 'all-notes' | 'recent' | 'favorites' | 'editor';

export interface UserStats {
  notesCreated: number;
  activeDays: number;
  thoughtsRecorded: number;
}
