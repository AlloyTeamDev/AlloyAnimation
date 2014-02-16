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
    var createId = util.createId,
        Keyframe;

    /**
    @class Keyframe
    @extends Backbone.RelationalModel
    **/
    Keyframe = Backbone.RelationalModel.extend({
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
            // 创建骨骼id
            id = createId();
            this.set('id', id);
            console.debug('A new keyframe model %s is created', id);

            // 为变化打log
            this.on('change', this._onChange);
        },
        
        _onChange: function(model, options){
            console.debug(
                'Keyframe model %s changed attributes: %O',
                model.get('id'), model.changed
            );
        }
    });

    relationalScope.Keyframe = Keyframe;

    return Keyframe;
})
