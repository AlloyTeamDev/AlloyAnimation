/**
关键帧model
@module
**/
define([
    'backbone',
    'modelUtil'
], function(
    Backbone,
    util
){
    var createId = util.createId,
        Keyframe;

    /**
    @class Keyframe
    @extends Backbone.Model
    **/
    Keyframe = Backbone.Model.extend({
        defaults: {
            // 以下属性，类型全为数值
            w: 100,
            h: 100,
            x: 0,
            y: 0,
            z: 0,
            rotate: 0,
            opacity: 1,
            jointX: 0,
            jointY: 0
        },

        /**
        @param {Object} attributes
            @param {String} attributes.action 所属的动作的id
            @param {String} attributes.bone 所属的骨骼的id
            @param {String} attributes.time 所处的时刻
            一个关键帧由动作、骨骼、时间三个维度共同确定
        **/
        initialize: function(attributes, options){
            // 构造函数中已经把 `attributes` 设置进model中

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

    return Keyframe;
})
