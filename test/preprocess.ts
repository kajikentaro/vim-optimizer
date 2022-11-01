import { BaseAction, getAllActions } from '../src/actions/base';
import { MoveWordBegin } from '../src/actions/motion';
import { DeleteOperator } from '../src/actions/operator';
import { ExecuteResult, executeTestA, NotCompatibleError } from './sameResultTest';
import { Configuration } from './testConfiguration';
import { setupWorkspace } from './testUtils';

const result1: ExecuteResult[] = [];

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

  try {
    const res = await executeTestA({
      title: 'ほげ',
      start: ['one |two three'],
      actions: [new DeleteOperator(), new MoveWordBegin()],
    });
    if (res.text !== 'one two three') {
      result1.push(res);
    }
  } catch (e) {
    if (e instanceof NotCompatibleError) {
      console.error('not compatible: stop');
    } else {
      // await cleanUpWorkspace();
      // await setupWorkspace();
      throw new Error('違うエラー');
    }
  }

  console.log('done preprocessing');
  log(JSON.stringify(result1));
}

export async function logReset() {
  const fs = require('fs').promises;
  await fs.writeFile('C:\\Users\\aaa\\Downloads\\hoge-log.txt', '');
}
export async function log(text: string) {
  const fs = require('fs').promises;
  await fs.appendFile('C:\\Users\\aaa\\Downloads\\hoge-log.txt', text);
}
