const express = require('express');
const http = require('axios');
const config = require('./conf/app').appConfig;
const app = express();
const _ = require('./dao/query');

let nextTime = 0;
let timer;
let expires = 0;
let access_token = '';

/**
 access_token 的有效期通过返回的 expire_in 来传达，目前是7200秒之内的值，中控服务器需要根据这个有效时间提前去刷新。
 在刷新过程中，中控服务器可对外继续输出的老 access_token，此时公众平台后台会保证在5分钟内，新老 access_token 都可用，这保证了第三方业务的平滑过渡；
 
 access_token 的有效时间可能会在未来有调整，所以中控服务器不仅需要内部定时主动刷新，还需要提供被动刷新 access_token 的接口，
 这样便于业务服务器在API调用获知 access_token 已超时的情况下，可以触发 access_token 的刷新流程。
 
 */

/**
 * @desc    利用setTimeout定时器来刷新access-token接口调用凭据
 * @param   {*回调函数} fn 
 * @param   {*定时器间隔} time 
 */
function refreshAccessToken(fn, time) {
  
    const refreshToken = function() {
       fn(refreshToken);
    }
  
    timer = setTimeout(refreshToken, time);
}

/**
 * @desc 获取access-token接口调用凭据
 * @param {*回调} cb 
 */
function getAccessToken(cb) {
    // 清除上一个定时器
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }

    // 获取 access_token
    /**
    返回的 JSON 数据包
    属性	类型	说明	最低版本
    access_token	string	获取到的凭证	
    expires_in	number	凭证有效时间，单位：秒。目前是7200秒之内的值。	
    errcode	number	错误码	
    errmsg	string	错误信息 
    正常时返回：{"access_token": "ACCESS_TOKEN", "expires_in": 7200}
    错误时返回：{"errcode": 40013, "errmsg": "invalid appid"}*/

    const opt = {
        url: 'https://api.weixin.qq.com/cgi-bin/token',
        method: 'GET',
        params: {
            grant_type: 'client_credential', //固定值
            appid: config.appid,
            secret: config.secret
        }
    };

    http(opt)
    .then(function(response) {
        
        // console.log(response,'调用接口返回数据');
        console.log('调用接口返回数据');
        if(response && response.data && response.data.access_token) {
            // 拿到access_token，存表
            const resData = response.data;
            access_token = resData.access_token;
            expires = resData.expires_in || 0;

            return _.query('select count(*) as count from access');
        }
    })
    .then(function(response) {
        // console.log('查表数据', response);
        console.log('查表数据');
        if(response && response[0]) {
            if (response[0]['count'] === 0) {   // 首次获取，插入表中 
                return _.query('insert into access set ?', {
                    token: access_token,
                    expires: expires
                })
            } else {                            // 非首次获取，刷新token
                return _.query('update access set ?', {
                    token: access_token,
                    expires: expires
                })
            }
        }
    })
    .then(function(response) {
        if(response) {
            // 更新下次刷新的时间
            nextTime = (expires || 7200) * 1000;
            setTimeout(cb, nextTime);
        }
    })
    .catch(function(error) {
        // console.log('error is:', error);
        // 捕获错误后，设置下次刷新时间为30s后
        nextTime = 30*1000;
        timer = setTimeout(cb, nextTime);
    });
}

// 刷新access-token
refreshAccessToken(getAccessToken, 0);

module.exports = app;