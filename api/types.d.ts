import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string | null;
        role: string;
        passwordHash?: string | null;
      };
    }
  }
}

declare module "cookie-parser";
