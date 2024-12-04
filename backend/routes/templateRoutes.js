const express = require('express'); // express 모듈을 불러옵니다.
const router = express.Router(); // express의 Router를 사용하여 라우터를 생성합니다.
const templateController = require('../controllers/templateController'); // templateController 모듈을 불러옵니다.

// 공유된 모든 템플릿을 가져옵니다.
router.get('/sharedTemplates/get', templateController.getAllsharedTemplates);

// 템플릿 사용 라우트
router.post('/sharedTemplates/:id/use', templateController.usesharedTemplate);

// 템플릿 좋아요 라우트
router.post('/sharedTemplates/:id/like', templateController.likeTemplate);


module.exports = router; // 라우터를 모듈로 내보냅니다.