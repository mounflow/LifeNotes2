import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../lib/mongodb';
import { User } from '../models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await dbConnect();

  if (req.method === 'POST') {
    const { action, email, password, name, avatar } = req.body;

    try {
      if (action === 'register') {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
          name,
          email,
          password: hashedPassword,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        });

        const token = jwt.sign({ userId: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({ 
          token, 
          user: { id: newUser._id, name: newUser.name, email: newUser.email, avatar: newUser.avatar } 
        });
      } 
      
      else if (action === 'login') {
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({ 
          token, 
          user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } 
        });
      }
      
      else if (action === 'update') {
          // Verify token for updates
          const authHeader = req.headers.authorization;
          if (!authHeader) return res.status(401).json({ message: 'No token provided' });
          
          const token = authHeader.split(' ')[1];
          const decoded: any = jwt.verify(token, JWT_SECRET);
          
          const updatedUser = await User.findByIdAndUpdate(
              decoded.userId, 
              { name, avatar },
              { new: true }
          );
          
           return res.status(200).json({ 
               user: { id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, avatar: updatedUser.avatar }
           });
      }

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}