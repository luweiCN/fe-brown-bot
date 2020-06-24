// bot.ts
import { Contact, Message, Wechaty } from "wechaty";
import { ScanStatus } from "wechaty-puppet";
import { PuppetPadplus } from "wechaty-puppet-padplus";
import QrcodeTerminal from "qrcode-terminal";
import { puppetPadplusToken } from "../constant";
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
    if (status === ScanStatus.Waiting) {
        QrcodeTerminal.generate(qrcode, {
            small: true,
        });
    }
})
    .on("login", (user: Contact) => {
        console.log(`login success, user: ${user}`);
    })
    .on("message", (msg: Message) => {
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
    .on("friendship", async (friendship) => {
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
    .on("logout", (user: Contact, reason?: string) => {
        console.log(`logout user: ${user}, reason : ${reason}`);
    })
    .start();
