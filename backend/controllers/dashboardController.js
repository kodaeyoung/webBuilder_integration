
const DashboardService = require('../services/dashboardService');

//대시보드 CREATE
exports.createDashboard = async (req, res) => {
  try {
    const dashboard = await DashboardService.saveDashboard(req.body);
    res.status(201).json(dashboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//Email별로 대시보드 READ
exports.getDashboardsByEmail = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect('http://localhost:4000/login');
    }
    const email = req.user.email;
    const dashboards = await DashboardService.getDashboardsByEmail(email);
    res.status(200).json(dashboards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//대시보드 이름 변경(put)
exports.updateDashboardName = async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.redirect('http://localhost:4000/login');
      }
      const id = req.params.id;
      const { name } = req.body;
      const updatedDashboard = await DashboardService.updateDashboardName(id, name);
      res.status(200).json(updatedDashboard);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

//작업하던 대시보드를 클릭하면 작업프로젝트 경로를 리턴하여 이어서 작업 가능
exports.getProjectPathById = async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.redirect('http://localhost:4000/login');
      }
      const { id } = req.params;
      const projectPath = await DashboardService.getProjectPathById(id);
      res.status(200).json({ projectPath });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

//대시보드를 템플릿으로 공유
exports.shareDashboard = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect('http://localhost:4000/login');
    }
    const { id } = req.params;
    const { category, description } = req.body;
    const user = {
      displayName: req.user.displayName,
      email: req.user.email,
      profileImageUrl: req.user.profileImageUrl,
    };
    const sharedTemplate = await DashboardService.shareDashboard(id, category, description, user);
    res.status(200).json(sharedTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 특정 대시보드 삭제
exports.deleteDashboard = async (req, res) => {
  const dashboardId = req.params.id;

  try {
    if (!req.isAuthenticated()) {
      return res.redirect('http://localhost:4000/login');
    }
    const result = await DashboardService.deleteDashboard(dashboardId);

    if (result === 0) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    res.status(200).json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//특정 대시보드 공유 중지
exports.stopSharingDashboard = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('http://localhost:4000/login');
  }
  const dashboardId = req.params.id;
  const user = req.user; // 현재 로그인된 사용자의 정보

  try {
    const result = await DashboardService.stopSharingDashboard(dashboardId, user);

    res.status(200).json({ message: 'Dashboard sharing stopped successfully', dashboard: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};