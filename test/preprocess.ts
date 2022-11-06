import { BaseAction, getAllActions } from '../src/actions/base';
import {
  EditorNotActiveError,
  ExecuteResult,
  executeTestA,
  NotCompatibleError,
} from './sameResultTest';
import { Configuration } from './testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

const result1: ExecuteResult[] = [];

function getFilterdAllActions(): [BaseAction[], string[][]] {
  const allActions = getAllActions();

  const simpleActions: BaseAction[] = [];
  const simpleActionKeys: string[][] = [];
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
        simpleActionKeys.push(keys);
        break;
      }
    }
  }
  return [simpleActions, simpleActionKeys];
}
export async function preprocess() {
  const configuration = new Configuration();
  configuration.tabstop = 4;
  configuration.expandtab = false;

  // 前処理(キー2つ)
  const [allActions, allActionKeys] = getFilterdAllActions();
  console.log('preprocessing of two actions');
  await setupWorkspace(configuration);
  logReset();

  for (let i = 0; i < allActions.length; i++) {
    const startTimeMs = new Date().getTime();
    for (let j = 0; j < allActions.length; j++) {
      try {
        const res = await executeTestA({
          title: 'ほげ',
          start: ['one |two three'],
          actions: [allActions[i], allActions[j]],
          actionKeys: [allActionKeys[i], allActionKeys[j]],
        });
        if (res.text !== 'one two three') {
          result1.push(res);
        }
        console.log('done ' + allActionKeys[i] + ',' + allActionKeys[j]);
      } catch (e) {
        if (e instanceof EditorNotActiveError) {
          console.error('editor not active');
          await cleanUpWorkspace();
          await setupWorkspace();
          j--;
          continue;
        } else if (e instanceof NotCompatibleError) {
          console.error('not compatible ' + allActionKeys[i] + ',' + allActionKeys[j]);
        } else {
          console.error('違うエラー ' + allActionKeys[i] + ',' + allActionKeys[j]);
          continue;
        }
      }
    }
    const endTimeMs = new Date().getTime();
    console.log('time ' + (endTimeMs - startTimeMs) / allActions.length + 'ms per action');
  }

  console.log('done preprocessing');
  log(JSON.stringify(result1));
}

export async function logReset() {
  const fs = require('fs').promises;
  await fs.writeFile('C:\\Users\\aaa\\Downloads\\VSCodeVim-A.txt', '');
  await fs.writeFile('C:\\Users\\aaa\\Downloads\\VSCodeVim-B.txt', '');
}
export async function log(text: string) {
  const fs = require('fs').promises;
  await fs.appendFile('C:\\Users\\aaa\\Downloads\\VSCodeVim-A.txt', text);
}

export async function logB(text: string) {
  const fs = require('fs').promises;
  await fs.appendFile('C:\\Users\\aaa\\Downloads\\VSCodeVim-B.txt', text);
}
