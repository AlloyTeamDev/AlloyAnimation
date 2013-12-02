/**
 * 景物面板视图
 * 景物面板相当于flash pro里的编辑栏窗口
 *
 * @module view.panel.Scene
**/
define([
    'underscore',
    'view.Panel', 'tmpl!html/panel.html'
], function(
    _,
    PanelView, panelTmpl
){
    var ScenePanelView;

    /**
     * @class ScenePanelView
     * @extends PanelView
    **/
    ScenePanelView = PanelView.extend({
        /**
         * Start: backbone内置属性/方法
        **/
        attribute: {
            'class': 'scenePanel'
        },
        initialize: function(options){
            // 借用父类的`initialize`方法
            this.constructor.__super__.initialize.apply(this, arguments);
        },
        render: function(){
            this.$el
                .html( panelTmpl({
                    title: '景物面板',
                    type: 'scene'
                }) )
                .appendTo(this.$container);

            return this;
        }
        /**
         * End: backbone内置属性/方法
        **/
    });

    return new ScenePanelView();
});
