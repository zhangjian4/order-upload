const fs = require('fs'); //获取文件系统模块，负责读写文件
const path = require('path'); //工具模块，处理文件路径的小工具
const JSZIP = require('jszip');
const { getVersion } = require('./version');
const { format } = require('date-fns');
// var exec = require('child_process').exec;

//读取目录及文件
function read(zip, target) {
  const name = path.parse(target).base;
  let file = fs.statSync(target);
  if (file.isDirectory()) {
    let folder = zip.folder(name);
    let files = fs.readdirSync(target);
    files.forEach((subFile) => {
      read(folder, path.join(target, subFile));
    });
  } else {
    zip.file(name, fs.readFileSync(target));
  }
}

//开始压缩文件
async function startZIP(dir, name) {
  let zip = new JSZIP();
  read(zip, dir);
  const content = await zip.generateAsync({
    //设置压缩格式，开始打包
    type: 'nodebuffer', //nodejs用
    compression: 'DEFLATE', //压缩算法
    compressionOptions: {
      //压缩级别
      level: 9,
    },
  });
  fs.writeFileSync(name, content, 'utf-8');
}

async function main() {
  const version = getVersion();
  const zipName = `release-v${version}.zip`;
  console.log(`开始压缩:${zipName}`);
  await startZIP('./www', zipName);
  console.log('压缩完成');
  // await deploy(zipName, version);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
