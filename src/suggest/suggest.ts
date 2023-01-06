import * as vscode from 'vscode';
import { Mode } from '../mode/mode';
import { VimState } from '../state/vimState';

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
    // console.error('not found in suggest map');
    return;
  }
  if (targetKey === JSON.stringify(result)) {
    // console.error('target is currently optimal');
    return;
  }
  const targetKeyLength = targetObj.reduce((sum, v) => v.pressKeys.length + sum, 0);
  const resultKeyLength = result.reduce((sum, v) => v.pressKeys.length + sum, 0);
  if (targetKeyLength === resultKeyLength) {
    // console.error('target key length is as same as optimal');
    return;
  }
  vscode.window.showInformationMessage(result.map((v) => v.pressKeys.join('')).join(' '));
}

let cursorTracking: vscode.Position | undefined;
export async function mySuggestOptimalMovement(vimState: VimState) {
  // 初期状態をセットする
  if (typeof cursorTracking === 'undefined' && vimState.currentMode === Mode.Normal) {
    cursorTracking = vimState.cursors[0].start;
    return;
  }

  // ノーマルモードから抜けた場合
  if (typeof cursorTracking !== 'undefined' && vimState.currentMode !== Mode.Normal) {
    const cursorNow = vimState.cursors[0].start;
    optimizeMovement(vimState.document.getText(), cursorTracking, cursorNow);

    cursorTracking = undefined;
  }
}

async function optimizeMovement(text: string, before: vscode.Position, after: vscode.Position) {
  const optIn = {
    origin: {
      line: before.line,
      character: before.character,
    },
    destination: {
      line: after.line,
      character: after.character,
    },
    editorText: text,
  };

  console.log(JSON.stringify(optIn.origin));
  console.log(JSON.stringify(optIn.destination));
  const callWasm = require('./callWasm');
  const optOutStr = await callWasm.callWasm(optIn);
  console.log(optOutStr);
}
