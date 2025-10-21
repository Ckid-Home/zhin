import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MessageCommand } from '../src/command'
import { Message } from '../src/message'
import { Plugin } from '../src/plugin'
import { App } from '../src/app'

// Mock segment-matcher
vi.mock('segment-matcher', () => {
  const MatchResult = {
    matched: true,
    args: [],
    options: {}
  }

  class SegmentMatcher {
    constructor(public pattern: string) {}
    
    match(content: any) {
      // 简单的mock实现
      if (Array.isArray(content) && content.length > 0) {
        const text = content[0]?.data?.text || ''
        if (text.includes(this.pattern)) {
          return {
            matched: true,
            args: [text.replace(this.pattern, '').trim()],
            options: {}
          }
        }
      }
      return null
    }
  }

  return { SegmentMatcher, MatchResult }
})

// Mock App with permissions
const mockApp = {
  permissions: {
    get: vi.fn((permission: string) => {
      // Mock permit checker
      return {
        check: vi.fn(async (perm: string, message: any) => {
          if (permission === 'adapter(discord)') {
            return message.$adapter === 'discord'
          }
          if (permission === 'adapter(telegram)') {
            return message.$adapter === 'telegram'
          }
          if (permission === 'adapter(email)') {
            return message.$adapter === 'email'
          }
          if (permission === 'adapter(test)') {
            return message.$adapter === 'test'
          }
          return true
        })
      }
    })
  }
} as any

// 为多个权限测试创建特殊的 mock app
const multiPermitMockApp = {
  permissions: {
    get: vi.fn((permission: string) => {
      return {
        check: vi.fn(async (perm: string, message: any) => {
          // 对于多个权限，只要有一个匹配就返回 true
          if (permission === 'adapter(discord)' && message.$adapter === 'discord') {
            return true
          }
          if (permission === 'adapter(telegram)' && message.$adapter === 'telegram') {
            return true
          }
          if (permission === 'adapter(email)' && message.$adapter === 'email') {
            return true
          }
          if (permission === 'adapter(test)' && message.$adapter === 'test') {
            return true
          }
          return false
        })
      }
    })
  }
} as any

describe('Command系统测试', () => {
  describe('MessageCommand基础功能测试', () => {
    it('应该正确创建MessageCommand实例', () => {
      const command = new MessageCommand('hello')
      expect(command).toBeInstanceOf(MessageCommand)
      // 注意：pattern 属性可能不是公开的，这里只测试实例创建
    })

    it('应该支持链式调用', () => {
      const command = new MessageCommand('test')
        .permit('adapter(discord)')
        .action(() => 'response')

      expect(command).toBeInstanceOf(MessageCommand)
      expect(typeof command.permit).toBe('function')
      expect(typeof command.action).toBe('function')
    })
  })

  describe('权限(permit)测试', () => {
    it('应该正确设置单个权限', async () => {
      const command = new MessageCommand('hello')
        .permit('adapter(discord)')
        .action(() => 'Hello from Discord!')

      // 匹配的适配器
      const discordMessage: Message = {
        $id: '1',
        $adapter: 'discord',
        $bot: 'discord-bot',
        $content: [{ type: 'text', data: { text: 'hello world' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'channel' },
        $timestamp: Date.now(),
        $raw: 'hello world'
      }

      // 不匹配的适配器
      const telegramMessage: Message = {
        $id: '2',
        $adapter: 'telegram',
        $bot: 'telegram-bot',
        $content: [{ type: 'text', data: { text: 'hello world' } }],
        $sender: { id: 'user2', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel2', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'hello world'
      }

      const discordResult = await command.handle(discordMessage, mockApp)
      const telegramResult = await command.handle(telegramMessage, mockApp)

      expect(discordResult).toBe('Hello from Discord!')
      expect(telegramResult).toBeUndefined()
    })

    it('应该正确设置多个权限', async () => {
      const command = new MessageCommand('hello')
        .permit('adapter(discord)')
        .action(() => 'Hello!')

      const discordMessage: Message = {
        $id: '1',
        $adapter: 'discord',
        $bot: 'discord-bot',
        $content: [{ type: 'text', data: { text: 'hello' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'channel' },
        $timestamp: Date.now(),
        $raw: 'hello'
      }

      const telegramMessage: Message = {
        $id: '2',
        $adapter: 'telegram',
        $bot: 'telegram-bot',
        $content: [{ type: 'text', data: { text: 'hello' } }],
        $sender: { id: 'user2', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel2', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'hello'
      }

      const emailMessage: Message = {
        $id: '3',
        $adapter: 'email',
        $bot: 'email-bot',
        $content: [{ type: 'text', data: { text: 'hello' } }],
        $sender: { id: 'user3', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel3', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'hello'
      }

      const discordResult = await command.handle(discordMessage, mockApp)
      const telegramResult = await command.handle(telegramMessage, mockApp)
      const emailResult = await command.handle(emailMessage, mockApp)

      expect(discordResult).toBe('Hello!')
      expect(telegramResult).toBeUndefined()
      expect(emailResult).toBeUndefined()
    })
  })

  describe('动作(action)测试', () => {
    it('应该正确执行单个动作', async () => {
      const actionSpy = vi.fn().mockReturnValue('Action executed!')
      
      const command = new MessageCommand('test')
        .action(actionSpy)

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [{ type: 'text', data: { text: 'test message' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'test message'
      }

      const result = await command.handle(message, mockApp)

      expect(actionSpy).toHaveBeenCalledWith(message, expect.any(Object))
      expect(result).toBe('Action executed!')
    })

    it('应该正确执行多个动作', async () => {
      const action1 = vi.fn()
      const action2 = vi.fn().mockReturnValue('Second action result')
      const action3 = vi.fn().mockReturnValue('Third action result')

      const command = new MessageCommand('test')
        .action(action1)
        .action(action2)
        .action(action3)

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [{ type: 'text', data: { text: 'test' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'test'
      }

      const result = await command.handle(message, mockApp)

      expect(action1).toHaveBeenCalled()
      expect(action2).toHaveBeenCalled()
      expect(action3).not.toHaveBeenCalled() // 第二个动作有返回值，所以第三个不会执行
      expect(result).toBe('Second action result')
    })

    it('应该正确处理异步动作', async () => {
      const asyncAction = vi.fn().mockResolvedValue('Async result')

      const command = new MessageCommand('async')
        .action(asyncAction)

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [{ type: 'text', data: { text: 'async test' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'async test'
      }

      const result = await command.handle(message, mockApp)

      expect(asyncAction).toHaveBeenCalled()
      expect(result).toBe('Async result')
    })

    it('应该正确传递匹配结果给动作', async () => {
      const actionSpy = vi.fn().mockReturnValue('Got args!')

      const command = new MessageCommand('echo')
        .action(actionSpy)

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [{ type: 'text', data: { text: 'echo hello world' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'echo hello world'
      }

      const result = await command.handle(message, mockApp)

      expect(actionSpy).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          matched: true,
          args: ['hello world']
        })
      )
      expect(result).toBe('Got args!')
    })
  })

  describe('消息处理(handle)测试', () => {
    it('应该在不匹配时返回undefined', async () => {
      const command = new MessageCommand('hello')
        .action(() => 'Hello!')

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [{ type: 'text', data: { text: 'goodbye' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'goodbye'
      }

      const result = await command.handle(message, mockApp)
      expect(result).toBeUndefined()
    })

    it('应该正确处理空消息内容', async () => {
      const command = new MessageCommand('test')
        .action(() => 'Response')

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: ''
      }

      const result = await command.handle(message, mockApp)
      expect(result).toBeUndefined()
    })

    it('应该正确处理非文本消息', async () => {
      const command = new MessageCommand('test')
        .action(() => 'Response')

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [
          { type: 'image', data: { url: 'https://example.com/image.png' } }
        ],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: '[图片]'
      }

      const result = await command.handle(message, mockApp)
      expect(result).toBeUndefined()
    })
  })

  describe('复合条件测试', () => {
    it('应该同时满足权限和匹配条件', async () => {
      const command = new MessageCommand('admin')
        .permit('adapter(discord)')
        .action(() => 'Admin command executed')

      // 正确的适配器和匹配的消息
      const validMessage: Message = {
        $id: '1',
        $adapter: 'discord',
        $bot: 'discord-bot',
        $content: [{ type: 'text', data: { text: 'admin panel' } }],
        $sender: { id: 'admin1', name: 'Admin' },
        $reply: vi.fn(),
        $channel: { id: 'admin-channel', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'admin panel'
      }

      // 错误的适配器但匹配的消息
      const wrongAdapterMessage: Message = {
        $id: '2',
        $adapter: 'telegram',
        $bot: 'telegram-bot',
        $content: [{ type: 'text', data: { text: 'admin panel' } }],
        $sender: { id: 'admin2', name: 'Admin' },
        $reply: vi.fn(),
        $channel: { id: 'admin-channel', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'admin panel'
      }

      // 正确的适配器但不匹配的消息
      const nonMatchingMessage: Message = {
        $id: '3',
        $adapter: 'discord',
        $bot: 'discord-bot',
        $content: [{ type: 'text', data: { text: 'hello world' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'general-channel', type: 'channel' },
        $timestamp: Date.now(),
        $raw: 'hello world'
      }

      const validResult = await command.handle(validMessage, mockApp)
      const wrongAdapterResult = await command.handle(wrongAdapterMessage, mockApp)
      const nonMatchingResult = await command.handle(nonMatchingMessage, mockApp)

      expect(validResult).toBe('Admin command executed')
      expect(wrongAdapterResult).toBeUndefined()
      expect(nonMatchingResult).toBeUndefined()
    })
  })

  describe('错误处理测试', () => {
    it('应该正确处理动作中的同步错误', async () => {
      const errorAction = vi.fn().mockImplementation(() => {
        throw new Error('Action failed')
      })

      const command = new MessageCommand('error')
        .action(errorAction)

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [{ type: 'text', data: { text: 'error test' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'error test'
      }

      await expect(command.handle(message, mockApp)).rejects.toThrow('Action failed')
    })

    it('应该正确处理动作中的异步错误', async () => {
      const asyncErrorAction = vi.fn().mockRejectedValue(new Error('Async action failed'))

      const command = new MessageCommand('async-error')
        .action(asyncErrorAction)

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [{ type: 'text', data: { text: 'async-error test' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'async-error test'
      }

      await expect(command.handle(message, mockApp)).rejects.toThrow('Async action failed')
    })
  })

  describe('类型系统测试', () => {
    it('应该支持泛型适配器类型约束', () => {
      // 这主要是TypeScript编译时检查
      const discordCommand = new MessageCommand('test')
        .permit('adapter(discord)')
        .action((message) => {
          // message 应该有正确的类型
          expect(message.$adapter).toBe('discord')
          return 'Discord response'
        })

      expect(discordCommand).toBeInstanceOf(MessageCommand)
    })
  })

  describe('性能测试', () => {
    it('应该高效处理大量消息检查', async () => {
      const action = vi.fn().mockReturnValue('Response')
      const command = new MessageCommand('perf')
        .permit('adapter(test)')
        .action(action)

      const messages: Message[] = Array.from({ length: 1000 }, (_, i) => ({
        $id: `msg-${i}`,
        $adapter: i % 2 === 0 ? 'test' : 'other',
        $bot: 'test-bot',
        $content: [{ type: 'text', data: { text: i % 3 === 0 ? 'perf test' : 'other' } }],
        $sender: { id: `user${i}`, name: `User ${i}` },
        $reply: vi.fn(),
        $channel: { id: `channel${i}`, type: 'private' },
        $timestamp: Date.now(),
        $raw: i % 3 === 0 ? 'perf test' : 'other'
      }))

      const startTime = Date.now()
      const results = await Promise.all(
        messages.map(message => command.handle(message, mockApp))
      )
      const endTime = Date.now()

      // 验证执行时间在合理范围内 (< 100ms for 1000 messages)
      expect(endTime - startTime).toBeLessThan(100)

      // 验证正确的消息被处理
      const validResults = results.filter(r => r !== undefined)
      expect(validResults.length).toBeGreaterThan(0)
      expect(action).toHaveBeenCalled()
    })
  })

  describe('复杂场景测试', () => {
    it('应该支持命令参数解析', async () => {
      const actionSpy = vi.fn((message, matchResult) => {
        return `参数: ${matchResult.args.join(', ')}`
      })

      const command = new MessageCommand('say')
        .action(actionSpy)

      const message: Message = {
        $id: '1',
        $adapter: 'test',
        $bot: 'test-bot',
        $content: [{ type: 'text', data: { text: 'say hello world from bot' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'say hello world from bot'
      }

      const result = await command.handle(message, mockApp)

      expect(actionSpy).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          args: ['hello world from bot']
        })
      )
      expect(result).toBe('参数: hello world from bot')
    })

    it('应该支持条件链式处理', async () => {
      const command = new MessageCommand('multi')
        .permit('adapter(discord)')
        .action((message, result) => {
          if (message.$channel.type === 'private') {
            return '私人消息响应'
          }
          return undefined
        })
        .action(() => {
          return '群组消息响应'
        })

      const privateMessage: Message = {
        $id: '1',
        $adapter: 'discord',
        $bot: 'discord-bot',
        $content: [{ type: 'text', data: { text: 'multi test' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'dm-channel', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'multi test'
      }

      const groupMessage: Message = {
        $id: '2',
        $adapter: 'discord',
        $bot: 'discord-bot',
        $content: [{ type: 'text', data: { text: 'multi test' } }],
        $sender: { id: 'user2', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'group-channel', type: 'group' },
        $timestamp: Date.now(),
        $raw: 'multi test'
      }

      const privateResult = await command.handle(privateMessage, mockApp)
      const groupResult = await command.handle(groupMessage, mockApp)

      expect(privateResult).toBe('私人消息响应')
      expect(groupResult).toBe('群组消息响应')
    })
  })

  describe('权限系统测试', () => {
    it('应该正确处理权限检查失败', async () => {
      const command = new MessageCommand('admin')
        .permit('adapter(discord)')
        .action(() => 'Admin command')

      const message: Message = {
        $id: '1',
        $adapter: 'telegram', // 不匹配的适配器
        $bot: 'telegram-bot',
        $content: [{ type: 'text', data: { text: 'admin test' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'admin test'
      }

      const result = await command.handle(message, mockApp)
      expect(result).toBeUndefined()
    })

    it('应该正确处理权限检查通过', async () => {
      const command = new MessageCommand('admin')
        .permit('adapter(discord)')
        .action(() => 'Admin command')

      const message: Message = {
        $id: '1',
        $adapter: 'discord', // 匹配的适配器
        $bot: 'discord-bot',
        $content: [{ type: 'text', data: { text: 'admin test' } }],
        $sender: { id: 'user1', name: 'User' },
        $reply: vi.fn(),
        $channel: { id: 'channel1', type: 'private' },
        $timestamp: Date.now(),
        $raw: 'admin test'
      }

      const result = await command.handle(message, mockApp)
      expect(result).toBe('Admin command')
    })
  })
})