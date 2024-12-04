const axios = require('axios');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const ncp = require('ncp').ncp;
const { exec } = require('child_process');
const Deploy = require('../models/deploy'); // 모델 파일 경로에 맞게 수정하세요
const Dashboard = require('../models/dashboard'); // 모델 파일 경로에 맞게 수정하세요
const dircompare = require('dir-compare'); // 디렉터리 비교를 위해 필요한 패키지

/* github pages 비활성화
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH;
const GITHUB_USERNAME=process.env.GITHUB_USERNAME;
*/

// deployProjects 하위에 deployName 이름의 디렉터리 생성
exports.createDeployDirectory = (deployName) => {
    const outputDir = path.join(__dirname, '../../deployProjects', deployName);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
};

// 생성된 디렉터리에 사용자가 배포하기 원하는 프로젝트를 복사
exports.copyTemplate = (templatePath, outputDir) => {
    return new Promise((resolve, reject) => {
        ncp(templatePath, outputDir, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// 디렉터리 삭제 함수
exports.deleteDirectory = (dirPath) => {
    return new Promise((resolve, reject) => {
      fs.rm(dirPath, { recursive: true, force: true }, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  };

// 배포 로직
exports.deployTemplate = async (id, deployName) => {
    const dashboard = await Dashboard.findOne({ where: { id } });
    if (!dashboard) {
        throw new Error(`Dashboard with id ${id} not found.`);
    }
    if(dashboard.publish==true){
      console.log('Already in deployment.');
      throw new Error(`Already in deployment.`);
    }

    // 중복되는 deployName 확인
    const existingDeploy = await Deploy.findOne({ where: { deployName } });
    if (existingDeploy) {
        // return { error: `Deploy name ${deployName} already exists.` };
        throw new Error(`Deploy name ${deployName} already exists.`);
    }

    const projectPath_relative = dashboard.projectPath;
    const projectPath_absolute = path.join(__dirname, '../..', projectPath_relative);

    if (!fs.existsSync(projectPath_absolute)) {
        throw new Error(`Template path ${projectPath_absolute} does not exist.`);
    }

    const outputDir = exports.createDeployDirectory(deployName);
    await exports.copyTemplate(projectPath_absolute, outputDir);

    // 프로젝트 루트 디렉토리 설정
    const projectRoot = path.resolve(__dirname, '../..');

    // 상대 경로로 변환
    const relativeOutputDir = path.relative(projectRoot, outputDir);

    /* github pages 비활성화
    await exports.deployDirectoryToGitHub(deployName, commitMessage);
    */

    // 배포 성공 시 DB에 데이터 삽입
    try {
        await Deploy.create({
            templatePath: `${projectPath_relative/*.replace(/\\/g, '/')*/}`,
            deployProjectPath: `\\${relativeOutputDir/*.replace(/\\/g, '/')*/}`,
            deployName: deployName
        });
        console.log('Deployment details saved to the database.');
    } catch (error) {
        console.error('Error saving deployment details to the database:', error);
        throw error; // 에러가 발생하면 상위로 던져서 gitDeploy가 실행되지 않도록 함
    }

    // 배포 완료 후 대시보드의 deploy 값을 true로 업데이트
    try {
        dashboard.publish = true;
        dashboard.modified = false;
        dashboard.deployPath=`http://localhost:3000/publish/${deployName}`
        await dashboard.save();
        console.log('Dashboard deploy status updated to true.');
        return deployName;
    } catch (error) {
        console.error('Error updating dashboard deploy status:', error);
        throw error;
    }
};



// 배포 중지 로직
exports.stopDeploy = async (id) => {
    const dashboard = await Dashboard.findOne({ where: { id } });
    if (!dashboard) {
      throw new Error(`Dashboard with id ${id} not found.`);
    }

    const projectPath_relative = dashboard.projectPath;
    const deployEntry = await Deploy.findOne({ where: { templatePath: projectPath_relative } });
    if (!deployEntry) {
      throw new Error(`Deploy entry not found for project path ${projectPath_relative}`);
    }
    const deployName = deployEntry.deployName;

    /* github pages 비활성화
    // GitHub에서 해당 디렉터리 삭제
    await exports.deleteDirectoryFromGitHub(deployName);
    */

    // 배포 중지 시 deployProjects 의 해당 디렉터리 삭제하기  root/deployProjects/deployName인 디렉터리를 삭제하면됨
    const deployProjectPath_relative = deployEntry.deployProjectPath;
    const deployProjectPath_absolute = path.join(__dirname, '../..', deployProjectPath_relative);

    // 디렉터리 삭제 시도
    try {
        await exports.deleteDirectory(deployProjectPath_absolute);
        console.log(`Directory at path ${deployProjectPath_absolute} has been deleted.`);
      } catch (error) {
        console.error('Error deleting deploy directory:', error);
        throw error;
    }

    // Deploy 테이블의 해당 항목 삭제
    await Deploy.destroy({ where: { deployName } });
  
    // Dashboard 테이블의 deploy 값을 false로 업데이트
    try {
      dashboard.publish = false;
      dashboard.deployPath=null;
      dashboard.modified=false;
      await dashboard.save();
      console.log('Dashboard deploy status updated to false.');
    } catch (error) {
      console.error('Error updating dashboard deploy status:', error);
      throw error;
    }
  };

 // 배포 업데이트 로직
exports.updateDeploy = async (id) => {
  const dashboard = await Dashboard.findOne({ where: { id } });
  if (!dashboard) {
      throw new Error(`Dashboard with id ${id} not found.`);
  }

  const projectPath_relative = dashboard.projectPath;
  const deployEntry = await Deploy.findOne({ where: { templatePath: projectPath_relative } });
  if (!deployEntry) {
      throw new Error(`Deploy entry not found for project path ${projectPath_relative}`);
  }

  const deployName = deployEntry.deployName;
  const projectPath_absolute = path.join(__dirname, '../..', projectPath_relative);

  if (!fs.existsSync(projectPath_absolute)) {
      throw new Error(`Template path ${projectPath_absolute} does not exist.`);
  }

  const outputDir = path.join(__dirname, '../../deployProjects', deployName);
  if (!fs.existsSync(outputDir)) {
      throw new Error(`Deployment directory ${outputDir} does not exist.`);
  }

  // 디렉터리 비교 로직
  const options = { compareContent: true };
  const comparison = dircompare.compareSync(projectPath_absolute, outputDir, options);

  if (comparison.same) {

      throw new Error(`No differences found between ${projectPath_absolute} and ${outputDir}. Deployment not needed.`);
  }

  // 프로젝트 내용을 deployProjects 디렉터리에 덮어쓰기
  await exports.copyTemplate(projectPath_absolute, outputDir);

  /* github pages 비활성화
  // GitHub에 업데이트 배포
  await exports.deployDirectoryToGitHub(deployName, commitMessage);
  */

  // 업데이트 성공 시 dashboard.update를 false로 설정
  dashboard.modified = false;
  await dashboard.save();

  return deployName;
};

  


/* github pages 비활성화함
  // 디렉터리를 GitHub에 업로드하는 함수
exports.deployDirectoryToGitHub = async (deployDir, commitMessage) => {
    return new Promise((resolve, reject) => {
        const gitprojectRoot = path.join(__dirname, '../../deployProjects');
        const commands = [
            `cd ${gitprojectRoot}`,
            `git add ${deployDir}`,
            `git commit -m "${commitMessage}"`,
            `git push https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git ${GITHUB_BRANCH}`
        ].join(' && ');

        exec(commands, (err, stdout, stderr) => {
            if (err) {
                console.error(`Git command failed: ${stderr}`);
                reject(err);
            } else {
                console.log(`Git command succeeded: ${stdout}`);
                resolve(stdout);
            }
        });
    });
};




// GitHub에서 디렉터리 삭제하는 함수
exports.deleteDirectoryFromGitHub = async (deployDir) => {
    return new Promise((resolve, reject) => {
      const gitprojectRoot = path.join(__dirname, '../../deployProjects');
      const commands = [
        `cd ${gitprojectRoot}`,
        `git rm -rf ${deployDir}`,
        `git commit -m "Remove ${deployDir}"`,
        `git push https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git ${GITHUB_BRANCH}`
      ].join(' && ');
  
      exec(commands, (err, stdout, stderr) => {
        if (err) {
          console.error(`Git command failed: ${stderr}`);
          reject(err);
        } else {
          console.log(`Git command succeeded: ${stdout}`);
          resolve(stdout);
        }
      });
    });
};
*/