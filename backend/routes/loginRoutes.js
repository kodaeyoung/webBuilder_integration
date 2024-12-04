const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Google 로그인 라우트
router.get('/google', authController.googleAuth);

// Google 로그인 콜백 라우트
router.get('/google/callback', authController.googleAuthCallback, authController.authCallbackRedirect);

// 사용자 정보 라우트
router.get('/profile', authController.getUser);

// 로그아웃 라우트
router.get('/logout', authController.logout);

module.exports = router;
