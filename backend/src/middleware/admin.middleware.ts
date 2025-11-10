import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';


export interface AuthenticatedRequest extends Request {
  user?: any; 
}

export const adminRequired = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    const user = await AuthService.getUser(token);
    if (!user.is_admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    req.user = user;
    next();

  } catch (err: any) {
    console.error('Admin middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};