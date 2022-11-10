import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test runner script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './index');

    // Download VS Code, unzip it and run the integration test
    logReset();
    await new Promise(async (resolve, reject) => {
      let cnt = 3;
      const ok = () => {
        cnt--;
        if (cnt === 0) {
          resolve(undefined);
        }
      };
      (async () => {
        await runTests({
          extensionDevelopmentPath,
          extensionTestsPath,
          // Disable other extensions while running tests for avoiding unexpected side-effect
          launchArgs: ['--disable-extensions'],
          extensionTestsEnv: { START: '0', END: '200' },
        });
        ok();
      })();
      (async () => {
        await runTests({
          extensionDevelopmentPath,
          extensionTestsPath,
          // Disable other extensions while running tests for avoiding unexpected side-effect
          launchArgs: ['--disable-extensions'],
          extensionTestsEnv: { START: '200', END: '400' },
        });
        ok();
      })();
      (async () => {
        await runTests({
          extensionDevelopmentPath,
          extensionTestsPath,
          // Disable other extensions while running tests for avoiding unexpected side-effect
          launchArgs: ['--disable-extensions'],
          extensionTestsEnv: { START: '400' },
        });
        ok();
      })();
    });
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();

export async function logReset() {
  const fs = require('fs').promises;
  await fs.writeFile('C:\\Users\\aaa\\Downloads\\VSCodeVim-A.txt', '');
  await fs.writeFile('C:\\Users\\aaa\\Downloads\\VSCodeVim-B.txt', '');
}
