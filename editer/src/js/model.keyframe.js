/**
关键帧model
@module
**/
define([
    'backbone.relational', 'relationalScope',
    'modelUtil'
], function(
    Backbone, relationalScope,
    util
){
    var KeyframeModel;

    /**
    @class KeyframeModel
    @extends Backbone.RelationalModel
    **/
    KeyframeModel = Backbone.RelationalModel.extend({
        /**
        Start: backbone内置属性/方法
        **/
        idAttribute: 'time',
        defaults: {
            // 以下属性，类型全为数值
            // TODO: 验证所设置的值是否为数值
            // 关键帧所在的时刻
            time: 0,
            // 处于此关键帧时，骨骼及其纹理的各种数据：
            w: 100,
            h: 100,
            jointX: 0,
            jointY: 0,
            x: 0,
            y: 0,
            z: 0,
            rotate: 0,
            opacity: 1
        },
        initialize: function(){
            console.debug('Create a keyframe model with time %s', this.get('time'));
        }
        /**
        End: backbone内置属性/方法
        **/
    });

    relationalScope.KeyframeModel = KeyframeModel;

    return KeyframeModel;
})
