import { Globals } from '../src/globals';
import preprocess0 from './preprocess0';
import { preprocess } from './preprocess1';
import preprocess2 from './preprocess2';
import { Configuration } from './testConfiguration';

Globals.isTesting = true;
Globals.mockConfiguration = new Configuration();

export async function run(): Promise<void> {
  const allActions = await preprocess0();
  await preprocess(allActions);
  await preprocess2();

  console.log('done preprocessing');
}
