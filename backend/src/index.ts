import cors from 'cors';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AIService } from './ai.service';
import { AnalyticsService } from './AnalyticsService';
import { AuthService } from './auth.service';
import { FlashcardService } from './flashcard.service';
import { GroupService } from './GroupService';
import { StudyPlanService } from './study-plan.service';
import { UserService } from './UserService';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const port = process.env.PORT || 3036;
const httpServer = createServer(app); 

/* ====================== MIDDLEWARE ====================== */
app.use(cors());
app.use(express.json());

/* ====================== SOCKET.IO SETUP ====================== */

const io = new Server(httpServer, { 
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

/* ====================== AUTH ROUTES ====================== */

app.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    console.log('Signup Request:', { email, name });

    const { user, session } = await AuthService.signUp(email, password, name);
    console.log('SignUp Success:', { userId: user.id, email: user.email });

    await AuthService.createUserProfile(user.id, email, name);
    console.log('Create User Profile Success:', { userId: user.id, email });

    await AuthService.signOut();
    res.json({ user, session });
  } catch (err: any) {
    console.error('SignUp Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post('/auth/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('Signin Request:', { email });

    const { user, session } = await AuthService.signIn(email, password);
    console.log('SignIn Success:', { userId: user.id, email: user.email });

    res.json({ user, session });
  } catch (err: any) {
    console.error('SignIn Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get('/auth/user', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    const user = await AuthService.getUser(token);
    console.log('Get User Success:', { userId: user.id, email: user.email });

    res.json({ user });
  } catch (err: any) {
    console.error('Get User Error:', err.message);
    res.status(401).json({ error: err.message });
  }
});
app.post('/auth/signout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    await AuthService.signOut();
    console.log('Signout Success');
    res.json({ message: 'Signed out successfully' });
  } catch (err: any) {
    console.error('Signout Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== AI ROUTE ====================== */

app.post('/ai/generate', async (req: Request, res: Response) => {
  try {
    const { userId, message } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !userId || !message)
      throw new Error('Missing userId, message, or token');

    const response = await AIService.generateResponse(userId, message, token);
    console.log('AI Response Success:', { userId, response });

    res.json({ response });
  } catch (err: any) {
    console.error('AI Generate Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== STUDY PLAN ROUTES ====================== */

app.post('/study-plan/generate', async (req: Request, res: Response) => {
  try {
    const { userId, subjects, timeSlots } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !userId || !subjects || !timeSlots)
      throw new Error('Missing userId, subjects, timeSlots, or token');

    const plan = await StudyPlanService.generatePlan(userId, subjects, timeSlots, token);
    console.log('Study Plan Generate Success:', { userId, plan });

    res.json({ plan });
  } catch (err: any) {
    console.error('Study Plan Generate Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/study-plan/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !userId) throw new Error('Missing userId or token');

    const plans = await StudyPlanService.getPlanHistory(userId, token);
    console.log('Study Plan History Success:', { userId, count: plans.length });

    res.json({ plans });
  } catch (err: any) {
    console.error('Study Plan History Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/study-plan/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !planId) throw new Error('Missing planId or token');

    const plan = await StudyPlanService.getPlanById(planId, token);
    console.log('Get Study Plan Success:', { planId });

    res.json({ plan });
  } catch (err: any) {
    console.error('Get Study Plan Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/study-plan/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !userId) throw new Error('Missing userId or token');

    const plans = await StudyPlanService.getUserPlans(userId, token);
    console.log('Get User Plans Success:', { userId, count: plans.length });

    res.json({ plans });
  } catch (err: any) {
    console.error('Get User Plans Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== FLASHCARDS ====================== */

app.post('/flashcard/generate', async (req: Request, res: Response) => {
  try {
    const { subject, count } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !subject || !count)
      throw new Error('Missing subject, count, or token');

    const flashcards = await FlashcardService.generateFlashcards('', subject, count, token);
    console.log('Flashcard Generate Success:', { subject });

    res.json({ flashcards });
  } catch (err: any) {
    console.error('Flashcard Generate Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get('/flashcards/review', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    const user = await AuthService.getUser(token);
    if (!user) throw new Error('User not found');

    const reviewDeck = await FlashcardService.getReviewDeck(user.id, token);
    console.log(`Fetched review deck for user ${user.id}, count: ${reviewDeck.length}`);
    res.json({ reviewDeck });
  } catch (err: any) {
    console.error('Get Review Deck Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post('/flashcards/review/:cardId', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const { performance } = req.body; 
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) throw new Error('No token provided');
    if (!performance) throw new Error('Performance rating is required');
    
    const user = await AuthService.getUser(token);
    if (!user) throw new Error('User not found');

    const updatedCard = await FlashcardService.updateFlashcardReview(
      cardId,
      user.id,
      performance,
      token
    );
    
    console.log(`Updated review for card ${cardId}, user ${user.id}`);
    res.json({ updatedCard });
  } catch (err: any) {
    console.error('Update Review Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});
/* ====================== USER ROUTES ====================== */

app.get('/user/statistics/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !userId) throw new Error('Missing userId or token');

    const statistics = await UserService.getUserStatistics(userId, token);
    res.json({ statistics });
  } catch (err: any) {
    console.error('Get User Statistics Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post('/user/study-session', async (req: Request, res: Response) => {
  try {
    const { userId, subject, duration } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !userId || !subject || !duration)
      throw new Error('Missing required fields');

    await UserService.recordStudySession(userId, subject, duration, token);
    res.json({ message: 'Study session recorded successfully' });
  } catch (err: any) {
    console.error('Record Study Session Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/user/achievements', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Missing token');

    const achievements = await UserService.getAchievements(token);
    res.json({ achievements });
  } catch (err: any) {
    console.error('Get Achievements Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== ANALYTICS ROUTES ====================== */
app.get('/analytics/subject-breakdown', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const user = await AuthService.getUser(token);
    if (!user) throw new Error('User not found');

    const data = await AnalyticsService.getSubjectBreakdown(user.id, token);
    res.json({ data });
  } catch (err: any) {
    console.error('Get Subject Breakdown Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/analytics/time-series', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const user = await AuthService.getUser(token);
    if (!user) throw new Error('User not found');

    const data = await AnalyticsService.getTimeSeries(user.id, token);
    res.json({ data });
  } catch (err: any) {
    console.error('Get Time Series Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== GROUP ROUTES ====================== */

// Get all groups
app.get('/groups', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    const groups = await GroupService.getAllGroups(token);
    res.json({ groups });
  } catch (err: any) {
    console.error('Get Groups Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Create a new group
app.get('/groups/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const user = await AuthService.getUser(token);
    if (!user) throw new Error('User not found');

    const groupIds = await GroupService.getMyGroupIds(user.id, token);
    res.json({ groupIds });
  } catch (err: any) {
    console.error('Get My Groups Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post('/groups', async (req, res) => {
  try {
    const { name, description } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const user = await AuthService.getUser(token);
    if (!user) throw new Error('User not found');

    const group = await GroupService.createGroup(user.id, name, description, token);
    res.status(201).json({ group });
  } catch (err: any) {
    console.error('Create Group Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Get details for a single group
app.get('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const group = await GroupService.getGroupDetails(groupId, token);
    res.json({ group });
  } catch (err: any) {
    console.error('Get Group Details Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Join a group
app.post('/groups/:groupId/join', async (req, res) => {
  try {
    const { groupId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const user = await AuthService.getUser(token);
    if (!user) throw new Error('User not found');

    await GroupService.joinGroup(user.id, groupId, token);
    res.json({ message: 'Joined group successfully' });
  } catch (err: any) {
    console.error('Join Group Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Leave a group
app.delete('/groups/:groupId/leave', async (req, res) => {
  try {
    const { groupId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const user = await AuthService.getUser(token);
    if (!user) throw new Error('User not found');

    await GroupService.leaveGroup(user.id, groupId, token);
    res.json({ message: 'Left group successfully' });
  } catch (err: any) {
    console.error('Leave Group Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Get a group's message history
app.get('/groups/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    const messages = await GroupService.getGroupMessages(groupId, token);
    res.json({ messages });
  } catch (err: any) {
    console.error('Get Messages Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/*======================= GET MY GROUPS ====================== */


/* ====================== SOCKET.IO LOGIC ====================== */
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }
  try {
    const user = await AuthService.getUser(token);
    if (!user) {
      return next(new Error('Authentication error: Invalid user.'));
    }
    (socket as any).user = user; 
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token.'));
  }
});

// --- NEW: Socket.io Connection Logic ---
io.on('connection', (socket) => {
  const user = (socket as any).user; 

  if (!user) {
    console.error('Socket connected, but user object is missing. Disconnecting.');
    socket.disconnect();
    return;
  }

  console.log(`✅ User connected: ${user.email} (ID: ${user.id})`);

  // Event: Client joins a group's room
  socket.on('join_group', (groupId: string) => {
    socket.join(groupId);
    console.log(`User ${user.id} joined room ${groupId}`);
  });

  // Event: Client sends a new message
  socket.on('send_message', async (payload: { groupId: string, content: string }) => {
    const { groupId, content } = payload;
    try {
      // 1. Save the message to the database
      const savedMessage = await GroupService.saveMessage(user.id, groupId, content);

      // 2. Prepare the broadcast object
      const broadcastMessage = {
        ...savedMessage,
        users: { // This matches our getGroupMessages query
          name: user.name,
          avatar_url: (user as any).avatar_url || null
        }
      };

      // 3. Broadcast the new message
      io.to(groupId).emit('receive_message', broadcastMessage);
    
    } catch (err: any) {
      console.error('Socket send_message error:', err.message);
      socket.emit('error_message', 'Failed to send message.');
    }
  });

  // --- NEW: Typing Indicator Events ---
  socket.on('typing_start', (groupId: string) => {
    // Broadcast to everyone *except* the user who is typing
    socket.to(groupId).emit('user_typing_start', {
      userId: user.id,
      name: user.name,
    });
  });

  socket.on('typing_stop', (groupId: string) => {
    // Broadcast to everyone *except* the user who is typing
    socket.to(groupId).emit('user_typing_stop', {
      userId: user.id,
    });
  });
  // --- END NEW EVENTS ---

  // Event: Client disconnects
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${user.email}`);
  });
});
// --- End Socket.io Logic ---


// --- We listen on the httpServer, NOT the 'app' ---
httpServer.listen(port, () => {
  console.log(`🚀 Server & Socket.io running on port ${port}`);
});