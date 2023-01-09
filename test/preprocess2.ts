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
  const actionRes = [
    ...(await readActionRes(DOUBLE_ACTION_RES_FILE)),
    ...(await readActionRes(SINGLE_ACTION_RES_FILE)),
  ];

  // 結果を保存するmap
  const recommendAction = new Map<string, ActionIdChain>();
  // デバック用
  const tmp = [];

  for (let ai = 0; ai < actionRes.length; ai++) {
    const a = actionRes[ai];

    // aと同じものを検索する
    const sameActionsWithA: ActionIdChain[] = [];
    for (let bi = 0; bi < actionRes.length; bi++) {
      if (bi === ai) continue;
      const b = actionRes[bi];
      if (isSame(a, b)) {
        sameActionsWithA.push(b.actionIdChain);
      }
    }

    // 見つからなかった場合はスキップ
    if (sameActionsWithA.length === 0) continue;

    // キーの押す回数が最も少ないものを探す
    let minKeyLength = Infinity;
    let minIdx = -1;
    for (let i = 0; i < sameActionsWithA.length; i++) {
      const keyLength = getKeyLengthSum(sameActionsWithA[i]);
      if (keyLength < minKeyLength) {
        minKeyLength = keyLength;
        minIdx = i;
      }
    }
    const mapValue = sameActionsWithA[minIdx];

    // Aよりキーの入力回数が多かったらスキップ
    const keyLengthA = getKeyLengthSum(a.actionIdChain);
    if (keyLengthA <= minKeyLength) continue;

    // 結果をmapに保存する
    const mapKey: ActionIdChain = actionRes[ai].actionIdChain;
    recommendAction.set(JSON.stringify(mapKey), sameActionsWithA[minIdx]);

    // デバック用に保存する
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
    tmp.push('\n');
  }

  // デバック用
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

function getKeyLengthSum(actionIdChain: ActionIdChain) {
  const keyLength = Math.max(
    actionIdChain.reduce((sum, v) => sum + v.pressKeys.length, 0),
    actionIdChain.length
  );
  return keyLength;
}
