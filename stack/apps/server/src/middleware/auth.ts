import { auth } from "@my-better-t-app/auth";
import type { Request, Response, NextFunction } from "express";
import { services } from "../db";

/**
 * Extended Express Request with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    authUserId: string;
    customUserId: number;
    email: string;
    username: string;
    role: "User" | "Admin";
  };
}

/**
 * Authentication Middleware
 *
 * Verifies the user's session using better-auth and attaches user info to the request.
 * If the user doesn't have a custom user entry, one is created automatically.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session || !session.user) {
      res.status(401).json({ error: "Unauthorized - Please sign in" });
      return;
    }

    const authUser = session.user;

    // Validate email exists
    if (!authUser.email) {
      res.status(400).json({ error: "User email is required" });
      return;
    }

    // Get or create custom user ID
    let userSync = await services.userSync.getUserSync(authUser.id);

    if (!userSync) {
      // User exists in better-auth but not in our custom users table
      // This can happen for existing users or if sync failed during registration
      const username = authUser.name ?? authUser.email.split("@")[0];
      await services.userSync.createCustomUser(
        authUser.id,
        username,
        authUser.email,
        "User"
      );

      userSync = await services.userSync.getUserSync(authUser.id);

      if (!userSync) {
        res.status(500).json({ error: "Failed to create user profile" });
        return;
      }
    }

    // Attach user info to request
    req.user = {
      authUserId: authUser.id,
      customUserId: userSync.custom_user_id,
      email: userSync.email,
      username: userSync.username,
      role: userSync.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * Optional Authentication Middleware
 *
 * Attempts to authenticate the user but doesn't fail if they're not signed in.
 * Useful for endpoints that have different behavior for authenticated vs anonymous users.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session && session.user) {
      const authUser = session.user;

      // Only proceed if email exists
      if (!authUser.email) {
        next();
        return;
      }

      let userSync = await services.userSync.getUserSync(authUser.id);

      if (!userSync) {
        const username = authUser.name ?? authUser.email.split("@")[0];
        await services.userSync.createCustomUser(
          authUser.id,
          username,
          authUser.email,
          "User"
        );
        userSync = await services.userSync.getUserSync(authUser.id);
      }

      if (userSync) {
        req.user = {
          authUserId: authUser.id,
          customUserId: userSync.custom_user_id,
          email: userSync.email,
          username: userSync.username,
          role: userSync.role,
        };
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    // Continue without user info
    next();
  }
}

/**
 * Admin-only Middleware
 *
 * Requires authentication and checks if user has Admin role
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "Admin") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }
    next();
  });
}
