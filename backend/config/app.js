require('dotenv').config(); // 환경 변수 로드를 최상단에 위치시킵니다.
const express = require('express');
const session = require('express-session');
const cors = require('cors');  // cors 모듈 추가
const path = require('path'); // path 모듈 추가
const passport = require('./passport'); // 모듈화된 Passport 설정 불러오기
const loginRoutes = require('../routes/loginRoutes'); // 로그인 라우트 불러오기
const generateRoutes= require("../routes/generateRoutes"); //챗 라우트 불러오기
const dashboardRoutes = require('../routes/dashboardRoutes'); //대시 보드 라우트 불러오기
const templateRoutes = require('../routes/templateRoutes'); //대시 보드 라우트 불러오기
const userTemplateRoutes = require('../routes/userTemplateRoutes');
const deployRoutes=require('../routes/deployRoutes');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize =require('./db');
const app = express();


// CORS 설정
app.use(cors({
  origin: 'http://localhost:4000', // 클라이언트 도메인
  credentials: true
}));

app.set('trust proxy', 1); // 프록시 신뢰 설정


// JSON 및 URL 인코딩된 본문 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 및 Passport 설정
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new SequelizeStore({
    db: sequelize,
  }),
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    secure: false,
    sameSite: 'strict'
  } // 프로덕션에서는 true로 설정 (HTTPS)
}));


app.use(passport.initialize());
app.use(passport.session());

// 미들웨어를 사용하여 요청된 URL을 디코딩
app.use((req, res, next) => {
  req.url = decodeURIComponent(req.url);
  next();
});

// 정적 파일 제공
const copiedTemplatesPath = path.resolve(__dirname, '../../copied_userTemplates');
const createdPagesPath = path.resolve(__dirname, '../../created_userPages');
const sharedTemplatesPath = path.resolve(__dirname, '../../sharedTempcdlates');
const frontendPath = path.resolve(__dirname, '../../frontend/public');
const page_screenshotsPath=path.resolve(__dirname,'../../page_screenshots');
const sharedpage_screenshotsPath =path.resolve(__dirname,'../../sharedpage_screenshots');
const deployProject=path.resolve(__dirname,'../../deployProjects');
const imageStore=path.resolve(__dirname,'../../imageStore');

app.use('/static', express.static(frontendPath));
app.use('/copied_userTemplates', express.static(copiedTemplatesPath));
app.use('/sharedTemplates', express.static(sharedTemplatesPath));
app.use('/created_userPages', express.static(createdPagesPath));
app.use('/page_screenshots', express.static(page_screenshotsPath));
app.use('/sharedpage_screenshots', express.static(sharedpage_screenshotsPath));
app.use('/publish',express.static(deployProject));

// 라우트 설정
app.use('/auth', loginRoutes);
app.use('/generate', generateRoutes); // 생성 라우트 추가
app.use('/dashboards',dashboardRoutes); //대시보드 라우트 추가
app.use('/templates',templateRoutes); //템플릿 라우트 추가  
app.use('/user-templates', userTemplateRoutes); //사용자 템플릿 라우트 추가
app.use('/deploy',deployRoutes); // 배포 라우트 추가

module.exports = app;