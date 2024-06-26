import { createApp } from '@zhinjs/core';
import { initialApp } from '.';
const errorHandler = (e: unknown) => console.error(e);

(async () => {
  let { init } = process.env;
  process.on('unhandledRejection', errorHandler);
  process.on('uncaughtException', errorHandler);
  const app = createApp(process.env.ZHIN_KEY || undefined);
  if (init === '1') {
    await initialApp.apply(app);
  }
  app.start(process.env.mode || 'prod');
})();
