/**
动作面板的view
@module
**/
define([
    'jquery',
    'view.panel'
], function(
    $,
    PanelView
){
    var ActionPanelView;

    /**
    @class ActionPanelView
    @extends PanelView
    **/
    ActionPanelView = PanelView.extend({
        /**
        Start: backbone内置属性/方法
        **/
        el: $('#js-actionPanel'),
        initialize: function(){
            // 复用父类的`initialize`方法
            this.constructor.__super__.initialize.apply(this, arguments);
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

    return new ActionPanelView();
});
