/**
整个WebApp中唯一的controller。
实现view与view之间、model与view之间的解耦，并避免循环依赖
@module controller
**/
define([
    'exports',
    'underscore',
    'view.panel.action', 'view.panel.workspace', 'view.panel.boneTree', 'view.panel.timeline',
    'collection.bone', 'model.keyframe'
], function(
    exports,
    _,
    actionPanelView, workspacePanelView, boneTreePanelView, timelinePanelView,
    BoneCollection, KeyframeModel
){
    var handler,
        keyframeModelDefaults;

    // 整个WebApp中所有骨骼的collection
    allBoneColl = new BoneCollection();

    // 关键帧model包含的默认字段
    keyframeModelProperties = _.keys(KeyframeModel.prototype.defaults);

    exports.init = function(){
        var initBonesData;

        // 获取初始数据
        // TODO: 先注释掉这句，等实现本地服务器后再调用fetch获取初始数据
        // allBoneColl.fetch();
        initBonesData = allBoneColl.toJSON();

        // 渲染出各个面板
        actionPanelView.render(initBonesData);
        workspacePanelView.render(initBonesData);
        boneTreePanelView.render(initBonesData);
        timelinePanelView.render(initBonesData);
        // 销毁引用，避免因为被事件回调函数的作用域链引用而没有释放内存
        initBonesData = null;

        // 监听model/collection事件
        allBoneColl
            .on('add', handler.onAllBoneCollAddModel)
            .on('remove', handler.onAllBoneCollRemoveModel);

        // 监听view事件
        workspacePanelView.on('addBone', handler.onWorkspacePanelAddBone);
        workspacePanelView.on('updateBone', handler.onWorkspacePanelUpdateBone);
    };

    /**
    监听一个骨骼model上的各种事件
    @param {BoneModel} boneModel 要监听的骨骼model实例
    **/
    function monitorBoneModel(boneModel){
        var _handler = handler;
        boneModel
            .on('change', _handler.onBoneModelChange)
            .on('destroy', _handler.onDestroyBoneModel);
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
        /****** start: model/collection event handler ******/
        /**
        @triggerObj {BoneCollection} 此事件回调仅用于 `allBoneColl` 这个实例上
        @event add 当collection中添加新model时触发
        **/
        onAllBoneCollAddModel: function(boneModel, allBoneColl, options){
            var boneId, boneModel,
                boneData;

            // 监听骨骼的事件
            monitorBoneModel(boneModel);

            boneData = boneModel.toJSON({time: timelinePanelView.now});
            // 在各个面板中添加此骨骼对应的view
            workspacePanelView.addBone(boneData);
            // TODO: 给其它面板也添加对应的view
            // boneTreePanelView.addBone(boneData);
            // timelinePanelView.addTimeline(boneData);
        },
        /**
        @triggerObj {BoneCollection} 此事件回调仅用于 `allBoneColl` 这个实例上
        @event remove collection中有model被移除时触发
        **/
        onAllBoneCollRemoveModel: function(boneModel, allBoneColl, options){

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
                    .updateBone(
                        keyframeModel.get('bone').get('id'),
                        changedData,
                        options
                    );
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
        /****** End: model/collection event handler ******/

        /****** Start: view event handler ******/
        /**
        @triggerObj {WorkspacePanelView} workspacePanelView
        @event addBone 当有新骨骼从工作区面板中添加时触发
        @param {Object} boneData 新骨骼的数据
        @param {Object} [options]
        **/
        onWorkspacePanelAddBone: function(boneData, options){
            boneData = unmixKeyframeData(boneData, timelinePanelView.now);
            allBoneColl.add(boneData);
        },

        /**
        @triggerObj {WorkspacePanelView} workspacePanelView
        @event updateBone 当工作区面板中的骨骼有更新时触发
        @param {String} boneId 骨骼的id
        @param {Object} boneData 新的骨骼数据
        **/
        onWorkspacePanelUpdateBone: function(boneId, boneData){
            boneData = unmixKeyframeData(boneData, timelinePanelView.now);
            allBoneColl
                .get(boneId)
                .set(boneData, {
                    hasUpdatedWorkspace: true
                });
        }
        /****** End: view event handler ******/
    };


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
});
