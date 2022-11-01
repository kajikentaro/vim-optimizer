import assert = require('assert');
import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
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
});
