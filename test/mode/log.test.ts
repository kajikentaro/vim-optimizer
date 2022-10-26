import { getAndUpdateModeHandler } from '../../extension';
import { getAllActions } from '../../src/actions/base';
import { ModeHandler } from '../../src/mode/modeHandler';
import { Configuration } from '../testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('Mode Normal', () => {
  return;
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

  teardown(cleanUpWorkspace);
  test('Write down all actions', async () => {
    const allActions = getAllActions();

    const simpleActions = [];
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
          if (key.length >= 2) {
            isOk = false;
            break;
          }
        }
        if (isOk) {
          // どれか一つが単純だった場合に追加して終了
          simpleActions.push(keys);
          break;
        }
      }
    }

    const data = JSON.stringify(simpleActions);
    const fs = require('fs').promises;
    await fs.writeFile('C:\\Users\\aaa\\Downloads\\hoge.json', data);
  });
});
