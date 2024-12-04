require('dotenv').config(); // 환경 변수 로드

const axios = require('axios'); // axios 모듈을 불러옵니다.
const fs = require('fs'); // fs 모듈을 불러옵니다.
const path = require('path'); // path 모듈을 불러옵니다.
const templateService = require('./templateService'); // templateService 모듈을 불러옵니다.
const dashboardService = require('./dashboardService'); // dashboardService 모듈을 불러옵니다.

const extractKeywords = require('../utils/extract-keywords');
const getUnsplashImage = require('../utils/unsplash');
const createPage = require('../utils/create-page');

// 스크린샷 라이브러리
const puppeteer = require('puppeteer');

exports.getbasicTemplates = async () => {
  // templateService에서 모든 basic템플릿을 가져옵니다.
  return await templateService.getAllbasicTemplates();
};

exports.selectTemplate = async (input, templates) => {
  // GPT-4 API 요청을 위한 프롬프트를 구성합니다.
  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant."
    },
    {
      role: "user",
      content: `
        The user provided the following requirements for a website:
        - Type of website: ${input.websiteType}
        - Features: ${input.features}
        - Mood: ${input.mood}

        Based on these requirements, choose the most suitable template from the following list:
        ${templates.map((template, index) => `Template ${index + 1}: ${template.website} - ${template.features} - ${template.mood}`).join('\n')}

        If there is a suitable template, respond with "template:number".
        If no appropriate template is found, choose the closest match and respond with "template:number".
      `
    }
  ];

  //console.log("Constructed messages:", messages);

  try {
    // GPT-4 API에 POST 요청을 보냅니다.
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages, // 메시지를 요청 본문에 포함합니다.
      max_tokens: 150, // 응답에서 최대 150개의 토큰을 반환하도록 설정합니다.
      n: 1,
      stop: null,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // OpenAI API 키를 인증 헤더에 포함합니다.
        'Content-Type': 'application/json'
      }
    });

    console.log("Response received from GPT-4o:", JSON.stringify(response.data, null, 2),"\n==============================\n");


    // 응답에서 분석된 텍스트를 추출하여 공백을 제거합니다.
    const analysis = response.data.choices[0].message.content.trim();
  

    // 분석 결과를 객체 형태로 반환합니다.
    console.log("Analsis result:" ,{analysis}) 
    return { analysis};
  } catch (error) {
    console.error("Error calling GPT-4 API:", error.response ? error.response.data : error.message);
    throw new Error('Failed to communicate with GPT-4 API.');
  }
};

exports.copyTemplate = async (input, analysis, userEmail ,pageName) => {
  let chosenTemplateId;

  // analysis가 문자열인지 확인
  if (typeof analysis === 'string') {
    // 정규 표현식을 사용하여 템플릿 번호를 추출합니다.
    const chosenTemplateMatch = analysis.match(/template:\s*(\d+)/i);
    console.log("선택된 템플릿은:",chosenTemplateMatch);
    if (!chosenTemplateMatch) {
      throw new Error('No suitable template found.');
    }
    chosenTemplateId = parseInt(chosenTemplateMatch[1], 10);
    //console.log("chosenTemplateId:",chosenTemplateId);
  } else {
    console.log("analysis가 문자열이 아닙니다..........");
    throw new Error('Invalid analysis format. Expected a string.');
  }

  // 선택된 템플릿을 가져옵니다.
  const chosenTemplate = await templateService.getbasicTemplatePathById(chosenTemplateId);
  if (!chosenTemplate) {
    throw new Error(`Template with ID ${chosenTemplateId} not found.`);
  }

  //console.log("Chosen Template:", JSON.stringify(chosenTemplate, null, 2));

  // 템플릿 디렉터리 경로를 설정합니다.
  let templateDir = chosenTemplate.templatePath; // DB에 저장된 템플릿 경로 사용

  // 프로젝트 루트 디렉터리를 기준으로 절대 경로 설정
  const projectRoot = path.resolve(__dirname, '../..'); // 프로젝트 루트 디렉터리
  templateDir = path.resolve(projectRoot, templateDir.replace(/^\//, ''));

  console.log('projectRoot',projectRoot);

  // 새로운 디렉터리 경로를 설정합니다.
  const timestamp = Date.now(); // 현재 타임스탬프를 사용하여 고유한 이름 생성
  const newTemplateDirName = `${pageName}_${chosenTemplate.templateName}_${userEmail}_${timestamp}`;
  //절대경로
  const newTemplateDir_absolute_path = path.join(__dirname, '../../copied_userTemplates', newTemplateDirName);
  //상대경로
  let newTemplateDir_relative_path = path.relative(projectRoot, newTemplateDir_absolute_path);

  // 상대 경로 앞에 슬래시 추가 (Windows 경로 구분자를 UNIX 스타일로 변경)
  newTemplateDir_relative_path = `\\${newTemplateDir_relative_path/*.replace(/\\/g, '/')*/}`;
   
  // 절대경로로 디렉터리를 복사합니다.
  try {
    await copyDirectory(templateDir, newTemplateDir_absolute_path);
    console.log("Template copied successfully to:", newTemplateDir_absolute_path);
  } catch (err) {
    console.error("Error copying template:", err);
    throw new Error('Failed to copy template.');
  }
  console.log("첫 번 째 스크린샷");
  // 로컬 서버 URL 설정
  const localServerUrl = `http://localhost:3000/copied_userTemplates/${newTemplateDirName}/index.html`; // 스크린샷 url
 

  // 스크린샷 파일 경로 설정
  const screenshotsDir = path.join(__dirname, "../../page_screenshots");
  const screenshotName=`${pageName}_${chosenTemplate.templateName}_${userEmail}_${timestamp}`;
  const screenshotPath_absolute_path = path.join(screenshotsDir, `${screenshotName}.png`);
  let screenshotPath_relative_path = path.relative(projectRoot, screenshotPath_absolute_path);
  screenshotPath_relative_path = `\\${screenshotPath_relative_path.replace(/\\/g, '/')}`;

  // 스크린샷 생성
  await captureScreenshot(localServerUrl, screenshotPath_absolute_path);
  //상대경로로 생성된 디렉터리 경로 저장
  const projectData = {
    projectName: pageName,
    projectPath: newTemplateDir_relative_path,
    imagePath: screenshotPath_relative_path,
    modified: false,
    email: userEmail,
    websiteType: input.websiteType || '',
    features: input.features || '',
    mood: input.mood || '',
    content: input.content || ''
  };
  dashboardService.saveDashboard(projectData);

  // 복사된 디렉터리 경로를 반환합니다.
  return {newTemplateDir_absolute_path,newTemplateDir_relative_path,screenshotPath_absolute_path};
};

exports.modifyTemplate = async (templateDir, input) => {
  // 템플릿 디렉터리 내의 모든 HTML 파일들을 읽어옵니다.
  const htmlFiles = fs.readdirSync(templateDir.newTemplateDir_absolute_path).filter(file => file.endsWith('.html'));
  let modifiedHtmlFiles = [];
  let indexHtmlModified = false; // 스크린샷을 위해 index.html 파일이 수정되었는지 확인하는 플래그


  // 각 HTML 파일의 내용을 GPT에게 수정 요청합니다.
  for (const htmlFile of htmlFiles) {
    const htmlFilePath = path.join(templateDir.newTemplateDir_absolute_path, htmlFile);
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: `
          The user provided the following requirements for a website:
          - Type of website: ${input.websiteType}
          - Features: ${input.features}
          - Mood: ${input.mood}
          - Content: ${input.content}

        Modify the HTML content below to match the user's requirements, while preserving the original structure as much as possible. Only the content should be adjusted to meet the requirements:

        ${htmlContent}
        `
      }
    ];
    console.log("request message",messages);

    try {
      // GPT-4 API에 POST 요청을 보냅니다.
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o-mini",
        messages, // 메시지를 요청 본문에 포함합니다.
        max_tokens: 16384, // 응답에서 최대의 토큰을 반환하도록 설정합니다.
        n: 1,
        stop: null,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // OpenAI API 키를 인증 헤더에 포함합니다.
          'Content-Type': 'application/json'
        }
      });

      console.log("Response received for HTML modification:", JSON.stringify(response.data, null, 2));

      // 응답에서 수정된 HTML 내용을 추출합니다.
      let modifiedHtmlContent = response.data.choices[0].message.content.trim();

      // HTML 태그만 추출하기 위한 정규 표현식 사용
      const htmlMatch = modifiedHtmlContent.match(/<!DOCTYPE html>[\s\S]*<html[^>]*>([\s\S]*?)<\/html>/i);
      if (htmlMatch) {
        modifiedHtmlContent = htmlMatch[0];
      } else {
        console.warn("No valid HTML content found in the response");
        continue; // 유효한 HTML이 없는 경우 다음 파일로 넘어갑니다.
      }

      // 수정된 내용을 HTML 파일에 저장합니다.
      fs.writeFileSync(htmlFilePath, modifiedHtmlContent, 'utf-8');
      

      // index.html 파일이 수정된 경우 플래그를 설정합니다.
      if (htmlFile === 'index.html') {
        indexHtmlModified = true;
      }

      modifiedHtmlFiles.push({ htmlFilePath, modifiedHtmlContent });
      // index.html 파일이 수정된 경우 스크린샷을 찍습니다.
      if (indexHtmlModified) {

  
        const localServerUrl = `http://localhost:3000${templateDir.newTemplateDir_relative_path}/index.html`; //스크린샷 url
       
       console.log('두번 째 스크린샷');
        await captureScreenshot(localServerUrl, templateDir.screenshotPath_absolute_path);
      }
    } catch (error) {
      console.error("Error calling GPT-4 API:", error.response ? error.response.data : error.message);
      throw new Error('Failed to communicate with GPT-4 API.');
    }
  }
  // 수정된 HTML 파일 경로를 반환합니다.
  return templateDir.newTemplateDir_relative_path;
};

// 디렉터리를 복사하는 함수
const copyDirectory = (src, dest) => {
  return new Promise((resolve, reject) => {
    fs.mkdir(dest, { recursive: true }, (err) => {
      if (err) {
        return reject(err);
      }
      fs.readdir(src, (err, files) => {
        if (err) {
          return reject(err);
        }
        Promise.all(files.map(file => {
          const srcFile = path.join(src, file);
          const destFile = path.join(dest, file);
          return new Promise((res, rej) => {
            fs.stat(srcFile, (err, stat) => {
              if (err) {
                return rej(err);
              }
              if (stat.isDirectory()) {
                copyDirectory(srcFile, destFile).then(res).catch(rej);
              } else {
                fs.copyFile(srcFile, destFile, (err) => {
                  if (err) {
                    return rej(err);
                  }
                  res();
                });
              }
            });
          });
        })).then(resolve).catch(reject);
      });
    });
  });
};



const chunkString = (str, size) => {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; i++, o += size) {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
};

/*
exports.generateSRS = async ({ websiteType, features, mood, content }) => {
  const prompt = `Create a System Requirements Specification (SRS) for a ${websiteType} website with features like ${features}. The mood should be ${mood}, and it should include content such as ${content}. The SRS should focus on:
  1. Specific Requirements
  2. UI/UX Design
  3. Accessibility Considerations
  Include sections where images should be placed, and provide appropriate keywords for those images from Unsplash.`;

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 2000, // 응답에서 최대 2000개의 토큰을 반환하도록 설정합니다.
      n: 1,
      stop: null,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // OpenAI API 키를 인증 헤더에 포함합니다.
        'Content-Type': 'application/json'
      }
    });
    console.log(response.data.choices[0].message.content.trim());
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating SRS:", error.response ? error.response.data : error.message);
    throw new Error("Error generating SRS");
  }
};

exports.generateCode = async ({ srs, websiteType, features }) => {
  const prompt = `Based on the following System Requirements Specification (SRS), create a highly engaging and visually appealing React component using Tailwind CSS and Chakra UI. Ensure the design is top-notch and suitable for design awards, with a user-friendly interface and excellent accessibility.
  
  SRS:
  ${srs}
  
  The component should include:
  - A header with a logo and navigation links
  - A visually stunning hero section with a background image, headline, and call-to-action button
  - A features section highlighting key features with icons and descriptions
  - A content section with placeholder text and images
  - A footer with links to social media and contact information
  
  Return only the JavaScript code for the component. Do not include any explanations, comments, or descriptions. Only the code.`;

  try {
    // Extract keywords
    const websiteTypeKeywords = await extractKeywords(websiteType);
    const featuresKeywords = await extractKeywords(features);

    console.log("websiteTypeKeywords:",websiteTypeKeywords);
    console.log("featuresKeywords:",featuresKeywords);

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 2000,
      n: 1,
      stop: null,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let generatedCode = response.data.choices[0].message.content.trim();

    generatedCode = generatedCode.replace(/```(javascript)?/g, "").trim();

    console.log("generatedCode=",generatedCode);

    // Fetch images from Unsplash using the extracted keywords
    const heroImage = await getUnsplashImage(websiteTypeKeywords);
    const featureImage = await getUnsplashImage(featuresKeywords);

    console.log("heroImage:",heroImage);
    console.log("featureImage:",featureImage);


    // Replace placeholders with image URLs
    generatedCode = generatedCode.replace("{heroImage}", heroImage || "");
    generatedCode = generatedCode.replace("{featureImage}", featureImage || "");

    return generatedCode;
  } catch (error) {
    console.error("Error generating code:", error.response ? error.response.data : error.message);
    throw new Error("Error generating code");
  }
};

// createPage 함수 호출
exports.createPage = async ( input, code, pageName, userEmail ) => {
  
   // 현재 시간을 문자열로 변환
   const currentTime = new Date().toISOString().replace(/[:.]/g, "-");
   // pageName에 userEmail과 currentTime 추가
   const newPageName = `${pageName}_${userEmail}_${currentTime}`;

   // 파일 경로 설정
  const pagesDir = path.join(__dirname, "../../created_userPages");
  const pagePath = path.join(pagesDir, `${newPageName}.js`);
  await createPage({ code, pagePath: pagePath });

  console.log("스크린샷 시작"); 

   // 로컬 서버 URL 설정
   const localServerUrl = `http://localhost:3000/created_userPages/${newPageName}.js`;

   // 스크린샷 파일 경로 설정
   const screenshotsDir = path.join(__dirname, "../../page_screenshots");
   const screenshotPath = path.join(screenshotsDir, `${newPageName}.png`);
 
   // 스크린샷 생성
   await captureScreenshot(localServerUrl, screenshotPath);

   //데이터 베이스에 저장
  const projectData = {
    ProjectName: newPageName,
    projectPath: pagePath,
    imagePath: screenshotPath,
    email: userEmail,
    websiteType: input.websiteType || '',
    features: input.features || '',
    mood: input.mood || '',
    content: input.content || ''
  };
  dashboardService.saveDashboard(projectData);

  return pagePath;
};
*/

// 스크린샷 생성 함수
async function captureScreenshot(url, outputPath) {
  const encodedUrl = encodeURI(url); // URL 인코딩
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const page = await browser.newPage();

  // 디버깅용 이벤트 핸들러 추가
  page.on('framenavigated', (frame) => {
    console.log(`Frame navigated to: ${frame.url()}`);
  });

  page.on('framedetach', (frame) => {
    console.log(`Frame detached: ${frame.url()}`);
  });

  page.on('requestfailed', (request) => {
    console.error(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log(`Navigating to: ${encodedUrl}`);
    await page.goto(encodedUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('body'); // 'body'가 로드될 때까지 대기
    await page.screenshot({ path: outputPath });
    console.log(`Screenshot saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error navigating to ${url}:`, error.message);
  } finally {
    await browser.close();
  }
}



module.exports.captureScreenshot = captureScreenshot;

