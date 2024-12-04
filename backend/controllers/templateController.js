const templateService = require('../services/templateService'); // templateService 모듈을 불러옵니다.

//모든 shared템플릿을 가져옵니다.
exports.getAllsharedTemplates = async (req, res) => { // getTemplates라는 비동기 함수를 정의합니다.
  try {
    // templateService에서 모든 템플릿을 가져옵니다.
    const sharedTemplates = await templateService.getAllsharedTemplates();
    // 템플릿 목록을 JSON 형식으로 클라이언트에 반환합니다.
    res.json(sharedTemplates);
  } catch (error) {
    // 에러가 발생하면 500 상태 코드와 에러 메시지를 JSON 형식으로 반환합니다.
    res.status(500).json({ error: error.message });
  }
};

//shared템플릿을 사용하기를 클릭할 경우 템플릿을 복사합니다.
exports.usesharedTemplate = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect('http://localhost:4000/login');
    }
    const { id } = req.params;  // 템플릿 ID
    const { pageName} = req.body;  // 페이지 이름
    const userEmail = req.user.email;  // 현재 로그인된 사용자의 이메일
    const newTemplatePath= await templateService.usesharedTemplate(id, pageName, userEmail);
    res.status(200).json(newTemplatePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//좋아요 클릭 시 숫자 증가
exports.likeTemplate = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect('http://localhost:4000/login');
    }
    const { id } = req.params;  // 템플릿 ID
    const userEmail = req.user.email;  // 현재 로그인된 사용자의 이메일

    const updatedTemplate = await templateService.likeTemplate(id, userEmail);

    res.status(200).json(updatedTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};