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
        初始化方法，会在默认的构造函数中被调用
        @method initialize
        **/
        initialize: function(attr){
            attr = attr || {};

            this.panelName = attr.panelName || 'no-name';

            if(!this.$el.hasClass('js-panel')){
                this.$el.addClass('js-panel');
            }
        },

        // @public
        panelName: null,

        panelTmpl: panelTmpl
    });

    return PanelView;
});
