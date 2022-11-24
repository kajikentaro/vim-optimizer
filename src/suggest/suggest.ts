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
    vscode.window.showInformationMessage('not for optimal action');
    return;
  }
  vscode.window.showInformationMessage(result.map((v) => v.pressKeys.join('')).join(' '));
}
