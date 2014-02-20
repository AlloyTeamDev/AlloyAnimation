/**
整个WebApp中唯一的controller。
实现view与view之间、model与view之间的解耦，并避免循环依赖
@module controller
**/
define([
    'exports',
    'underscore',
    'view.panel.action', 'view.panel.workspace', 'view.panel.boneTree', 'view.panel.timeLine', 'view.panel.boneProp',
    'model.keyframe', 'collection.keyframe',
    'collection.bone', 'collection.action', 'model.action'
], function(
    exports,
    _,
    actionPanelView, workspacePanelView, boneTreePanelView, timeLinePanelView, bonePropPanelView,
    KeyframeModel, KeyframeCollection,
    BoneCollection, ActionCollection, ActionModel
){
    var handler,
        keyframeModelDefaults,
        keyframeColl, boneColl, actionColl;
    var PANEL_NAME_2_FLAG = {
        'bone-prop': 'hasUpdatedBoneProp',
        'workspace': 'hasUpdatedWorkspace',
        'bone-tree': 'hasUpdatedBoneTree',
        'time-line': 'hasUpdatedTimeline',
        'action': 'hasUpdatedAction'
    };

    // 整个WebApp中所有关键帧的collection
    window.keyframeColl = keyframeColl = new KeyframeCollection();
    // 整个WebApp中所有骨骼的collection
    window.boneColl = boneColl = new BoneCollection();
    // 整个WebApp中所有动作的collection
    window.actionColl = actionColl = new ActionCollection();

    // 关键帧model包含的默认字段
    keyframeModelProperties = _.keys(KeyframeModel.prototype.defaults);

    exports.init = function(){
        var initBonesData;

        // 获取初始数据
        // TODO: 先注释掉这句，等实现本地服务器后再调用fetch获取初始数据
        // boneColl.fetch();
        initBonesData = boneColl.toJSON();

        // 渲染出各个面板
        actionPanelView.render(initBonesData);
        workspacePanelView.render(initBonesData);
        boneTreePanelView.render(initBonesData);
        timeLinePanelView.render(initBonesData);
        bonePropPanelView.render(initBonesData);
        // 销毁引用，避免因为被事件回调函数的作用域链引用而没有释放内存
        initBonesData = null;

        // 注意：这些事件的处理逻辑跟事件回调函数的绑定顺序有关
        // 监听model/collection事件
        keyframeColl
            .on('add', handler.onAddKeyFrameModel)
            .on('remove', handler.onRemoveKeyFrameModel);
        boneColl
            // 有骨骼之后，先确保各个视图里已渲染出骨骼，再同步所激活的骨骼
            .once('add', handler.onceBoneCollAddModel)
            .on('add', handler.onBoneCollAddModel)
            .on('remove', handler.onBoneCollRemoveModel);
        actionColl
            .on('add', handler.onActionCollAddModel);

        // 监听view事件
        bonePropPanelView
            .on('updatedBoneData', handler.onCertainPanelUpdatedBoneData);
        workspacePanelView
            .once('addBone', handler.onceCertainPanelAddBone)
            .on('addBone', handler.onCertainPanelAddBone)
            .on('updatedBoneData', handler.onCertainPanelUpdatedBoneData);
        boneTreePanelView
            .once('addBone', handler.onceCertainPanelAddBone)
            .on('addBone', handler.onCertainPanelAddBone);
        timeLinePanelView
            .on('updatedKeyframe', handler.onCertainPanelUpdatedKeyframe);
    };

    /**
    监听一个骨骼model上的各种事件
    @param {BoneModel} boneModel 要监听的骨骼model实例
    **/
    function monitorBoneModel(boneModel){
        boneModel
            .on('change', handler.onBoneModelChange)
            .on('destroy', handler.onDestroyBoneModel);
    }
    /**
    解除监听一个骨骼model实例上的事件
    @param {BoneModel} boneModel 要解除监听的骨骼model实例
    **/
    function unmonitorBoneModel(boneModel){
        boneModel
            .off('change', handler.onBoneModelChange)
            .off('destroy', handler.onDestroyBoneModel);
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
        keyframeModel.off('change', handler.onChangeKeyframeModel);
    }


    // 各种事件的回调函数
    handler = {
        /****** start: model/collection event handler ******/
        /**
        @triggerObj {BoneCollection} 此事件回调仅用于 `boneColl` 这个实例上
        @event add 当collection中添加新model时触发
        **/
        onBoneCollAddModel: function(boneModel, boneColl, options){
            var boneId, boneData;

            // 监听骨骼的事件
            monitorBoneModel(boneModel);

            // 要让骨骼id覆盖关键帧id
            boneData = _.extend(
                keyframeColl.getFrameData({
                    bone: (boneId = boneModel.get('id')),
                    action: actionPanelView.getActiveActionId(),
                    time: timeLinePanelView.now
                }),
                boneModel.toJSON()
            );

            console.debug(
                'Controller add bone %s to panel views: workspace, bone-tree',
                boneId
            );
            // 在各个面板中添加此骨骼对应的view
            workspacePanelView.addBone(boneData);
            // TODO: 给其它面板也添加对应的view
            boneTreePanelView.addBone(boneData);
            timeLinePanelView.addTimeLine(boneId);
        },

        /**
        当 `boneColl` 有骨骼model之后，
        开始监听各个面板对激活元素的改变，在不同面板之间同步激活元素。
        此事件回调应只被调用一次。
        @triggerObj {BoneCollection} 此事件回调仅用于 `boneColl` 这个实例上
        @event add 当collection中添加新model时触发
        **/
        onceBoneCollAddModel: function(){
            console.debug('Controller start listening "changedActiveBone" event on panel views: workspace, bone-tree');
            workspacePanelView.on(
                'changedActiveBone',
                handler.onCertainPanelChangedActiveBone
            );
            boneTreePanelView.on(
                'changedActiveBone',
                handler.onCertainPanelChangedActiveBone
            );
        },

        /**
        @triggerObj {BoneCollection} 此事件回调仅用于 `boneColl` 这个实例上
        @event remove collection中有model被移除时触发
        **/
        onBoneCollRemoveModel: function(boneModel, boneColl, options){

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
                workspacePanelView.updateBone(
                    boneModel.get('id'),
                    changedData,
                    options
                );
                options.hasUpdatedWorkspace = true;
            }
            if(!options.hasUpdatedBoneTree){

                options.hasUpdatedBoneTree = true;
            }
        },

        /**
        @triggerObj {KeyframeCollection}
        @event add 当有关键帧model被添加进某个关键帧collection时触发
        **/
        onAddKeyFrameModel: function(keyframeModel, keyframeColl, options){
            timeLinePanelView.addKeyframe(
                keyframeModel.get('bone'),
                keyframeModel.toJSON()
            );
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
            var changedData, keyframeId;

            options = options || {};

            keyframeId = keyframeModel.get('id');
            // 获取此关键帧中改变了的数据
            changedData = keyframeModel.changedAttributes();

            console.debug(
                'Controller receive that keyframe %s changed attribute %O',
                keyframeId, changedData
            );

            // 检验此关键帧是否为当前激活的关键帧
            if( keyframeModel.get('time') === timeLinePanelView.now &&
                keyframeModel.get('bone') === boneTreePanelView.getActiveBoneId() &&
                keyframeModel.get('action') === actionPanelView.getActiveActionId()
            ){
                console.debug(
                    'Keyframe %s is active, controller sync change to other panels',
                    keyframeId
                );

                // 更新各个面板的视图
                if(!options.hasUpdatedBoneProp){
                    bonePropPanelView.updateProp(changedData, options);
                    options.hasUpdatedBoneProp = true;
                }
                if(!options.hasUpdatedWorkspace){
                    workspacePanelView
                        .updateBone(
                            workspacePanelView.getActiveBoneId(),
                            changedData,
                            options
                        );
                    options.hasUpdatedWorkspace = true;
                }
                if(!options.hasUpdatedTimeline){
                    // TODO: 更新时间轴面板中此关键帧的显示数据

                    options.hasUpdatedTimeline = true;
                }
            }
            else{
                console.debug(
                    'Keyframe %s is not active, controller do nothing with this change',
                    keyframeId
                );
            }
        },


        onActionCollAddModel: function(actionModel, actionColl, options){
            actionPanelView.addAction(actionModel.toJSON());
        },
        /****** End: model/collection event handler ******/

        /****** Start: view event handler ******/
        onceCertainPanelAddBone: function(boneData, options){
            // 对于第一个骨骼，如果还没有动作，创建初始动作
            if(!actionColl.length){
                console.debug('Controller add a new action');
                actionColl.add(new ActionModel);
            }

            // 对于第一个骨骼，如果时间轴面板还没设置时间，设置初始时间
            if(typeof timeLinePanelView.now !== 'number'){
                timeLinePanelView.now = 0;
            }

            // 确保此函数只被调用一次
            workspacePanelView.off('add', handler.onceCertainPanelAddBone);
            boneTreePanelView.off('add', handler.onceCertainPanelAddBone);
        },

        /**
        @triggerObj workspacePanelView|boneTreePanelView
        @event addBone 当有新骨骼从某个面板（目前支持的有工作区和骨骼树面板）中添加时触发
        @param {Object} boneData 新骨骼的数据
        @param {Object} [options]
        **/
        onCertainPanelAddBone: function(boneData, options){
            var boneModel, keyframeModel,
                flag = PANEL_NAME_2_FLAG[this.panelName];

            console.debug('Controller receive a new bone added by panel %s', this.panelName);

            options = options || {};
            options[flag] = true;

            options.silent = true;
            boneModel = boneColl.add({
                texture: boneData.texture
            }, options);

            keyframeModel = keyframeColl.add({
                action: actionPanelView.getActiveActionId(),
                bone: boneModel.get('id'),
                time: timeLinePanelView.now,
                w: boneData.w,
                h: boneData.h,
                jointX: boneData.jointX,
                jointY: boneData.jointY
            }, options);

            delete options.silent;
            boneColl.trigger('add', boneModel, boneColl, options);
            keyframeColl.trigger('add', keyframeModel, keyframeColl, options);
        },

        /**
        @triggerObj bonePropPanelView|workspacePanelView
        @event updatedBone 当骨骼属性面板或工作区面板更新了骨骼数据时触发
        @param {String} boneId 骨骼的id
        @param {Object} updatedBoneData 新的骨骼数据
        **/
        onCertainPanelUpdatedBoneData: function(boneId, updatedBoneData){
            var options = {},
                keyframeModel, fromPanel, boneData;

            console.debug(
                'Controller receive that panel %s updated bone %s attributes %O, and set to model',
                this.panelName, boneId, updatedBoneData
            );

            if(this.panelName in PANEL_NAME_2_FLAG){
                options[PANEL_NAME_2_FLAG[this.panelName]] = true;
            }

            keyframeModel = keyframeColl
                .findWhere({
                    action: actionPanelView.getActiveActionId(),
                    bone: boneTreePanelView.getActiveBoneId(),
                    time: timeLinePanelView.now
                });
            if(keyframeModel){
                keyframeModel.set(updatedBoneData, options)
            }
            else{
                boneData = this.getBoneData();
                keyframeData = _.extend(extractKeyframeData(boneData), {
                    action: actionPanelView.getActiveActionId(),
                    bone: boneTreePanelView.getActiveBoneId(),
                    time: timeLinePanelView.now
                });
                keyframeColl.add(keyframeData);
            }
        },

        onCertainPanelChangedActiveBone: function(boneId){
            var fromPanel = this.panelName,
                frameData, boneModel;
            console.debug(
                'Controller receive that %s panel changed active bone to %s, and sync active bone to other panels',
                fromPanel, boneId
            );

            if(fromPanel !== 'workspace'){
                workspacePanelView.changeActiveBone(boneId);
            }
            if(fromPanel !== 'bone-tree'){
                boneTreePanelView.changeActiveBone(boneId);
            }
            if(fromPanel !== 'bone-prop'){
                frameData = keyframeColl.getFrameData({
                    action: actionPanelView.getActiveActionId(),
                    bone: boneId,
                    time: timeLinePanelView.now
                });

                boneModel = boneColl.get(boneId);
                bonePropPanelView.changeBoneTo(
                    _.extend(frameData, boneModel.toJSON())
                );
            }
        },

        onCertainPanelUpdatedKeyframe: function(keyframeId, updatedKeyframeData){
            var options = {};

            console.debug(
                'Controller receive that panel %s updated keyframe %s attributes %O, and set it to model',
                this.panelName, keyframeId, updatedKeyframeData
            );

            if(this.panelName in PANEL_NAME_2_FLAG){
                options[PANEL_NAME_2_FLAG[this.panelName]] = true;
            }

            keyframeColl
                .get(keyframeId)
                .set(updatedKeyframeData, options);
        }
        /****** End: view event handler ******/
    };


    /**
    将混入骨骼数据中的关键帧数据抽离出来。

    所谓混入骨骼数据中的关键帧数据，就是指 `KeyframeModel` 中的字段，
    从骨骼model的角度来看的，这些字段应该定义在骨骼数据的关键帧属性中，所以称之为“混入”；
    而从骨骼view的角度来看，这些字段（宽高、坐标、旋转角度等）都是骨骼的数据，骨骼view的视角中没有关键帧的概念（时间轴面板中的骨骼view除外），所以“混入”是自然而然的。

    @param {Object} boneData 骨骼数据
    @return {Object} 关键帧数据
    **/
    function extractKeyframeData(boneData){
        var und = _;
        var keyframe = {}, i, prop,
            propList = keyframeModelProperties;

        for(i = 0; prop = propList[i]; ++i){
            if(prop in boneData){
                keyframe[prop] = boneData[prop];
            }
        }

        return keyframe;
    }
});
