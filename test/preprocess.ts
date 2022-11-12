import { BaseAction, getAllActions } from '../src/actions/base';
import { logA, logB, logReset } from './const';
import {
  EditorNotActiveError,
  ExecuteResult,
  executeTestA,
  NotCompatibleError,
  NotModifiedError,
} from './sameResultTest';
import { Configuration } from './testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

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

async function preprocessSingleAction(allActions: BaseAction[], allActionKeys: string[][]) {
  for (let i = 0; i < allActions.length; i++) {
    if (allActions[i].keys[0] === 'v') {
      console.log('hoge');
    }
  }

  const resultSingle: ExecuteResult[] = [];
  for (let i = 0; i < allActions.length; i++) {
    try {
      const res = await executeTestA({
        title: 'ほげ',
        start: ['one |two three'],
        actions: [allActions[i]],
        actionKeys: [allActionKeys[i]],
      });

      // 初期値と全く一緒の場合はスキップ
      if (
        res.text === 'one two three' &&
        res.mode === 'NORMAL' &&
        res.position.line === 0 &&
        res.position.character === 4
      ) {
        console.log('skip ' + allActionKeys[i]);
        continue;
      }
      resultSingle.push(res);
      console.log('done ' + allActionKeys[i]);
    } catch (e) {
      if (e instanceof EditorNotActiveError) {
        console.error('editor not active');
        await cleanUpWorkspace();
        await setupWorkspace();
        i--;
        continue;
      } else if (e instanceof NotCompatibleError) {
        console.error('not compatible ' + allActionKeys[i]);
      } else if (e instanceof NotModifiedError) {
        console.error('not modified ' + allActionKeys[i]);
      } else {
        console.error('違うエラー ' + allActionKeys[i]);
        continue;
      }
    }
  }
  logB(JSON.stringify(resultSingle));
}

async function preprocessDoubleAction(
  allActions: BaseAction[],
  allActionKeys: string[][],
  startIdx: number,
  endIdx: number
) {
  for (let i = startIdx; i < endIdx; i++) {
    const startTimeMs = new Date().getTime();
    const resultSingle: ExecuteResult[] = [];
    for (let j = 0; j < allActions.length; j++) {
      try {
        const res = await executeTestA({
          title: 'ほげ',
          start: ['one |two three'],
          actions: [allActions[i], allActions[j]],
          actionKeys: [allActionKeys[i], allActionKeys[j]],
        });

        // 初期値と全く一緒の場合はスキップ
        if (
          res.text === 'one two three' &&
          res.mode === 'NORMAL' &&
          res.position.line === 0 &&
          res.position.character === 4
        ) {
          console.log('skip ' + allActionKeys[i] + ',' + allActionKeys[j]);
          continue;
        }
        resultSingle.push(res);
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
    logA(JSON.stringify(resultSingle));
  }
}

export async function preprocess() {
  logReset();
  const configuration = new Configuration();
  configuration.tabstop = 4;
  configuration.expandtab = false;

  // 前処理(キー2つ)
  const [allActions, allActionKeys] = getFilterdAllActions();
  console.log('preprocessing of two actions');
  await setupWorkspace(configuration);

  const startIdx = parseInt(process.env.START || '0');
  const endIdx = parseInt(process.env.END || allActions.length + '');

  startIdx === 0 && (await preprocessSingleAction(allActions, allActionKeys));
  await preprocessDoubleAction(allActions, allActionKeys, startIdx, endIdx);

  console.log('done preprocessing');
}
