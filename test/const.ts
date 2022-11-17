import { assert } from 'console';
import * as fs from 'fs/promises';
import { BaseAction } from 'src/actions/base';
import { Position } from 'vscode';
export const SINGLE_ACTION_RES_FILE = __dirname + '/SingleAction.txt';
export const DOUBLE_ACTION_RES_FILE = __dirname + '/DoubleAction.txt';
export const UNREACHABLE_ACTION_CACHE_FILE = __dirname + '/UnreachableCache.txt';
export const TEST_FILE = __dirname + '/test.txt';

export async function logReset() {
  await fs.writeFile(SINGLE_ACTION_RES_FILE, '');
  await fs.writeFile(DOUBLE_ACTION_RES_FILE, '');
}
export async function logB(text: string) {
  await fs.appendFile(SINGLE_ACTION_RES_FILE, text);
  await fs.appendFile(SINGLE_ACTION_RES_FILE, '\n');
}

export async function logA(text: string) {
  await fs.appendFile(DOUBLE_ACTION_RES_FILE, text);
  await fs.appendFile(DOUBLE_ACTION_RES_FILE, '\n');
}

export async function logTestReset() {
  await fs.writeFile(TEST_FILE, '');
}

export async function logTest(text: string) {
  await fs.appendFile(TEST_FILE, text);
  await fs.appendFile(TEST_FILE, '\n');
}

export async function saveUnreachableActionCache() {
  await fs.writeFile(DOUBLE_ACTION_RES_FILE, '');
}

export async function readUnreachableActionCache(executeActions: ExecuteAction[]) {
  try {
    const cacheBuf = await fs.readFile(UNREACHABLE_ACTION_CACHE_FILE);
    const cache = JSON.parse(cacheBuf.toString()) as UnreachableActionCache;

    // 同じアクションを指しているか確かめる
    for (let i = 0; i < cache.length; i++) {
      assert(cache[i].keys.length === executeActions[i].keys.length);
      for (let j = 0; j < cache.length; j++) {
        assert(cache[i][j] === executeActions[i].keys[j]);
      }
    }

    for (let i = 0; i < cache.length; i++) {
      executeActions[i].isBanFirstAction = cache[i].isBanFirstAction;
    }
    return executeActions;
  } catch {
    return undefined;
  }
}

export async function writeUnreachableActionCache(executeActions: ExecuteAction[]) {
  const cache: UnreachableActionCache = executeActions.map((v) => {
    return { isBanFirstAction: v.isBanFirstAction, keys: v.keys };
  });
  await fs.writeFile(UNREACHABLE_ACTION_CACHE_FILE, JSON.stringify(cache));
}

export type UnreachableActionCache = Array<{ keys: string[]; isBanFirstAction: boolean }>;

export interface ExecuteResultSingle {
  text: string;
  position: Position;
  mode: string;
}

export interface ExecuteResultAll {
  actionKeys: string[];
  result: ExecuteResultSingle[];
}

export interface ExecuteAction {
  action: BaseAction;
  keys: string[];
  isBanFirstAction: boolean;
  skipDoubleAction: boolean;
}
