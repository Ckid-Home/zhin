import { Adapter, App, Message } from 'zhin';
import { sendableToString, formatSendable } from './utils';
import {
  Bot,
  PrivateMessageEvent,
  GroupMessageEvent,
  GuildMessageEvent,
  Sendable,
  Quotable,
  Intent,
} from 'qq-group-bot';
type QQMessageEvent = PrivateMessageEvent | GroupMessageEvent | GuildMessageEvent;
export type QQAdapter = typeof qq;
const qq = new Adapter<Adapter.Bot<Bot>, QQMessageEvent>('qq');
declare module 'zhin' {
  namespace App {
    interface Adapters {
      qq: QQConfig;
    }
  }
}
qq.schema('appid', {
  method: 'text',
  args: ['请输入appid'],
})
  .schema('secret', {
    method: 'text',
    args: ['请输入secret'],
  })
  .schema('group', {
    method: 'confirm',
    args: ['是否拥有群聊能力'],
  })
  .schema('public', {
    method: 'confirm',
    args: ['是否公域机器人'],
  })
  .schema('sandbox', {
    method: 'confirm',
    args: ['是否开启沙箱模式'],
  });
qq.define('sendMsg', async (bot_id, target_id, target_type, message, source) => {
  const bot = qq.pick(bot_id);
  let msg: Sendable = await qq.app!.renderMessage(message as string, source);
  msg = formatSendable(msg);
  const quote: Quotable | undefined = source ? source.original : undefined;
  switch (target_type) {
    case 'group':
      return bot.sendGroupMessage(target_id, msg, quote);
    case 'private':
      const [sub_type, user_id] = target_id.split(':');
      if (sub_type === 'friend') {
        return bot.sendPrivateMessage(user_id, msg, quote);
      }
      return bot.sendDirectMessage(user_id, msg, quote);
    case 'direct':
      return bot.sendDirectMessage(target_id, msg, quote);
    case 'guild':
      return bot.sendGuildMessage(target_id, msg, quote);
    default:
      throw new Error(`QQ适配器暂不支持发送${target_type}类型的消息`);
  }
});
type QQConfig = {
  appid: string;
  token: string;
  secret: string;
  private?: boolean;
  group?: boolean;
  removeAt?: boolean;
  sandbox?: boolean;
  timeout?: number;
  public?: boolean;
};
const initBot = (configs: App.BotConfig<'qq'>[]) => {
  for (const { private: isPrivate, group, public: isPublic, ...config } of configs) {
    const botConfig: Bot.Config = {
      logLevel: qq.app!.config.log_level as any,
      ...config,
      intents: [
        group && 'GROUP_AT_MESSAGE_CREATE',
        isPrivate && 'C2C_MESSAGE_CREATE',
        'DIRECT_MESSAGE',
        !isPublic && 'GUILD_MESSAGES',
        'GUILDS',
        'GUILD_MEMBERS',
        'GUILD_MESSAGE_REACTIONS',
        'DIRECT_MESSAGE',
        'INTERACTION',
        isPublic && 'PUBLIC_GUILD_MESSAGES',
      ].filter(Boolean) as Intent[],
    };
    const bot = new Bot(botConfig) as Adapter.Bot<Bot>;
    Object.defineProperties(bot, {
      unique_id: {
        value: config.unique_id,
        writable: false,
      },
      quote_self: {
        get() {
          return qq.app!.config.bots.find(b => b.unique_id === bot.unique_id)?.quote_self;
        },
      },
      forward_length: {
        get() {
          return qq.app!.config.bots.find(b => b.unique_id === bot.unique_id)?.forward_length;
        },
      },
      command_prefix: {
        get() {
          return qq.app!.config.bots.find(b => b.unique_id === bot.unique_id)?.command_prefix;
        },
      },
    });
    qq.bots.push(bot);
  }
  qq.on('start', startBots);
  qq.on('stop', stopBots);
};
const messageHandler = (bot: Adapter.Bot<Bot>, event: QQMessageEvent) => {
  const message = Message.fromEvent(qq, bot, event);
  message.raw_message = sendableToString(event.message).trim();
  message.message_type = event.message_type;
  const master = qq.app!.config.bots.find(b => b.unique_id === bot.unique_id)?.master;
  const admins = qq.app!.config.bots.find(b => b.unique_id === bot.unique_id)?.admins;
  message.sender = {
    ...event.sender,
    permissions: [
      master && event.user_id === master && 'master',
      admins && admins.includes(event.user_id) && 'admins',
      ...(event.sender?.permissions as unknown as string[]),
    ].filter(Boolean) as string[],
  };
  if (event.source) {
    message.quote = event.source;
  }
  switch (event.message_type) {
    case 'private':
      Object.defineProperty(message, 'from_id', {
        value: `${event.sub_type}:${event.guild_id || event.user_id}`,
        writable: false,
      });
      break;
    case 'group':
      Object.defineProperty(message, 'from_id', {
        value: event.group_id,
        writable: false,
      });
      break;
    case 'guild':
      Object.defineProperty(message, 'from_id', {
        value: event.channel_id,
        writable: false,
      });
      break;
  }
  const commands = qq.app!.getSupportCommands(qq, bot, message);
  const matchReg = new RegExp(`^/(${commands.map(c => c.name).join('|')})`);
  if (message.raw_message.match(matchReg)) message.raw_message = message.raw_message.slice(1);
  qq.app!.emit('message', qq, bot, message);
};
const startBots = () => {
  for (const bot of qq.bots) {
    bot.on('message', messageHandler.bind(global, bot));
    bot.start().then(() => {
      qq.emit('bot-ready', bot);
    });
  }
};
const stopBots = () => {
  for (const bot of qq.bots) {
    bot.stop();
  }
};
qq.on('mounted', initBot);

export default qq;
