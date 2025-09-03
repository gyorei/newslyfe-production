// src\backend\auth\controllers\auth.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { findUserByEmail, createUser, findUserById, updateUserVerificationToken, CreateUserInput, findUserByVerificationToken, activateUser } from '../models/user.model.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { generateToken, AppJwtPayload } from '../utils/token.js';
import { generateVerificationToken, getVerificationTokenExpiry, isExpired } from '../utils/tokenService.js';
import { emailService } from '../utils/emailService.js';
const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email format.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

/**
 * Regisztrációs végpont logikája
 */
export async function register(req: Request, res: Response) {
  console.log('Register endpoint hit!');
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    console.log('Validation failed:', validation.error.flatten().fieldErrors);
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const { email, password, name } = validation.data;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    console.log('Email already registered:', email);
    return res.status(409).json({ error: 'This email is already registered.' });
  }

  const password_hash = await hashPassword(password);
  const newUserInput: CreateUserInput = {
    email,
    password_hash,
    role: 'user',
    status: 'pending',
    name,
  };
  const user = await createUser(newUserInput);
  console.log('User created, ID:', user.id);

  const verificationToken = generateVerificationToken();
  const verificationExpiry = new Date(getVerificationTokenExpiry(24));
  await updateUserVerificationToken(user.id, verificationToken, verificationExpiry);
  console.log('Verification token updated for user:', user.id);

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  const emailContent = `<p>Thank you for registering!</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`;

  console.log('Initiating email send to:', email);
  emailService.send({
    to: email,
    subject: 'Email Verification',
    html: emailContent,
  }).then(() => {
    console.log('Email sent successfully to:', email);
  }).catch(err => {
    console.error('Failed to send email to:', email, err);
  });

  return res.status(201).json({
    message: 'Registration successful! Please verify your email address using the link sent to your inbox.'
  });
}

/**
 * Bejelentkezési végpont logikája
 */
export async function login(req: Request, res: Response) {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const { email, password } = validation.data;
  const user = await findUserByEmail(email);
  // Social login user vagy nem létező user: nem engedjük a jelszavas bejelentkezést
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const token = generateToken({ id: user.id, role: user.role });
  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
  });
}

/**
 * Saját profil lekérdezése (védett végpont)
 */
export async function getProfile(req: Request, res: Response) {
  const userPayload = req.user as AppJwtPayload;
  if (!userPayload) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const user = await findUserById(userPayload.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
  });
}

/**
 * Email verification endpoint
 * GET /api/auth/verify-email?token=...
 */
export async function verifyEmail(req: Request, res: Response) {
  const token = req.query.token as string;
  if (!token) {
    return res.status(400).json({ error: 'Missing token parameter.' });
  }

  const user = await findUserByVerificationToken(token);
  if (!user || !user.verification_token_expires_at || isExpired(new Date(user.verification_token_expires_at).getTime())) {
    return res.status(404).json({ error: 'Invalid or expired verification link.' });
  }

  await activateUser(user.id);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return res.redirect(`${frontendUrl}/login?verified=true`);
}