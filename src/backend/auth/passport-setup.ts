import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { findUserByEmail, createUser, User } from './models/user.model';
import { generateToken } from './utils/token';

// Eltávolítjuk az azonnali process.exit(1) hívást
// A Google OAuth2 stratégia csak akkor inicializálódik, ha a változók elérhetők
function initializeGoogleStrategy() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('WARNING: Google OAuth2 credentials are not defined. Google login will be disabled.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken: string, refreshToken: string, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email found in Google profile'));
          let user = await findUserByEmail(email);
          if (!user) {
            user = await createUser({
              email,
              name: profile.displayName,
              password_hash: null, // Social login user: nincs jelszó
              role: 'user',
              status: 'active',
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

// Késleltetett inicializálás - csak akkor fut le, amikor már betöltődtek az env változók
setTimeout(initializeGoogleStrategy, 100);

export function issueJwtForUser(user: User) {
  return generateToken({ id: user.id, role: user.role });
}

export default passport;