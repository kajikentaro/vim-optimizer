import assert = require('assert');
import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { result1, result2 } from '../preprocess';
import { Configuration } from '../testConfiguration';
import { setupWorkspace } from './../testUtils';

suite('Mode Normal', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    const configuration = new Configuration();
    configuration.tabstop = 4;
    configuration.expandtab = false;

    await setupWorkspace(configuration);
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  const log = async (text: string) => {
    const fs = require('fs').promises;
    await fs.appendFile('C:\\Users\\aaa\\Downloads\\hoge-log.txt', text);
  };

  for (const resultA of result1) {
    for (const resultB of result2) {
      test('hoge', async () => {
        assert.strictEqual(resultA.text, resultB.text, '文字の結果が一致しません');

        // カーソルのポジションチェック
        assert.deepStrictEqual(
          { line: resultA.position.line, character: resultA.position.character },
          { line: resultB.position.line, character: resultB.position.character },
          'カーソルの場所が一致しません'
        );

        assert.strictEqual(resultA.mode, resultB.mode, 'モードが一致しません');
      });
    }
  }
});
