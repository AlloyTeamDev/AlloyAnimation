/**
整个WebApp中唯一的controller。
实现view与view之间、model与view之间的解耦，并避免循环依赖
@module controller
**/
define([
    'exports',
    'view.panel.action', 'view.panel.workspace', 'view.panel.boneTree', 'view.panel.timeline',
    'collection.Skeleton'
], function(
    exports,
    actionPanelView, workspacePanelView, boneTreePanelView, timelinePanelView,
    SkeletonCollection
){
    var allSkeletonColl,
        handler;

    // 整个WebApp中所有骨架的collection
    allSkeletonColl = new SkeletonCollection();

    exports.init = function(){
        var initSkeletonsData;

        // 获取初始数据
        // TODO: 先注释掉这句，等实现本地服务器后再调用fetch获取初始数据
        // allSkeletonColl.fetch();
        initSkeletonsData = allSkeletonColl.toJSON();

        // 渲染出各个面板
        actionPanelView.render(initSkeletonsData);
        workspacePanelView.render(initSkeletonsData);
        boneTreePanelView.render(initSkeletonsData);
        timelinePanelView.render(initSkeletonsData);
        // 销毁引用，避免因为被事件回调函数的作用域链引用而没有释放内存
        initSkeletonsData = null;

        // 监听各种事件
        allSkeletonColl.on('add', handler.onAddSkeletonModel);
        allSkeletonColl.on('remove', handler.onRemoveSkeletonModel);
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
            workspacePanelView.addSkeleton(skeletonData);
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
            workspacePanelView
                .getSkeleton(skeletonModel.get('id'))
                .addBone(boneModel.toJSON(), options);
            // TODO: 给其他面板也添加骨骼view
        },
        /**
        @triggerObj {SkeletonModel}
        @event removeBone 当骨架中移除某个骨骼时触发
        @param {BoneModel} boneModel 所移除的骨骼
        @param {SkeletonModel} skeletonModel 骨骼被添加到的骨架
        @param {Object} [options]
        **/
        onRemoveBoneModel: function(boneModel, SkeletonModel, options){

        },

        /**
        @triggerObj {BoneModel}
        @event change backbone内置事件，当model中的数据被修改时触发
        @param {BoneModel} 被修改的model
        @param {Object} [options]
            以下参数表示修改的来源，来源处的view中已是新数据，无需更新
            @param {Boolean} [options.fromWorkspacePanel=false]
            @param {Boolean} [options.fromBoneTreePanel=false]
            @param {Boolean} [options.fromTimelinePanel=false]
        **/
        onChangeBoneModel: function(boneModel, options){
            var changedData;

            options = options || {};

            // 获取此骨骼中改变了的数据
            changedData = boneModel.changedAttributes();

            // TODO: 更新各个面板的视图
            if(!options.fromWorkspacePanel){}
            if(!options.fromBoneTreePanel){}
            if(!options.fromTimelinePanel){}
        },

        /**
        @triggerObj {KeyframeCollection}
        @event add 当有关键帧model被添加进某个关键帧collection时触发
        **/
        onAddKeyFrameModel: function(keyframeModel, keyframeColl, options){
            monitorKeyframeModel(keyframeModel);
        },
        /**
        @triggerObj {KeyframeCollection}
        @event remove 当有关键帧model被从某个关键帧collection中移除时触发
        **/
        onRemoveKeyFrameModel: function(keyframeModel, keyframeColl, options){

        },

        /**
        @triggerObj {KeyframeModel}
        @event change backbone内置事件，当model中的数据被修改时触发
        @param {BoneModel} 被修改的model
        @param {Object} [options]
            以下参数表示修改的来源，来源处的view中已是新数据，无需更新
            @param {Boolean} [options.fromWorkspacePanel=false]
        **/
        onChangeKeyframeModel: function(keyframeModel, options){
            var changedData;

            options = options || {};

            // 获取此关键帧中改变了的数据
            changedData = keyframeModel.changedAttributes();

            // 更新各个面板的视图。对于修改的来源，其中的数据已是新的
            if(!options.fromWorkspacePanel){
                workspacePanelView
                    .getBone(keyframeModel.get('bone').get('id'))
                    .update(changedData, options);
            }
            if(!options.fromBoneTreePanel){
                // TODO: 更新骨骼树面板中此骨骼的显示数据
            }
            if(!options.fromTimelinePanel){
                // TODO: 更新时间轴面板中此关键帧的显示数据
            }
        }
    };
});
