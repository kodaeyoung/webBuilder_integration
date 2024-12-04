require('dotenv').config();
const sequelize = require('./config/db'); // MariaDB 연결 설정 불러오기
const app = require('./config/app'); // Express 앱 설정 불러오기

const PORT = process.env.PORT || 3000;

// 데이터베이스 연결 및 서버 실행
sequelize.sync({ alter: false })
  .then(() => {
    app.listen(PORT, '0.0.0.0',() => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
