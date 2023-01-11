import * as vscode from 'vscode';
import { Mode } from '../mode/mode';
import { VimState } from '../state/vimState';

export type ActionIdChain = ActionId[];
export type ActionIdKeyChain = ActionIdKeys[];

export interface ActionIdKeys {
  pressKeys: string[];
}

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

  const targetObj: ActionIdKeyChain = history.slice(-2).map((v) => {
    return { pressKeys: v.pressKeys };
  });
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
  vscode.window.showInformationMessage(
    'Action may be optimized: ' + result.map((v) => v.pressKeys.join('')).join(' ')
  );
}

let cursorTracking: vscode.Position | undefined;
let executeMovementCnt = 0;
export async function mySuggestOptimalMovement(vimState: VimState) {
  executeMovementCnt++;

  // 初期状態をセットする
  if (typeof cursorTracking === 'undefined' && vimState.currentMode === Mode.Normal) {
    cursorTracking = vimState.cursors[0].start;
    executeMovementCnt = 1;
    return;
  }

  // ノーマルモードから抜けた場合
  if (typeof cursorTracking !== 'undefined' && vimState.currentMode !== Mode.Normal) {
    const cursorNow = vimState.cursors[0].start;
    await optimizeMovement(vimState.document.getText(), cursorTracking, cursorNow);

    cursorTracking = undefined;
    executeMovementCnt = 0;
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

  interface OptOut {
    actions: Array<{
      actionKeys: string[];
      actionName: string;
    }>;
    isOk: boolean;
    errorMessage: string;
  }

  const callWasm = require('./callWasm');
  const optOutStr = await callWasm.callWasm(optIn);
  const optOut = JSON.parse(optOutStr) as OptOut;

  if (!optOut.isOk) {
    console.error(optOut.errorMessage);
    return;
  }

  if (executeMovementCnt <= optOut.actions.length) {
    return;
  }

  vscode.window.showInformationMessage(
    'Movements may be optimized: ' + optOut.actions.map((v) => v.actionKeys.join('')).join(' ')
  );
}
