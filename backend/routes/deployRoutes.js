// routes/deployRoutes.js
const express = require('express');
const deployController = require('../controllers/deployController');

const router = express.Router();

router.post('/deploy', deployController.deploy);
router.post('/undeploy',deployController.stopDeploy);
router.post('/update',deployController.updateDeploy);

module.exports = router;
