import mongoose, { Schema, model, models } from 'mongoose';

// User Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Note Schema
const NoteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  folderId: { type: String, default: '' },
  tags: [{ type: String }],
  isPinned: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
}, { timestamps: true });

// We map _id to id in the frontend, but keep standard Mongo _id in DB.
// Folders and Tags are often simple enough to store on the User or as separate docs.
// For simplicity in this migration, we will store them as separate documents to allow full CRUD.

const FolderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String, required: true }, // Client-side generated ID or custom ID
  name: { type: String, required: true },
  parentId: { type: String },
});

const TagSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
});

export const User = models.User || model('User', UserSchema);
export const Note = models.Note || model('Note', NoteSchema);
export const Folder = models.Folder || model('Folder', FolderSchema);
export const Tag = models.Tag || model('Tag', TagSchema);