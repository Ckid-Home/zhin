import {Context} from "@/context";
import {h} from '@/element'

export const name = 'terminalLogin'
export const scope = 'icqq' as const

export function install(ctx: Context) {
    ctx=ctx.platform('icqq')
    ctx.command('test [number:number] [string:string] [text:text]')
        .option('boolean','-b 测试boolean')
        .option('number','-n <number:number> 测试number')
        .option('string','-s <string:string> 测试string')
        .shortcut(/^输入数字(\d+)$/,{args:['$1'],options:{number:'$1',boolean:true}})
        .option('text','-t <text:text> 测试text')
        .action(({options,args})=>{
            return h('text',{text:JSON.stringify({options,args},null,2)})
        })
    ctx.on('icqq.system.login.slider', (e) => {
        console.log('输入滑块地址获取的ticket后继续。\n滑块地址:    ' + e.url)
        process.stdin.once('data', (data) => {
            e.bot.internal.submitSlider(data.toString().trim())
        })
    })
    ctx.on('icqq.system.login.qrcode', (e) => {
        console.log('扫码完成后回车继续:    ')
        process.stdin.once('data', () => {
            e.bot.internal.login()
        })
    })
    ctx.on('icqq.system.login.device', (e) => {
        console.log('请选择验证方式:(1：短信验证   其他：扫码验证)')
        process.stdin.once('data', (data) => {
            if (data.toString().trim() === '1') {
                e.bot.internal.sendSmsCode()
                console.log('请输入手机收到的短信验证码:')
                process.stdin.once('data', (res) => {
                    e.bot.internal.submitSmsCode(res.toString().trim())
                })
            } else {
                console.log('扫码完成后回车继续：' + e.url)
                process.stdin.once('data', () => {
                    e.bot.internal.login()
                })
            }
        })
    })
}
