/**
整个WebApp中唯一的controller。
实现view与view之间、model与view之间的解耦，并避免循环依赖
@module controller
**/
define([
    'exports',
    'view.panel.action', 'view.panel.scene', 'view.panel.boneTree', 'view.panel.timeline',
    'collection.Skeleton'
], function(
    exports,
    actionPanelView ,scenePanelView, boneTreePanelView, timelinePanelView,
    SkeletonCollection
){
    var allSkeletonColl,
        handler;

    // 所有骨架的collection
    allSkeletonColl = new SkeletonCollection();

    /**
    整个WebApp的初始化
    @method init
    **/
    exports.init = function(){
        var initSkeletonsData;

        // 获取初始数据
        allSkeletonColl.fetch();
        initSkeletonsData = allSkeletonColl.toJSON();

        // 渲染出各个面板
        actionPanelView.render();
        scenePanelView.render(initSkeletonsData);
        boneTreePanelView.render(initSkeletonsData);
        timelinePanelView.render(initSkeletonsData);
        initSkeletonsData = null;

        /**
        Start: backbone内置事件
        **/
        allSkeletonColl.on('add', handler.onAddSkeletonModel);
        allSkeletonColl.on('remove', handler.onRemoveSkeletonModel);
        /**
        End: backbone内置事件
        **/

        /**
        Fired when click add button of scene panel
        @event clickAddBtn
        @param {String} textureUrl texture image's url
        @param {Object} [options] optional param
            @param {Object} [options.addOptions] backbone's optional param for adding model to collection
        **/
        scenePanelView.on('clickAddBtn', handler.onClickScenePanelAddBtn);
    };

    /**
    监听一个骨骼model实例上的事件
    @param {BoneModel} boneModel 要监听的骨骼model实例
    **/
    function monitorBoneModel(boneModel){
        boneModel
            .on('change', handler.onChangeBoneModel)
            .on('destroy', handler.onDestroyBoneModel);
        monitorKeyframeColl(boneModel.get('keyframes'));
    }
    /**
    解除监听一个骨骼model实例上的事件
    @param {BoneModel} boneModel 要解除监听的骨骼model实例
    **/
    function unmonitorBoneModel(boneModel){

    }

    /**
    监听一个关键帧collection上的事件
    @param {KeyframeCollection} keyframeColl 要监听的关键帧collection
    **/
    function monitorKeyframeColl(keyframeColl){
        // 监听此关键帧集合中已有的、以后添加的关键帧model的事件
        keyframeColl.forEach(function(keyframeModel){
            monitorKeyframeModel(keyframeModel);
        });
        keyframeColl.on('add', handler.onAddKeyFrameModel);
    }
    /**
    解除监听一个关键帧collection上的事件
    @param {KeyframeCollection} keyframeColl 要解除监听的关键帧collection
    **/
    function unmonitorKeyframeColl(keyframeColl){

    }

    /**
    监听一个关键帧model上的事件
    @param {KeyframeModel} keyframeModel 要解除监听的关键帧model
    **/
    function monitorKeyframeModel(keyframeModel){
        keyframeModel.on('change', handler.onChangeKeyframeModel);
    }
    /**
    解除监听一个关键帧model上的事件
    @param {KeyframeModel} keyframeModel 要解除监听的关键帧model
    **/
    function unmonitorKeyframeModel(keyframeModel){

    }


    // 各种事件的回调函数
    handler = {
        /****** model/collection event handler ******/
        /**
        @triggerObj {SkeletonCollection} 此事件回调仅用于 `allSkeletonColl` 这个实例上
        @event add 当骨架collection中添加新骨架时触发
        **/
        onAddSkeletonModel: function(skeletonModel, allSkeletonColl, options){
            var boneId, boneModel,
                skeletonData;

            // 在骨架现有的、以后添加的骨骼model上绑定事件监听
            skeletonModel
                .getBone()
                .forEach(function(boneModel){
                    monitorBoneModel(boneModel);
                });
            skeletonModel.on('addBone', handler.onAddBoneModel);

            skeletonData = skeletonModel.toJSON();
            // 在各个面板中添加此骨架对应的view
            scenePanelView.addSkeleton(skeletonData);
            // TODO: 给其它面板也添加骨架
            // boneTreePanelView.addSkeleton(skeletonData);
            // timelinePanelView.addTimeline(skeletonData);
        },
        /**
        @triggerObj {SkeletonCollection} 此事件回调仅用于 `allSkeletonColl` 这个实例上
        @event remove 当骨架collection中移除骨架时触发
        **/
        onRemoveSkeletonModel: function(skeletonModel, allSkeletonColl, options){

        },

        /**
        @triggerObj {SkeletonModel}
        @event addBone 当骨架中添加骨骼时触发
        @param {BoneModel} boneModel 所添加的骨骼
        @param {SkeletonModel} skeletonModel 骨骼被添加到的骨架
        @param {Object} [options]
        **/
        onAddBoneModel: function(boneModel, skeletonModel, options){
            monitorBoneModel(boneModel);

            // 在各个面板中添加此骨骼对应的view
            scenePanelView
                .getSkeleton(skeletonModel.get('id'))
                .addBone(boneModel.toJSON(), options);
            // TODO: 给其他面板也添加骨骼view
        },


        /****** view event handler ******/
        onClickScenePanelAddBtn: function(textureUrl, options){
            allSkeletonColl.add({
                textureUrl: textureUrl
            }, options && options.addOptions);
        }
    };
});
