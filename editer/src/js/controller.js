/**
 * 整个WebApp中唯一的controller。
 * 实现view与view之间、model与view之间的解耦，并避免循环依赖
 *
 * @module controller
**/
define([
    'exports',
    'view.panel.Scene'
], function(
    exports,
    ScenePanelView
){
    var scenePanelView;

    /**
     * 整个WebApp的初始化
     *
     * @method init
    **/
    exports.init = function(){
        (scenePanelView = new ScenePanelView())
            .render();
    };
});
