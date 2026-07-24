const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
  proxy: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email returned from Google'), null);

    let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email,
        avatar: profile.photos?.[0]?.value || '',
        googleId: profile.id,
        provider: 'google',
        isActive: true
      });
    } else {
      if (!user.googleId) {
        user.googleId = profile.id;
        user.provider = 'google';
      }
      if (profile.photos?.[0]?.value && !user.avatar) {
        user.avatar = profile.photos[0].value;
      }
      await user.save();
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;