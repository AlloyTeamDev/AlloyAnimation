/**
 * 面板视图
**/
define([
    'Backbone',
    'tmpl!html/panel.html'
], function(
    Backbone,
    panelTmpl
){
    var PanelView;

    /**
     * 继承类 `Backbone.View`
    **/
    PanelView = Backbone.View.extend({
        /**
         * 自定义的初始化方法，会在默认的构造函数中被调用
         *
         * @method initialize
         * @param {Object} [options]
         *      @param {DOMElement|String} [options.container]
        **/
        initialize: function(options){
            var container;

            options = options || {};
            if(_.has(options, 'container')){
                container = options.container
                // TODO: 改成判断是否为DOMElement
                if(_.isObject(container)){
                    this.$container = $(container);
                }
                else if(_.isString(container)){
                    this.$container = $(container);
                }
            }
            if(!this.$container) this.$container = $('body');
        }
    });

    return PanelView;
});
