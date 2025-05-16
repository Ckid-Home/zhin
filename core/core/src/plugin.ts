import { ArgsType, Command, defineCommand } from './command';
import {fileURLToPath} from 'url'
import { EventEmitter } from 'events';
import { Middleware } from './middleware';
import { getCallerStack } from './utils';
import { Adapters, App } from './app';
import { APP_KEY, pluginKey, serviceCallbacksKey, WORK_DIR } from './constans';
import { remove } from '@zhinjs/shared';
import path from 'path';
import { Adapter } from './adapter';
import { getLogger, Logger } from 'log4js';
import { Schema } from './schema';
import { Config } from './config';

export interface Plugin extends Plugin.Options {}
export class Plugin extends EventEmitter {
  public name: string = '';
  private _logger?: Logger;
  disposes: Function[] = [];
  priority: number;
  private [pluginKey] = true;
  get isMounted() {
    return !!this.app;
  }
  get need_services() {
    const result: Set<keyof App.Services> = new Set<keyof App.Services>();
    for (const serviceCallback of this[serviceCallbacksKey]) {
      for (const service of serviceCallback.services) {
        result.add(service);
      }
    }
    return [...result];
  }
  private [serviceCallbacksKey]: Plugin.ServiceCallbackInfo[] = [];
  filePath: string;
  setup: boolean = false;
  public adapters?: string[] = [];
  get status(): Plugin.Status {
    return this.isMounted && !this.app!.config.disable_plugins.includes(this.id) ? 'enabled' : 'disabled';
  }
  static isPlugin(obj: any): obj is Plugin {
    return typeof obj === 'object' && !!obj[pluginKey];
  }
  services: Map<string | symbol, any> = new Map<string | symbol, any>();
  commands: Map<string, Command> = new Map<string, Command>();
  middlewares: Middleware[] = [];
  [APP_KEY]: App | null = null;
  get app() {
    return this[APP_KEY];
  }

  get display_name() {
    return this.name || this.id;
  }

  set display_name(name: string) {
    this.name = name;
  }
  useConfig<T>(configPath: string, schema: Schema<T>): T {
    if (schema.meta.type !== 'object') throw new Error(`config schema root must be type object`);
    const config = new Config<T & object>(configPath, schema.meta.default as any);
    return schema(config.data);
  }
  get statusText() {
    return Plugin.StatusText[this.status];
  }

  get commandList() {
    const commandList = [...this.commands.values()];
    return commandList.reduce((result, command) => {
      result.push(...command.deepChildren);
      return result;
    }, commandList);
  }
  get id() {
    return Plugin.createIdByPath(this.filePath);
  }
  constructor(name?: string);
  constructor(options?: Plugin.Options);
  constructor(param: Plugin.Options | string = {}) {
    super();
    const options: Plugin.Options =
      typeof param === 'string'
        ? {
            name: param,
          }
        : param;
    this.adapters = options.adapters;
    this.priority = options.priority || 1;
    this.desc = options.desc || '';
    const stack = getCallerStack().map(s => s.getFileName());
    const currentIdx = stack.findIndex(s => s === __filename);
    this.filePath = stack.slice(currentIdx).find(s => s !== __filename)!;
    this.name = options.name!;
    this.on('service-register', name => {
      if (!this.need_services.includes(name) || !this.isMounted) return;
      Plugin.runCallbackWithService(this.app!, this);
    });
    return new Proxy(this, {
      get(target: Plugin, key) {
        if (!target.app || Reflect.has(target, key)) return Reflect.get(target, key);
        return Reflect.get(target.app.services, key);
      },
    });
  }
  get logger() {
    const logger = (this._logger ||= getLogger(`[zhin:${this.display_name}]`));
    logger.level = this.app?.config.log_level || 'info';
    return logger;
  }
  set logger(logger: Logger) {
    this._logger = logger;
  }
  waitServices(...services: (keyof App.Services)[] | [...(keyof App.Services)[], callabck: (app: App) => void]) {
    const lastArg = services[services.length - 1];
    const callback: undefined | ((app: App) => void) = typeof lastArg === 'function' ? lastArg : undefined;
    if (callback) services = services.slice(0, -1) as (keyof App.Services)[];
    this[serviceCallbacksKey].push({
      services: services as (keyof App.Services)[],
      is_run: false,
      callback,
    });
    this.mounted(app => {
      Plugin.runCallbackWithService(app, this);
    });
  }
  adapter<T extends Adapters>(name: T): Adapter<T>;
  adapter<T extends Adapters>(adapter: Adapter<T>): this;
  adapter<T extends Adapters>(adapter: Adapter<T> | T) {
    if (Adapter.isAdapter(adapter)) {
      App.adapters.set(adapter.name, adapter);
      return this;
    }
    return App.adapters.get(adapter) as Adapter<T>;
  }

  service<T extends keyof App.Services>(name: T): App.Services[T];
  service<T extends keyof App.Services>(name: T, service: App.Services[T]): this;
  service<T extends keyof App.Services>(name: T, service?: App.Services[T]) {
    if (!service) return this.app?.services[name];
    this.services.set(name, service);
    this.mounted(app => {
      this.logger.info(`service：${name} registered`);
      app.emit('service-register', name, service);
    });
    return this;
  }
  middleware<AD extends Adapters = Adapters>(middleware: Middleware<AD>, before?: boolean) {
    const method: 'push' | 'unshift' = before ? 'unshift' : 'push';
    this.middlewares[method](middleware as Middleware);
    this.disposes.push(() => remove(this.middlewares, middleware));
    return this;
  }

  plugin(name: string) {
    const filePath = path.resolve(this.filePath, name);
    this.app?.once('plugin-mounted', p => {
      this.disposes.push(() => {
        this.app?.unmount(p.id);
      });
    });
    this.app?.mount(filePath);
    return this;
  }
  command<A extends any[] = [], O = {}>(command: Command<A, O>): this;
  command<S extends Command.Declare>(
    decl: S,
    initialValue?: ArgsType<Command.RemoveFirst<S>>,
  ): Command<ArgsType<Command.RemoveFirst<S>>>;
  command<S extends Command.Declare>(decl: S, config?: Command.Config): Command<ArgsType<Command.RemoveFirst<S>>>;
  command<S extends Command.Declare>(
    decl: S,
    initialValue: ArgsType<Command.RemoveFirst<S>>,
    config?: Command.Config,
  ): Command<ArgsType<Command.RemoveFirst<S>>>;
  command<S extends Command.Declare>(
    decl: S | Command,
    ...args: [(ArgsType<S> | Command.Config)?] | [ArgsType<S>, Command.Config?]
  ) {
    if (typeof decl !== 'string') {
      const command = decl;
      this.commands.set(command.name!, command);
      this.emit('command-add', command);
      this.disposes.push(() => {
        this.commands.delete(command.name!);
        this.emit('command-remove', command);
      });
      return this;
    }
    const [nameDecl, ...argsDecl] = decl.split(/\s+/);
    if (!nameDecl) throw new Error('nameDecl不能为空');
    const nameArr = nameDecl.split('.').filter(Boolean);
    if (nameArr.length === 0) throw new Error('command name cannot be empty or have dot character only');
    let parent: Command | undefined;
    for (let i = nameArr.length - 1; i > 0; i--) {
      const parentName = nameArr.slice(0, i).join('.');
      parent = this.findCommand(parentName);
      if (parent) break;
    }
    const command = defineCommand(argsDecl.join(' '), ...(args as any));
    if (parent) {
      command.parent = parent;
      parent.children.push(command as unknown as Command);
    }
    command.name = nameArr.join('.');
    this.commands.set(command.name, command);
    this.emit('command-add', command);
    this.disposes.push(() => {
      this.commands.delete(command.name!);
      this.emit('command-remove', command);
    });
    return command as unknown as Command<ArgsType<Command.RemoveFirst<S>>>;
  }

  /**
   * 查找指定名称的指令
   * @param name 指令名
   */
  findCommand(name: string) {
    return this.commandList.find(command => command.name === name);
  }

  mounted(callback: Plugin.CallBack) {
    const listener = (p: Plugin) => {
      if (p !== this || p.app===null) return;
      callback(p.app!);
      this.off('plugin-mounted', listener);
    };
    this.on('plugin-mounted', listener);
    if (this.isMounted) return callback(this.app!);
  }
  beforeUnmount(callback: Plugin.CallBack) {
    this.on('plugin-beforeUnmount', p => {
      if (p !== this) return;
      callback(this.app!);
    });
  }
}

export interface Plugin extends App.Services {
  on<T extends keyof App.EventMap>(event: T, callback: App.EventMap[T]): this;

  on<S extends string | symbol>(
    event: S & Exclude<string | symbol, keyof App.EventMap>,
    callback: (...args: any[]) => void,
  ): this;

  once<T extends keyof App.EventMap>(event: T, callback: App.EventMap[T]): this;

  once<S extends string | symbol>(
    event: S & Exclude<string | symbol, keyof App.EventMap>,
    callback: (...args: any[]) => void,
  ): this;

  off<T extends keyof App.EventMap>(event: T, callback?: App.EventMap[T]): this;

  off<S extends string | symbol>(
    event: S & Exclude<string | symbol, keyof App.EventMap>,
    callback?: (...args: any[]) => void,
  ): this;

  emit<T extends keyof App.EventMap>(event: T, ...args: Parameters<App.EventMap[T]>): boolean;

  emit<S extends string | symbol>(event: S & Exclude<string | symbol, keyof App.EventMap>, ...args: any[]): boolean;

  addListener<T extends keyof App.EventMap>(event: T, callback: App.EventMap[T]): this;

  addListener<S extends string | symbol>(
    event: S & Exclude<string | symbol, keyof App.EventMap>,
    callback: (...args: any[]) => void,
  ): this;

  addListenerOnce<T extends keyof App.EventMap>(event: T, callback: App.EventMap[T]): this;

  addListenerOnce<S extends string | symbol>(
    event: S & Exclude<string | symbol, keyof App.EventMap>,
    callback: (...args: any[]) => void,
  ): this;

  removeListener<T extends keyof App.EventMap>(event: T, callback?: App.EventMap[T]): this;

  removeListener<S extends string | symbol>(
    event: S & Exclude<string | symbol, keyof App.EventMap>,
    callback?: (...args: any[]) => void,
  ): this;

  removeAllListeners<T extends keyof App.EventMap>(event: T): this;

  removeAllListeners<S extends string | symbol>(event: S & Exclude<string | symbol, keyof App.EventMap>): this;
}

export namespace Plugin {
  export type CallBack = (app: App) => any;

  export interface Options {
    /**
     * 插件名称
     */
    name?: string;
    /**
     * 支持的适配器
     */
    adapters?: string[];
    /**
     * 插件描述
     */
    desc?: string;
    /**
     * 匹配优先级
     */
    priority?: number;
  }

  export type Status = 'enabled' | 'disabled';

  export enum StatusText {
    enabled = '✅',
    disabled = '❌',
  }
  export interface ServiceCallbackInfo {
    services: (keyof App.Services)[];
    is_run: boolean;
    callback?: (app: App) => void;
  }
  export type InstallObject = {
    name?: string;
    install: InstallFn;
  };
  export type InstallFn = (plugin: Plugin) => void;
  export function createIdByPath(filePath: string) {
    return  filePath.replace(path.resolve(WORK_DIR, 'node_modules', 'zhin', 'lib', 'plugins') + path.sep, '')
      .replace(path.resolve(WORK_DIR, 'node_modules') + path.sep, '')
      .replace(path.resolve(WORK_DIR, '..', 'zhin', 'lib', 'plugins') + path.sep, '') // for dev
      .replace(path.resolve(WORK_DIR, '..', 'packages', 'adapters') + path.sep, '@zhinjs/adapter-') // for dev
      .replace(path.resolve(WORK_DIR, '..', 'packages', 'plugins') + path.sep, '@zhinjs/plugin-') // for dev
      .replace(path.resolve(WORK_DIR, '..', 'packages', 'services') + path.sep, '@zhinjs/plugin-') // for dev
      .replace(WORK_DIR + path.sep, '')
      .replace(/([\/\\]+((lib)|(src)))?[\/\\]+index\.[cm]?[tj]?sx?$/, '')
      .replace(/\.[cm]?[tj]?sx?$/, '');
  }
  export function runCallbackWithService(app: App, plugin: Plugin) {
    const serviceCallbacks = plugin[serviceCallbacksKey];
    for (const serviceCallback of serviceCallbacks) {
      const { services, callback, is_run } = serviceCallback;
      if (is_run) continue;
      if (services.every(s => Reflect.has(app.services, s))) {
        callback?.(app);
        serviceCallback.is_run = true;
      }
    }
  }
}

export class PluginMap extends Map<string, Plugin> {
  private get anonymousCount() {
    return [...this.keys()].filter(name => name.startsWith(`anonymous_`)).length;
  }

  getWithPath(filePath: string) {
    const id = Plugin.createIdByPath(filePath);
    if (this.has(id)) return this.get(id);
  }

  get generateId() {
    for (let i = 0; i < this.anonymousCount; i++) {
      if (!this.has(`anonymous_${i}`)) return `anonymous_${i}`;
    }
    return `anonymous_${this.anonymousCount}`;
  }
}
