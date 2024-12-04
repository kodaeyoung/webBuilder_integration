const userTemplateService = require('../services/userTemplateService');
const modifyService = require('../services/modifyService');
const path = require('path');

// 사용자의 템플릿 정보

exports.getDirectoryStructure = async (req, res) => {
  const { dirPath } = req.query;  // 쿼리 파라미터로 디렉터리 경로 받기
  try {
    const directories = await userTemplateService.getDirectoryStructure(dirPath);
    res.json(directories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read directory' });
  }
};

exports.getFileContents = async (req, res) => {
  const { filePath } = req.query;  // 쿼리 파라미터로 디렉터리 및 파일 경로 받기
  try {
    const content = await userTemplateService.getFileContents(filePath);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read file' });
  }
};

exports.modifyFileWithGpt = async (req, res) => {
  const { path, prompt } = req.body;

    if (!path || !prompt) {
        return res.status(400).send('File path and prompt are required.');
    }

    try {
        // prompt를 분리하여 Dom Element와 수정할 사항을 구분
        const promptParts = prompt.split('\n\n');
        let domElement = promptParts[0].replace('# DOM Element', '').trim();
        const modificationRequest = promptParts[1].replace('# Prompt', '').trim();

         // 빈 class 속성 제거
         domElement = domElement.replace(/\sclass=""/g, '');

        // GPT로 Dom Element와 수정사항을 기반으로 새로운 코드 생성
        let gptGeneratedElement;
        
        if (domElement == '선택한 요소가 없습니다.') {
          // 선택된 요소가 없는 경우, 페이지 전체를 수정
          gptGeneratedElement = await modifyService.modifyEntirePage(path, modificationRequest);
        } else if (domElement.startsWith('<img')) {
          // DOM 요소가 이미지인 경우 특정 서비스 함수 호출

          // DOM 요소의 형식을 원본 템플릿의 형식으로 수정
          domElement = await modifyService.modifyDomElement(path,domElement);

          gptGeneratedElement = await modifyService.modifyImageElement(domElement, modificationRequest);
          await modifyService.updateHtmlFile(path, domElement, gptGeneratedElement);
          
        } else {
          // GPT로 Dom Element와 수정사항을 기반으로 새로운 코드 생성
          gptGeneratedElement = await modifyService.modifyElement(domElement, modificationRequest);
          
          // 생성된 코드를 원본 HTML 파일에서 교체
          await modifyService.updateHtmlFile(path, domElement, gptGeneratedElement);
        }
    
        res.send('HTML file updated successfully.');
    } catch (error) {
        res.status(500).send('Error updating HTML file: ' + error.message);
    }
};

exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;
    const { pagePath, imgSrc } = req.body;

    if (!file || !pagePath || !imgSrc) {
      return res.status(400).json({ message: 'Invalid request data.' });
    }

     // pagePath에서 디렉터리 경로 추출
    const pageDir = path.dirname(pagePath);

    // imgSrc에서 이미지 파일 이름 추출
    const imgFilename = path.basename(file.originalname);

    // 이미지가 저장될 디렉터리 경로 생성
    const targetDir = path.join(pageDir, path.dirname(imgSrc));

    // 이미지 저장 및 기존 이미지 삭제
    const savedFilePath = await uploadService.saveUploadedFile(file, targetDir, imgFilename);

    // 새로 저장된 이미지 경로로 HTML 파일의 src 업데이트
    const newSrc = path.join(path.dirname(imgSrc), imgFilename).replace(/\\/g, '/');
    await uploadService.updateImageSrcInHTML(pagePath, imgSrc, newSrc);
 
    res.status(200).json({
      message: 'Image uploaded and src updated successfully.',
      updatedSrc,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};