import * as assert from 'assert';
import * as vscode from 'vscode';
import { Range } from 'vscode';
import { getAllActions } from '../src/actions/base';

import { Position } from 'vscode';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { ExecuteAction, readUnreachableActionCache, writeUnreachableActionCache } from './const';

class Node {
  key: string;
  nextNode: Map<string, Node>;

  // 木を作った後に使用する値
  actionIdx: number[];

  constructor(key: string) {
    this.key = key;
    this.nextNode = new Map<string, Node>();
    this.actionIdx = [];
  }

  getNext(key: string): Node {
    const nextNode = this.nextNode.get(key);
    if (typeof nextNode !== 'undefined') {
      return nextNode;
    }
    const newNode = new Node(key);
    this.nextNode.set(key, newNode);
    return newNode;
  }
}

function getFilterdAllActions(): ExecuteAction[] {
  const allActions = getAllActions();

  const simpleActions: ExecuteAction[] = [];
  for (const action of allActions) {
    // 2Dと3Dの物があるので、3Dに統一する
    let checkingKeys: string[][];
    if (Array.isArray(action.keys[0])) {
      checkingKeys = action.keys as string[][];
    } else {
      checkingKeys = [action.keys as string[]];
    }

    // キーリストのどれか一つが単純だった場合はsimpleActionsに追加
    for (const keys of checkingKeys) {
      let isOk = true;
      for (const key of keys) {
        // 単純なキー入力のみの場合はOK
        if (key.length >= 2 || key === 'q') {
          isOk = false;
          break;
        }
      }
      if (isOk) {
        // どれか一つが単純だった場合に追加して終了
        simpleActions.push({
          action,
          keys,
          isBanFirstAction: false,
          skipDoubleAction: false,
        });
        break;
      }
    }
  }
  return simpleActions;
}

export default async function preprocess0() {
  let pureActions = getFilterdAllActions();
  const attrActions = await createUnreachableActionTree(pureActions);
  return attrActions;
}

// aw, i)などの範囲指定コマンドは、オペレーターがない状態で初回実行できない。
// 初回実行を想定していないアクションを抽出するため、
// ノードがアクションキーとなる木を作り、「doesActionApplyがtrueとなるアクションの子」をメモしておくことでこれを防ぐ
async function createUnreachableActionTree(allActions: ExecuteAction[]) {
  // キャッシュがある場合はそれを使う
  const cache = await readUnreachableActionCache(allActions);
  if (cache) {
    return cache;
  }

  // 木を作る
  const firstNode = new Node('FIRST');
  for (let i = 0; i < allActions.length; i++) {
    const actionKey = allActions[i].keys;
    let now = firstNode.getNext(actionKey[0]);
    for (let j = 0; j < actionKey.length; j++) {
      if (j === 0) continue;
      now = now.getNext(actionKey[j]);
    }
    now.actionIdx.push(i);
  }

  const dfs = async (now: Node, didAction: boolean) => {
    // アクションがすでに実行されていた場合は結果の配列に追加
    if (didAction) {
      for (const idx of now.actionIdx) {
        allActions[idx].isBanFirstAction = true;
      }
    }

    // このノードでアクションが実行されるか調べる
    let doAction = didAction;
    for (const idx of now.actionIdx) {
      doAction = doAction || (await examineDoesActionApply(allActions[idx]));
    }

    // 再帰
    for (const [_, nextNode] of now.nextNode) {
      await dfs(nextNode, doAction);
    }
  };

  await dfs(firstNode, false);
  writeUnreachableActionCache(allActions);
  return allActions;
}

async function examineDoesActionApply(action: ExecuteAction): Promise<boolean> {
  const editor = vscode.window.activeTextEditor;
  assert(editor, new Error('Expected an active editor'));

  // Initialize the editor with the starting text and cursor selection
  await editor.edit((builder) => {
    builder.replace(new Range(new Position(0, 0), new Position(1e5, 0)), 'test');
  });
  await editor.document.save();
  editor.selections = [new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0))];

  ModeHandlerMap.clear();
  const [modeHandler, _] = await ModeHandlerMap.getOrCreate(editor);

  if (action.action.doesActionApply(modeHandler.vimState, action.keys)) {
    return true;
  }
  return false;
}
