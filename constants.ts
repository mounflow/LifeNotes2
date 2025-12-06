import { Folder, Note, Tag } from './types';

export const TAGS: Tag[] = [
  { id: 'personal', name: 'Personal', color: 'bg-red-100 text-red-600' },
  { id: 'work', name: 'Work', color: 'bg-blue-100 text-blue-600' },
  { id: 'family', name: 'Family', color: 'bg-green-100 text-green-600' },
  { id: 'renro', name: 'Renro', color: 'bg-yellow-100 text-yellow-600' },
];

export const FOLDERS: Folder[] = [
  { id: 'son', name: 'Son' },
  { id: 'father', name: 'Father' },
  { id: 'test', name: '新笔记测试' },
];

// Helper to get a date relative to today
const getRelativeDate = (daysOffset: number, hoursOffset: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysOffset);
  date.setHours(date.getHours() - hoursOffset);
  return date.toISOString();
};

export const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'Son',
    content: '这是一个关于孩子的记录摘要，记录了今天的成长点滴，包括他第一次走路的样子，真的是太可爱了。',
    folderId: 'son',
    tags: ['family', 'work'],
    createdAt: getRelativeDate(0, 2), // Today
    updatedAt: getRelativeDate(0, 2),
    isPinned: true,
    isFavorite: true,
  },
  {
    id: '2',
    title: 'Father',
    content: '今天和父亲通了电话，聊了很多以前的事情。',
    folderId: 'father',
    tags: ['family'],
    createdAt: getRelativeDate(1, 4), // Yesterday
    updatedAt: getRelativeDate(1, 4),
    isPinned: true,
    isFavorite: false,
  },
  {
    id: '3',
    title: 'Project Renro Ideas',
    content: 'Brainstorming session results: 1. UI cleanup, 2. Performance optimization...',
    folderId: 'test',
    tags: ['renro', 'work'],
    createdAt: getRelativeDate(2, 0), // 2 days ago
    updatedAt: getRelativeDate(2, 0),
    isPinned: false,
    isFavorite: true,
  },
  {
    id: '4',
    title: 'Weekend Plans',
    content: 'Grocery shopping list: Milk, Bread, Eggs. Also need to stop by the hardware store.',
    folderId: 'test',
    tags: ['personal'],
    createdAt: getRelativeDate(4, 0), // 4 days ago
    updatedAt: getRelativeDate(4, 0),
    isPinned: false,
    isFavorite: false,
  },
  {
    id: '5',
    title: 'Old Archives',
    content: 'Some older content to test date filtering.',
    folderId: 'test',
    tags: ['work'],
    createdAt: getRelativeDate(35, 0), // 35 days ago
    updatedAt: getRelativeDate(35, 0),
    isPinned: false,
    isFavorite: false,
  },
];
