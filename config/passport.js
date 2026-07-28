const passport = require('passport');

const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here' &&
    process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret_here';

if (isGoogleConfigured) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const { Op } = require('sequelize');
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
      let user = await User.findOne({ where: { [Op.or]: [{ googleId: profile.id }, { email }] } });
      if (!user) {
        user = await User.create({
          name: profile.displayName, email,
          avatar: profile.photos?.[0]?.value || '',
          googleId: profile.id, provider: 'google', isActive: true
        });
      } else {
        if (!user.googleId) { user.googleId = profile.id; user.provider = 'google'; }
        if (profile.photos?.[0]?.value && !user.avatar) user.avatar = profile.photos[0].value;
        await user.save();
      }
      done(null, user);
    } catch (err) { done(err, null); }
  }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const User = require('../models/User');
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    done(null, user);
  } catch (err) { done(err, null); }
});

module.exports = passport;
module.exports.isGoogleConfigured = isGoogleConfigured;