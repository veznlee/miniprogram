/** pages/comment/comment.js **/

// 获取服务器接口地址
const api = require('../../config/config.js');
// 获取app应用实例
const app = getApp();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        bookInfo: {},
        comment: ''
    },

    /**
     * 用户输入评论
     */
    inputComment: function(ev) {
        let that = this;
        that.setData({
            comment: ev.detail.value
        });
    },

    /**
     * 检查输入是否为空
     */
    checkEmpty: function(input) {
        return input === '';
    },

    /**
     *  检查用户是否输入了非法字符
     */
    checkIllegal: function(input) {
        let patern = /[`#^<>:"?{}\/;'[\]]/im;
        let _result = patern.test(input);
        return _result;
    },

    /**
     * 检查用户输入
     */
    checkUserInput: function() {
        /*
         * 检测用户输入
         * 1. 是否包含非法字符
         * 2. 是否为空
         * 3. 是否超出长度限制
         */
        let that = this;
        let comment = that.data.comment;
        let showToastFlag = false;
        let toastWording = '';

        if (that.checkEmpty(comment)) {
            showToastFlag = true;
            toastWording = '输入不能为空';
        } else if (that.checkIllegal(comment)) {
            showToastFlag = true;
            toastWording = '含有非法字符';
        } else if (comment.length > 140) {
            showToastFlag = true;
            toastWording = '长度超出限制';
        }

        if (showToastFlag) {
            that.showInfo(toastWording);
            return false;
        } else {
            return true;
        }
    },

    /**
     * 提交评论内容
     */
    submitComment: function(ev) {
        
        let that = this;
        
        let formId = ev.detail.formId;
        // 要获得真实有效的 formId 需要在真机上运行，formid用于向用户推送消息
        console.log(formId); // the formId is a mock one
        
        if (that.checkUserInput()) {

            console.log('submit!');

            let requestData = {
                skey: app.getLoginFlag(),
                content: that.data.comment,
                bookid: that.data.bookInfo.id,
                formid: formId
            };

            wx.request({
                url: api.commentUrl,
                method: 'POST',
                data: requestData,
                success: function(res) {
                    // 接口返回成功
                    if (res.data.result == 0) {
                        that.showInfo('评论成功', 'success', function() {
                            wx.setStorageSync('isFromBack', '1');
                            // 返回上一层
                            setTimeout(function() {
                                wx.navigateBack({
                                    delta: 1
                                });
                            }, 1500);
                        });
                    } else {
                        console.log(res.data);
                        that.showInfo(res.data.errmsg);
                    }

                },
                fail: function(error) {
                    that.showInfo('请求失败');
                }
            });
        }
    },


    /**
     *  封装 wx.showToast
     */
    showInfo: function(info, icon = 'none', callback = () => {}) {
        wx.showToast({
            title: info,
            icon: icon,
            duration: 1500,
            mask: true,
            success: callback
        });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let _bookInfo = {};

        for (let key in options) {
            _bookInfo[key] = decodeURIComponent(options[key]);
        }

        console.log(_bookInfo);

        this.setData({
            bookInfo: _bookInfo
        });
    },


    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        console.log('current page is onReady');

        //获得dialog组件
        this.dialog = this.selectComponent("#dialog");
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        console.log('current page is onShow');
    },



    /**========================================
     *        以下内容为自定义组件测试使用       *
    ========================================== */
    showDialog() {
      this.dialog.showDialog();
    },

    //取消事件
    _cancelEvent() {
      console.log('你点击了取消');
      this.dialog.hideDialog();
    },
    //确认事件
    _confirmEvent() {
      console.log('你点击了确定');
      this.dialog.hideDialog();
    }
});