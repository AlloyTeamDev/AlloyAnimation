/**
整个WebApp中唯一的controller。
实现view与view之间、model与view之间的解耦，并避免循环依赖
@module controller
**/
define([
    'exports',
    'view.panel.action', 'view.panel.scene', 'view.panel.boneTree', 'view.panel.timeline',
    'collection.bone'
], function(
    exports,
    actionPanelView ,scenePanelView, boneTreePanelView, timelinePanelView,
    boneCollection
){
    var scenePanelView;

    /**
    整个WebApp的初始化
    @method init
    **/
    exports.init = function(){
        // 渲染出各个面板
        actionPanelView.render();
        scenePanelView.render();
        boneTreePanelView.render();
        timelinePanelView.render();

        /**
        Start: backbonen内置事件
        **/
        boneCollection.on('add', function(model, collection, options){
            var boneData = model.toJSON();

            // 在各个面板中添加一个骨骼view
            scenePanelView.addBone(boneData);
            boneTreePanelView.addBone(boneData);
            timelinePanelView.addTimeline(boneData.keyframes || []);
        });
        /**
        End: backbonen内置事件
        **/

        /**
        Fired when click add button of scene panel
        @event clickAddBtn
        @param {String} textureUrl texture image's url
        @param {Object} [options] optional param
            @param {Object} [options.addOptions] backbone's optional param for adding model to collection
        **/
        scenePanelView.on('clickAddBtn', function(textureUrl, options){
            boneCollection.add({
                textureUrl: textureUrl
            }, options && options.addOptions);
        });
    };
});
