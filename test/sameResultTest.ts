import * as assert from 'assert';
import * as vscode from 'vscode';
import { Range } from 'vscode';

import { ModeHandler } from 'src/mode/modeHandler';
import { Position } from 'vscode';
import { IConfiguration } from '../src/configuration/iconfiguration';
import { Mode } from '../src/mode/mode';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { Register } from '../src/register/register';
import { globalState } from '../src/state/globalState';
import { ExecuteAction, SingleTestResult } from './const';

interface SameResultTestObject {
  config?: Partial<IConfiguration>;
  editorOptions?: vscode.TextEditorOptions;
  start: string[];
  actions: ExecuteAction[];
  endMode?: Mode;
  statusBar?: string;
  jumps?: string[];
  stub?: {
    stubClass: any;
    methodName: string;
    returnValue: any;
  };
}

class TestObjectHelper {
  /**
   * Position that the test says that the cursor starts at.
   */
  startPosition = new Position(0, 0);

  /**
   * Position that the test says that the cursor ends at.
   */
  endPosition = new Position(0, 0);

  public readonly isValid: boolean;
  private readonly testObject: SameResultTestObject;

  constructor(testObject: SameResultTestObject) {
    this.testObject = testObject;

    this.isValid = this.setStartCursorPosition(testObject.start);
  }

  private setStartCursorPosition(lines: string[]): boolean {
    const result = this.getCursorPosition(lines);
    this.startPosition = result.position;
    return result.success;
  }

  private getCursorPosition(lines: string[]): { success: boolean; position: Position } {
    const ret = { success: false, position: new Position(0, 0) };
    for (let i = 0; i < lines.length; i++) {
      const columnIdx = lines[i].indexOf('|');
      if (columnIdx >= 0) {
        ret.position = new Position(i, columnIdx);
        ret.success = true;
      }
    }

    return ret;
  }
}
/**
 * Tokenize a string like "abc<Esc>d<C-c>" into ["a", "b", "c", "<Esc>", "d", "<C-c>"]
 */
function tokenizeKeySequence(sequence: string): string[] {
  let isBracketedKey = false;
  let key = '';
  const result: string[] = [];

  // no close bracket, probably trying to do a left shift, take literal
  // char sequence
  function rawTokenize(characters: string): void {
    for (const char of characters) {
      result.push(char);
    }
  }

  for (const char of sequence) {
    key += char;

    if (char === '<') {
      if (isBracketedKey) {
        rawTokenize(key.slice(0, key.length - 1));
        key = '<';
      } else {
        isBracketedKey = true;
      }
    }

    if (char === '>') {
      isBracketedKey = false;
    }

    if (isBracketedKey) {
      continue;
    }

    result.push(key);
    key = '';
  }

  if (isBracketedKey) {
    rawTokenize(key);
  }

  return result;
}

interface MonitoredResult {
  text: string;
  position: Position;
  mode: string;
}

// 操作同一性テストのためのエラー
export class SameResultTestError extends Error {}

// 連続して使用できない操作の場合のエラー(d -> y など)
export class NotCompatibleError extends SameResultTestError {
  override message = 'Not compatible action';
}

// エディターが開いていない場合のエラー(:q の後のテストなど)
export class EditorNotActiveError extends SameResultTestError {
  override message = 'Editor not active';
}

// アクションを実行しても変わらない場合のエラー
export class NotModifiedError extends SameResultTestError {
  override message = 'Not modified';
}

// iw, a) など 最初に実行してはいけないものを実行した場合のエラー
export class NotAllowFirstAction extends SameResultTestError {
  override message = 'Not allow to run as first action';
}

// アクションの途中で終了してしまった場合のエラー
export class NotActionComplete extends SameResultTestError {
  override message = 'Not action complete';
}

function isSameResult(a: MonitoredResult, b: MonitoredResult) {
  return (
    a.text === b.text &&
    a.mode === b.mode &&
    a.position.line === b.position.line &&
    a.position.character === b.position.character
  );
}

function getResultObject(modeHandler: ModeHandler): MonitoredResult {
  const text = vscode.window.activeTextEditor?.document.getText() || '';
  const position = modeHandler.vimState.editor.selection.start;
  const mode = Mode[modeHandler.currentMode].toUpperCase();
  return { text, position, mode };
}

export async function executeTest(testObj: SameResultTestObject): Promise<SingleTestResult> {
  const editor = vscode.window.activeTextEditor;
  assert(editor, new EditorNotActiveError('Expected an active editor'));

  const helper = new TestObjectHelper(testObj);
  assert(helper.isValid, "Missing '|' in test object.");

  if (testObj.editorOptions) {
    editor.options = testObj.editorOptions;
  }

  // Initialize the editor with the starting text and cursor selection
  await editor.edit((builder) => {
    builder.replace(
      new Range(new Position(0, 0), new Position(1e5, 0)),
      testObj.start.join('\n').replace('|', '')
    );
  });
  // TODO 様子見
  // await editor.document.save();
  editor.selections = [new vscode.Selection(helper.startPosition, helper.startPosition)];

  // Generate a brand new ModeHandler for this editor
  ModeHandlerMap.clear();
  const [modeHandler, _] = await ModeHandlerMap.getOrCreate(editor);

  const jumpTracker = globalState.jumpTracker;
  jumpTracker.clearJumps();

  Register.clearAllRegisters();

  let result = getResultObject(modeHandler);
  const initialResult = { ...result };
  for (let i = 0; i < testObj.actions.length; i++) {
    const action = testObj.actions[i];

    if (modeHandler.vimState.recordedState.actionsRun.length === 0 && action.isBanFirstAction) {
      throw new NotAllowFirstAction();
    }

    if (action.action.doesActionApply(modeHandler.vimState, action.actionKeys)) {
      // from handleKeyEvent
      modeHandler.vimState.cursorsInitialState = modeHandler.vimState.cursors;

      await modeHandler.myHandleKeyAsAnAction(action.action, action.actionKeys);
    } else if (
      action.action.couldActionApply(
        modeHandler.vimState,
        modeHandler.vimState.recordedState.actionKeys
      )
    ) {
      // do thing
    } else {
      throw new NotCompatibleError();
    }

    const nowResult = getResultObject(modeHandler);
    // アクションの前と比べて、何ら変更がなかったらエラーにする。
    if (
      modeHandler.vimState.recordedState.actionsRun.length === 0 &&
      isSameResult(nowResult, result)
    ) {
      throw new NotModifiedError();
    }

    result = nowResult;
  }

  // アクションが完了していない場合
  // TODO InsertのときはactionsRun = ["I"]になる。その他の場合はどうなる？
  if (
    modeHandler.currentMode === Mode.Normal &&
    modeHandler.vimState.recordedState.actionsRun.length !== 0
  ) {
    throw new NotActionComplete();
  }

  // 最初と同じになってしまった場合
  if (isSameResult(result, initialResult)) {
    throw new NotModifiedError();
  }

  return {
    ...result,
  };
}
