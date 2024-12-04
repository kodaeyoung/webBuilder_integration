const fs = require('fs').promises;
const path = require('path');

// 프로젝트 루트 경로 설정
const rootPath = path.resolve(__dirname, '../../');


const getDirectoryStructureRecursive = async (baseDirPath, relativePath = '') => {
  const fullPath = path.join(rootPath, baseDirPath, relativePath);
  const files = await fs.readdir(fullPath, { withFileTypes: true });

  const directoryStructure = await Promise.all(files.map(async (file) => {
    const filePath = path.join(baseDirPath, relativePath, file.name);
    if (file.isDirectory()) {
      const children = await getDirectoryStructureRecursive(baseDirPath, path.join(relativePath, file.name));
      return {
        name: file.name,
        path: filePath.replace(/\\/g, '/'), // 템플릿 디렉터리 기준으로 경로 설정
        isDirectory: true,
        children,
      };
    } else {
      return {
        name: file.name,
        path: filePath.replace(/\\/g, '/'), // 템플릿 디렉터리 기준으로 경로 설정
        isDirectory: false,
      };
    }
  }));

  return directoryStructure;
};

exports.getDirectoryStructure = async (dirPath) => {
  return await getDirectoryStructureRecursive(dirPath);
};

exports.getFileContents = async (filePath) => {
  const fullPath = path.join(rootPath, filePath);  // 절대 경로로 설정
  const content = await fs.readFile(fullPath, 'utf-8');
  return content;
};

exports.updateFileContents = async (filePath, content) => {
  const fullPath = path.join(rootPath, filePath);  // 절대 경로로 설정
  await fs.writeFile(fullPath, content, 'utf-8');
};
