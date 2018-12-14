const http = require('axios');
const crypto = require('crypto');
const { appConfig: config } = require('../conf/app');
const { decryptByAES, encryptSha1 } = require('../util/util');
const { saveUserInfo } = require('../controllers/users');
/**
 * 登录校验中间件
 */
function authorizeMiddleware(req, res, next) {
    return authMiddleware(req).then(function(result) {
        // 将结果存入响应信息的'auth_data'字段
        console.log(result);
        res['auth_data'] = result;
        return next();
    })
}


/**
 * 请求微信服务登录
 */
function authMiddleware (req) {
    const {
        appid,
        secret
    } = config;

    const {
        code,
        encryptedData,
        iv
    } = req.query;

    // 检查参数完整性
    if ([code, encryptedData, iv].some(item => !item)) {
        return {
            result: -1,
            errmsg: '缺少参数字段，请检查后重试'
        }
    }

    // 获取 session_key和 openid
    return getSessionKey(code, appid, secret)
        .then(resData => {
            // 选择加密算法生成自己的登录态标识
            const { session_key } = resData;
            const skey = encryptSha1(session_key);

            let decryptedData = JSON.parse(decryptByAES(encryptedData, session_key, iv));
            console.log('-------------decryptedData---------------');
            // console.log(decryptedData);
            console.log('-------------decryptedData---------------');
            
            // 存入用户数据表中
            return saveUserInfo({
                userInfo: decryptedData,
                session_key,
                skey
            })
        })
        .catch(err => {
            return {
                result: -3,
                errmsg: JSON.stringify(err)
            }
        })
}
/**
 * code2Session，登录凭证校验。通过 wx.login() 接口获得临时登录凭证 code 后传到开发者服务器调用此接口完成登录流程
 * 请求地址 GET https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
    返回的 JSON 数据包
    属性	类型	说明	最低版本
    openid	string	用户唯一标识	
    session_key	string	会话密钥	
    unionid	string	用户在开放平台的唯一标识符，在满足 UnionID 下发条件的情况下会返回，详见 UnionID 机制说明。	
    errcode	number	错误码	
    errmsg	string	错误信息} code 

 * 获取当前用户session_key
 * 
 * @param {*用户临时登录凭证} code 
 * @param {*小程序appid} appid 
 * @param {*小程序密钥} appSecret 
 */
function getSessionKey (code, appid, appSecret) {
    
    const opt = {
        method: 'GET',
        url: 'https://api.weixin.qq.com/sns/jscode2session',
        params: {
            appid: appid,
            secret: appSecret,
            js_code: code,
            grant_type: 'authorization_code' // 固定值
        }
    };
   
    return http(opt).then(function (response) {
        const data = response.data;
        
        if (!data.openid || !data.session_key || data.errcode) {
            return {
                result: -2,
                errmsg: data.errmsg || '返回数据字段不完整'
            }
        } else {
            return data
        }
    });
}
module.exports = {
    authorizeMiddleware
}