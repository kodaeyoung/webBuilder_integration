// backend/controllers/deployController.js
const deployService = require('../services/deployService');
const path = require('path');

//배포
const deploy = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('http://localhost:4000/login');
  }
  const deployName=req.body.deployName;
  const id = req.body.id;

  try {
    const result = await deployService.deployTemplate(id, deployName);
    res.status(200).json({ message: 'Template deployed successfully', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 배포 중지
const stopDeploy = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('http://localhost:4000/login');
  }
  const id = req.body.id;

  try {
    const result = await deployService.stopDeploy(id);
    res.status(200).json({ message: 'Deployment stopped successfully', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CI/CD, 최신 사항 반영
const updateDeploy = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('http://localhost:4000/login');
  }
  const id = req.body.id;

  try {
    const result = await deployService.updateDeploy(id);
    res.status(200).json({ message: 'Deployment updated successfully', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  deploy,
  stopDeploy,
  updateDeploy
};