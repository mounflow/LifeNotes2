import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../lib/mongodb';
import { Note, Folder, Tag } from '../models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await dbConnect();

  // Middleware-like Auth Check
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  
  let userId;
  try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
  } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
  }

  if (req.method === 'GET') {
      try {
          const notes = await Note.find({ userId });
          const folders = await Folder.find({ userId });
          const tags = await Tag.find({ userId });
          
          // Map Mongo _id to id for frontend compatibility
          const mapId = (doc: any) => ({ ...doc.toObject(), id: doc._id.toString() });

          return res.status(200).json({
              notes: notes.map(mapId),
              folders: folders.map(mapId),
              tags: tags.map(mapId)
          });
      } catch (e) {
          return res.status(500).json({ error: 'Failed to fetch data' });
      }
  }

  if (req.method === 'POST') {
      const { type, data } = req.body;
      
      try {
          if (type === 'note') {
              if (data.id && data.id.length > 10) { // Assume mongo ID is long, temp ID is random string
                   // Update
                   await Note.findByIdAndUpdate(data.id, { ...data, userId });
              } else {
                  // Create
                  const newNote = await Note.create({ ...data, userId });
                  return res.status(200).json({ id: newNote._id.toString() });
              }
          } else if (type === 'folder') {
              // Simple upsert logic
              const existing = await Folder.findOne({ id: data.id, userId });
              if (!existing) await Folder.create({ ...data, userId });
          } else if (type === 'tag') {
              const existing = await Tag.findOne({ id: data.id, userId });
              if (!existing) await Tag.create({ ...data, userId });
          }
          
          return res.status(200).json({ success: true });
      } catch (e) {
          return res.status(500).json({ error: 'Failed to save data' });
      }
  }

  if (req.method === 'DELETE') {
      const { type, id } = req.body; // Use body for Delete to simplify
      try {
          if (type === 'note') await Note.findByIdAndDelete(id);
          if (type === 'tag') await Tag.findOneAndDelete({ id, userId }); // Using custom ID for tags
          if (type === 'folder') await Folder.findOneAndDelete({ id, userId });
          return res.status(200).json({ success: true });
      } catch (e) {
           return res.status(500).json({ error: 'Failed to delete' });
      }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}