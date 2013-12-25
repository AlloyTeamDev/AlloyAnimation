define([
    'exports'
], function(exports){
    /**
    给css属性名添加浏览器厂商前缀
    @param {String} prop 属性名
    @param {String} val 属性值
    **/
    exports.prefix = function(prop, val){
        var cssRules = {};
        cssRules['-webkit-' + prop] = val;
        cssRules['-moz-' + prop] = val;
        cssRules['-ms-' + prop] = val;
        cssRules[prop] = val;
        return cssRules;
    };
});
