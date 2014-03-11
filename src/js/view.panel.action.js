/**
动作面板的view
@module
**/
define([
    'view.panel',
    'tmpl!html/panel.action.html', 'tmpl!html/panel.action.action.html'
], function(
    Panel,
    panelTmpl, actionTmpl
){
    var ActionPanel;

    /**
    @class ActionPanel
    @extends Panel
    **/
    ActionPanel = Panel.extend({
        el: '#js-actionPanel',

        initialize: function(){
            // 复用父类的`initialize`方法
            ActionPanel.__super__.initialize.apply(this, arguments);

            this._actionHash = {};
            // 激活骨骼的数据
            this._activeAction = null;
        },

        render: function(actions){
            // 渲染空面板
            this.$el
                .html( panelTmpl() );

            // 缓存DOM元素
            this._$bd = this.$el.children('.bd');
        },

        /**
        添加一个动作到动作面板中
        **/
        addAction: function(actionData){
            this._actionHash[actionData.id] = actionData;
            this._$bd.append( actionTmpl({
                id: actionData.id,
                name: actionData.name
            }) );
            return this;
        },

        /**
        将激活动作切换为指定的动作
        @param {String} id
        @param {Object} [options]
            @param {Boolean} [options.silentChangedActiveAction=false]
                不触发 `changedActiveBone` 事件
        **/
        changeActiveAction: function(id, options){
            var action;

            options = options || {};

            if( (action = this._actionHash[id]) ){
                this._activeAction = action;
                this._$bd
                    .find('#js-action-' + action.id)
                    .addClass('js-active');

                if(!options.silentChangedActiveAction){
                    this.trigger('changedActiveAction', id, options);
                }
            }
            else{
                console.warn(
                    'Panel %s tries to activate action %s but it doesnot have this action',
                    this.panelName, id
                );
            }
        },

        /**
        如果有激活骨骼，返回激活骨骼的id，否则返回空字符串
        **/
        getActiveActionId: function(){
            if(this._activeAction){
                return this._activeAction.id;
            }
            else{
                console.warn(
                    'Panel %s tries to get active action id while it has no active action',
                    this.panelName
                );
                return '';
            }
        },

        events: {
            'input .js-action': '_onInputActionName'
        },

        _onInputActionName: function($event){
            var $target = $($event.target),
                actionId = $target.data('action-id'),
                actionName = $target.val().trim();

            console.debug('Panel %s changed action %s name to %s',
                this.panelName, actionId, actionName
            );

            this.trigger(
                'updatedActionData',
                actionId,
                {
                    name: actionName
                }
            );
        }
    });

    return new ActionPanel({panelName: 'action'});
});
