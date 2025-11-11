import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { createServer } from "http";
import cron from "node-cron";
import { Server } from "socket.io";
import { AIService } from "./ai.service";
import { AnalyticsService } from "./AnalyticsService";
import { AuthService } from "./auth.service";
import { FlashcardService } from "./flashcard.service";
import { GroupService } from "./GroupService";
import { NotificationService } from "./NotificationService";
import { StudyPlanService } from "./study-plan.service";
import { UserService } from "./UserService";
import {
  adminRequired,
  AuthenticatedRequest,
} from "./middleware/admin.middleware";
import { authRequired } from "./middleware/auth.middleware";
import { StorageService } from "./StorageService";
import multer from "multer";

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
    methods: ["GET", "POST"],
  },
});

const supabaseUrl = "https://tfdghduqsaniszkvzyhl.supabase.co";
const supabaseAdminClient = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_KEY!
);

/* ====================== AUTH ROUTES ====================== */

app.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const { user, session } = await AuthService.signUp(email, password, name);
    await AuthService.createUserProfile(user.id, email, name);
    await AuthService.signOut();
    res.json({ user, session });
  } catch (err: any) {
    console.error("SignUp Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.post("/auth/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, session } = await AuthService.signIn(email, password);
    res.json({ user, session });
  } catch (err: any) {
    console.error("SignIn Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/auth/user", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    res.json({ user });
  } catch (err: any) {
    console.error("Get User Error:", err.message);
    res.status(401).json({ error: err.message });
  }
});
app.post("/auth/signout", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    await AuthService.signOut();
    res.json({ message: "Signed out successfully" });
  } catch (err: any) {
    console.error("Signout Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== AI ROUTE ====================== */

app.post("/ai/generate", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No authorization token provided");
    const { userId, message } = req.body;
    if (!userId || !message) throw new Error("Missing userId or message");
    const reply = await AIService.generateResponse(userId, message, token);
    res.json({ reply: reply });
  } catch (err: any) {
    console.error("AI /generate Route Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ====================== STUDY PLAN ROUTES ====================== */

app.post("/study-plan/generate", async (req, res) => {
  try {
    const { subjects, timeSlots, startDate } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    const plan = await StudyPlanService.generatePlan(
      user.id,
      subjects,
      timeSlots,
      startDate,
      token
    );
    res.status(201).json({ plan });
  } catch (err: any) {
    console.error("Generate Plan Route Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/study-plan/history/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !userId) throw new Error("Missing userId or token");
    const plans = await StudyPlanService.getPlanHistory(userId, token);
    res.json({ plans });
  } catch (err: any) {
    console.error("Study Plan History Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/study-plan/:planId", async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !planId) throw new Error("Missing planId or token");
    const plan = await StudyPlanService.getPlanById(planId, token);
    res.json({ plan });
  } catch (err: any) {
    console.error("Get Study Plan Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/study-plan/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !userId) throw new Error("Missing userId or token");
    const plans = await StudyPlanService.getUserPlans(userId, token);
    res.json({ plans });
  } catch (err: any) {
    console.error("Get User Plans Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== FLASHCARDS ====================== */

app.post("/flashcard/generate", async (req: Request, res: Response) => {
  try {
    const { subject, count } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !subject || !count)
      throw new Error("Missing subject, count, or token");
    const user = await AuthService.getUser(token);
    const flashcards = await FlashcardService.generateFlashcards(
      user.id,
      subject,
      count,
      token
    );
    res.json({ flashcards });
  } catch (err: any) {
    console.error("Flashcard Generate Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/flashcards/review", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    const reviewDeck = await FlashcardService.getReviewDeck(user.id, token);
    res.json({ reviewDeck });
  } catch (err: any) {
    console.error("Get Review Deck Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.post("/flashcards/review/:cardId", async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const { performance } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    if (!performance) throw new Error("Performance rating is required");
    const user = await AuthService.getUser(token);
    const updatedCard = await FlashcardService.updateFlashcardReview(
      cardId,
      user.id,
      performance,
      token
    );
    res.json({ updatedCard });
  } catch (err: any) {
    console.error("Update Review Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== USER ROUTES ====================== */

app.get("/user/education-level", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    const data = await GroupService.getUserEducationLevel(user.id, token);
    res.json({ level: data?.level || null });
  } catch (err: any) {
    console.error("Get Education Level Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.post("/user/education-level", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const { level } = req.body;
    if (!level) throw new Error("No level provided");
    const user = await AuthService.getUser(token);
    await GroupService.saveUserEducationLevel(user.id, level, token);
    res.json({ success: true, level: level });
  } catch (err: any) {
    console.error("Save Education Level Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/user/statistics/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !userId) throw new Error("Missing userId or token");
    const statistics = await UserService.getUserStatistics(userId, token);
    res.json({ statistics });
  } catch (err: any) {
    console.error("Get User Statistics Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.post("/user/study-session", async (req: Request, res: Response) => {
  try {
    const { userId, subject, duration } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !userId || !subject || !duration)
      throw new Error("Missing required fields");
    await UserService.recordStudySession(userId, subject, duration, token);
    res.json({ message: "Study session recorded successfully" });
  } catch (err: any) {
    console.error("Record Study Session Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/user/achievements", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("Missing token");
    const achievements = await UserService.getAchievements(token);
    res.json({ achievements });
  } catch (err: any) {
    console.error("Get Achievements Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== ANALYTICS ROUTES ====================== */

app.get("/analytics/subject-breakdown", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    const data = await AnalyticsService.getSubjectBreakdown(user.id, token);
    res.json({ data });
  } catch (err: any) {
    console.error("Get Subject Breakdown Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/analytics/time-series", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    const data = await AnalyticsService.getTimeSeries(user.id, token);
    res.json({ data });
  } catch (err: any) {
    console.error("Get Time Series Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== GROUP ROUTES ====================== */

app.get("/groups", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const groups = await GroupService.getAllGroups(token);
    res.json({ groups });
  } catch (err: any) {
    console.error("Get Groups Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/groups/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    const groupIds = await GroupService.getMyGroupIds(user.id, token);
    res.json({ groupIds });
  } catch (err: any) {
    console.error("Get My Groups Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.post("/groups", async (req, res) => {
  try {
    const { name, description } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    const group = await GroupService.createGroup(
      user.id,
      name,
      description,
      token
    );
    res.status(201).json({ group });
  } catch (err: any) {
    console.error("Create Group Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const group = await GroupService.getGroupDetails(groupId, token);
    res.json({ group });
  } catch (err: any) {
    console.error("Get Group Details Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/groups/:groupId/rooms", async (req, res) => {
  try {
    const { groupId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const rooms = await GroupService.getGroupRooms(groupId, token);
    res.json({ rooms });
  } catch (err: any) {
    console.error("Get Group Rooms Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.post("/groups/:groupId/join", async (req, res) => {
  try {
    const { groupId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    await GroupService.joinGroup(user.id, groupId, token);
    res.json({ message: "Joined group successfully" });
  } catch (err: any) {
    console.error("Join Group Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.delete("/groups/:groupId/leave", async (req, res) => {
  try {
    const { groupId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    await GroupService.leaveGroup(user.id, groupId, token);
    res.json({ message: "Left group successfully" });
  } catch (err: any) {
    console.error("Leave Group Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.get("/groups/:groupId/messages", async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { roomName } = req.query;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    if (!roomName) throw new Error("A roomName query parameter is required");
    const messages = await GroupService.getGroupMessages(
      groupId,
      roomName as string,
      token
    );
    res.json({ messages });
  } catch (err: any) {
    console.error("Get Messages Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== NOTIFICATION ROUTES ====================== */

app.get("/notifications/vapid-key", (req, res) => {
  try {
    const key = NotificationService.getVapidKey();
    res.json({ publicKey: key });
  } catch (err: any) {
    console.error("Get Vapid Key Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.post("/notifications/subscribe", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    const subscription = req.body.subscription;
    if (!subscription) throw new Error("No subscription object provided");
    await NotificationService.saveSubscription(user.id, subscription, token);
    res.status(201).json({ message: "Subscription saved." });
  } catch (err: any) {
    console.error("Subscribe Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});
app.post("/notifications/test", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");
    const user = await AuthService.getUser(token);
    await NotificationService.sendNotification(
      user.id,
      "Test Notification",
      "This is a test from Goal Mate!",
      "/"
    );
    res.json({ message: "Test notification sent." });
  } catch (err: any) {
    console.error("Test Notification Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ====================== FILE UPLOAD SETUP ====================== */
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/* ====================== FILE UPLOAD ROUTE ====================== */

app.post(
  "/api/upload",
  authRequired,
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      const file = req.file;

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      if (!file) {
        return res.status(400).json({ error: "No file was uploaded." });
      }
      const publicUrl = await StorageService.uploadFile(file, user.id);
      res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error("File Upload Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);
/* ====================== ADMIN ROUTES ====================== */

app.get(
  "/admin/stats",
  adminRequired,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { count: userCount, error: userError } = await supabaseAdminClient
        .from("users")
        .select("id", { count: "exact", head: true });
      const { count: premiumCount, error: premiumError } =
        await supabaseAdminClient
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("subscription_tier", "premium");
      const { count: groupCount, error: groupError } = await supabaseAdminClient
        .from("study_groups")
        .select("id", { count: "exact", head: true });
      if (userError || premiumError || groupError) {
        throw new Error(
          userError?.message || premiumError?.message || groupError?.message
        );
      }
      res.json({
        totalUsers: userCount || 0,
        premiumUsers: premiumCount || 0,
        totalGroups: groupCount || 0,
      });
    } catch (err: any) {
      console.error("Admin Stats Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);
app.get(
  "/admin/users",
  adminRequired,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabaseAdminClient
        .from("users")
        .select(
          "id, name, email, subscription_tier, created_at, user_education_level (level)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error("Admin Get Users Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);
app.post(
  "/admin/users/update-tier",
  adminRequired,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, newTier } = req.body;
      if (!userId || !newTier) {
        return res
          .status(400)
          .json({ error: "userId and newTier are required" });
      }
      const { data, error } = await supabaseAdminClient
        .from("users")
        .update({
          subscription_tier: newTier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select(
          "id, name, email, subscription_tier, user_education_level (level)"
        )
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      console.error("Admin Update Tier Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  "/admin/users/update-education-level",
  adminRequired,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, newLevel } = req.body;

      if (!userId || !newLevel) {
        return res.status(400).json({ error: "Missing userId or newLevel" });
      }

      const data = await GroupService.updateUserEducationLevelAdmin(
        userId,
        newLevel
      );

      res.json({
        success: true,
        message: "Education level updated successfully",
        data,
      });
    } catch (err: any) {
      console.error("Admin Update Education Level Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  "/admin/announce",
  adminRequired,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminUser = req.user;
      if (!adminUser) throw new Error("Admin user not found on request");
      const { roomName, content } = req.body;
      if (!roomName || !content) {
        return res
          .status(400)
          .json({ error: "roomName and content are required" });
      }
      const { data: adminGroup, error: groupError } = await supabaseAdminClient
        .from("study_groups")
        .select("id")
        .eq("is_admin_group", true)
        .single();
      if (groupError || !adminGroup) {
        throw new Error("Admin group not found");
      }
      const savedMessage = await GroupService.saveMessage(
        adminUser.id,
        adminGroup.id,
        roomName,
        content,
        null
      );
      const broadcastMessage = {
        ...savedMessage,
        users: {
          name: adminUser.name,
          avatar_url: null,
        },
      };
      const roomSocketName = `${adminGroup.id}-${roomName}`;
      io.to(roomSocketName).emit("receive_message", broadcastMessage);
      res.status(201).json({ success: true, message: savedMessage });
    } catch (err: any) {
      console.error("Admin Announce Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

/* ====================== VOICE API ROUTES ====================== */

app.get(
  "/api/voice/summary",
  authRequired,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      const sessionCount = 2;
      const unreadMessages = 3;
      const summary = `
      Welcome back, ${user.name}.
      You have ${sessionCount} study sessions scheduled for today.
      You also have ${unreadMessages} new messages in your study groups.
      What would you like to do?
    `;
      res.json({ spokenResponse: summary });
    } catch (err: any) {
      console.error("Voice API Summary Error:", err.message);
      res.status(500).json({ error: "Failed to generate voice summary" });
    }
  }
);

/* ====================== SOCKET.IO LOGIC (MODIFIED) ====================== */

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided."));
  }
  try {
    const user = await AuthService.getUser(token);
    (socket as any).user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token."));
  }
});

io.on("connection", (socket) => {
  const user = (socket as any).user;

  if (!user) {
    console.error(
      "Socket connected, but user object is missing. Disconnecting."
    );
    socket.disconnect();
    return;
  }

  (socket as any).currentRoom = null;
  socket.join(user.id);
  const broadcastOnlineUsers = async (roomSocketName: string) => {
    try {
      const socketsInRoom = await io.in(roomSocketName).fetchSockets();
      const onlineUsers = socketsInRoom.map((s) => {
        const socketUser = (s as any).user;
        return {
          id: socketUser.id,
          name: socketUser.name,
          avatar_url: null,
        };
      });
      io.to(roomSocketName).emit("online_users_update", onlineUsers);
      console.log(
        `Broadcasted online users for ${roomSocketName}: ${onlineUsers.length} users`
      );
    } catch (err: any) {
      console.error(
        `Error broadcasting online users for ${roomSocketName}:`,
        err.message
      );
    }
  };
  socket.on(
    "join_room",
    async (payload: { groupId: string; roomName: string }) => {
      const { groupId, roomName } = payload;
      if (!groupId || !roomName) return;
      const isEducationRoom = ["primary", "secondary", "tertiary"].includes(
        roomName
      );
      if (
        !user.is_admin &&
        isEducationRoom &&
        user.education_level !== roomName
      ) {
        console.warn(
          `SECURITY: User ${user.id} DENIED access to room ${roomName}.`
        );
        socket.emit(
          "error_message",
          "You do not have permission to join this room."
        );
        return;
      }
      const roomSocketName = `${groupId}-${roomName}`;
      const oldRoom = (socket as any).currentRoom;
      if (oldRoom && oldRoom !== roomSocketName) {
        socket.leave(oldRoom);
        await broadcastOnlineUsers(oldRoom);
      }

      socket.join(roomSocketName);
      (socket as any).currentRoom = roomSocketName;
      console.log(`User ${user.id} joined room ${roomSocketName}`);
      await broadcastOnlineUsers(roomSocketName);
    }
  );
  socket.on(
    "leave_room",
    async (payload: { groupId: string; roomName: string }) => {
      const { groupId, roomName } = payload;
      if (!groupId || !roomName) return;
      const roomSocketName = `${groupId}-${roomName}`;
      socket.leave(roomSocketName);
      (socket as any).currentRoom = null;
      console.log(`User ${user.id} left room ${roomSocketName}`);
      await broadcastOnlineUsers(roomSocketName);
    }
  );
  socket.on(
    "send_message",
    async (payload: {
      groupId: string;
      roomName: string;
      content: string;
      fileUrl: string | null;
    }) => {
      const { groupId, roomName, content, fileUrl } = payload;
      if (!groupId || !roomName || (!content && !fileUrl)) return;
      const isEducationRoom = ["primary", "secondary", "tertiary"].includes(
        roomName
      );
      if (
        !user.is_admin &&
        isEducationRoom &&
        user.education_level !== roomName
      ) {
        console.warn(
          `SECURITY: User ${user.id} DENIED message send to ${roomName}.`
        );
        socket.emit(
          "error_message",
          "You do not have permission to post in this room."
        );
        return;
      }
      const roomSocketName = `${groupId}-${roomName}`;

      try {
        const savedMessage = await GroupService.saveMessage(
          user.id,
          groupId,
          roomName,
          content,
          fileUrl
        );
        const broadcastMessage = {
          ...savedMessage,
          users: {
            name: user.name,
            avatar_url: null,
          },
        };
        io.to(roomSocketName).emit("receive_message", broadcastMessage);

        try {
          const socketsInRoom = await io.in(roomSocketName).fetchSockets();
          const onlineUserIds = socketsInRoom.map((s) => (s as any).user.id);
          const allMemberIds = await GroupService.getGroupMembers(groupId);
          const offlineUserIds = allMemberIds.filter(
            (id) => !onlineUserIds.includes(id) && id !== user.id
          );

          if (offlineUserIds.length > 0) {
            console.log(
              `Sending push notifications to ${offlineUserIds.length} offline members of room ${roomSocketName}.`
            );
            const messageSnippet = content
              ? content.length > 100
                ? content.substring(0, 97) + "..."
                : content
              : "Sent an attachment";
            const notificationTasks = offlineUserIds.map((userId) =>
              NotificationService.sendNotification(
                userId,
                `${user.name} (#${roomName})`,
                messageSnippet,
                `/study-groups/${groupId}?room=${roomName}`
              )
            );
            await Promise.allSettled(notificationTasks);
          }
        } catch (pushError: any) {
          console.error(
            "Socket send_push_notification error:",
            pushError.message
          );
        }
      } catch (err: any) {
        console.error("Socket send_message error:", err.message);
        socket.emit("error_message", "Failed to send message.");
      }
    }
  );
  socket.on(
    "add_reaction",
    async (payload: {
      messageId: number;
      emoji: string;
      groupId: string;
      roomName: string;
    }) => {
      try {
        const { messageId, emoji, groupId, roomName } = payload;
        if (!messageId || !emoji || !groupId || !roomName) return;
        const updatedMessage = await GroupService.addReaction(
          messageId,
          user.id,
          emoji
        );
        const roomSocketName = `${groupId}-${roomName}`;
        io.to(roomSocketName).emit("reaction_update", updatedMessage);
      } catch (err: any) {
        console.error("Socket add_reaction error:", err.message);
        socket.emit("error_message", "Failed to add reaction.");
      }
    }
  );

  socket.on(
    "message_read",
    async (payload: {
      messageId: number;
      groupId: string;
      roomName: string;
    }) => {
      try {
        const { messageId, groupId, roomName } = payload;
        if (!messageId || !groupId || !roomName) return;
        const token = (socket as any).handshake.auth.token;
        await GroupService.addReadReceipt(messageId, user.id, token);
        const roomSocketName = `${groupId}-${roomName}`;
        io.to(roomSocketName).emit("read_receipt_update", {
          messageId: messageId,
          userId: user.id,
        });
      } catch (err: any) {
        console.error("Socket message_read error:", err.message);
      }
    }
  );

  socket.on(
    "typing_start",
    (payload: { groupId: string; roomName: string }) => {
      if (!payload.groupId || !payload.roomName) return;
      const roomSocketName = `${payload.groupId}-${payload.roomName}`;
      socket.to(roomSocketName).emit("user_typing_start", {
        userId: user.id,
        name: user.name,
      });
    }
  );

  socket.on("typing_stop", (payload: { groupId: string; roomName: string }) => {
    if (!payload.groupId || !payload.roomName) return;
    const roomSocketName = `${payload.groupId}-${payload.roomName}`;
    socket.to(roomSocketName).emit("user_typing_stop", {
      userId: user.id,
    });
  });

  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${user.email}`);
    const roomSocketName = (socket as any).currentRoom;
    if (roomSocketName) {
      await broadcastOnlineUsers(roomSocketName);
    }
  });
});

/* ====================== CRON JOBS ====================== */

console.log("Setting up cron jobs...");
cron.schedule("0 * * * *", () => {
  console.log("CronJob: Running hourly task for study plan reminders...");
  StudyPlanService.sendUpcomingSessionNotifications();
});
cron.schedule("0 9 * * *", () => {
  console.log("CronJob: Running daily task for flashcard reminders...");
  FlashcardService.sendReviewNotifications();
});

/* ====================== START SERVER ====================== */

console.log("Cron jobs scheduled.");
httpServer.listen(port, () => {
  console.log(` Server & Socket.io running on port ${port}`);
});
