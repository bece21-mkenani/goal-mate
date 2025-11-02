import express, { Request, Response } from 'express';
import cors from 'cors';
import { AuthService } from './auth.service';
import { AIService } from './ai.service';
import { StudyPlanService } from './study-plan.service';
import { FlashcardService } from './flashcard.service';
import { UserService } from './UserService';

const app = express();
const port = process.env.PORT || 3036;

// Middleware
app.use(cors());
app.use(express.json());

/* ====================== AUTH ROUTES ====================== */

// Sign up
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

// Sign in
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

// Get user
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

// Sign out
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

/* ====================== SERVER START ====================== */

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
