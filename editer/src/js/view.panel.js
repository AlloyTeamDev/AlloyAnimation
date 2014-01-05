/**
面板view
@module
**/
define([
    'backbone',
    'tmpl!html/panel.html'
], function(
    Backbone,
    panelTmpl
){
    var PanelView;

    /**
    @class PanelView
    @extends Backbone.View
    **/
    PanelView = Backbone.View.extend({
        /**
        Start: backbone内置属性/方法
        **/
        /**
        自定义的初始化方法，会在默认的构造函数中被调用
        @method initialize
        **/
        initialize: function(){
            if(!this.$el.hasClass('js-panel')){
                this.$el.addClass('js-panel');
            }
        },
        /**
        End: backbone内置属性/方法
        **/

        panelTmpl: panelTmpl
    });

    return PanelView;
});
