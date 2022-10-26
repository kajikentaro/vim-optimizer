import { getAllActions } from '../src/actions/base';
import { executeResult, executeTestA } from './sameResultTest';
import { Configuration } from './testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

export const result2: executeResult[] = [];
export const result1: executeResult[] = [];

function getAllActionKeys() {
  const allActions = getAllActions();

  const simpleActions: string[][] = [];
  for (const action of allActions) {
    // 2Dと3Dの物があるので、3Dに統一する
    let checkingKeys: string[][];
    if (Array.isArray(action.keys[0])) {
      checkingKeys = action.keys as string[][];
    } else {
      checkingKeys = [action.keys as string[]];
    }

    // キーリストのどれか一つが単純だった場合はsimpleActionsに追加
    for (const keys of checkingKeys) {
      let isOk = true;
      for (const key of keys) {
        // 単純なキー入力のみの場合はOK
        if (key.length >= 2 || key === 'q') {
          isOk = false;
          break;
        }
      }
      if (isOk) {
        // どれか一つが単純だった場合に追加して終了
        simpleActions.push(keys);
        break;
      }
    }
  }
  return simpleActions;
}
export async function preprocess() {
  const configuration = new Configuration();
  configuration.tabstop = 4;
  configuration.expandtab = false;

  // 前処理(キー2つ)
  const allActionKeys = getAllActionKeys();
  console.log('preprocessing of two actions');
  let startTimeMs = new Date().getTime();
  for (let i = 0; i < allActionKeys.length; i++) {
    for (let j = 0; j < allActionKeys.length; j++) {
      if (j % 50 === 0) {
        const middleTimeMs = new Date().getTime();
        console.log('ms per an action', (middleTimeMs - startTimeMs) / 50);
        startTimeMs = middleTimeMs;
      }

      await cleanUpWorkspace();
      await setupWorkspace(configuration);
      const keysPressed = allActionKeys[i].join('') + allActionKeys[j].join('');
      const res = await executeTestA({
        title: keysPressed,
        start: ['one |two three'],
        keysPressed,
      });
      if (res.text !== 'one two three') {
        result2.push;
      }
    }
  }

  // 前処理(キー1つ)
  console.log('preprocessing of an actions');
  for (let i = 0; i < allActionKeys.length; i++) {
    await cleanUpWorkspace();
    await setupWorkspace(configuration);
    const keysPressed = allActionKeys[i].join('');
    const res = await executeTestA({
      title: keysPressed,
      start: ['one |two three'],
      keysPressed,
    });
    if (res.text !== 'one two three') {
      result1.push;
    }
  }

  console.log('done preprocessing');
  log(JSON.stringify(result1));
  log(JSON.stringify(result2));
}
export async function log(text: string) {
  const fs = require('fs').promises;
  await fs.appendFile('C:\\Users\\aaa\\Downloads\\hoge-log.txt', text);
}
