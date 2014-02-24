/**
动作model
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
        Action;

    /**
    @class Action
    @extends Backbone.Model
    **/
    Action = Backbone.Model.extend({
        // 约定这些默认字段就是动作model的全部字段（除了id）
        defaults: {
            name: 'action'
        },

        initialize: function(){
            // 创建动作id
            id = createId();
            this.set('id', id);
            console.debug('A new action model %s is created', id);

            // 为变化打log
            this.on('change', this._onChange);

            ++Action._actionCount;
            // 设置默认的动作名
            this.set('name', 'action' + Action._actionCount);
        },
        
        _onChange: function(model, options){
            console.debug(
                'Action model %s changed attributes: %O',
                model.get('id'), model.changed
            );
        }
    }, {
        // 动作实例的数量
        _actionCount: 0
    });

    return Action;
})
