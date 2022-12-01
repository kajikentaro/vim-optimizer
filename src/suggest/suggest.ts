import * as vscode from 'vscode';

export type ActionIdChain = ActionId[];

export interface ActionId {
  pressKeys: string[];
  actionName: string;
}

const history: ActionId[] = [];

let suggestMapCache: undefined | Map<string, ActionIdChain>;
function getSuggestMap() {
  if (typeof suggestMapCache !== 'undefined') {
    return suggestMapCache;
  }
  suggestMapCache = new Map<string, ActionIdChain>();
  const suggestMapJson = require('./suggestMap.json');
  for (const { k, v } of suggestMapJson) {
    suggestMapCache.set(k, v);
  }
  return suggestMapCache;
}

export async function mySuggestOptimalAction(actionName: string, actionKey: string[]) {
  const suggestMap = getSuggestMap();
  history.push({ pressKeys: actionKey, actionName });

  const targetObj: ActionIdChain = history.slice(-2);
  const targetKey = JSON.stringify(targetObj);
  const result = suggestMap.get(targetKey);
  if (typeof result === 'undefined') {
    console.error('not found in suggest map');
    return;
  }
  if (targetKey === JSON.stringify(result)) {
    console.error('target is currently optimal');
    return;
  }
  const targetKeyLength = targetObj.reduce((sum, v) => v.pressKeys.length + sum, 0);
  const resultKeyLength = result.reduce((sum, v) => v.pressKeys.length + sum, 0);
  if (targetKeyLength === resultKeyLength) {
    console.error('target key length is as same as optimal');
    return;
  }
  vscode.window.showInformationMessage(result.map((v) => v.pressKeys.join('')).join(' '));
}

export async function myTest() {
  const callWasm = require('./callWasm');
  console.log(await callWasm.callWasm(1, 3));
}
