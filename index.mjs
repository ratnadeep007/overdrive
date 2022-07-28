import { Overdrive } from './build/index.mjs';

const overdrive = new Overdrive();
(async () => {
  await overdrive.start();
})();