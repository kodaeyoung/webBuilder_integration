// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

//대시보드에 저장
router.post('/dashboard/create', dashboardController.createDashboard);

//사용자별 대시보드 정보를 리턴
router.get('/dashboard/mydashboard', dashboardController.getDashboardsByEmail);

// 대시보드 이름 변경
router.put('/:id/name', dashboardController.updateDashboardName);

//대시보드 클릭 시 해당 대시보드 경로를 반환하여 이어서 작업할 수 있도록 함
router.get('/dashboard/:id/project-path', dashboardController.getProjectPathById);

//템플릿 공유하기 클릭 시 해당 대시보드가 공유됨
router.post('/dashboard/:id/share', dashboardController.shareDashboard);

//특정 대시보드 삭제
router.delete('/dashboard/remove/:id', dashboardController.deleteDashboard);

//특정 대시보드 공유 중지
router.delete('/dashboard/:id/share-stop', dashboardController.stopSharingDashboard);


module.exports = router;
