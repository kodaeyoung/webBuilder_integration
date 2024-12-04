const User = require('../models/user')

exports.handleAuthCallback = async (req) => {
    // req.user에서 사용자 프로필 정보를 가져옵니다.
    const profile = req.user;
    
    // 데이터베이스에서 Google ID로 사용자를 찾습니다.
    let user = await User.findOne({ where: { googleId: profile.id } });
  
    // 사용자가 데이터베이스에 없으면 새로 생성합니다.
    if (!user) {
      user = await User.create({
        googleId: profile.id,  // Google ID 저장
        displayName: profile.displayName,  // 사용자 이름 저장
        email: profile.emails[0].value,  // 이메일 저장
        profileImageUrl: profile.photos[0] ? profile.photos[0].value : null  // 프로필 이미지 URL 저장 (존재하는 경우)
      });
    }
  
    // Promise를 반환하여 사용자 로그인 세션을 설정합니다.
    return new Promise((resolve, reject) => {
      req.login(user, (err) => {
        if (err) {
          // 로그인 중 오류가 발생하면 reject를 호출합니다.
          return reject(err);
        }
        // 성공적으로 로그인하면 resolve를 호출합니다.
        resolve();
      });
    });
  };
  