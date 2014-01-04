/**
关键帧model
@module
**/
define([
    'Backbone.Relational', 'relationalScope',
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
        defaults: {
            time: 0, // 关键帧所在的时刻
            // 处于此关键帧时，骨骼及其纹理的各种数据：
            width: 100,
            height: 100,
            x: 0,
            y: 0,
            z: 0,
            jointX: 0,
            jointY: 0,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            alpha: 1
        },
        initialize: function(){
            var id;

            id = util.createId();
            this.set('id', id);
            console.debug('Create a keyframe model with time %s', this.get('time'));
        }
        /**
        End: backbone内置属性/方法
        **/
    });

    relationalScope.KeyframeModel = KeyframeModel;

    return KeyframeModel;
})
