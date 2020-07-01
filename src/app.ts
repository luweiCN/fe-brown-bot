// bot.ts
import { Contact, Message, Wechaty } from "wechaty";
import { ScanStatus } from "wechaty-puppet";
import { PuppetPadplus } from "wechaty-puppet-padplus";
import QrcodeTerminal from "qrcode-terminal";
import { puppetPadplusToken } from "./config";
import { TXRobot } from "./cmds/tianxin";
import { error_text, hello_text } from "./common/constant";

const puppet = new PuppetPadplus({
    token: puppetPadplusToken,
});

const name = "BrownWeChatBot";

const bot = new Wechaty({
    puppet,
    name, // generate xxxx.memory-card.json and save login data for the next login
});

bot.on("scan", (qrcode, status) => {
    // 扫码
    if (status === ScanStatus.Waiting) {
        QrcodeTerminal.generate(qrcode, {
            small: true,
        });
    }
})
    .on("login", (user: Contact) => {
        // 登录成功
        console.log(`login success, user: ${user}`);
    })
    .on("friendship", async (friendship) => {
        // 接收到好友请求时，直接同意并说一句配置好的欢迎语
        try {
            switch (friendship.type()) {
                // 1. New Friend Request
                case bot.Friendship.Type.Receive:
                    await friendship.accept();
                    friendship.contact().say(hello_text);
                    break;

                // 2. Friend Ship Confirmed
                case bot.Friendship.Type.Confirm:
                    break;
            }
        } catch (e) {
            console.error(e);
        }
    })
    .on("message", (msg: Message) => {
        // 接收到文字消息时转给天行机器人，调用天行机器人接口并回复结果
        switch (msg.type()) {
            case Message.Type.Text: {
                TXRobot(msg.text(), msg.from()?.id)
                    .then((replay) => {
                        msg.from()?.say(replay);
                    })
                    .catch((e) => {
                        console.log("catch err", e);
                        msg.from()?.say(error_text);
                    });
            }
        }
    })
    .on("logout", (user: Contact, reason?: string) => {
        console.log(`logout user: ${user}, reason : ${reason}`);
    })
    .start()
    .catch((e) => {
        console.log(e);
    });
