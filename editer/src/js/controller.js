/**
整个WebApp中唯一的controller。
实现view与view之间、model与view之间的解耦，并避免循环依赖
@module controller
**/
define([
    'exports',
    'underscore',
    'view.panel.action', 'view.panel.workspace', 'view.panel.boneTree', 'view.panel.timeline',
    'collection.skeleton', 'collection.bone',
    'model.keyframe'
], function(
    exports,
    _,
    actionPanelView, workspacePanelView, boneTreePanelView, timelinePanelView,
    SkeletonCollection, BoneCollection,
    KeyframeModel
){
    var allSkeletonColl,
        handler,
        keyframeModelDefaults;

    // TODO:
    // 使用 `allBoneColl` 维护各个骨骼自身的数据，
    // 使用 `allSkeletonColl` 维护骨骼之间的结构关系，和骨架的动作
    // 整个WebApp中所有骨架的collection
    allSkeletonColl = new SkeletonCollection();
    // 整个WebApp中所有骨骼的collection
    allBoneColl = new BoneCollection();

    // 关键帧model包含的默认字段
    keyframeModelProperties = _.keys(KeyframeModel.prototype.defaults);

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

        // 监听model/collection事件
        allSkeletonColl.on('add', handler.onAllSkeletonCollAddModel);
        allSkeletonColl.on('remove', handler.onAllSkeletonCollRemoveModel);

        // 监听view事件
        workspacePanelView.on('addBone', handler.onWorkspacePanelAddBone);
        workspacePanelView.on('updateBone', handler.onWorkspacePanelUpdateBone);
    };

    /**
    监听一个骨骼model实例上的事件
    @param {BoneModel} boneModel 要监听的骨骼model实例
    **/
    function monitorBoneModel(boneModel){
        boneModel
            .on('change', handler.onBoneModelChange)
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


    /**
    将混入骨骼数据中的关键帧数据抽离出来，放到骨骼数据的关键帧属性中，
    让得到的骨骼数据满足骨骼model的数据结构。
    如果骨骼数据中没混入有关键帧数据，则不会给骨骼数据创建关键帧属性。

    所谓混入骨骼数据中的关键帧数据，就是指 `KeyframeModel` 中的字段，
    从骨骼model的角度来看的，这些字段应该定义在骨骼数据的关键帧属性中，所以称之为“混入”；
    而从骨骼view的角度来看，这些字段（宽高、坐标、旋转角度等）都是骨骼的数据，骨骼view的视角中没有关键帧的概念（时间轴面板中的骨骼view除外），所以“混入”是自然而然的。

    @param {Object} boneData 骨骼数据
    @param {Number} time 创建的关键帧所在的时间点
    @return {Object} 处理后的骨骼数据
    **/
    function unmixKeyframeData(boneData, time){
        var und = _;
        var keyframe, i, prop,
            propList = keyframeModelProperties,
            hasKeyframeData = false;

        // 拷贝一遍，因为后面要修改 `boneData` ，避免副作用
        boneData = und.clone(boneData);

        if( !und.isArray(boneData.keyframes) ||
            !und.isObject(boneData.keyframes[0])
        ){
            keyframe = {};
            boneData.keyframes = [keyframe];
        }

        for(i = 0; prop = propList[i]; ++i){
            if(prop in boneData){
                hasKeyframeData = true;
                keyframe[prop] = boneData[prop];
                delete boneData[prop];
            }
        }

        // 如果骨骼数据中没有混入任何关键帧数据，要删除关键帧属性，避免副作用，
        // 比如用关键帧属性为 `[{}]` 的骨骼数据设置到骨骼model中时，会将已有的关键帧数据置空
        if(!hasKeyframeData){
            delete boneData.keyframes;
        }
        else{
            keyframe.time = time;
        }

        return boneData;
    }


    // 各种事件的回调函数
    handler = {
        /****** model/collection event handler ******/
        /**
        @triggerObj {SkeletonCollection} 此事件回调仅用于 `allSkeletonColl` 这个实例上
        @event add 当骨架collection中添加新骨架时触发
        **/
        onAllSkeletonCollAddModel: function(skeletonModel, allSkeletonColl, options){
            var boneId, boneModel,
                skeletonData;

            // 在骨架现有的、以后添加的骨骼model上绑定事件监听
            skeletonModel
                .getBone()
                .forEach(function(boneModel){
                    monitorBoneModel(boneModel);
                });
            skeletonModel.on('addBone', handler.onSkeletonModelAddBone);

            skeletonData = skeletonModel.toJSON({time: timelinePanelView.now});
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
        onAllSkeletonCollRemoveModel: function(skeletonModel, allSkeletonColl, options){

        },

        /**
        @triggerObj {SkeletonModel}
        @event addBone 当骨架中添加骨骼时触发
        @param {BoneModel} boneModel 所添加的骨骼
        @param {SkeletonModel} skeletonModel 骨骼被添加到的骨架
        @param {Object} [options]
        **/
        onSkeletonModelAddBone: function(boneModel, skeletonModel, options){
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
        onSkeletonModelRemoveBone: function(boneModel, SkeletonModel, options){

        },

        /**
        @triggerObj {BoneModel}
        @event change backbone内置事件，当model中的数据被修改时触发
        @param {BoneModel} 被修改的model
        @param {Object} [options]
            以下参数表示各个面板的视图是否已更新，已更新的不必再次更新
            @param {Boolean} [options.hasUpdatedWorkspace=false]
            @param {Boolean} [options.hasUpdatedBoneTree=false]
            @param {Boolean} [options.hasUpdatedTimeline=false]
        **/
        onBoneModelChange: function(boneModel, options){
            var changedData;

            options = options || {};

            // 获取此骨骼中改变了的数据
            changedData = boneModel.changedAttributes();

            // TODO: 更新各个面板视图
            if(!options.hasUpdatedWorkspace){

                options.hasUpdatedWorkspace = true;
            }
            if(!options.hasUpdatedBoneTree){

                options.hasUpdatedBoneTree = true;
            }
            if(!options.hasUpdatedTimeline){

                options.hasUpdatedTimeline = true;
            }
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
            以下参数表示各个面板的视图是否已更新，已更新的不必再次更新
            @param {Boolean} [options.hasUpdatedWorkspace=false]
            @param {Boolean} [options.hasUpdatedBoneTree=false]
            @param {Boolean} [options.hasUpdatedTimeline=false]
        **/
        onChangeKeyframeModel: function(keyframeModel, options){
            var changedData;

            options = options || {};

            // 获取此关键帧中改变了的数据
            changedData = keyframeModel.changedAttributes();

            // 更新各个面板的视图
            if(!options.hasUpdatedWorkspace){
                workspacePanelView
                    .getBone(keyframeModel.get('bone').get('id'))
                    .update(changedData, options);
                options.hasUpdatedWorkspace = true;
            }
            if(!options.hasUpdatedBoneTree){
                // TODO: 更新骨骼树面板中此骨骼的显示数据

                options.hasUpdatedBoneTree = true;
            }
            if(!options.hasUpdatedTimeline){
                // TODO: 更新时间轴面板中此关键帧的显示数据

                options.hasUpdatedTimeline = true;
            }
        },


        /****** view event handler ******/
        /**
        @triggerObj {WorkspacePanelView} workspacePanelView
        @event addBone 当有新骨骼从工作区面板中添加时触发
        @param {Object} boneData 新骨骼的数据
        @param {Object} [options]
        **/
        onWorkspacePanelAddBone: function(boneData, options){
            boneData = unmixKeyframeData(boneData, timelinePanelView.now);
            allSkeletonColl.add({
                root: boneData
            });
        },

        /**
        @triggerObj {WorkspacePanelView} workspacePanelView
        @event updateBone 当工作区面板中的骨骼有更新时触发
        @param {String} boneId 骨骼的id
        @param {Object} boneData 新的骨骼数据
        **/
        onWorkspacePanelUpdateBone: function(boneId, boneData){
            boneData = unmixKeyframeData(boneData, timelinePanelView.now);
            allSkeletonColl.forEach(function(skeletonModel){
                var boneModel;
                if(boneModel = skeletonModel.getBone(boneId)){
                    boneModel.set(boneData, {hasUpdatedWorkspace: true});
                }
            });
        }
    };
});
