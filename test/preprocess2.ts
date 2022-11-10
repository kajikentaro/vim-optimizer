import * as fs from 'fs';
import * as readline from 'readline';
import { DOUBLE_ACTION_RES_FILE, logTest, logTestReset, SINGLE_ACTION_RES_FILE } from './const';
import { ExecuteResult } from './sameResultTest';

export interface ExecuteResultKey {
  text: string;
  cursorLine: number;
  cursorCharacter: number;
  mode: string;
}

function isSameActionResult(a: ExecuteResult, b: ExecuteResult) {
  return (
    a.mode === b.mode &&
    a.position.line === b.position.line &&
    a.position.character === b.position.character &&
    a.text === b.text
  );
}

export default async function preprocess2() {
  const doubleActionRes = await readDoubleActionRes();
  const singleActionRes = await readSingleActionRes();

  const resMap = new Map<string, string[][]>();
  for (const v of doubleActionRes) {
    const resultkey: ExecuteResultKey = {
      text: v.text,
      cursorCharacter: v.position.character,
      cursorLine: v.position.line,
      mode: v.mode,
    };
    const target = resMap.get(JSON.stringify(resultkey));
    if (target) {
      target.push(v.actionKeys);
    } else {
      resMap.set(JSON.stringify(resultkey), [v.actionKeys]);
    }
  }

  for (const v of singleActionRes) {
    const resultkey: ExecuteResultKey = {
      text: v.text,
      cursorCharacter: v.position.character,
      cursorLine: v.position.line,
      mode: v.mode,
    };
    const target = resMap.get(JSON.stringify(resultkey));
    if (target) {
      target.push(v.actionKeys);
    } else {
      resMap.set(JSON.stringify(resultkey), [v.actionKeys]);
    }
  }

  logTestReset();
  for (const [k, v] of resMap) {
    if (v.length === 1) continue;
    let res = k + '\n';
    for (const a of v) {
      res += a.join('') + '\n';
    }
    res += '\n';
    logTest(res);
  }
}

async function readDoubleActionRes() {
  const stream = fs.createReadStream(DOUBLE_ACTION_RES_FILE, {
    encoding: 'utf8',
    highWaterMark: 1024,
  });
  const reader = readline.createInterface({ input: stream });
  const res = [];
  for await (const line of reader) {
    const obj = JSON.parse(line) as ExecuteResult[];
    res.push(...obj);
  }
  return res;
}

async function readSingleActionRes() {
  const stream = fs.createReadStream(SINGLE_ACTION_RES_FILE, {
    encoding: 'utf8',
    highWaterMark: 1024,
  });
  const reader = readline.createInterface({ input: stream });
  const res = [];
  for await (const line of reader) {
    const obj = JSON.parse(line) as ExecuteResult[];
    res.push(...obj);
  }
  return res;
}
