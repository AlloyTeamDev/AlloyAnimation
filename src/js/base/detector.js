/**
浏览器检测、特性检测等各种检测
@module
**/
define([
    'exports',
    'underscore'
], function(
    exports,
    _
){
    var vendorPrefix = (function(){
        var styles = window.getComputedStyle(document.documentElement, ''),
            pre = (Array.prototype.slice
                .call(styles)
                .join('') 
                .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
            )[1],
            dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
        return {
            dom: dom,
            lowercase: pre,
            css: '-' + pre + '-',
            js: pre[0].toLowerCase() + pre.substr(1)
        };
    })();

    /**
    获取浏览器厂商前缀的各种形式
    @return {Object}
    **/
    exports.vendorPrefix = function(){
        // 浅拷贝，避免 `vendorPrefix` 对象的属性被修改
        return _.clone(vendorPrefix);
    };

    /**
    获取一个css属性名的支持的格式，即如果需要的话，添加浏览器厂商前缀
    @param prop {String} css属性名的js格式，比如 `transformOriginX`
    @return {String} 所支持的格式
    **/
    exports.validFormOf = function(prop){
        var div = document.createElement('div'),
            supportedProp, vendorProp;

        if(prop in div.style){
            supportedProp = prop;
        }
        else{
            vendorProp = vendorPrefix.js + prop[0].toUpperCase() + prop.slice(1);
            if(vendorProp in div.style){
                supportedProp = vendorProp;
            }
        }
        div = null;
        return supportedProp;
    };
});
