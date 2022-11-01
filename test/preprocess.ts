import { BaseAction, getAllActions } from '../src/actions/base';
import { ExecuteResult, executeTestA } from './sameResultTest';
import { Configuration } from './testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

export const result2: ExecuteResult[] = [];
export const result1: ExecuteResult[] = [];

function getFilterdAllActions() {
  const allActions = getAllActions();

  const simpleActions: BaseAction[] = [];
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
        simpleActions.push(action);
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
  const allActions = getFilterdAllActions();
  console.log('preprocessing of two actions');
  let startTimeMs = new Date().getTime();
  await setupWorkspace(configuration);
  logReset();
  for (const actionA of allActions.splice(0, 100)) {
    for (let j = 0; j < 100; j++) {
      if (j % 50 === 0) {
        const middleTimeMs = new Date().getTime();
        console.log('ms per an action', (middleTimeMs - startTimeMs) / 50);
        startTimeMs = middleTimeMs;
      }
      try {
        await cleanUpWorkspace();
        await setupWorkspace();

        const res = await executeTestA({
          title: actionA.keys.toString(),
          start: ['one |two three'],
          actions: [actionA, allActions[j]],
        });
        if (res.text !== 'one two three') {
          result2.push(res);
        }
      } catch (e) {
        console.error('error');
      }
    }
  }

  // 前処理(キー1つ)
  console.log('preprocessing of an actions');
  for (const actionA of allActions.splice(0, 100)) {
    try {
      const res = await executeTestA({
        title: actionA.keys.toString(),
        start: ['one |two three'],
        actions: [actionA],
      });
      if (res.text !== 'one two three') {
        result2.push(res);
      }
    } catch (e) {
      console.error(e);
      await cleanUpWorkspace();
      await setupWorkspace();

      const res = await executeTestA({
        title: actionA.keys.toString(),
        start: ['one |two three'],
        actions: [actionA],
      });
      if (res.text !== 'one two three') {
        result2.push(res);
      }
    }
  }

  console.log('done preprocessing');
  log(JSON.stringify(result1));
  log(JSON.stringify(result2));
}

export async function logReset() {
  const fs = require('fs').promises;
  await fs.writeFile('C:\\Users\\aaa\\Downloads\\hoge-log.txt', '');
}
export async function log(text: string) {
  const fs = require('fs').promises;
  await fs.appendFile('C:\\Users\\aaa\\Downloads\\hoge-log.txt', text);
}
