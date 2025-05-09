import path from 'path';
import * as fs from 'fs';
export {
  context,
  getAdapter,
  registerAdapter,
  registerMiddleware,
  provide,
  inject,
  getBot,
  sendGroupMessage,
  sendPrivateMessage,
  sendGuildMessage,
  sendDirectMessage,
  onMount,
  onUnmount,
  listen,
  defineMetadata,
  useCommand,
  waitServices,
  logger,
  useConfig,
} from './plugins/setup';
export * from './constants';
import {
  aesDecrypt,
  aesEncrypt,
  createApp,
  formatTime,
  formatSize,
  defineCommand,
  formatDateTime,
  parseFromTemplate,
  getCallerStack,
  loadModule,
  evaluate,
  findLastIndex,
  isMac,
  getDataKeyOfObj,
  getValueOfObj,
  getValueWithRuntime,
  parseObjFromStr,
  setValueToObj,
  stringifyObj,
  isMobile,
  compiler,
  defineConfig,
  execute,
  trimQuote,
  segment,
  isLinux,
  isWin,
  App,
  Adapter,
  ArgsType,
  APP_KEY,
  Command,
  Message,
  Middleware,
  MessageBase,
  ParseArgType,
  OptionValueType,
  PluginMap,
  ParseOptionType,
  Compose,
  WORK_DIR,
  CONFIG_DIR,
  HOME_DIR,
  TEMP_DIR,
  REQUIRED_KEY,
  Plugin,
  NumString,
  LogLevel,
  Logger,
  HelpOptions,
  OptionsType,
  OptionType,
  Element,
  Schema,
  h,
  Fragment,
  renderToString,
  jsx,
  jsxs,
  jsxDEV
} from '@zhinjs/core';
export * from './worker';
export async function initialApp(this: App) {
  const userPluginDir = path.join(WORK_DIR, 'plugins');
  if (!fs.existsSync(userPluginDir)) fs.mkdirSync(userPluginDir);
  this.config.has_init = true;
  this.config.db_driver = 'level';
  this.config.db_init_args = [
    'zhin.db',
    {
      valueEncoding: 'json',
      createIfMissing: true,
    },
  ];
  this.config.plugins.push('setup', 'processAdapter', 'hmr', 'commandParser', 'echo', 'zhinManager');
  this.config.plugin_dirs.push(
    path.relative(WORK_DIR, path.join(__dirname, 'plugins')), // 内置
    path.relative(WORK_DIR, path.join(WORK_DIR, 'node_modules', '@zhinjs')), // 官方
    path.relative(WORK_DIR, userPluginDir), // 用户自定义
    path.relative(WORK_DIR, path.join(WORK_DIR, 'node_modules')), // 社区
  );
  this.config.bots.push({ adapter: 'process', unique_id: 'developer', title: '终端' });
}

import {
  axios,
  Dict,
  Define,
  Merge,
  Awaitable,
  PackageJson,
  isArray,
  isObject,
  isEmpty,
  getReqIp,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  deepMerge,
  deepClone,
  pick,
  omit,
  Mixin,
  is,
  getPackageInfo,
  wrapExport,
  getIpAddress,
  getCaller,
  Promisify,
  deepEqual,
  camelCase,
  paramCase,
  snakeCase,
  camelize,
  hyphenate,
  capitalize,
  trimSlash,
  sanitize,
  toJSON,
  noop,
  Time,
  Random,
  sleep,
  isNullable,
  isBailed,
  remove,
  toArray,
  valueMap,
  defineProperty,
  lock,
  hide,
  escape,
  unescape,
} from '@zhinjs/shared';
export default {
  h,
  Fragment,

}
export {
  aesDecrypt,
  aesEncrypt,
  createApp,
  formatTime,
  formatSize,
  defineCommand,
  formatDateTime,
  parseFromTemplate,
  getCallerStack,
  loadModule,
  evaluate,
  findLastIndex,
  isMac,
  getDataKeyOfObj,
  getValueOfObj,
  getValueWithRuntime,
  parseObjFromStr,
  setValueToObj,
  stringifyObj,
  isMobile,
  compiler,
  defineConfig,
  execute,
  trimQuote,
  segment,
  isLinux,
  isWin,
  App,
  Adapter,
  ArgsType,
  APP_KEY,
  Command,
  Message,
  Middleware,
  MessageBase,
  ParseArgType,
  OptionValueType,
  PluginMap,
  ParseOptionType,
  Compose,
  WORK_DIR,
  CONFIG_DIR,
  HOME_DIR,
  TEMP_DIR,
  REQUIRED_KEY,
  Plugin,
  NumString,
  LogLevel,
  Logger,
  HelpOptions,
  OptionsType,
  OptionType,
  Element,
  Schema,
  axios,
  Dict,
  Define,
  Merge,
  Awaitable,
  PackageJson,
  isArray,
  isObject,
  isEmpty,
  getReqIp,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  deepMerge,
  deepClone,
  pick,
  omit,
  Mixin,
  is,
  getPackageInfo,
  wrapExport,
  getIpAddress,
  getCaller,
  Promisify,
  deepEqual,
  camelCase,
  paramCase,
  snakeCase,
  camelize,
  hyphenate,
  capitalize,
  trimSlash,
  sanitize,
  toJSON,
  noop,
  Time,
  Random,
  sleep,
  isNullable,
  isBailed,
  remove,
  toArray,
  valueMap,
  defineProperty,
  lock,
  hide,
  escape,
  unescape,
  h,
  Fragment,
  renderToString,
  jsx,
  jsxs,
  jsxDEV
};
