# 十分钟实现一个微信聊天机器人

[![Powered by Wechaty](https://img.shields.io/badge/Powered%20By-Wechaty-green.svg)](https://github.com/chatie/wechaty)
[![Wechaty开源激励计划](https://img.shields.io/badge/Wechaty-开源激励计划-green.svg)](https://github.com/juzibot/Welcome/wiki/Everything-about-Wechaty)

## 背景

最近开始写自己的公众号《前端布朗熊》了，注意到有的的公众号有微信机器人可以实现拉人进群、踢人等自动化操作，也想给自己的公众号开发一个机器人来帮我处理一些自动化的重复任务。因此就对微信机器人技术进行了调研，发现了以下几个情况：

1. 微信禁止了新用户和一部分老用户的网页微信登录权限
2. 市面上现有的微信机器人 sdk 大部分是基于网页微信的 http 协议实现的
3. wechaty 是一个可以支持非 http 协议的 Chat Bot SDK，并且是一个使用 Typescript 构建的 Node.js 应用，可以使用 iPad 协议实现手机和服务端同时登录微信，并且最重要的即使是新注册的微信号，也可以使用 iPad 协议登录微信

我本人手头上的常用微信号需要登录 Mac 微信工作使用，因此不能拿来做机器人，而另一个微信小号也没有登录网页微信的权限，因此 wechaty 就成了我的首选

## 准备工作

-   获取 token：wechaty 使用 iPad 协议时需要 token，这个 token 可以购买也可以通过成为项目贡献者来得到一个长期可用的 token。对于第一次接触 wechaty 的开发者，可以申请一个为期 15 天的 token 来试用，然后 15 天之内向官方提交你的 wechaty 成果，待官方审核通过之后就可以获得一个长期 token
-   注册天行 API（购买一个月的基础套餐）：我们要让机器人能够实现执行一些简单的交互，就必须需要数据的支持。比如，想让机器人帮我们查询天气，那么就需要有天气数据供我们使用；那么这个数据可以使用公开的免费 API、自己写爬虫抓取等方式获得，我这边提供的方法是使用现成的天行 API；价格不贵而且除了天气还有笑话、故事等等 API 的使用权限。

## 写代码

1. 登录
2. 接收好友请求
3. 接收文字消息并调用天行机器人接口回复

> 代码中用到的`puppetPadplusToken`和`tianxinApiKey`分别是 wechaty 的 token 和天行接口的 api key 需要自己申请，然后按照项目中的`src/config-sample.ts`的格式创建`src/config.ts`并填写 wechaty 的 token 和天行接口的 api key

```javascript
import { Contact, Message, Wechaty } from "wechaty";
import { ScanStatus } from "wechaty-puppet";
import { PuppetPadplus } from "wechaty-puppet-padplus";
import QrcodeTerminal from "qrcode-terminal";
import { puppetPadplusToken, tianxinApiKey } from "./config";
import { TXRobot } from "./cmds/tianxin";
import { error_text, hello_text } from "./common/constant";
import querystring from "querystring";
import axios from "axios";

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

/**
 * 天行机器人
 * @param {string} question 提问
 * @param {number} [restype=0] 输入类型，文本0[默认]、语音1、人脸2、其他3
 * @param {number} [datatype=0] 返回类型，文本0[默认]、语音1
 * @returns
 */
const TXRobot = (
    question: string,
    userid?: string,
    restype?: number,
    datatype?: number
): Promise<string> => {
    // 使用axios请求天行机器人的接口就可以
    return axios({
        method: "post",
        url: "http://api.tianapi.com/txapi/robot/index",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        data: querystring.stringify({
            key: tianxinApiKey,
            question,
            userid: restype ?? "",
            restype: restype ?? 0,
            datatype: datatype ?? 0,
            voc: 3,
        }),
    }).then((res: any) => {
        if (res?.data?.code === 200) {
            switch (res.data.datatype) {
                case "text": {
                    return res.data.newslist?.[0]?.reply ?? error_text;
                }
            }
        } else {
            return Promise.reject(res?.data?.msg ?? error_text);
        }
    });
};
```

> [项目源码](https://github.com/luweiCN/fe-brown-bot)
>
> 完整代码我已经提交到 github 上了，大家只需要准备好 wechaty 的 token 和天行的 api key，然后再代码目录下执行`yarn && yarn start`就可以运行了。对了，需要提前安装好 node 环境和 yarn

## 实现效果

<img src="http://image.beyi.wang/darlk.mp4" style="zoom: 50%;" />

## 后续

以上只是一个 mvp 的机器人，后期我会完善自己的机器人，实现一些可以帮我提高效率的功能，后面的代码我都会把代码同步到这个仓库，保证所有的代码开源。
