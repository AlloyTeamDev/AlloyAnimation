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

        // 监听model/collection上的事件
        boneCollection.on('add', function(model, collection, options){
            scenePanelView.addBone(model.toJSON());
        });

        /**
        Fired when click add button of scene panel
        @event clickAddBtn
        @param {String} textureUrl texture image's url
        @param {Object} [options] optional param
            @param {Object} [options.addOptions] optional param for adding bone model
        **/
        scenePanelView.on('clickAddBtn', function(textureUrl, options){
            addBoneModel(textureUrl, options && options.addOptions);
        });
    };


    /**
    添加一个骨骼model到collection中
    @private
    @param <String> textureUrl 骨骼纹理图的url
    @param <Object> [options] 添加model时的可选参数
        @param <Boolean> [options.add]
        @param <Boolean> [options.remove]
        @param <Boolean> [options.merge]
    **/
    function addBoneModel(textureUrl, options){
        boneCollection.add({
            textureUrl: textureUrl
        }, options && options.addOptions);
    };
});
