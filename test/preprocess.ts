import { getAllActions } from '../src/actions/base';
import { ExecuteAction, ExecuteResultAll, logA, logB, logReset } from './const';
import { createUnreachableActionTree } from './createUnreachableActionTree';
import {
  EditorNotActiveError,
  executeTest,
  NotAllowFirstAction,
  NotCompatibleError,
  NotModifiedError,
} from './sameResultTest';
import { Configuration } from './testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

function getFilterdAllActions(): ExecuteAction[] {
  const allActions = getAllActions();

  const simpleActions: ExecuteAction[] = [];
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
        simpleActions.push({
          action,
          keys: keys,
          isBanFirstAction: false,
          skipDoubleAction: false,
        });
        break;
      }
    }
  }
  return simpleActions;
}

async function executeTestWrapper(
  executeActions: ExecuteAction[]
): Promise<ExecuteResultAll | undefined> {
  const executeResultAll: ExecuteResultAll = {
    actionKeys: executeActions.map((v) => v.keys).flat(),
    result: [],
  };

  const keyLine = executeActions.map((v) => v.keys.join('')).join(' ');
  const testCase = [
    ['one |two three'],
    ['zero one|TwoThree four', 'five'],
    ['abc def', '', 'abc ab|c', 'abc abc', '', 'abc def'],
  ];
  for (let i = 0; i < testCase.length; i++) {
    try {
      const res = await executeTest({
        start: testCase[i],
        actions: executeActions,
      });

      console.log('done ' + keyLine);
      executeResultAll.result.push(res);
    } catch (e) {
      if (e instanceof EditorNotActiveError) {
        console.error('editor not active');
        await cleanUpWorkspace();
        await setupWorkspace();
        // もう一度実行
        i--;
        continue;
      } else if (e instanceof NotCompatibleError) {
        console.error('not compatible ' + keyLine);
      } else if (e instanceof NotModifiedError) {
        console.error('not modified ' + keyLine);
      } else if (e instanceof NotAllowFirstAction) {
        console.error('not allow first ' + keyLine);
      } else if (e instanceof NotAllowFirstAction) {
        console.error('not action complete' + keyLine);
      } else {
        console.error('違うエラー ' + keyLine);
      }
      return undefined;
    }
  }
  return executeResultAll;
}

async function preprocessSingleAction(allActions: ExecuteAction[]) {
  const resultSingle: ExecuteResultAll[] = [];
  for (let i = 0; i < allActions.length; i++) {
    const res = await executeTestWrapper([allActions[i]]);
    if (res) {
      resultSingle.push(res);
    } else {
      // ダブルアクションではスキップするように
      allActions[i].skipDoubleAction = true;
    }
  }
  logB(JSON.stringify(resultSingle));
}

async function preprocessDoubleAction(
  allActions: ExecuteAction[],
  startIdx: number,
  endIdx: number
) {
  for (let i = startIdx; i < endIdx; i++) {
    const startTimeMs = new Date().getTime();
    const resultSingle: ExecuteResultAll[] = [];
    if (allActions[i].skipDoubleAction) {
      console.error('skip double action ' + allActions[i].keys);
      continue;
    }
    for (let j = 0; j < allActions.length; j++) {
      const res = await executeTestWrapper([allActions[i], allActions[j]]);
      if (res) {
        resultSingle.push(res);
      }
    }
    const endTimeMs = new Date().getTime();
    console.log('time ' + (endTimeMs - startTimeMs) / allActions.length + 'ms per action');
    logA(JSON.stringify(resultSingle));
  }
}

export async function preprocess() {
  logReset();
  const configuration = new Configuration();
  configuration.tabstop = 4;
  configuration.expandtab = false;

  // 前処理(キー2つ)
  let allActions = getFilterdAllActions();
  await setupWorkspace(configuration);

  const startIdx = parseInt(process.env.START || '0');
  const endIdx = parseInt(process.env.END || allActions.length + '');

  allActions = await createUnreachableActionTree(allActions);
  startIdx === 0 && (await preprocessSingleAction(allActions));
  await preprocessDoubleAction(allActions, startIdx, endIdx);

  console.log('done preprocessing');
}
