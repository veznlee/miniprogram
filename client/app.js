//app.js
const api = require('./config/config.js');

App({
    // 小程序启动生命周期
    onLaunch: function () {
        let that = this;
        // 检查登录状态
        that.checkLoginStatus();
    },

    // 检查本地 storage 中是否有登录态标识
    checkLoginStatus: function () {
        let that = this;
        let loginFlag = wx.getStorageSync('loginFlag');
        console.log('登录态',loginFlag);
        if (loginFlag) {
            // 检查登录态是否过期。通过 wx.login 接口获得的用户登录态拥有一定的时效性。
            // 登录态过期后开发者可以再调用 wx.login 获取新的用户登录态。调用成功说明当前 session_key 未过期，调用失败说明 session_key 已过期。
            wx.checkSession({
                // session_key 有效(未过期)
                success: function () {
                    console.log('session_key 有效(未过期)');
                    // 直接从Storage中获取用户信息
                    let userStorageInfo = wx.getStorageSync('userInfo');
                    if (userStorageInfo) {
                        that.globalData.userInfo = JSON.parse(userStorageInfo);
                    } else {
                        that.showInfo('缓存信息缺失');
                        console.error('登录成功后将用户信息存在Storage的userStorageInfo字段中，该字段丢失');
                    }
                },
                // session_key 过期
                fail: function () {
                    console.log('session_key过期');
                    // session_key过期
                    that.doLogin();
                }
            });
        } else {
            // 无登录态
            that.doLogin();
        }
    },

    // 登录动作
    doLogin: function (callback = () => {}) {
        let that = this;
        wx.login({ // 获取code，时效5分钟
            success: function (loginRes) {
                if (loginRes.code) {
                    console.log(loginRes.code);
                    /* 
                     * @desc: 获取用户信息 期望数据如下 
                     *
                     * @param: userInfo       [Object]
                     * @param: rawData        [String]
                     * @param: signature      [String]
                     * @param: encryptedData  [String]
                     * @param: iv             [String]
                     **/
                    wx.getUserInfo({
                        /*
                          是否带上登录态信息。
                          当 withCredentials 为 true 时，要求此前有调用过 wx.login 且登录态尚未过期，此时返回的数据会包含 encryptedData, iv 等敏感信息；
                          当 withCredentials 为 false 时，不要求有登录态，返回的数据不包含 encryptedData, iv 等敏感信息。
                        */ 
                        withCredentials: true, // 非必填, 默认为true

                        success: function (infoRes) {
                            console.log(infoRes,'>>>')
                            /* 请求服务端的登录接口，
                               服务端拿到这里传递的数据去请求微信接口，
                               微信接口返回session_key和openid给服务端，
                               服务端根据session_key和openid 返回登录态。
                            */
                            wx.request({
                                url: api.loginUrl,

                                data: {
                                    code: loginRes.code,                    // 临时登录凭证
                                    rawData: infoRes.rawData,               // 用户非敏感信息
                                    signature: infoRes.signature,           // 签名
                                    encryptedData: infoRes.encryptedData,   // 用户敏感信息
                                    iv: infoRes.iv                          // 解密算法的向量
                                },

                                success: function (res) {
                                    console.log('login success');
                                    res = res.data;
                                    console.log(res);
                                    if (res.result == 0) {
                                        that.globalData.userInfo = res.userInfo;
                                        wx.setStorageSync('userInfo', JSON.stringify(res.userInfo));
                                        wx.setStorageSync('loginFlag', res.skey);
                                        callback();
                                    } else {
                                        that.showInfo(res.errmsg);
                                    }
                                },

                                fail: function (error) {
                                    // 调用服务端登录接口失败
                                    that.showInfo('调用接口失败');
                                    console.log(error);
                                }
                            });
                        },

                        fail: function (error) {
                            // 获取 userInfo 失败，去检查是否未开启权限
                            console.log('获取用户信息失败');
                            wx.hideLoading();
                            that.checkUserInfoPermission();
                        }
                    });

                } else {
                    // 获取 code 失败
                    that.showInfo('登录失败');
                    console.log('调用wx.login获取code失败');
                }
            },

            fail: function (error) {
                // 调用 wx.login 接口失败
                that.showInfo('接口调用失败');
                console.log(error);
            }
        });
    },

    // 检查用户信息授权设置
    checkUserInfoPermission: function (callback = () => { }) {
        wx.getSetting({
            success: function (res) {
                console.log('获取用户授权信息成功');
                if (!res.authSetting['scope.userInfo']) { // 如果没授权获取用户信息
                    wx.openSetting({
                        success: function (authSetting) {
                            console.log(authSetting)
                        }
                    });
                }
            },
            fail: function (error) {
                console.log('获取用户授权信息失败');
                console.log(error);
            }
        });
    },


    // 获取用户登录标示 供全局调用
    getLoginFlag: function () {
        return wx.getStorageSync('loginFlag');
    },


    // 封装 wx.showToast 方法
    showInfo: function (info = 'error', icon = 'none') {
        wx.showToast({
            title: info,
            icon: icon,
            duration: 1500,
            mask: true
        });
    },

    // 获取书籍已下载路径
    getDownloadPath: function (key) {
        return wx.getStorageSync(key);
    },

    // 调用 wx.saveFile 将下载的文件保存在本地
    saveDownloadPath: function (key, filePath) {
        return new Promise((resolve, reject) => {
            wx.saveFile({
                tempFilePath: filePath,
                success: function (res) {
                    // 保存成功 在Storage中标记 下次不再下载
                    let savedFilePath = res.savedFilePath;
                    wx.setStorageSync(key, savedFilePath);
                    resolve(savedFilePath);
                },
                fail: function () {
                    reject(false);
                }
            });
        })
    },

    // 打开书籍
    openBook: function (filePath) {
        wx.openDocument({
            filePath: filePath,
            success: function (res) {
                console.log('打开文档成功')
            },
            fail: function (error) {
                console.log(error);
            }
        });
    },
    // app全局数据
    globalData: {
        userInfo: null
    }
});