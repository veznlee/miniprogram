//index.js
//获取应用实例
const app = getApp()

/*
 * wx.canIUse(string) 
 * 返回值 boolean 当前版本是否可用
 * 使用 ${API}.${method}.${param}.${options} 或者 ${component}.${attribute}.${option} 方式来调用
 * 
 * ${API} 代表 API 名字
   ${method} 代表调用方式，有效值为return, success, object, callback
   ${param} 代表参数或者返回值
   ${options} 代表参数的可选值
   ${component} 代表组件名字
   ${attribute} 代表组件属性
   ${option} 代表组件属性的可选值
 */

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo') 
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  onShow: function () {
    console.log(this.route)
  },
  getUserInfo: function (e) {
    console.log(e);
    app.globalData.userInfo = e.detail.userInfo;
    let detail = e.detail;
    var obj = {
      iv: detail.iv,
      signature: detail.signature,
      rawData: JSON.parse(detail.rawData),
      encryptedData: detail.encryptedData
    };
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    });

    wx.getUserInfo({
      withCredentials: true, // 非必填, 默认为true

      success: function (infoRes) {
        console.log(infoRes, '>>>')
      },
      fail: function(){

      }
    })

    // wx.request({
    //   url: api.loginUrl,

    //   data: {
    //     iv: detail.iv,
    //     signature: detail.signature,
    //     rawData: JSON.parse(detail.rawData),
    //     encryptedData: detail.encryptedData
    //   },

    //   success: function (res) {
    //     console.log('login success');
    //     res = res.data;
    //     console.log(res);
    //     if (res.result == 0) {
    //       that.globalData.userInfo = res.userInfo;
    //       wx.setStorageSync('userInfo', JSON.stringify(res.userInfo));
    //       wx.setStorageSync('loginFlag', res.skey);
    //       callback();
    //     } else {
    //       that.showInfo(res.errmsg);
    //     }
    //   },

    //   fail: function (error) {
    //     // 调用服务端登录接口失败
    //     that.showInfo('调用接口失败');
    //     console.log(error);
    //   }
    // });
  },
  // 打开授权设置
  openSetting: function(e) {
    // 设置完成返回时能拿到设置信息
    console.log(e.detail.authSetting);
  },
  getSettingInfo:function() {
    console.log(0);
    wx.getSetting({
      success(res) {
        console.log(res);
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success() {
              // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
              wx.startRecord()
            }
          })
        }
      }
    })
  },
  toBooks() {
    // 带有tabbar的页面只能用switchTab跳转
    wx.switchTab({
      url: '/pages/books/books'
    })
  }
})

// wx.authorize(Object object)
// 基础库 1.2.0 开始支持，低版本需做兼容处理。
// 提前向用户发起授权请求。调用后会立刻弹窗询问用户是否同意授权小程序使用某项功能或获取用户的某些数据，但不会实际调用对应接口。如果用户之前已经同意授权，则不会出现弹窗，直接返回成功。

// 可以通过 wx.getSetting 先查询一下用户是否授权了 "scope.record" 这个 scope
// wx.getSetting({
//   success(res) {
//     if (!res.authSetting['scope.record']) {
//       wx.authorize({
//         scope: 'scope.record',
//         success() {
//           // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
//           wx.startRecord()
//         }
//       })
//     }
//   }
// })

/**
  scope.userInfo	wx.getUserInfo	用户信息
  scope.userLocation	wx.getLocation, wx.chooseLocation	地理位置
  scope.address	wx.chooseAddress	通讯地址
  scope.invoiceTitle	wx.chooseInvoiceTitle	发票抬头
  scope.invoice	wx.chooseInvoice	获取发票
  scope.werun	wx.getWeRunData	微信运动步数
  scope.record	wx.startRecord	录音功能
  scope.writePhotosAlbum	wx.saveImageToPhotosAlbum, wx.saveVideoToPhotosAlbum	保存到相册
  scope.camera	<camera /> 组件	摄像头
 */