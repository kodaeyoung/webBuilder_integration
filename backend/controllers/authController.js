const passport = require('passport');
const authService = require('../services/authService');


exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleAuthCallback = passport.authenticate('google', { failureRedirect: '/' });

exports.authCallbackRedirect = async (req, res) => {
  try {
    await authService.handleAuthCallback(req);
    const redirectUrl = 'http://localhost:4000'; // 실제 클라이언트 주소로 변경
    res.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    res.redirect('/http://localhost:4000/login');
  }
};




exports.getUser = (req, res) => {
  console.log('Get User - Session:', req.session);
  console.log('Get User - User:', req.user);
  if (req.isAuthenticated()) {
    const { displayName, profileImageUrl } = req.user;
    res.json({ displayName, profileImageUrl });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

exports.logout = (req, res, next) => {
  req.logout(err => {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.send(`
        <html>
          <body>
            <script>
              window.location.href = 'https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=https://1am11m.store/';
            </script>
          </body>
        </html>
      `);
    });
  });
};
