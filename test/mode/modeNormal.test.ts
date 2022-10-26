import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { newCompare } from '../sameResultTest';
import { Configuration } from '../testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('Mode Normal', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    const configuration = new Configuration();
    configuration.tabstop = 4;
    configuration.expandtab = false;

    await setupWorkspace(configuration);
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  newCompare({
    title: '成功する(dw, dw)',
    start: ['one |two three'],
    keysPressedA: 'dw',
    keysPressedB: 'dw',
  });

  newCompare({
    title: '失敗する(dw, de)',
    start: ['one |two three'],
    keysPressedA: 'dw',
    keysPressedB: 'de',
  });

  newCompare({
    title: '成功する(dw, dW)',
    start: ['one |two three'],
    keysPressedA: 'dw',
    keysPressedB: 'dW',
  });
});
