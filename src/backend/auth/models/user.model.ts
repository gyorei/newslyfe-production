// src\backend\auth\models\user.model.ts
import { db } from '../../server/PostgreSQLManager.js';

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  role: string;
  status: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
  // Új mezők az email verifikációhoz
  verification_token: string | null;
  verification_token_expires_at: Date | null;
  email_verified: boolean;
}

// Új, dedikált típus a felhasználó létrehozásához
export type CreateUserInput = Pick<User, 'email' | 'password_hash' | 'role' | 'status' | 'name'>;

const TABLE_NAME = 'public.users';

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await db.query<User>(
    `SELECT * FROM ${TABLE_NAME} WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

export async function createUser(user: CreateUserInput): Promise<User> {
  const result = await db.query<User>(
    `INSERT INTO ${TABLE_NAME} (email, password_hash, role, status, name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user.email, user.password_hash, user.role, user.status, user.name]
  );
  return result.rows[0];
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await db.query<User>(
    `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Frissíti a felhasználó verifikációs tokenjét és lejárati idejét
 */
export async function updateUserVerificationToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<User | null> {
  const result = await db.query<User>(
    `UPDATE ${TABLE_NAME}
     SET verification_token = $1,
         verification_token_expires_at = $2
     WHERE id = $3
     RETURNING *`,
    [token, expiresAt, userId]
  );
  return result.rows[0] || null;
}

/**
 * Felhasználó keresése verifikációs token alapján
 */
export async function findUserByVerificationToken(token: string): Promise<User | null> {
  const result = await db.query<User>(
    `SELECT * FROM ${TABLE_NAME} WHERE verification_token = $1`,
    [token]
  );
  return result.rows[0] || null;
}

/**
 * Aktiválja a felhasználót az email verifikáció után.
 */
export async function activateUser(userId: string): Promise<User | null> {
  const result = await db.query<User>(
    `UPDATE ${TABLE_NAME}
     SET status = 'active',
         email_verified = TRUE,
         verification_token = NULL,
         verification_token_expires_at = NULL
     WHERE id = $1
     RETURNING *`,
    [userId]
  );
  return result.rows[0] || null;
}