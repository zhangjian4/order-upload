const readline = require("readline");
const { getVersion, setVersion, isValid } = require("./version");

async function main() {
  const version = getVersion();
  const split = version.split(".");
  split[2] = (+split[2] + 1).toString();
  const newVersion = split.join(".");
  console.info(`更新版本号:${version}-->${newVersion}`);
  setVersion(newVersion);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
