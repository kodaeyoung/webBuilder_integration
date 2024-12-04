const express = require('express');
const router = express.Router();
const multer = require('multer');
const userTemplateController = require('../controllers/userTemplateController');

// 디렉터리 구조를 제공하는 API
router.get('/directory', userTemplateController.getDirectoryStructure);

// 파일 내용을 읽어오는 API
router.get('/file', userTemplateController.getFileContents);

// 파일 내용을 GPT API를 통해 수정하는 API
router.post('/modify-file', userTemplateController.modifyFileWithGpt);

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('image'), userTemplateController.uploadImage);

module.exports = router;