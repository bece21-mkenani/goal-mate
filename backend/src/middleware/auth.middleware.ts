import { Request, Response, NextFunction } from "express";
import { AuthService } from "../auth.service";
import { AuthenticatedRequest } from "./admin.middleware";

export const authRequired = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }
    const user = await AuthService.getUser(token);
    req.user = user;
    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};
