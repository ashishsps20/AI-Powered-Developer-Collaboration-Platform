import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ProjectMember from '../models/ProjectMember.js';

class SocketService {
  constructor() {
    this.io = null;
  }

  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        // Prefer token from auth payload or headers
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await User.findById(decoded.sub);

        if (!user || !user.isActive) {
          return next(new Error('Authentication error: Invalid or inactive user'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id} (User: ${socket.userId})`);

      // Automatically join personal user room for notifications
      socket.join(`user:${socket.userId}`);

      // Handle project room joining
      socket.on('join-project', async (projectId) => {
        try {
          if (!projectId) return;

          // Verify user is a member of the project
          const isMember = await ProjectMember.findOne({
            project: projectId,
            user: socket.userId,
            isActive: true
          });

          if (!isMember) {
            socket.emit('error', { message: 'Unauthorized to join this project room' });
            return;
          }

          socket.join(`project:${projectId}`);
          console.log(`Socket ${socket.id} joined project room: project:${projectId}`);
        } catch (error) {
          console.error(`Socket join-project error:`, error);
        }
      });

      // Handle project room leaving
      socket.on('leave-project', (projectId) => {
        if (!projectId) return;
        socket.leave(`project:${projectId}`);
        console.log(`Socket ${socket.id} left project room: project:${projectId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  // --- Emitters ---

  emitToUser(userId, event, payload) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, payload);
  }

  emitToProject(projectId, event, payload) {
    if (!this.io) return;
    this.io.to(`project:${projectId}`).emit(event, payload);
  }

  // Specific high-level emitters
  emitTaskUpdate(projectId, payload) {
    this.emitToProject(projectId, 'task:updated', payload);
  }

  emitIssueUpdate(projectId, payload) {
    this.emitToProject(projectId, 'issue:updated', payload);
  }
  
  emitComment(projectId, payload) {
    this.emitToProject(projectId, 'comment:new', payload);
  }

  emitActivity(projectId, payload) {
    this.emitToProject(projectId, 'activity:new', payload);
  }
}

export const socketService = new SocketService();
export default socketService;
