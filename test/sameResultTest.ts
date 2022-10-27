import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { Position } from 'vscode';
import { IConfiguration } from '../src/configuration/iconfiguration';
import { Globals } from '../src/globals';
import { Mode } from '../src/mode/mode';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { Register } from '../src/register/register';
import { globalState } from '../src/state/globalState';
import { Configuration } from './testConfiguration';
import { cleanUpWorkspace, reloadConfiguration, setupWorkspace } from './testUtils';

function getNiceStack(stack: string | undefined): string {
  return stack ? stack.split('\n').splice(2, 1).join('\n') : 'no stack available :(';
}

export function newCompare(testObj: SameReulstTestObject) {
  const stack = getNiceStack(new Error().stack);

  test(testObj.title, async () => {
    const prevConfig = { ...Globals.mockConfiguration };
    try {
      if (testObj.config) {
        for (const key in testObj.config) {
          if (testObj.config.hasOwnProperty(key)) {
            const value = testObj.config[key];
            Globals.mockConfiguration[key] = value;
          }
        }
        await reloadConfiguration();
      }
      await testIt(testObj);
    } catch (reason) {
      reason.stack = stack;
      throw reason;
    } finally {
      if (testObj.config) {
        Globals.mockConfiguration = prevConfig;
        await reloadConfiguration();
      }
    }
  });
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
  keysPressed: string;
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
  keys: string;
  text: string;
  position: Position;
  mode: string;
}

export async function executeTestA(testObj: SameReulstTestObjectA): Promise<ExecuteResult> {
  const editor = vscode.window.activeTextEditor;
  assert(editor, 'Expected an active editor');

  const helper = new TestObjectHelper(testObj);
  assert(helper.isValid, "Missing '|' in test object.");

  if (testObj.editorOptions) {
    editor.options = testObj.editorOptions;
  }

  // Initialize the editor with the starting text and cursor selection
  await editor.edit((builder) => {
    builder.insert(new Position(0, 0), testObj.start.join('\n').replace('|', ''));
  });
  await editor.document.save();
  editor.selections = [new vscode.Selection(helper.startPosition, helper.startPosition)];

  // Generate a brand new ModeHandler for this editor
  ModeHandlerMap.clear();
  const [modeHandler, _] = await ModeHandlerMap.getOrCreate(editor);

  let keysPressedA = testObj.keysPressed;
  if (process.platform === 'win32') {
    keysPressedA = keysPressedA.replace(/\\n/g, '\\r\\n');
  }

  const jumpTracker = globalState.jumpTracker;
  jumpTracker.clearJumps();

  Register.clearAllRegisters();

  if (testObj.stub) {
    const confirmStub = sinon
      .stub(testObj.stub.stubClass.prototype, testObj.stub.methodName)
      .resolves(testObj.stub.returnValue);
    await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(keysPressedA));
    confirmStub.restore();
  } else {
    // Assumes key presses are single characters for now
    await modeHandler.handleMultipleKeyEvents(tokenizeKeySequence(keysPressedA));
  }

  // Check given end output is correct
  const resultTextA = vscode.window.activeTextEditor?.document.getText();

  // Check final cursor position
  const actualPosition = modeHandler.vimState.editor.selection.start;

  const actualModeA = Mode[modeHandler.currentMode].toUpperCase();
  return {
    keys: testObj.keysPressed,
    text: resultTextA || '',
    position: actualPosition,
    mode: actualModeA,
  };
}

async function testIt(testObj: SameReulstTestObject) {
  const testObjA: SameReulstTestObjectA = { ...testObj, keysPressed: testObj.keysPressedA };
  const resultA = await executeTestA(testObjA);

  // リセットする
  await clearAndSetupEditor();

  const testObjB: SameReulstTestObjectA = { ...testObj, keysPressed: testObj.keysPressedB };
  const resultB = await executeTestA(testObjB);

  assert.strictEqual(resultA[0], resultB[0], '文字の結果が一致しません');

  // カーソルのポジションチェック
  assert.deepStrictEqual(
    { line: resultA[1].line, character: resultA[1].character },
    { line: resultB[1].line, character: resultB[1].character },
    'カーソルの場所が一致しません'
  );

  assert.strictEqual(resultA[2], resultB[2], 'モードが一致しません');
}

async function clearAndSetupEditor() {
  await cleanUpWorkspace();

  // setup
  const configuration = new Configuration();
  configuration.tabstop = 4;
  configuration.expandtab = false;

  await setupWorkspace(configuration);
}
