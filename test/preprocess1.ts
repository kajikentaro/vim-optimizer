import {
  AllTestResult,
  ExecuteAction,
  executeActionToActionCache,
  logA,
  logB,
  logReset,
} from './const';
import { EditorNotActiveError, executeTest, SameResultTestError } from './sameResultTest';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

async function executeTestWrapper(
  executeActions: ExecuteAction[]
): Promise<AllTestResult | undefined> {
  const executeResultAll: AllTestResult = {
    actionIdChain: executeActions.map((v) => executeActionToActionCache(v)),
    result: [],
  };

  const keyLine = executeActions.map((v) => v.actionKeys.join('')).join(' ');
  const testCase = [
    ['one |two three'],
    ['zero one|TwoThree four', 'five'],
    ['abc def', '', 'abc ab|c', 'abc abc', '', 'abc def'],
    ['(', '<div><a>[int main(vo|id)]</a></div>', ')'],
    ['def hoge():', '  for |i in range(5):', '    print(i)', '  return 0'],
  ];
  let notModifiedCnt = 0;
  for (let i = 0; i < testCase.length; i++) {
    try {
      const res = await executeTest({
        start: testCase[i],
        actions: executeActions,
      });
      if (res === null) {
        notModifiedCnt++;
      }
      executeResultAll.result.push(res);
    } catch (e) {
      if (e instanceof EditorNotActiveError) {
        console.error('editor not active');
        await cleanUpWorkspace();
        await setupWorkspace();
        // もう一度実行
        i--;
        continue;
      } else if (e instanceof SameResultTestError) {
        console.error(e.message + ' ' + keyLine);
      } else {
        console.error('その他のエラー ' + e.message + ' ' + keyLine);
      }
      return undefined;
    }
  }
  // 全てのテストで変更がなかったら失敗にする
  if (notModifiedCnt === testCase.length) {
    console.error('Not modified ' + keyLine);
    return undefined;
  }
  console.log('done ' + keyLine);
  return executeResultAll;
}

async function preprocessSingleAction(allActions: ExecuteAction[]) {
  const resultSingle: AllTestResult[] = [];
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
    const resultSingle: AllTestResult[] = [];
    if (allActions[i].skipDoubleAction) {
      console.error('skip double action ' + allActions[i].actionKeys);
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

export async function preprocess(allActions: ExecuteAction[]) {
  logReset();
  await setupWorkspace();

  const startIdx = parseInt(process.env.START || '0', 10);
  const endIdx = parseInt(process.env.END || allActions.length + '', 10);

  if (startIdx === 0) {
    await preprocessSingleAction(allActions);
  }
  await preprocessDoubleAction(allActions, startIdx, endIdx);
}
