import { getAllActions } from '../src/actions/base';
import { ExecuteAction, ExecuteResult, logA, logB, logReset } from './const';
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

async function preprocessSingleAction(allActions: ExecuteAction[]) {
  const resultSingle: ExecuteResult[] = [];
  for (let i = 0; i < allActions.length; i++) {
    try {
      const res = await executeTest({
        title: 'ほげ',
        start: ['one |two three'],
        actions: [allActions[i]],
      });

      resultSingle.push(res);
      console.log('done ' + allActions[i].keys);
    } catch (e) {
      if (e instanceof EditorNotActiveError) {
        console.error('editor not active');
        await cleanUpWorkspace();
        await setupWorkspace();
        i--;
        continue;
      } else if (e instanceof NotCompatibleError) {
        console.error('not compatible ' + allActions[i].keys);
      } else if (e instanceof NotModifiedError) {
        console.error('not modified ' + allActions[i].keys);
      } else if (e instanceof NotAllowFirstAction) {
        console.error('not allow first ' + allActions[i].keys);
      } else {
        console.error('違うエラー ' + allActions[i].keys);
      }
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
    const resultSingle: ExecuteResult[] = [];
    if (allActions[i].skipDoubleAction) {
      console.error('skip double action ' + allActions[i].keys);
      continue;
    }
    for (let j = 0; j < allActions.length; j++) {
      try {
        const res = await executeTest({
          title: 'ほげ',
          start: ['one |two three'],
          actions: [allActions[i], allActions[j]],
        });

        resultSingle.push(res);
        console.log('done ' + allActions[i].keys + ',' + allActions[j].keys);
      } catch (e) {
        if (e instanceof EditorNotActiveError) {
          console.error('editor not active');
          await cleanUpWorkspace();
          await setupWorkspace();
          j--;
          continue;
        } else if (e instanceof NotCompatibleError) {
          console.error('not compatible ' + allActions[i].keys + ',' + allActions[j].keys);
        } else if (e instanceof NotModifiedError) {
          console.error('not modified ' + allActions[i].keys + ',' + allActions[j].keys);
        } else if (e instanceof NotAllowFirstAction) {
          console.error('not allow first ' + allActions[i].keys + ',' + allActions[j].keys);
        } else {
          console.error('違うエラー ' + allActions[i].keys + ',' + allActions[j].keys);
        }
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
