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
        /**
        Start: backbone内置属性/方法
        **/
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
        }
        /**
        End: backbone内置属性/方法
        **/
    });

    return new ActionPanel({panelName: 'action'});
});
