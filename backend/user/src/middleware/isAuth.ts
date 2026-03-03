import type { NextFunction, Request, Response } from "express";
import type { IUser } from "../model/User.js";
import jwt, { type JwtPayload } from "jsonwebtoken";

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
        message: "Please Login - No auth header",
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

    const decodedValue = jwt.verify(token, secret) as JwtPayload;

    if (!decodedValue || !decodedValue.user) {
      res.status(401).json({
        message: "Invalid token",
      });
      return;
    }

    req.user = decodedValue.user as IUser;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Please login - JWT error",
    });
  }
};
