import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { WORK_DIR } from './constans';
import { App } from './app';
export class Config {
  public static exts: string[] = ['.json', '.yaml', '.yml'];
  #filename: string = '';
  #type: Config.Type = Config.Type.YAML;
  #saving: boolean = false;
  #data: App.Config;
  get #dir() {
    return path.dirname(this.#filename);
  }
  constructor(name: string, defaultValue?: App.Config) {
    try {
      this.#filename = this.#resolveByName(name);
    } catch (e) {
      if (!defaultValue) throw e;
      const ext = path.extname(name);
      if (!Config.exts.includes(ext)) this.#filename = path.join(WORK_DIR, `${name}${this.#resolveExt()}`);
      this.#saveConfig(defaultValue);
    }
    this.#data = this.#loadConfig();
    const watcher = fs.watch(this.#filename, 'buffer', () => {
      if (process.env.init !== '1') {
        console.log(`config changed, restarting...`);
        watcher.close();
        process.exit(51);
      }
    });
    return new Proxy<App.Config>(this.#data, {
      get: (target, p, receiver) => {
        if (Reflect.has(this, p)) return Reflect.get(this, p, receiver);
        return this.#proxied(target, p, receiver);
      },
      set: (target, p, value, receiver) => {
        if (Reflect.has(this, p)) return Reflect.set(this, p, value, receiver);
        const result = Reflect.set(target, p, receiver);
        this.#saveConfig();
        return result;
      },
      deleteProperty: (target, p) => {
        if (Reflect.has(this, p)) return Reflect.deleteProperty(this, p);
        const result = Reflect.deleteProperty(target, p);
        this.#saveConfig();
        return result;
      },
    }) as unknown as Config;
  }
  #resolveByName(name: string): string {
    if (!Config.exts.includes(path.extname(name))) {
      for (const ext of Config.exts) {
        try {
          return this.#resolveByName(`${name}${ext}`);
        } catch {}
      }
      throw new Error(`未找到配置文件${name}`);
    }
    name = path.resolve(WORK_DIR, name);
    if (!fs.existsSync(name)) {
      throw new Error(`未找到配置文件${name}`);
    }
    const ext = path.extname(name);
    this.#type = ['.yaml', '.yml'].includes(ext) ? Config.Type.YAML : Config.Type.JSON;
    return name;
  }
  #resolveExt() {
    switch (this.#type) {
      case Config.Type.JSON:
        return '.json';
      case Config.Type.YAML:
        return '.yml';
      default:
        throw new Error(`不支持的配置文件类型${this.#type}`);
    }
  }
  #loadConfig() {
    const content = fs.readFileSync(this.#filename, 'utf8');
    switch (this.#type) {
      case Config.Type.JSON:
        return JSON.parse(content);
      case Config.Type.YAML:
        return yaml.parse(content);
      default:
        throw new Error(`不支持的配置文件类型${this.#type}`);
    }
  }
  #saveConfig(data: App.Config = this.#data) {
    switch (this.#type) {
      case Config.Type.JSON:
        return fs.writeFileSync(this.#filename, JSON.stringify(data, null, 2));
      case Config.Type.YAML:
        return fs.writeFileSync(this.#filename, yaml.stringify(data));
      default:
        throw new Error(`不支持的配置文件类型${this.#type}`);
    }
  }
  #proxied<T extends object, R = any>(obj: T, p: string | symbol, receiver: any): R {
    const result = Reflect.get(obj, p, receiver);
    if (!result || typeof result !== 'object') return result as R;
    return new Proxy(result, {
      get: (target, p, receiver) => {
        const result = Reflect.get(target, p, receiver);
        if (typeof result !== 'object') return result;
        return this.#proxied(target, p, receiver);
      },
      set: (target, p, value, receiver) => {
        const result = Reflect.set(target, p, value, receiver);
        this.#saveConfig();
        return result;
      },
      deleteProperty: (target, p) => {
        const result = Reflect.deleteProperty(target, p);
        this.#saveConfig();
        return result;
      },
    }) as R;
  }
}
export namespace Config {
  export enum Type {
    JSON = 'json',
    YAML = 'yaml',
  }
}
export interface Config extends App.Config {}
