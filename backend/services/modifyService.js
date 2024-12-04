const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Dashboard = require('../models/dashboard'); // 모델 파일 경로에 맞게 수정하세요
const ImageStore = require('../models/imageStore'); // 모델 파일 경로에 맞게 수정하세요
const { captureScreenshot } = require('./generateService');

exports.modifyElement = async (domElement, modificationRequest) => {
  try {
      const messages = [
          {
              role: "system",
              content: "You are an assistant that helps modify HTML DOM elements."
          },
          {
              role: "user",
              content: `Modify the following DOM element as requested and return only the modified element without including any additional characters or symbols.

DOM Element:
${domElement}

Modification:
${modificationRequest}

Return only the modified element:`
          }
      ];

      // GPT API 호출
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-4o-mini", // 올바른 모델 이름 사용
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
      }, {
          headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // OpenAI API 키를 인증 헤더에 포함합니다.
              'Content-Type': 'application/json'
          }
      });

      // GPT의 응답에서 수정된 DOM 요소 추출
      const gptGeneratedElement = response.data.choices[0].message.content.trim();
      return gptGeneratedElement;
  } catch (error) {
      console.error('Error processing prompt with GPT:', error.message);
      throw new Error('Error processing prompt with GPT: ' + error.message);
  }
};

exports.updateHtmlFile = async (filepath, originalElement, modifiedElement) => {
    return new Promise(async (resolve, reject) => {
        try {
            // filePath에서 '/copied_userTemplates/template1' 부분만 추출

            /* 윈도우에서 실행 시 경로 구분자가 \로 사용되므로 , /를 \로 변경*/
            const filePath = filepath.replace(/\//g, "\\");
            /* 윈도우에서 실행 시 경로 구분자가 \로 사용되므로 , /를 \로 변경*/
            /*원래는 매개변수 filepath가 filePath이나, 여기서는 매개변수를 filepath로 두고 filePath라는 변수로 선언해서 정규식 거치고 사용*/
            const parts = filePath.split(path.sep);
            const directoryPath = `\\${parts[1]}\\${parts[2]}`; // 슬래시를 포함한 경로 생성


            // Dashboard 테이블에서 해당 경로와 일치하는 항목 찾기
            const dashboard = await Dashboard.findOne({ where: { projectPath: directoryPath } });
            if (!dashboard) {
                return reject(new Error('Dashboard not found.'));
            }

            const htmlFilePath = path.join(__dirname, '../..', filePath);

            // HTML 파일 읽기
            fs.readFile(htmlFilePath, 'utf8', (err, data) => {
                if (err) {
                    return reject(new Error('Error reading HTML file.'));
                }

                // 원본 DOM 요소를 찾아 수정된 요소로 교체
                const escapedOriginalElement = originalElement.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(escapedOriginalElement, 'g');
                const updatedHtmlContent = data.replace(regex, modifiedElement);

                // 수정된 HTML 파일 저장
                fs.writeFile(htmlFilePath, updatedHtmlContent, 'utf8', async (err) => {
                    if (err) {
                        return reject(new Error('Error writing to HTML file.'));
                    }

                    // 업데이트 성공 시 dashboard.modified를 true로 설정
                    dashboard.modified = true;
                    await dashboard.save();

                    resolve();
                });
            });
        } catch (error) {
            reject(error);
        }
    });
};

// 전체 HTML 페이지를 수정하는 함수
exports.modifyEntirePage = async (filepath, modificationRequest) => {
    try {
        const htmlFilePath = path.join(__dirname, '../..', filepath);

        // filePath에서 '/copied_userTemplates/template1' 부분만 추출

        /* 윈도우에서 실행 시 경로 구분자가 \로 사용되므로 , /를 \로 변경*/
        const filePath = filepath.replace(/\//g, "\\");
        /* 윈도우에서 실행 시 경로 구분자가 \로 사용되므로 , /를 \로 변경*/
        /*원래는 매개변수 filepath가 filePath이나, 여기서는 매개변수를 filepath로 두고 filePath라는 변수로 선언해서 정규식 거치고 사용*/
        const parts = filePath.split(path.sep);
        const directoryPath = `\\${parts[1]}\\${parts[2]}`; // 슬래시를 포함한 경로 생성

        // Dashboard 테이블에서 해당 경로와 일치하는 항목 찾기
        const dashboard = await Dashboard.findOne({ where: { projectPath: directoryPath } });


        if (!dashboard) {
            throw new Error('Dashboard not found.');
        }

        // HTML 파일의 전체 내용 읽기
        const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');

        const messages = [
            {
                role: "system",
                content: "You are a helpful assistant."
            },
            {
                role: "user",
                content: `Modify the HTML content below to match the user's requirements
Current HTML:
${htmlContent}

Modification Requirements:
${modificationRequest}`
            }
        ];

        // GPT API 호출
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 16384,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // GPT의 응답에서 수정된 페이지 콘텐츠 추출
        let gptGeneratedPage = response.data.choices[0].message.content.trim();

        // HTML 태그만 추출하기 위한 정규 표현식 사용
        const htmlMatch = gptGeneratedPage.match(/<!DOCTYPE html>[\s\S]*<html[^>]*>([\s\S]*?)<\/html>/i);
        if (htmlMatch) {
            gptGeneratedPage = htmlMatch[0];
        }

        // 수정된 HTML 페이지 내용을 덮어쓰는 방식으로 저장
        await fs.promises.writeFile(htmlFilePath, gptGeneratedPage, 'utf8');


        // dashboard.imagePath를 절대 경로로 변환
        const screenshotAbsolutePath = path.join(__dirname, '../..', dashboard.imagePath);

        const localServerUrl = `http://localhost:3000${directoryPath}/index.html`;
        
        // Puppeteer를 사용하여 스크린샷 찍기
        await captureScreenshot(localServerUrl, screenshotAbsolutePath);

        console.log(`Screenshot saved to: ${screenshotAbsolutePath}`);
        

        // 업데이트 성공 시 dashboard.modified를 true로 설정
        dashboard.modified = true;
        await dashboard.save();

        return gptGeneratedPage;
    } catch (error) {
        console.error('Error processing prompt with GPT:', error.response ? error.response.data : error.message);
        throw new Error('Error processing prompt with GPT: ' + error.message);
    }
};

/*
// gpt 활용한 이미지 변경 서비스
exports.modifyImageElement = async (domElement, modificationRequest) => {
    try {
        // 1. DB에서 imageStore에 있는 모든 내용을 추출
        const allImages = await ImageStore.findAll(); // Sequelize를 통해 모든 이미지 데이터를 가져옴

        if (!allImages || allImages.length === 0) {
            throw new Error('이미지 데이터가 없습니다.');
        }

        // messages 작성
        const messages = [
            {
                role: 'system',
                content: 'You are an assistant that helps to select the most appropriate image from a list of available images based on the user\'s request. You must respond with only the selected image\'s path in the format: "path: <image_path>". Do not include any other text in your response.'
            },
            {
                role: 'user',
                content: `Here are the available images:\n${allImages.map(image => `Path: ${image.imagePath}, Description: ${image.description}`).join('\n')}\n\nThe user's request is: "${modificationRequest}". Please select only one image path that best fits the user's request, and respond in the format: "path: <image_path>".`
            }
        ];
  
        // 2. GPT API에 요구사항과 DB에서 가져온 이미지 데이터를 전송하여 적절한 이미지 선택
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // GPT API의 응답에서 선택된 이미지 ID를 받아옴
        let selectedImagePath = response.data.choices[0].message.content?.trim();

        if (!selectedImagePath) {
            throw new Error('GPT 응답에서 이미지 ID를 찾을 수 없습니다.');
        }

        // "path: " 부분을 제거하고 경로만 추출
        selectedImagePath = selectedImagePath.replace('path: ', '').trim();


        // 4. DOM Element에서 기존 src 속성 추출
        const srcMatch = domElement.match(/src="([^"]*)"/);
        if (!srcMatch || !srcMatch[1]) {
            throw new Error('DOM 요소에서 src 속성을 찾을 수 없습니다.');
        }
        let existingSrc = srcMatch[1]; // 기존 이미지 경로 추출
        existingSrc=existingSrc.replace('http://localhost:3000', '').trim();

        // 5. 절대 경로로 새로운 이미지 경로 만들기
        const newImageAbsolutePath = path.join(__dirname, '../..', selectedImagePath);
        const existingSrcAbsolute = path.join(__dirname, '../..', existingSrc);

        
        // 6. 기존 경로에 새로운 이미지로 덮어씌우기
        if (fs.existsSync(newImageAbsolutePath)) {
            // 기존 src 경로에 새로운 이미지를 덮어씌움
            fs.copyFileSync(newImageAbsolutePath, existingSrcAbsolute);
        } else {
            throw new Error('새로운 이미지 파일을 찾을 수 없습니다.');
        }
        
        return domElement;
    } catch (error) {
        console.error('Error modifying image element:', error);
        throw new Error('이미지 요소를 수정하는 중 오류가 발생했습니다.');
    }
};
*/

exports.modifyImageElement = async (domElement, modificationRequest) => {
    try {
        // 1. gpt api 호출하여 modificationRequest의 핵심 추출  후 Google Custom Search API를 통해 이미지 검색

        const messages = [
            {
                role: 'system',
                content: `You are an assistant that extracts the main keywords from user modification requests. Your job is to identify the most relevant and concise keywords that best represent the user's intent for an image search. Respond only with the main keywords in a comma-separated format.`
            },
            {
                role: 'user',
                content:  `User modification request: "${modificationRequest}". Extract the main keywords that would be most suitable for finding an image related to this request.`
            }
        ];
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.choices || response.data.choices.length === 0) {
            throw new Error('GPT API로부터 핵심 키워드를 추출할 수 없습니다.');
        }

        // GPT 응답에서 핵심 키워드 추출
        const extractedKeywords = response.data.choices[0].message.content.trim();

        // 2. Google Custom Search API를 통해 추출된 키워드로 이미지 검색

        const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(extractedKeywords)}&cx=${process.env.GOOGLE_PSE_ID}&key=${process.env.GOOGLE_CUSTOM_SEARCH_KEY}&searchType=image&num=1`;
        
        const customsearchResponse = await axios.get(apiUrl);

        if (!customsearchResponse.data.items || customsearchResponse.data.items.length === 0) {
            throw new Error('적절한 이미지를 찾을 수 없습니다.');
        }

        // 검색 결과에서 첫 번째 이미지의 링크를 추출
        const selectedImageUrl = customsearchResponse.data.items[0].link;

        //domElement의 src의 값을 selectedImageUrl로 변경
        const updatedDomElement = domElement.replace(/src="[^"]*"/, `src="${selectedImageUrl}"`);

        // 변경된 domElement를 리턴
        return updatedDomElement;
    } catch (error) {
        console.error('Error modifying image element:', error);
        throw new Error('이미지 요소를 수정하는 중 오류가 발생했습니다.');
    }
};

exports.modifyDomElement = async (pagePath, domElement) => {

    const srcMatch = domElement.match(/src="([^"]+)"/);
    
    if (srcMatch) {
        const fullSrc = srcMatch[1]; // 현재 전체 src 경로 예: "http://localhost:3000/copied_userTemplates/min_kody0017@gmail.com_1727024407120/img/about/about.png"
        

        if (fullSrc.startsWith('http://localhost:3000')) {
            // 디렉터리만 추출 ex) /copied_userTemplates/dir1/index.html - > /copied_userTemplates/dir1
            
            const directoryPath = path.dirname(pagePath); 
            
            // 전송 받은 domElement 형식으로 변환 ex) /copied_userTemplates/dir1 -> http://localhost:3000/copied_userTemplates/dir1
            const fullPath = `http://localhost:3000${directoryPath}/`;
            
            // fullPath를 제거하여 원본 템플릿과 똑같은 src 형식으로 만듬
            const originalSrcPath = fullSrc.replace(fullPath, '');
        
            // 기존 domElement에서 src만 변경
            const originalDomElement = domElement.replace(fullSrc, originalSrcPath);
        
            // 이후 작업
            return originalDomElement;
        }
    }
    // 만약 src 속성이 없거나 매치되지 않는다면 원본 그대로 반환(이미 한 번 수정된 경우)
    return domElement.replace(/&amp;/g, '&');
};


/* 비활성화
// 이미지 업로드 서비스 

exports.saveUploadedFile = async (file, targetDir, imgFilename) => {
    
    // __dirname을 기준으로 절대 경로 생성
  const targetPath = path.join(__dirname, '../../',targetDir,imgFilename);
  
    // 기존 파일이 있으면 삭제
    try {
      fs.unlink(targetPath);
    } catch (error) {
      // 파일이 없으면 무시
    }
  
    // 파일을 지정된 경로로 이동
    fs.rename(file.path, targetPath);
  
    return targetPath;
  };
  
exports.updateImageSrcInHTML = async (pagePath, oldSrc, newSrc) => {
    try {
      let htmlContent = fs.readFile(pagePath, 'utf-8');
  
      // 이미지 태그의 src 속성을 새 이미지로 업데이트
      const updatedContent = htmlContent.replace(new RegExp(oldSrc, 'g'), newSrc);
  
      // 업데이트된 내용을 다시 파일에 씀
      fs.writeFile(pagePath, updatedContent, 'utf-8');

      // index.html 파일이 수정된 경우 스크린샷 찍기
      if (path.basename(pagePath) === 'index.html') {

        // filePath에서 '/copied_userTemplates/template1' 부분만 추출
        const parts = filePath.split(path.sep);
        const directoryPath = `/${parts[1]}/${parts[2]}`; // 슬래시를 포함한 경로 생성

        // Dashboard 테이블에서 해당 경로와 일치하는 항목 찾기
        const dashboard = await Dashboard.findOne({ where: { projectPath: directoryPath } });

        // 로컬 서버 URL 생성
        const localServerUrl = `http://localhost:3000/${directoryPath}/index.html`;

        if (!dashboard) {
            throw new Error('Dashboard not found.');
        }

        // dashboard.imagePath를 절대 경로로 변환
        const screenshotAbsolutePath = path.resolve(__dirname, '../..', dashboard.imagePath);

        // Puppeteer를 사용하여 스크린샷 찍기
        await captureScreenshot(localServerUrl, screenshotAbsolutePath);

        console.log(`Screenshot saved to: ${screenshotAbsolutePath}`);

        // 업데이트 성공 시 dashboard.modified를 true로 설정
        dashboard.modified = true;
        await dashboard.save();

    }
    } catch (error) {
      throw new Error(`Failed to update image src in ${pagePath}: ${error.message}`);
    }
};
  */