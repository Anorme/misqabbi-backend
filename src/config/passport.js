import env from "./env.js";

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "../models/user.mongo.js";
import { createGoogleUser, findUserByEmail } from "../models/user.model.js";

/**
 * Configure Passport to use the Local Strategy for email/password authentication,
 *
 * - Overrides the default 'username' field with 'email'.
 * - Uses custom logic to verify user credentials via Mongoose and bcrypt.
 * - Returns structured error messages for development; replace with generic messages in production.
 */
passport.use(
  new LocalStrategy(
    { usernameField: "email" }, // Specify 'email' as the login identifier
    async (email, password, done) => {
      try {
        // Attempt to find user by email
        const user = await User.findOne({ email });

        // If user is not found, authentication fails
        // Replace message with a generic one in production to avoid leaking system info
        if (!user) return done(null, false, { message: "User not found" });

        // Compare provided password with stored hash
        const isMatch = await user.comparePassword(password);

        // If password does not match, authentication fails
        // Replace message with a generic one in production
        if (!isMatch)
          return done(null, false, { message: "Incorrect password" });

        // Authentication successful; return user object
        return done(null, user);
      } catch (err) {
        // Internal error during authentication
        return done(err);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile?.emails[0]?.value;
      if (!email)
        return done(null, false, { message: "No email returned from Google" });

      let user = await findUserByEmail(email);

      if (!user) {
        user = await createGoogleUser({
          email,
          googleId: profile.id,
          displayName: profile.displayName,
        });
      } else if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }

      return done(null, user);
    }
  )
);
