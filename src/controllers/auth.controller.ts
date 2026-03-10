import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AuthenticationError, ValidationError, ConflictError } from '../utils/errors';
import { SignUpInput, SignInInput, GoogleAuthInput } from '../validators/auth.validator';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  /**
   * Sign up with email and password
   */
  static async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName } = req.body as SignUpInput;

      // Sign up user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new ConflictError('Email already registered');
        }
        throw new ValidationError(error.message);
      }

      if (!data.user) {
        throw new AuthenticationError('Failed to create user');
      }

      // Format response based on whether email verification is required
      const response: any = {
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name,
        },
      };

      // If session exists (no email verification required), format it consistently
      if (data.session) {
        response.session = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
          expiresAt: data.session.expires_at,
        };
      } else {
        // No session means email verification is required
        response.message = 'Please check your email to verify your account';
        response.requiresEmailVerification = true;
      }

      sendSuccess(res, response, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as SignInInput;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new AuthenticationError('Invalid email or password');
      }

      if (!data.user || !data.session) {
        throw new AuthenticationError('Authentication failed');
      }

      sendSuccess(res, {
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name,
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
          expiresAt: data.session.expires_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body as GoogleAuthInput;

      // Verify and sign in with Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        throw new AuthenticationError('Google authentication failed: ' + error.message);
      }

      if (!data.user || !data.session) {
        throw new AuthenticationError('Google authentication failed');
      }

      sendSuccess(res, {
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name,
          avatar: data.user.user_metadata?.avatar_url,
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
          expiresAt: data.session.expires_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Google OAuth URL
   */
  static async getGoogleAuthUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${req.protocol}://${req.get('host')}/google/callback`,
          // redirectTo: `${req.protocol}://localhost:5173/google/callback`,
        },
      });

      if (error) {
        throw new AuthenticationError('Failed to generate Google auth URL');
      }

      sendSuccess(res, {
        url: data.url,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sign out
   */
  static async signOut(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);

      if (token) {
        await supabaseAdmin.auth.admin.signOut(token);
      }

      sendSuccess(res, { message: 'Successfully signed out' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      if (!data.session) {
        throw new AuthenticationError('Failed to refresh token');
      }

      sendSuccess(res, {
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
          expiresAt: data.session.expires_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(req.user.id);

      if (error || !user) {
        throw new AuthenticationError('User not found');
      }

      sendSuccess(res, {
        user: {
          id: user.user.id,
          email: user.user.email,
          fullName: user.user.user_metadata?.full_name,
          avatar: user.user.user_metadata?.avatar_url,
          emailVerified: !!user.user.email_confirmed_at,
          createdAt: user.user.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.protocol}://${req.get('host')}/reset-password`,
      });

      if (error) {
        throw new ValidationError(error.message);
      }

      // Always return success for security (don't reveal if email exists)
      sendSuccess(res, {
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body;

      // Verify the token and update password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw new AuthenticationError('Invalid or expired reset token');
      }

      sendSuccess(res, {
        message: 'Password successfully reset',
      });
    } catch (error) {
      next(error);
    }
  }
}
