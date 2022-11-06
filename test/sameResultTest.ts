import * as assert from 'assert';
import * as vscode from 'vscode';
import { Range } from 'vscode';
import { BaseAction, KeypressState } from '../src/actions/base';

import { Position } from 'vscode';
import { IConfiguration } from '../src/configuration/iconfiguration';
import { Mode } from '../src/mode/mode';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { Register } from '../src/register/register';
import { globalState } from '../src/state/globalState';
import { Configuration } from './testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

function getNiceStack(stack: string | undefined): string {
  return stack ? stack.split('\n').splice(2, 1).join('\n') : 'no stack available :(';
}

interface SameReulstTestObject {
  title: string;
  config?: Partial<IConfiguration>;
  editorOptions?: vscode.TextEditorOptions;
  start: string[];
  keysPressedA: string;
  keysPressedB: string;
  endMode?: Mode;
  statusBar?: string;
  jumps?: string[];
  stub?: {
    stubClass: any;
    methodName: string;
    returnValue: any;
  };
}

interface SameReulstTestObjectA {
  title: string;
  config?: Partial<IConfiguration>;
  editorOptions?: vscode.TextEditorOptions;
  start: string[];
  actions: BaseAction[] | KeypressState[];
  actionKeys: string[][];
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
  private readonly testObject: SameReulstTestObjectA;

  constructor(testObject: SameReulstTestObjectA) {
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

export interface ExecuteResult {
  text: string;
  position: Position;
  mode: string;
}

export class NotCompatibleError extends Error {}
export class EditorNotActiveError extends Error {}

export async function executeTestA(testObj: SameReulstTestObjectA): Promise<ExecuteResult> {
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
  await editor.document.save();
  editor.selections = [new vscode.Selection(helper.startPosition, helper.startPosition)];

  // Generate a brand new ModeHandler for this editor
  ModeHandlerMap.clear();
  const [modeHandler, _] = await ModeHandlerMap.getOrCreate(editor);

  const jumpTracker = globalState.jumpTracker;
  jumpTracker.clearJumps();

  Register.clearAllRegisters();

  for (let i = 0; i < testObj.actions.length; i++) {
    const action = testObj.actions[i];
    const actionKey = testObj.actionKeys[i];
    if (!(action instanceof BaseAction)) {
      continue;
    }
    if (action.doesActionApply(modeHandler.vimState, actionKey)) {
      modeHandler.vimState.cursorsInitialState = modeHandler.vimState.cursors;
      await modeHandler.myHandleKeyAsAnAction(action);
      continue;
    }
    if (
      action.couldActionApply(modeHandler.vimState, modeHandler.vimState.recordedState.actionKeys)
    ) {
      continue;
    }
    throw new NotCompatibleError();
  }

  // Check given end output is correct
  const resultTextA = vscode.window.activeTextEditor?.document.getText();

  // Check final cursor position
  const actualPosition = modeHandler.vimState.editor.selection.start;

  const actualModeA = Mode[modeHandler.currentMode].toUpperCase();
  return {
    text: resultTextA || '',
    position: actualPosition,
    mode: actualModeA,
  };
}

async function clearAndSetupEditor() {
  await cleanUpWorkspace();

  // setup
  const configuration = new Configuration();
  configuration.tabstop = 4;
  configuration.expandtab = false;

  await setupWorkspace(configuration);
}
