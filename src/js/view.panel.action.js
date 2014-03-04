/**
动作面板的view
@module
**/
define([
    'jquery',
    'view.panel'
], function(
    $,
    Panel
){
    var ActionPanel;

    /**
    @class ActionPanel
    @extends Panel
    **/
    ActionPanel = Panel.extend({
        el: $('#js-actionPanel'),
        initialize: function(){
            // 复用父类的`initialize`方法
            ActionPanel.__super__.initialize.apply(this, arguments);
        },
        render: function(){
            this.$el
                .html( this.panelTmpl({
                    type: 'action',
                    title: '动作'
                }) );
        },

        addAction: function(actionData){
            this._activeAction = actionData;
            return this;
        },

        getActiveActionId: function(){
            return this._activeAction.id;
        }
    });

    return new ActionPanel({panelName: 'action'});
});
