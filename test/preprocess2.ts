import * as fs from 'fs';
import * as readline from 'readline';
import {
  DOUBLE_ACTION_RES_FILE,
  ExecuteResultAll,
  ExecuteResultSingle,
  logTest,
  logTestReset,
  SINGLE_ACTION_RES_FILE,
} from './const';

export type ExecuteResultKey = {
  text: string;
  cursorLine: number;
  cursorCharacter: number;
  mode: string;
}[];

export default async function preprocess2() {
  const doubleActionRes = await readActionRes(DOUBLE_ACTION_RES_FILE);
  const singleActionRes = await readActionRes(SINGLE_ACTION_RES_FILE);

  const resMap = new Map<string, string[][]>();
  for (const v of doubleActionRes) {
    const resultkey: ExecuteResultKey = v.result.map((v) => {
      return {
        text: v.text,
        cursorCharacter: v.position.character,
        cursorLine: v.position.line,
        mode: v.mode,
      };
    });
    const target = resMap.get(JSON.stringify(resultkey));
    if (target) {
      target.push(v.actionKeys);
    } else {
      resMap.set(JSON.stringify(resultkey), [v.actionKeys]);
    }
  }

  for (const v of singleActionRes) {
    const resultkey: ExecuteResultKey = v.result.map((v) => {
      return {
        text: v.text,
        cursorCharacter: v.position.character,
        cursorLine: v.position.line,
        mode: v.mode,
      };
    });
    const target = resMap.get(JSON.stringify(resultkey));
    if (target) {
      target.push(v.actionKeys);
    } else {
      resMap.set(JSON.stringify(resultkey), [v.actionKeys]);
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
  const res = [];
  for await (const line of reader) {
    const obj = JSON.parse(line) as ExecuteResultAll[];
    res.push(...obj);
  }
  return res;
}

async function readDoubleActionRes() {
  const stream = fs.createReadStream(DOUBLE_ACTION_RES_FILE, {
    encoding: 'utf8',
    highWaterMark: 1024,
  });
  const reader = readline.createInterface({ input: stream });
  const res = [];
  for await (const line of reader) {
    const obj = JSON.parse(line) as ExecuteResultSingle[];
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
    const obj = JSON.parse(line) as ExecuteResultSingle[];
    res.push(...obj);
  }
  return res;
}
