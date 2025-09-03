// src\backend\auth\routes\auth.routes.ts
import { Router } from 'express';
import { register, login, getProfile, verifyEmail } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import passport from '../passport-setup.js';
import { issueJwtForUser } from '../passport-setup.js';

const router = Router();

// Regisztráció
router.post('/register', register);

// Bejelentkezés
router.post('/login', login);

// Saját profil lekérdezése (védett végpont)
router.get('/me', authMiddleware, getProfile);

// Email verification endpoint
router.get('/verify-email', verifyEmail);

// Social login indítása (Google)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Social login callback (Google)
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Típusbiztos ellenőrzés és konverzió
    if (!req.user || !('id' in req.user && 'email' in req.user && 'role' in req.user)) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login-failure`);
    }
    // Explicit konverzió a saját User típusra
    const user = req.user as import('../models/user.model.js').User;
    const token = issueJwtForUser(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login-success?token=${token}`);
  }
);

export default router;