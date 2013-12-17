/**
整个WebApp中唯一的controller。
实现view与view之间、model与view之间的解耦，并避免循环依赖
@module controller
**/
define([
    'exports',
    'view.panel.action', 'view.panel.Scene', 'view.panel.boneTree', 'view.panel.timeline','view.Bone',
    'collection.bone','model.Bone'
], function(
    exports,
    actionPanelView, scenePanelView, boneTreePanelView, timelinePanelView,BoneView,
    boneCollection, BoneModel
){

    /** 整个WebApp的初始化 **/
    exports.init = function(){
        // 渲染出各个面板
        actionPanelView.render();
        scenePanelView.render();
        boneTreePanelView.render();
        timelinePanelView.render();
    };  

});
