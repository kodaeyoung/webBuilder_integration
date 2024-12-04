const generateService = require('../services/generateService'); // generatetService 모듈을 불러옵니다.


exports.handleChatInput = async (req, res) => { // handleChatInput이라는 비동기 함수를 정의합니다.

  try {

     // 세션 및 사용자 정보 로그
     console.log("세션 정보:", req.session);
     console.log("사용자 정보:", req.user);
    if (!req.isAuthenticated()) {
      return res.redirect('http://localhost:4000/login');
    }
    // req.body에서 사용자 입력 데이터를 추출합니다.
    const { websiteType, features, mood, content , pageName } = req.body;
    const useremail = req.user.email; // req.user.email에서 email을 추출합니다.
    
    // generateService에서 모든 basic템플릿을 가져옵니다.
    const templates = await generateService.getbasicTemplates();
    console.log(templates);
    // 사용자 입력 데이터와 템플릿을 사용하여 어떤 템플릿을 사용할지 결정합니다.
    const templateSelection = await generateService.selectTemplate({ websiteType, features, mood, content }, templates);
    console.log("선택된 템플릿: " + JSON.stringify(templateSelection, null, 2));

    // 템플릿을 찾지 못한 경우 처리
    if (templateSelection.analysis == "No appropriate template!") {
      // 템플릿 없이 웹사이트 생성 로직 실행
      /*
      const srs = await generateService.generateSRS({ websiteType, features, mood, content });
      const code = await generateService.generateCode({ srs, websiteType, features });
      const result = await generateService.createPage({ websiteType, features, mood, content },code, pageName,useremail);
      res.send(result);
      */
    } else {
      // 선택된 템플릿을 파일 시스템에 복사합니다.
      const {newTemplateDir_absolute_path,newTemplateDir_relative_path,screenshotPath_absolute_path } = await generateService.copyTemplate({ websiteType, features, mood, content },templateSelection.analysis,useremail,pageName);
      // GPT에게 복사된 템플릿을 수정하도록 요청합니다.
      const modifiedTemplatePath = await generateService.modifyTemplate({newTemplateDir_absolute_path,newTemplateDir_relative_path,screenshotPath_absolute_path}, { websiteType, features, mood, content });
      res.send(modifiedTemplatePath);
    }
  } catch (error) {
    // 에러가 발생하면 500 상태 코드와 에러 메시지를 JSON 형식으로 반환합니다.
    res.status(500).json({ error: error.message });
  }
};



exports.generateSRS = async (req, res) => {
  try {
    const { websiteType, features, mood, content } = req.body;
    const srs = await generateService.generateSRS({ websiteType, features, mood, content });
    console.log("srs:",srs);
    res.status(200).json({ srs });
  } catch (error) {
    res.status(500).json({ error: "Error generating SRS" });
  }
};

exports.generateCode = async (req, res) => {
  try {
    const { srs, websiteType, features } = req.body;
    const code = await generateService.generateCode({ srs, websiteType, features });
    console.log("generatedCode:",code);
    res.status(200).json({ code });
  } catch (error) {
    res.status(500).json({ error: "Error generating code" });
  }
};

exports.createPage = async (req, res) => {
  try {
    const { code, pageName } = req.body;
    const result = await generateService.createPage({ code, pageName });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Error creating page" });
  }
};