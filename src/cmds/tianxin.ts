import { tianxinApiKey } from "../../constant";
import axios from "axios";
import { error_text } from "../common/constant";
import querystring from "querystring";

/**
 * 天行机器人
 * @param {string} question 提问
 * @param {number} [restype=0] 输入类型，文本0[默认]、语音1、人脸2、其他3
 * @param {number} [datatype=0] 返回类型，文本0[默认]、语音1
 * @returns
 */
export const TXRobot = (
    question: string,
    userid?: string,
    restype?: number,
    datatype?: number
): Promise<string> => {
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
