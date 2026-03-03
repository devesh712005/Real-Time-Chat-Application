import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Please Login - No Auth Header",
      });
      return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        message: "Token missing",
      });
      return;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET not defined");
    }
    const decodedValue = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    if (!decodedValue || !decodedValue.user) {
      res.status(401).json({
        message: "Invalid token",
      });
      return;
    }
    req.user = decodedValue.user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Please login - JWT error",
    });
  }
};

export default isAuth;
