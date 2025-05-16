import { App, Plugin, segment, WORK_DIR, formatTime, formatSize, formatDateTime, Adapter } from '@zhinjs/core';
import { axios, remove } from '@zhinjs/shared';
import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { version } from '../constants';
import os from 'os';
const downloadGit = (url: string, savePath: string = '.') => {
  return new Promise<string>((resolve, reject) => {
    exec(
      `git clone ${url}`,
      {
        cwd: savePath,
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout);
        }
      },
    );
  });
};
type PluginOptions = {
  setup?: boolean;
  typescript?: boolean;
};
const templates = {
  typescript_setup: `
  import {defineMetadata,useCommand} from 'zhin';
  defineMetadata({name:'$PluginName'})
  useCommand('foo')
  .action(()=>'bar')
  `,
  setup: ``,
  typescript: ``,
  normal: ``,
};
const createPlugin = async (savePath: string, pluginName: string, options: PluginOptions) => {};
const isExistPkg = (pkgName: string) => {
  return fs.existsSync(path.resolve(WORK_DIR, 'node_modules', pkgName));
};
const isExistAdapter = (name: string) => {
  return isExistMod(path.resolve(WORK_DIR, 'adapters'), name) || isExistPkg(name);
};
const isExistMod = (relativePath: string, name: string) => {
  const filesInfo = fs.readdirSync(relativePath, { withFileTypes: true });
  return filesInfo.some(dirent => {
    if (dirent.isDirectory()) return dirent.name === name;
    const extension = path.extname(path.resolve(relativePath, dirent.name));
    const filename = dirent.name.replace(extension, '');
    return filename === name && ['.js', '.cjs', '.mjs', '.ts', '.mts'].includes(extension);
  });
};
const isExistPlugin = (name: string) => {
  return isExistMod(path.resolve(WORK_DIR, 'plugins'), name) || isExistPkg(name);
};
const installNpmPkg = (name: string, env?: Record<string, string>) => {
  return new Promise<string>((resolve, reject) => {
    exec(
      `npm install ${name}`,
      {
        cwd: WORK_DIR,
        env,
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout);
        }
      },
    );
  });
};
const uninstallNpmPkg = (name: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(
      `npm uninstall ${name}`,
      {
        cwd: WORK_DIR,
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout);
        }
      },
    );
  });
};
const unlinkLocalDir = (dir_path: string) => {
  return new Promise((resolve, reject) => {
    exec(
      `rm -rf ${dir_path}`,
      {
        cwd: WORK_DIR,
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout);
        }
      },
    );
  });
};
const zhinManager = new Plugin('systemManage');
zhinManager
  .command('status')
  .desc('查看知音运行状态')
  .alias('状态')
  .action(({ message }) => {
    const restartTimes = Number(process.env?.RESTART_TIMES);
    const lastRestartTime = Date.now() - process.uptime() * 1000;
    const startTime = Date.now() / 1000 - Number(process.env?.START_TIME);
    const cpus = os.cpus();
    const cpuInfo = cpus[0];
    const cpus_model = cpuInfo.model;
    const cpu_speed = cpuInfo.speed;
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const processMemory = process.memoryUsage.rss();
    return segment.text(
      [
        `系统架构：${os.type()} ${os.release()} ${os.arch()}`,
        `开机时长：${formatTime(os.uptime())}`,
        `CPU：${cpus.length}核 ${cpus_model}(${cpu_speed}MHz)`,
        `内存：${formatSize(usedMemory)}/${formatSize(totalMemory)} ${((usedMemory / totalMemory) * 100).toFixed(2)}%`,
        `运行环境：NodeJS ${process.version}`,
        `zhin v${version} (${process.env.mode} mode)`,
        `适配器：${message.adapter.name}`,
        `进程：${process.ppid}/${process.pid} ${formatSize(processMemory)} ${(
          (processMemory / usedMemory) *
          100
        ).toFixed(2)}%`,
        `持续运行：${formatTime(startTime)}`,
        `重启次数：${restartTimes}`,
        `上次重启：${formatDateTime(lastRestartTime)}`,
      ].join('\n'),
    );
  });
zhinManager
  .command('update')
  .desc('升级zhin 到指定版本')
  .option('-v [version:string] 更新到指定版本，默认最新', 'latest')
  .option('-r [restart:boolean] 是否立即重启，默认不重启', false)
  .permission('master')
  .action(async ({ message, options }) => {
    const beforeVersion = version;
    if (!options.version) options.version = 'latest';
    const afterVersion = await (async () => {
      const response = await axios.get('https://registry.npmjs.org/zhin');
      if (options.version === 'latest') return response.data['dist-tags'].latest;
      return response.data['versions'][options.version!];
    })();
    if (!afterVersion) return `无效的版本号: ${options.version}`;
    if (afterVersion === beforeVersion) return `zhin 已是最新版(${afterVersion})`;
    execSync(`npm install zhin@${options.version}`, {
      cwd: WORK_DIR,
    });
    const changeLogPath = path.join(path.dirname(require.resolve('zhin/package.json')), 'CHANGELOG.md');
    const changeLogContent = fs.readFileSync(changeLogPath, 'utf8');
    const oldContentIndex = changeLogContent.indexOf(`## ${beforeVersion}`);
    const newContent = changeLogContent.slice(0, oldContentIndex);
    if (options.restart) {
      await message.reply('正在重启，使新功能生效...');
      process.send?.({
        type: 'queue',
        body: {
          adapter: message.adapter.name,
          bot: message.bot.unique_id,
          channel: message.channel,
          message: `重启完成，本次升级内容如下:\n${newContent}`,
        },
      });
      return process.exit(51);
    }
    return segment.text(`zhin 已升级，将在下次重启时生效，本次升级内容如下：\n${newContent}`);
  });

const pluginManage = zhinManager.command('plugin').hidden().desc('插件管理');
pluginManage
  .command('plugin.list')
  .desc('查看已安装插件')
  .scope('private', 'group', 'guild', 'direct')
  .action(({ adapter }) => {
    return segment.text(
      [...zhinManager.app!.pluginList]
        .map((plugin, index) => {
          return `${index + 1} ${plugin.display_name}(${plugin.id}) ${plugin.statusText}`;
        })
        .join('\n'),
    );
  });
pluginManage
  .command('plugin.install [name:string]')
  .desc('安装插件')
  .option('-e [env:string] node_env')
  .permission('master')
  .action(async ({ message, options, prompt }, name) => {
    if (!name) name = await prompt.text('请输入插件名或插件仓库地址');
    if (!name) return `输入错误`;
    if (/^https?:\/\//.test(name)) {
      try {
        return await downloadGit(name, path.resolve(WORK_DIR, './plugins'));
      } catch (e: unknown) {
        return `安装失败\n${(e as Error).message}`;
      }
    }
    try {
      return await installNpmPkg(name, {
        NODE_ENV: options.env!,
      });
    } catch (e) {
      return `安装失败\n${(e as Error).message}`;
    }
  });
pluginManage
  .command('plugin.uninstall [name:string]')
  .desc('卸载插件')
  .permission('master')
  .action(async ({ message, prompt }, name) => {
    if (!name) name = await prompt.text('请输入插件名或插件仓库名');
    if (!name) return `输入错误`;
    if (fs.existsSync(path.resolve(WORK_DIR, 'plugins', name))) {
      try {
        await unlinkLocalDir(path.resolve(WORK_DIR, 'plugins', name));
      } catch (e) {
        return `卸载失败\n${(e as Error).message}`;
      }
      return `${name} 已卸载`;
    }
    try {
      await uninstallNpmPkg(name);
    } catch (e) {
      return `卸载失败\n${(e as Error).message}`;
    }
  });
pluginManage
  .command('plugin.enable [name:string]')
  .desc('启用插件')
  .permission('master')
  .scope('direct')
  .action((runtime, name) => {
    const plugin = zhinManager.app!.plugins.get(name);
    if (!plugin) {
      return '该插件未添加';
    }
    remove(zhinManager.app!.config.disable_plugins, name);
    return '插件已启用';
  });
pluginManage
  .command('plugin.disable [name:string]')
  .desc('禁用插件')
  .permission('master')
  .scope('direct', 'private')
  .action((runtime, name) => {
    const plugin = zhinManager.app!.plugins.get(name);
    if (!plugin) {
      return '插件未添加';
    }
    zhinManager.app!.config.disable_plugins.push(name);
    return '插件已禁用';
  });
pluginManage
  .command('plugin.add [name:string]')
  .desc('添加插件')
  .permission('master')
  .action(async ({ prompt }, name) => {
    if (!name) name = await prompt.text('请输入插件名');
    if (!name) return `输入错误`;
    if (!isExistPlugin(name)) return `插件(${name})不存在，你可能需要先安装它`;
    zhinManager.app!.config.plugins.push(name);
    zhinManager.app!.loadPlugin(name);
    return `插件(${name})已添加`;
  });
pluginManage
  .command('plugin.new [name:string]')
  .desc('新建插件')
  .option('-t [typescript:boolean]', false)
  .option('-s [setup:boolean]', false)
  .permission('master')
  .action(async ({ prompt, options }, name) => {
    if (!name) name = await prompt.text('请输入插件名');
    const saveToDir = zhinManager.app!.config.plugin_dirs[0];
    if (!saveToDir) return `您为定义插件存放目录，请先在'config/zhin.config.yaml'中定义'plugin_dirs`;
    const pluginPath = await createPlugin(saveToDir, name, options);
    return `已创建插件'${pluginPath}'`;
  });
pluginManage
  .command('plugin.remove [name:string]')
  .desc('移除插件')
  .permission('master')
  .action(async ({ prompt }, name) => {
    if (!name) name = await prompt.text('请输入插件名');
    if (!name) return `输入错误`;
    if (!zhinManager.app!.config.plugins.includes(name)) return '插件尚未添加到zhin';
    remove(zhinManager.app!.config.plugins, name);
    zhinManager.app!.unmount(name);
    return `插件(${name})已移除`;
  });
const adapterManage = zhinManager.command('adapter').desc('适配器管理').hidden();
adapterManage
  .command('adapter.install [name:string]')
  .desc('安装适配器')
  .permission('master')
  .option('-e [env:string] node_env')
  .action(async ({ message, options, prompt }) => {
    const name = await prompt.text('请输入适配器名');
    if (!name) return `输入错误`;
    try {
      await installNpmPkg(name, {
        NODE_ENV: options.env!,
      });
    } catch (e) {
      return `安装失败\n${(e as Error).message}`;
    }
  });
adapterManage
  .command('adapter.uninstall [name:string]')
  .permission('master')
  .desc('卸载适配器')
  .permission('master')
  .action(async ({ message, prompt }, name) => {
    if (!name) name = await prompt.text('请输入适配器名');
    if (!name) return `输入错误`;
    try {
      await uninstallNpmPkg(name);
    } catch (e) {
      return `卸载失败\n${(e as Error).message}`;
    }
  });
const botManage = zhinManager.command('bot').desc('机器人管理').hidden();
botManage
  .command('bot.add <adapter:string>')
  .permission('master')
  .action(async ({ prompt }, adapter) => {
    if (!App.adapters.get(adapter))
      return `未找到名为“${adapter}”的适配器，请确认你是否安装并启用了“@zhinjs/adapter-${adapter}”`;
    const schema = zhinManager.app!.getAdapterSchema(adapter);
    const botConfig = {
      adapter,
      ...(await prompt.getValueWithSchema(schema)),
    } as Adapter.BotConfig;
    zhinManager.app!.config.bots.push(botConfig);
    return `已添加，请重启`;
  });
botManage.command('bot.list').action(() => {
  const bots = zhinManager.app!.config.bots;
  if (!bots.length) {
    return '暂无机器人';
  }
  const adapterInfos: { name: string; bots: string[] }[] = [];
  for (const bot of bots) {
    const adapter = adapterInfos.find(ad => ad.name === bot.adapter);
    if (!adapter) {
      adapterInfos.push({
        name: bot.adapter,
        bots: [bot.unique_id],
      });
      continue;
    }
    adapter.bots.push(bot.unique_id);
  }
  return adapterInfos
    .map(adapter => {
      return (
        `${adapter.name}\n` +
        adapter.bots
          .map((unique_id, idx) => {
            return `  ${unique_id}`;
          })
          .join('\n')
      );
    })
    .join('\n');
});

botManage
  .command('bot.edit [unique_id:string]')
  .permission('master')
  .action(async ({ prompt, options }, unique_id) => {
    if (!unique_id) unique_id = await prompt.text('请输入机器人唯一id');
    if (!unique_id) return '输入错误';
    const botConfig = zhinManager.app!.config.bots.find(b => b.unique_id == unique_id);
    if (!botConfig) return `机器人 ${unique_id} 不存在`;

    const schema = zhinManager.app!.getAdapterSchema(botConfig.adapter);
    const key = await prompt.text('请输入配置项key');
    if (!(key in schema.options.object!))
      return `无效的配置项“${schema}”,期望输入：${Object.keys(schema.options.object!).join(',')}`;
    if (!key) return '输入错误';
    let value = await prompt.getValueWithSchemas({ [key]: schema.options.object![key] });
    Reflect.set(botConfig, key, value[key]);
  });
botManage
  .command('bot.enable <unique_id:string>')
  .desc('启用bot')
  .permission('master')
  .action(async ({ prompt }, unique_id) => {
    if (!unique_id) unique_id = await prompt.text('请输入机器人唯一id');
    if (!unique_id) return '输入错误';
    const botConfig = zhinManager.app!.config.bots.find(b => b.unique_id == unique_id);
    if (!botConfig) return `机器人 ${unique_id} 不存在`;
    remove(zhinManager.app!.config.disable_bots, unique_id);
    return `已启用(${unique_id})，下次启动生效`;
  });
botManage
  .command('bot.disable <unique_id:string>')
  .desc('禁用bot')
  .permission('master')
  .action(async ({ prompt }, unique_id) => {
    const botConfig = zhinManager.app!.config.bots.find(b => b.unique_id == unique_id);
    if (!botConfig) return `机器人 ${unique_id} 不存在`;
    zhinManager.app!.config.disable_bots.push(unique_id);
    return `已禁用(${unique_id})，下次启动生效`;
  });
botManage
  .command('bot.remove [unique_id:string]')
  .permission('master')
  .option('-f <force:boolean>', false)
  .action(async ({ prompt, options }, unique_id) => {
    if (!unique_id) unique_id = await prompt.text('请输入机器人唯一id');
    if (!unique_id) return '输入错误';
    const isConfirm = options.force || (await prompt.confirm('确认移除么'));
    if (isConfirm) {
      remove(zhinManager.app!.config.bots, (bot: Adapter.BotConfig) => {
        return bot.unique_id === unique_id;
      });
      return `已移除(${unique_id})，下次启动生效`;
    }
    return '已取消';
  });
botManage
  .command('bot.clean [name:string]')
  .permission('master')
  .option('-f <force:boolean>', false)
  .action(async ({ prompt, options }, name) => {
    if (!name) name = await prompt.text('请输入机器人适配器名称');
    if (!name) return '输入错误';
    const isConfirm = options.force || (await prompt.confirm('确认移除么'));
    if (isConfirm) {
      zhinManager.app!.config.bots = zhinManager.app!.config.bots.filter(bot => {
        return bot.adapter !== name;
      });
      return `已移除 ${name} 机器人，下次启动生效`;
    }
    return '已取消';
  });
const getObj = <T extends object>(parent: T, keys: string[]): any => {
  const key: keyof T = keys.shift() as keyof T;
  if (!key) return parent;
  if (key && typeof parent[key] === 'object') return getObj(parent[key] as object, keys);
  return parent[key];
};
zhinManager
  .command('zhin.config')
  .desc('配置管理')
  .permission('master')
  .hidden()
  .action(() => {
    return JSON.stringify(zhinManager.app?.config.data, null, 2);
  });
zhinManager
  .command('db.import [filepath:string]')
  .desc('导入数据库')
  .permission('master')
  .hidden()
  .action(async ({ prompt }, filepath) => {
    if (!filepath) filepath = await prompt.text('请输入要导入的数据文件路径');
    if (!filepath) return '输入错误';
    try {
      const config = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      await zhinManager.database.import(config);
    } catch (e) {
      return (e as Error)?.message || '导入失败，未知错误';
    }
    return '导入成功';
  });
zhinManager
  .command('db.export [filename:string]')
  .desc('导出数据库')
  .action(async (_, filename = 'zhin.db.json') => {
    await zhinManager.database.export(filename);
    return '导出成功';
  });
zhinManager
  .command('config.set <key:string> <value:any>')
  .permission('master')
  .action((_, key, value) => {
    const keys = key.split('.').filter(Boolean);
    try {
      value = JSON.parse(value as string);
    } catch {}
    const lastKey = keys.pop();
    if (!lastKey) return 'key is required';
    const obj = getObj(zhinManager.app!.config, keys);
    obj[lastKey as keyof object] = value;
    return `config.${key} 已更新`;
  });
zhinManager
  .command('config.push <key:string> <value:any>')
  .permission('master')
  .action((_, key, value) => {
    const keys = key.split('.').filter(Boolean);
    try {
      value = JSON.parse(value as string);
    } catch {}
    if (!keys.length) return 'key is required';
    const arr = getObj(zhinManager.app!.config, keys);
    if (!Array.isArray(arr)) return `config.${key}} is not an array`;
    arr.push(value);
    return `config.${key} 已添加`;
  });
zhinManager
  .command('config.delete <key:string>')
  .permission('master')
  .action((_, key) => {
    const keys = key.split('.').filter(Boolean);
    const lastKey = keys.pop();
    if (!lastKey) return 'key is required';
    const obj = getObj(zhinManager.app!.config, keys);
    delete obj[lastKey as keyof object];
    return `config.${keys} 已删除`;
  });

export default zhinManager;
