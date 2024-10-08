// 深合并
import { Dict } from './types';
import * as path from 'path';
import * as fs from 'fs';
import { networkInterfaces } from 'os';
import { IncomingMessage } from 'http';
export const isArray = Array.isArray;
export const isObject = <T = never>(obj: T) => obj && typeof obj === 'object' && !isArray(obj);
export const isEmpty = <T = never>(obj: T) => {
  if (isArray(obj)) return obj.length === 0;
  if (!obj || typeof obj !== 'object') return true;
  if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
  return Object.keys(obj).length === 0;
};
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Uint8Array(256);

for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}
export function getReqIp(req: IncomingMessage) {
  return (
    req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
    req.socket.remoteAddress
  );
}
export function arrayBufferToBase64(arrayBuffer: ArrayBuffer, mediaType: string = ''): string {
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.length;

  let base64 = mediaType ? 'data:' + mediaType + ';base64,' : '';

  for (let i = 0; i < len; i += 3) {
    base64 += chars[bytes[i] >> 2];
    base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    base64 += chars[bytes[i + 2] & 63];
  }

  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + '=';
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + '==';
  }

  return base64;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  base64 = base64.substring(base64.indexOf(',') + 1);

  const len = base64.length;
  let bufferLength = len * 0.75;
  let p = 0;
  let encoded1;
  let encoded2;
  let encoded3;
  let encoded4;

  if (base64[len - 1] === '=') {
    bufferLength--;

    if (base64[len - 2] === '=') {
      bufferLength--;
    }
  }

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);

  for (let i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arrayBuffer;
}

export function deepMerge<T>(base: T, ...from: T[]) {
  if (base === null || base === undefined) base = from.shift()!;
  if (from.length === 0) {
    return base;
  }
  if (typeof base !== 'object') {
    return base;
  }
  if (!base) return base;
  if (Array.isArray(base)) {
    return Array.from(new Set(base.concat(...from)));
  }
  for (const item of from) {
    for (const key in item) {
      if (base.hasOwnProperty(key)) {
        if (typeof base[key] === 'object') {
          base[key] = deepMerge(base[key], item[key]) as any;
        } else {
          base[key] = item[key] as any;
        }
      } else {
        base[key] = item[key] as any;
      }
    }
  }
  return base;
}

// 深拷贝
export function deepClone<T extends object>(obj: T, cache = new WeakMap()): T {
  if (obj === null) return obj;
  if (obj instanceof Date) return new Date(obj) as T;
  if (obj instanceof RegExp) return new RegExp(obj) as T;
  if (typeof obj !== 'object') return obj;
  if (cache.get(obj)) return cache.get(obj);
  //判断拷贝的obj是对象还是数组
  if (Array.isArray(obj)) return obj.map(item => deepClone(item, cache)) as T;
  const objClone: Dict = {};
  cache.set(obj, objClone);
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (obj[key] && typeof obj[key] === 'object') {
        objClone[key] = deepClone(obj[key], cache);
      } else {
        objClone[key] = obj[key];
      }
    }
  }
  return objClone as T;
}

export function pick<T extends object, K extends keyof T>(source: T, keys?: Iterable<K>, forced?: boolean) {
  if (!keys) return { ...source };
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (forced || key in source) result[key] = source[key];
  }
  return result;
}

export function omit<T, K extends keyof T>(source: T, keys?: Iterable<K>) {
  if (!keys) return { ...source };
  const result = { ...source } as Omit<T, K>;
  for (const key of keys) {
    Reflect.deleteProperty(result, key);
  }
  return result;
}

type MergeType<B = {}, N = {}> = {
  [P in keyof B | keyof N]: P extends keyof N ? N[P] : P extends keyof B ? B[P] : unknown;
};
type MergedClass<T extends new (...args: any[]) => any, O extends new (...args: any[]) => any> = T extends new (
  ...args: infer A
) => infer L
  ? O extends new (...args: any[]) => infer R
    ? new (...args: [...A, ...any[]]) => MergeType<L, R>
    : new (...args: any[]) => L
  : T;
type MergedManyClass<T extends new (...args: any[]) => any, O extends any[]> = O extends [infer L, ...infer R]
  ? L extends new (...args: any[]) => any
    ? MergedManyClass<MergedClass<T, L>, R>
    : MergedManyClass<T, R>
  : T;
export function Mixin<T extends new (...args: any[]) => any, O extends (new (...args: any[]) => any)[]>(
  base: T,
  ...classes: O
): MergedManyClass<T, O> {
  if (!classes.length) return base as MergedManyClass<T, O>;
  function copyProperties<T extends object, S extends object>(target: T, source: S, skipName = false) {
    for (let key of Reflect.ownKeys(source)) {
      if (key !== 'constructor' && key !== 'prototype') {
        if (skipName && key == 'name') continue;
        let desc = Object.getOwnPropertyDescriptor(source, key);
        Object.defineProperty(target, key, desc!);
      }
    }
  }
  class Mix {
    constructor(...args: any[]) {
      for (let _class of [base, ...classes]) {
        // this 指向子类Benz实例
        copyProperties(this, new _class(...args)); // 拷贝实例属性
      }
    }
  }

  for (let mixin of [base, ...classes]) {
    copyProperties(Mix, mixin, true); // 拷贝静态属性
    copyProperties(Mix.prototype, mixin.prototype); // 拷贝原型属性
  }
  return Mix as MergedManyClass<T, O>;
}
export function is<K extends keyof typeof globalThis>(
  type: K,
  value: any,
): value is InstanceType<(typeof globalThis)[K]> {
  return (
    (type in globalThis && value instanceof (globalThis[type] as any)) ||
    Object.prototype.toString.call(value).slice(8, -1) === type
  );
}
export function getPackageInfo(filepath: string) {
  const isTs = filepath.endsWith('.ts');
  const filename = filepath.split(path.sep).reverse()[0];
  const isMain = /index\.(t|j)s$/.test(filename);
  let dir = path.dirname(filepath);
  if (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  if (!fs.existsSync(path.join(dir, 'package.json'))) return null;
  const packageJson = require(path.join(dir, 'package.json'));
  if (filepath === path.resolve(dir, packageJson.main || `index.${isTs ? 'ts' : 'js'}`))
    return { ...packageJson, fullName: packageJson.name };
  if (isMain && packageJson.main && /.+index\.(t|j)s$/.test(packageJson.main))
    return { ...packageJson, fullName: packageJson.name };
  return null;
}
export const wrapExport = (filePath: string) => {
  const result = require(filePath);
  if (result.default) {
    const { default: main, ...other } = result;
    return Object.assign(main, other);
  }
  return result;
};
export function getIpAddress() {
  const interfaces = networkInterfaces();
  const ips: string[] = [];
  for (let dev in interfaces) {
    for (let j = 0; j < interfaces[dev]!.length; j++) {
      if (interfaces[dev]![j].family === 'IPv4') {
        ips.push(interfaces[dev]![j].address);
      }
    }
  }
  if (!ips.length) ips.push('127.0.0.1');
  return ips;
}
export function getCaller() {
  const origPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = function (_, stack) {
    return stack;
  };
  const err = new Error();
  const stack: NodeJS.CallSite[] = err.stack as unknown as NodeJS.CallSite[];
  Error.prepareStackTrace = origPrepareStackTrace;
  stack.shift();
  stack.shift();
  return stack.shift();
}
export type Promisify<T> = T extends Promise<infer R> ? Promise<R> : Promise<T>;
export function deepEqual<T = object>(a: Partial<T>, b: Partial<T>): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (!a || !b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  } else if (Array.isArray(b)) {
    return false;
  }
  return Object.keys({ ...a, ...b }).every(key => deepEqual(a[key as keyof T]!, b[key as keyof T]!));
}
function deepen(modifyString: (source: string) => string) {
  function modifyObject<T extends unknown>(source: T): T {
    if (typeof source !== 'object' || !source) return source;
    if (Array.isArray(source)) return source.map(modifyObject) as any;
    const result = {} as any;
    for (const key in source) {
      result[modifyString(key)] = modifyObject(source[key]);
    }
    return result as T;
  }

  return function <T>(source: T): T {
    if (typeof source === 'string') {
      return modifyString(source) as any;
    } else {
      return modifyObject(source);
    }
  };
}

export const camelCase = deepen(source => source.replace(/[_-][a-z]/g, str => str.slice(1).toUpperCase()));
export const paramCase = deepen(source =>
  source.replace(/_/g, '-').replace(/(?<!^)[A-Z]/g, str => '-' + str.toLowerCase()),
);
export const snakeCase = deepen(source =>
  source.replace(/-/g, '_').replace(/(?<!^)[A-Z]/g, str => '_' + str.toLowerCase()),
);

export const camelize = camelCase;
export const hyphenate = paramCase;

export function capitalize(source: string) {
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export function trimSlash(source: string) {
  return source.replace(/\/$/, '');
}

export function sanitize(source: string) {
  if (!source.startsWith('/')) source = '/' + source;
  return trimSlash(source);
}

export function toJSON<T extends object>(cls: T): Dict {
  function getProperty<T extends object>(new_obj: T): string[] {
    const newVal = Reflect.get(obj, '__proto__') as object;
    if (newVal === null) {
      //说明该对象已经是最顶层的对象
      return [];
    }
    return [...Object.getOwnPropertyNames(new_obj), ...getProperty(newVal)];
  }

  const { info = {}, ...obj } = Object.fromEntries(
    getProperty(cls)
      .filter(key => {
        return typeof cls[key as keyof T] !== 'function' && !key.startsWith('_') && !['c', 'client'].includes(key);
      })
      .map(key => {
        return [key, cls[key as keyof T]];
      }),
  );
  return { ...obj, ...info };
}

function deepAssign(head: any, base: any): any {
  Object.entries(base).forEach(([key, value]) => {
    if (typeof value === 'object' && typeof head[key] === 'object') {
      head[key] = deepAssign(head[key], value);
    } else {
      head[key] = base[key];
    }
  });
  return head;
}

export function noop() {}

export namespace Time {
  export const millisecond = 1;
  export const second = 1000;
  export const minute = second * 60;
  export const hour = minute * 60;
  export const day = hour * 24;
  export const week = day * 7;

  let timezoneOffset = new Date().getTimezoneOffset();

  export function setTimezoneOffset(offset: number) {
    timezoneOffset = offset;
  }

  export function getTimezoneOffset() {
    return timezoneOffset;
  }

  export function getDateNumber(date: number | Date = new Date(), offset?: number) {
    if (typeof date === 'number') date = new Date(date);
    if (offset === undefined) offset = timezoneOffset;
    return Math.floor((date.valueOf() / minute - offset) / 1440);
  }

  export function fromDateNumber(value: number, offset?: number) {
    const date = new Date(value * day);
    if (offset === undefined) offset = timezoneOffset;
    return new Date(+date + offset * minute);
  }

  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(
    `^${['w(?:eek(?:s)?)?', 'd(?:ay(?:s)?)?', 'h(?:our(?:s)?)?', 'm(?:in(?:ute)?(?:s)?)?', 's(?:ec(?:ond)?(?:s)?)?']
      .map(unit => `(${numeric}${unit})?`)
      .join('')}$`,
  );

  export function parseTime(source: string) {
    const capture = timeRegExp.exec(source);
    if (!capture) return 0;
    return (
      (parseFloat(capture[1]) * week || 0) +
      (parseFloat(capture[2]) * day || 0) +
      (parseFloat(capture[3]) * hour || 0) +
      (parseFloat(capture[4]) * minute || 0) +
      (parseFloat(capture[5]) * second || 0)
    );
  }

  export function parseDate(date: string) {
    const parsed = parseTime(date);
    if (parsed) {
      date = (Date.now() + parsed) as any;
    } else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
      date = `${new Date().toLocaleDateString()}-${date}`;
    } else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
      date = `${new Date().getFullYear()}-${date}`;
    }
    return date ? new Date(date) : new Date();
  }

  export function formatTimeShort(ms: number) {
    const abs = Math.abs(ms);
    if (abs >= day - hour / 2) {
      return Math.round(ms / day) + 'd';
    } else if (abs >= hour - minute / 2) {
      return Math.round(ms / hour) + 'h';
    } else if (abs >= minute - second / 2) {
      return Math.round(ms / minute) + 'm';
    } else if (abs >= second) {
      return Math.round(ms / second) + 's';
    }
    return ms + 'ms';
  }

  export function formatTime(ms: number) {
    let result: string;
    if (ms >= day - hour / 2) {
      ms += hour / 2;
      result = Math.floor(ms / day) + ' 天';
      if (ms % day > hour) {
        result += ` ${Math.floor((ms % day) / hour)} 小时`;
      }
    } else if (ms >= hour - minute / 2) {
      ms += minute / 2;
      result = Math.floor(ms / hour) + ' 小时';
      if (ms % hour > minute) {
        result += ` ${Math.floor((ms % hour) / minute)} 分钟`;
      }
    } else if (ms >= minute - second / 2) {
      ms += second / 2;
      result = Math.floor(ms / minute) + ' 分钟';
      if (ms % minute > second) {
        result += ` ${Math.floor((ms % minute) / second)} 秒`;
      }
    } else {
      result = Math.round(ms / second) + ' 秒';
    }
    return result;
  }

  const dayMap = ['日', '一', '二', '三', '四', '五', '六'];

  function toDigits(source: number, length = 2) {
    return source.toString().padStart(length, '0');
  }

  export function template(template: string, time = new Date()) {
    return template
      .replace('yyyy', time.getFullYear().toString())
      .replace('yy', time.getFullYear().toString().slice(2))
      .replace('MM', toDigits(time.getMonth() + 1))
      .replace('dd', toDigits(time.getDate()))
      .replace('hh', toDigits(time.getHours()))
      .replace('mm', toDigits(time.getMinutes()))
      .replace('ss', toDigits(time.getSeconds()))
      .replace('SSS', toDigits(time.getMilliseconds(), 3));
  }

  function toHourMinute(time: Date) {
    return `${toDigits(time.getHours())}:${toDigits(time.getMinutes())}`;
  }

  export function formatTimeInterval(time: Date, interval?: number) {
    if (!interval) {
      return template('yyyy-MM-dd hh:mm:ss', time);
    } else if (interval === day) {
      return `每天 ${toHourMinute(time)}`;
    } else if (interval === week) {
      return `每周${dayMap[time.getDay()]} ${toHourMinute(time)}`;
    } else {
      return `${template('yyyy-MM-dd hh:mm:ss', time)} 起每隔 ${formatTime(interval)}`;
    }
  }
}
export class Random {
  constructor(private value = Math.random()) {}

  bool(probability: number) {
    if (probability >= 1) return true;
    if (probability <= 0) return false;
    return this.value < probability;
  }
  real(end: number): number;
  real(start: number, end: number): number;
  real(...args: [number, number?]): number {
    const start = args.length > 1 ? args[0] : 0;
    const end = args[args.length - 1]!;
    return this.value * (end - start) + start;
  }
  int(end: number): number;
  int(start: number, end: number): number;
  int(...args: [number, number?]): number {
    return Math.floor(this.real.call(this, ...(args as [number, number])));
  }

  pick<T>(source: readonly T[]) {
    return source[Math.floor(this.value * source.length)];
  }

  splice<T>(source: T[]) {
    return source.splice(Math.floor(this.value * source.length), 1)[0];
  }

  weightedPick<T extends string>(weights: Readonly<Record<T, number>>): T | undefined {
    const total = Object.entries(weights).reduce((prev, [, curr]) => prev + (curr as number), 0);
    const pointer = this.value * total;
    let counter = 0;
    for (const key in weights) {
      counter += weights[key];
      if (pointer < counter) return key;
    }
  }
}

export namespace Random {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  export function id(length = 8, radix = 16) {
    let result = '';
    for (let i = 0; i < length; ++i) {
      result += chars[Math.floor(Math.random() * radix)];
    }
    return result;
  }
  export function real(end: number): number;
  export function real(start: number, end: number): number;
  export function real(...args: [number, number?]): number {
    return new Random().real(...(args as [number, number]));
  }
  export function int(end: number): number;
  export function int(start: number, end: number): number;
  export function int(...args: [number, number?]): number {
    return new Random().int(...(args as [number, number]));
  }

  export function pick<T>(source: readonly T[]) {
    return new Random().pick(source);
  }

  export function shuffle<T>(source: readonly T[]) {
    const clone = source.slice();
    const result: T[] = [];
    for (let i = source.length; i > 0; --i) {
      result.push(new Random().splice(clone));
    }
    return result;
  }

  export function multiPick<T>(source: T[], count: number) {
    source = source.slice();
    const result: T[] = [];
    const length = Math.min(source.length, count);
    for (let i = 0; i < length; i += 1) {
      const index = Math.floor(Math.random() * source.length);
      const [item] = source.splice(index, 1);
      result.push(item);
    }
    return result;
  }

  export function weightedPick<T extends string>(weights: Readonly<Record<T, number>>): T | undefined {
    return new Random().weightedPick(weights);
  }

  export function bool(probability: number) {
    return new Random().bool(probability);
  }
}

export async function sleep(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export function isNullable(value: any) {
  return value === null || value === undefined;
}

export function isBailed(value: any) {
  return value !== null && value !== false && value !== undefined;
}

export function remove<T>(list: T[], fn: (item: T) => boolean): void;
export function remove<T>(list: T[], item: T): void;
export function remove<T>(list: T[], arg: T | ((item: T) => boolean)) {
  const index =
    typeof arg === 'function' && !list.every(item => typeof item === 'function')
      ? list.findIndex(arg as (item: T) => boolean)
      : list.indexOf(arg as T);
  if (index !== -1) list.splice(index, 1);
}

export function toArray<T>(source: T | T[]) {
  return Array.isArray(source) ? source : isNullable(source) ? [] : [source];
}

export function valueMap<T extends object, U>(obj: T, transform: (value: T, key: string) => U): T {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, transform(value, key)])) as T;
}

export function defineProperty<T, K extends keyof T>(object: T, key: K, value: T[K]): void;
export function defineProperty<T, K extends keyof any>(object: T, key: K, value: any): void;
export function defineProperty<T, K extends keyof any>(object: T, key: K, value: any) {
  Object.defineProperty(object, key, { writable: true, value });
}
export function lock<T extends object, K extends keyof T>(object: T, ...keys: K[]): void {
  for (const key of keys) {
    Object.defineProperty(object, key, { writable: false });
  }
}
export function hide<T extends object, K extends keyof T>(object: T, ...keys: K[]): void {
  for (const key of keys) {
    Object.defineProperty(object, key, { enumerable: false });
  }
}

export function escape<T>(text: T): T {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;') as T;
}
export function unescape<T>(text: T): T {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&') as T;
}
