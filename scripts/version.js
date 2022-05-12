const fs = require('fs');

const filePath = './src/app/core/version.ts';
const pattern = /\d+\.\d+\.\d+/;

function getVersion() {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = pattern.exec(content);
  if (result) {
    return result[0];
  } else {
    throw '获取版本号失败';
  }
}

function setVersion(version) {
  fs.writeFileSync(filePath, `export const VERSION = '${version}';
`);
}

function isValid(version) {
  return pattern.test(version);
}

module.exports = {
  getVersion,
  setVersion,
  isValid,
};
