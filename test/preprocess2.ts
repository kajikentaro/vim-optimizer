import * as fs from 'fs';
import * as readline from 'readline';
import { ActionIdChain } from '../src/suggest/suggest';
import {
  AllTestResult,
  DOUBLE_ACTION_RES_FILE,
  logTest,
  logTestReset,
  saveRecommendMap,
  SINGLE_ACTION_RES_FILE,
} from './const';

export type ExecuteResultKey = Array<{
  text: string;
  cursorLine: number;
  cursorCharacter: number;
  mode: string;
}>;

function isSame(a: AllTestResult, b: AllTestResult) {
  const size = a.result.length;
  for (let i = 0; i < size; i++) {
    const ai = a.result[i];
    const bi = b.result[i];
    if (ai === null || bi === null) {
      continue;
    }
    if (
      ai.mode === bi.mode &&
      ai.position.character === bi.position.character &&
      ai.position.line === bi.position.line &&
      ai.text === bi.text
    ) {
      continue;
    }
    return false;
  }
  return true;
}

export default async function preprocess2() {
  const doubleActionRes = await readActionRes(DOUBLE_ACTION_RES_FILE);
  const singleActionRes = await readActionRes(SINGLE_ACTION_RES_FILE);

  const actionRes = [...doubleActionRes, ...singleActionRes];

  const actionResSame = [...Array(actionRes.length)].map(() => [] as ActionIdChain[]);
  for (let ai = 0; ai < actionRes.length; ai++) {
    const a = actionRes[ai];
    if (
      a.actionIdChain.length === 2 &&
      a.actionIdChain[0].pressKeys[0] === 'k' &&
      a.actionIdChain[1].pressKeys[0] === 'o'
    ) {
      console.log('hoge');
    }
    for (const b of actionRes) {
      if (b.actionIdChain.length === 1 && b.actionIdChain[0].pressKeys[0] === 'O') {
        console.log('hoge');
      }
      if (isSame(a, b)) {
        actionResSame[ai].push(b.actionIdChain);
      }
    }
  }

  const recommendAction = new Map<string, ActionIdChain>();
  const tmp = [];
  for (let ai = 0; ai < actionRes.length; ai++) {
    const sameActions = actionResSame[ai];
    const mapKey: ActionIdChain = actionRes[ai].actionIdChain;
    if (sameActions.length === 1) continue;

    // キーの押す回数が最も少ないものを探す
    let minKeyLength = Infinity;
    let minIdx = -1;
    for (let i = 0; i < sameActions.length; i++) {
      const idChain = sameActions[i];
      const keyLength = Math.max(
        idChain.reduce((sum, v) => sum + v.pressKeys.length, 0),
        idChain.length
      );
      if (keyLength < minKeyLength) {
        minKeyLength = keyLength;
        minIdx = i;
      }
    }

    const mapValue = sameActions[minIdx];

    tmp.push(
      mapKey.map((v) => v.pressKeys.join('').replace('\n', '\\n')).join(' ') +
        ' ### ' +
        mapKey.map((v) => v.actionName).join(' ')
    );
    tmp.push(
      mapValue.map((v) => v.pressKeys.join('').replace('\n', '\\n')).join(' ') +
        ' ### ' +
        mapValue.map((v) => v.actionName).join(' ')
    );
    recommendAction.set(JSON.stringify(mapKey), sameActions[minIdx]);
    tmp.push('\n');
  }

  logTestReset();
  logTest(tmp.join('\n'));

  // ファイルに保存
  await saveRecommendMap(recommendAction);
}

async function readActionRes(filename: string) {
  const stream = fs.createReadStream(filename, {
    encoding: 'utf8',
    highWaterMark: 1024,
  });
  const reader = readline.createInterface({ input: stream });
  const executeResult = await new Promise<AllTestResult[]>((resolve) => {
    const res: AllTestResult[] = [];
    reader.on('line', (v) => {
      const obj = JSON.parse(v) as AllTestResult[];
      res.push(...obj);
    });
    reader.on('close', () => {
      resolve(res);
    });
  });
  return executeResult;
}
