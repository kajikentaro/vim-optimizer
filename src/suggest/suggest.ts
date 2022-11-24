import * as vscode from 'vscode';
import * as suggestMapJson from './suggestMap.json';

export type CacheActionChain = CacheAction[];

export interface CacheAction {
  pressKeys: string[];
  actionName: string;
}

const history: CacheAction[] = [];

let suggestMapCache: undefined | Map<string, CacheActionChain>;
function getSuggestMap() {
  if (typeof suggestMapCache !== 'undefined') {
    return suggestMapCache;
  }
  suggestMapCache = new Map<string, CacheActionChain>();
  for (const { k, v } of suggestMapJson) {
    suggestMapCache.set(k, v);
  }
  return suggestMapCache;
}

export async function mySuggestOptimalAction(actionName: string, actionKey: string[]) {
  const suggestMap = getSuggestMap();
  history.push({ pressKeys: actionKey, actionName });

  const target = JSON.stringify(history.slice(-2));
  const result = suggestMap.get(target);
  if (typeof result === 'undefined') {
    vscode.window.showInformationMessage('not for optimal action');
    return;
  }
  vscode.window.showInformationMessage(result.map((v) => v.pressKeys.join('')).join(' '));
}
