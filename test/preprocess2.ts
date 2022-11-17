import * as fs from 'fs';
import * as readline from 'readline';
import {
  DOUBLE_ACTION_RES_FILE,
  ExecuteResultAll,
  logTest,
  logTestReset,
  SINGLE_ACTION_RES_FILE,
} from './const';

export type ExecuteResultKey = Array<{
  text: string;
  cursorLine: number;
  cursorCharacter: number;
  mode: string;
}>;

export default async function preprocess2() {
  const doubleActionRes = await readActionRes(DOUBLE_ACTION_RES_FILE);
  const singleActionRes = await readActionRes(SINGLE_ACTION_RES_FILE);

  const resMap = new Map<string, string[][]>();
  for (const actionRes of doubleActionRes) {
    const resultkey: ExecuteResultKey = actionRes.result.map((v) => {
      return {
        text: v.text,
        cursorCharacter: v.position.character,
        cursorLine: v.position.line,
        mode: v.mode,
      };
    });
    const target = resMap.get(JSON.stringify(resultkey));
    if (target) {
      target.push(actionRes.actionKeys);
    } else {
      resMap.set(JSON.stringify(resultkey), [actionRes.actionKeys]);
    }
  }

  for (const actionRes of singleActionRes) {
    const resultkey: ExecuteResultKey = actionRes.result.map((v) => {
      return {
        text: v.text,
        cursorCharacter: v.position.character,
        cursorLine: v.position.line,
        mode: v.mode,
      };
    });
    const target = resMap.get(JSON.stringify(resultkey));
    if (target) {
      target.push(actionRes.actionKeys);
    } else {
      resMap.set(JSON.stringify(resultkey), [actionRes.actionKeys]);
    }
  }

  logTestReset();
  let i = 0;
  for (const [k, v] of resMap) {
    i++;
    if (v.length === 1) continue;
    let res = k + '\n';
    let j = 0;
    for (const a of v) {
      res += a.join('').replace(/\n/, '\\n') + '\n';
      j++;
    }
    res += '\n';
    logTest(res);
  }
}

async function readActionRes(filename: string) {
  const stream = fs.createReadStream(filename, {
    encoding: 'utf8',
    highWaterMark: 1024,
  });
  const reader = readline.createInterface({ input: stream });
  const executeResult = await new Promise<ExecuteResultAll[]>((resolve) => {
    const res: ExecuteResultAll[] = [];
    reader.on('line', (v) => {
      const obj = JSON.parse(v) as ExecuteResultAll[];
      res.push(...obj);
    });
    reader.on('close', () => {
      resolve(res);
    });
  });
  return executeResult;
}
