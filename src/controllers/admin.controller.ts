import { Request, Response, NextFunction } from 'express';
import { validateEnv } from '../config/env';
import { sendSuccess } from '../utils/response';
import { AuthorizationError } from '../utils/errors';
import { AdminLoginInput } from '../validators/admin.validator';

const env = validateEnv();

export class AdminController {
  /**
   * POST /api/v1/admin/login
   * Validates username + password from env and returns the admin API key.
   * The frontend should store the returned token and send it as:
   *   x-admin-key: <token>
   * on all subsequent admin requests.
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body as AdminLoginInput;

      if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
        throw new AuthorizationError('Invalid admin credentials');
      }

      sendSuccess(res, {
        token: env.ADMIN_SECRET_KEY,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }
}
