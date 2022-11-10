import * as fs from 'fs/promises';
export const SINGLE_ACTION_RES_FILE = __dirname + '/SingleAction.txt';
export const DOUBLE_ACTION_RES_FILE = __dirname + '/DoubleAction.txt';
export const TEST_FILE = __dirname + '/test.txt';

export async function logReset() {
  await fs.writeFile(SINGLE_ACTION_RES_FILE, '');
  await fs.writeFile(DOUBLE_ACTION_RES_FILE, '');
}
export async function logA(text: string) {
  await fs.appendFile(SINGLE_ACTION_RES_FILE, text);
  await fs.appendFile(SINGLE_ACTION_RES_FILE, '\n');
}

export async function logB(text: string) {
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
