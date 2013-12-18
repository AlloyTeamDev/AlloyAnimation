/**
针对model的util
@module
**/
define([
    'require', 'exports', 'module'
], function(
    require, exports, module
){
    /**
    使用随机数和当前时间戳作为因子生成id。
    id的长度不一定。用程序连续生成id，一般到80000次左右会出现重复
    **/
    exports.createId = function(){
        var t = (new Date()).getTime(),
            id = (parseInt(Math.random() * (Math.pow(10, t.toString().length) - 1)) ^ t);
        return Math.abs(id).toString(16);
    }
});
