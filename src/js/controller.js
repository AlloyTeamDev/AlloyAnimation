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
    'model.bone', 'collection.bone',
    'model.action', 'collection.action'
], function(
    exports,
    _,
    actionPanelView, workspacePanelView, boneTreePanelView, timeLinePanelView, bonePropPanelView,
    KeyframeModel, KeyframeCollection,
    BoneModel, BoneCollection,
    ActionModel, ActionCollection
){
    var handler,
        keyframeModelDefaults,
        keyframeColl, boneColl, actionColl;
    var PANEL_NAME_2_FLAG = {};
    PANEL_NAME_2_FLAG[bonePropPanelView.panelName] = 'hasUpdatedBoneProp';
    PANEL_NAME_2_FLAG[workspacePanelView.panelName] = 'hasUpdatedWorkspace';
    PANEL_NAME_2_FLAG[boneTreePanelView.panelName] = 'hasUpdatedBoneTree';
    PANEL_NAME_2_FLAG[timeLinePanelView.panelName] = 'hasUpdatedTimeline';
    PANEL_NAME_2_FLAG[actionPanelView.panelName] = 'hasUpdatedAction';

    // TODO: 这些collection放在 `window` 下只是为了方便调试，发布的时候记得去掉。谁有空给这个项目配个grunt处理这部分逻辑呀？
    // 整个WebApp中所有关键帧的collection
    window.keyframeColl = keyframeColl = new KeyframeCollection();
    // 整个WebApp中所有骨骼的collection
    window.boneColl = boneColl = new BoneCollection();
    // 整个WebApp中所有动作的collection
    window.actionColl = actionColl = new ActionCollection();

    // 关键帧model包含的默认字段，也是关键帧model中应有的全部字段（目前的约定）
    KEYFRAME_MODEL_PROPS = _.keys(KeyframeModel.prototype.defaults);
    // 骨骼model包含的默认字段，也是骨骼model中应有的全部字段（目前的约定）
    BONE_MODEL_PROPS = _.keys(BoneModel.prototype.defaults);

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
        actionPanelView
            .on('updatedActionData', handler.onActionPanelUpdatedAction)
        boneTreePanelView
            .once('addBone', handler.onceCertainPanelAddBone)
            .on('addBone', handler.onCertainPanelAddBone)
            .on('removedBone', handler.onBoneTreePanelRemoveBone)
            .on('changeBoneParent', handler.onBoneTreePanelChangeBoneParent);
        timeLinePanelView
            .on('toAddKeyframe', handler.onTimeLinePanelToAddKeyframe)
            .on('toRemoveKeyframe', handler.onTimeLinePanelToRemoveKeyframe)
            .on('updatedKeyframe', handler.onCertainPanelUpdatedKeyframe)
            .on('changedNowTime', handler.onTimeLinePanelChangedNowTime);
    };

    /**
    监听一个骨骼model上的各种事件
    @param {BoneModel} boneModel 要监听的骨骼model实例
    **/
    function monitorBoneModel(boneModel){
        boneModel.on('change', handler.onChangeBoneModel);
    }
    /**
    解除监听一个骨骼model实例上的事件
    @param {BoneModel} boneModel 要解除监听的骨骼model实例
    **/
    function unmonitorBoneModel(boneModel){
        boneModel.off('change', handler.onChangeBoneModel);
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

            console.debug(
                'Controller receive that bone collection %s add bone %s, then monitor this bone',
                boneColl.id, boneModel.id
            );

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
                'Controller add bone %s to panels: %s, %s, %s',
                boneId, workspacePanelView.panelName,
                boneTreePanelView.panelName, timeLinePanelView.panelName
            );
            // 在各个面板中添加此骨骼对应的view
            workspacePanelView.addBone(boneData);
            boneTreePanelView.addBone(boneData);
            timeLinePanelView.addTimeLine(boneId);

            // 切换新骨骼为激活骨骼
            workspacePanelView.changeActiveBone(boneData.id);
        },

        /**
        当 `boneColl` 有骨骼model之后，
        开始监听各个面板对激活元素的改变，在不同面板之间同步激活元素。
        此事件回调应只被调用一次。
        @triggerObj {BoneCollection} 此事件回调仅用于 `boneColl` 这个实例上
        @event add 当collection中添加新model时触发
        **/
        onceBoneCollAddModel: function(){
            console.debug(
                'Controller start listening "changedActiveBone" event on panels: %s, %s',
                workspacePanelView.panelName, boneTreePanelView.panelName
            );
            [
                workspacePanelView,
                boneTreePanelView,
                timeLinePanelView
            ].forEach(function(panelView){
                panelView.on(
                    'changedActiveBone',
                    handler.onCertainPanelChangedActiveBone
                );
            });
        },

        /**
        @triggerObj {BoneCollection} 此事件回调仅用于 `boneColl` 这个实例上
        @event remove collection中有model被移除时触发
        **/
        onBoneCollRemoveModel: function(boneModel, boneColl, options){
            var boneId = boneModel.get('id');

            console.debug(
                'Controller receive that bone collection %s remove bone %s, then remove keyframes of this bone, and sync to panels views',
                boneColl.id, boneId
            );

            // 删除此骨骼对应的关键帧
            keyframeColl.remove(
                keyframeColl.where({ bone: boneId })
            );

            // 删除各个面板中对应的骨骼
            [
                workspacePanelView,
                boneTreePanelView,
                timeLinePanelView
            ].forEach(function(panel){
                if( !options[ PANEL_NAME_2_FLAG[panel.panelName] ] ){
                    if(panel === timeLinePanelView){
                        panel.removeTimeLine(boneId);
                        return;
                    }
                    else{
                        panel.removeBone(boneId);
                    }
                }
            }, this);

            // TODO: 如果没有骨骼了，重新监听第一个骨骼的添加
        },

        /**
        @triggerObj {BoneModel}
        @event change backbone内置事件，当model中的数据被修改时触发
        @param {BoneModel} 被修改的model
        @param {Object} [options]
            以下几个布尔值参数表示各个面板的视图是否已更新，已更新的不必再次更新
            @param {Boolean} [options.hasUpdatedWorkspace=false]
            @param {Boolean} [options.hasUpdatedBoneTree=false]
            @param {Boolean} [options.hasUpdatedTimeline=false]

            以下的参数，是为了提供给时间轴面板，当骨骼树结构变化时，
            时间轴面板能保持时间轴跟对应的骨骼在一个水平线上
            @param {Number} [options.childrenAmount]
                当修改了骨骼model的 `parent` 字段时才会且一定会存在。
                表示被移动的骨骼有多少个子骨骼
        **/
        onChangeBoneModel: function(boneModel, options){
            var changedData, boneId;

            options = options || {};

            // 获取此骨骼中改变了的数据
            changedData = boneModel.changedAttributes();
            boneId = boneModel.get('id');

            console.debug(
                'Controller receive that bone model %s changed attributes %O',
                boneId, changedData
            );

            // 以下更新各个面板视图
            if(!options.hasUpdatedWorkspace){
                workspacePanelView.updateBone(boneId, changedData, options);
                options.hasUpdatedWorkspace = true;
            }

            // 骨骼树面板中，需要展示的骨骼字段只有 `name`
            if( !options.hasUpdatedBoneTree &&
                ('name' in changedData)
            ){
                boneTreePanelView.updateBone(boneId, changedData, options);
                options.hasUpdatedBoneTree = true;
            }

            // 骨骼model中的各个字段，需要体现在时间轴面板中的只有 `parent`
            if( !options.hasUpdatedTimeline &&
                'parent' in changedData
            ){
                timeLinePanelView.moveTimeLine(boneId, changedData.parent, options);
                options.hasUpdatedTimeline = true;
            }
        },

        /**
        @triggerObj {KeyframeCollection}
        @event add 当有关键帧model被添加进某个关键帧collection时触发
        **/
        onAddKeyFrameModel: function(keyframeModel, keyframeColl, options){
            console.debug(
                'Controller receive that keyframe collection %s add new keyframe model %s, then sync to panel views',
                keyframeColl.id, keyframeModel.id
            );

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
            var keyframeId = keyframeModel.get('id'),
                time, bone, action;
            console.debug(
                'Controller receive that keyframe %s is removed, and remove corresponding view',
                keyframeId
            );
            timeLinePanelView.removeKeyframe(keyframeId);

            // 如果删除的关键帧正在被展示，使用补间帧的数据展示到骨骼属性面板和工作区面板中
            if( keyframeModel.get('time') === (time = timeLinePanelView.now) &&
                keyframeModel.get('bone') === (bone = boneTreePanelView.getActiveBoneId()) &&
                keyframeModel.get('action') === (action = actionPanelView.getActiveActionId())
            ){
                displayBoneData(time, bone, action);
            }
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
            var changedData, keyframeId, activeBoneId;

            options = options || {};

            keyframeId = keyframeModel.get('id');
            // 获取此关键帧中改变了的数据
            changedData = keyframeModel.changedAttributes();

            console.debug(
                'Controller receive that keyframe %s changed attribute %O',
                keyframeId, changedData
            );

            // 如果此关键帧是当前正在展示的关键帧
            if( keyframeModel.get('time') === timeLinePanelView.now &&
                keyframeModel.get('bone') === boneTreePanelView.getActiveBoneId() &&
                keyframeModel.get('action') === actionPanelView.getActiveActionId()
            ){
                console.debug(
                    'Keyframe %s is displaying, controller sync change to other panel views',
                    keyframeId
                );

                // 各个面板中的激活骨骼是同步的
                activeBoneId = workspacePanelView.getActiveBoneId();

                // 更新各个面板的视图
                if( !options.hasUpdatedBoneProp ){
                    bonePropPanelView.updateProp(changedData, options);
                    options.hasUpdatedBoneProp = true;
                }
                if( !options.hasUpdatedWorkspace ){
                    workspacePanelView.updateBone(activeBoneId, changedData, options);
                    options.hasUpdatedWorkspace = true;
                }
            }
            else{
                console.debug(
                    'Keyframe %s is not displaying, controller do nothing with this change',
                    keyframeId
                );
            }
        },

        onActionCollAddModel: function(actionModel, actionColl, options){
            var actionData = actionModel.toJSON()

            console.debug(
                'Controller receive that action collection %s added action model %s, then sync to views',
                actionColl.id, actionModel.id
            );

            actionPanelView
                .addAction(actionData)
                .changeActiveAction(actionData.id);
        },
        /****** End: model/collection event handler ******/

        /****** Start: view event handler ******/
        onceCertainPanelAddBone: function(boneData, options){
            // 对于第一个骨骼，如果还没有动作，创建初始动作
            if(!actionColl.length){
                console.debug(
                    'Controller create a default action for the first bone %s',
                    boneData.id
                );
                actionColl.add(new ActionModel);
            }

            // 对于第一个骨骼，如果时间轴面板还没设置时间，设置初始时间
            if(typeof timeLinePanelView.now !== 'number'){
                timeLinePanelView.now = 0;
            }
        },

        /**
        @triggerObj workspacePanelView|boneTreePanelView
        @event addBone 当有新骨骼从某个面板中添加时触发，目前支持添加骨骼的面板有工作区、骨骼树面板
        @param {Object} boneData 新骨骼的数据
        @param {Object} [options]
        **/
        onCertainPanelAddBone: function(boneData, options){
            var boneModel, keyframeModel;

            console.debug('Controller receive a new bone added by panel %s', this.panelName);

            options = options || {};
            options[PANEL_NAME_2_FLAG[this.panelName]] = true;

            // 确保骨骼model和关键帧model都存在之后，再触发 `add` 事件，
            // 因为 `add` 事件的处理函数中需要用到它们
            options.silent = true;
            boneModel = boneColl.add(extractBoneData(boneData), options);

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
        @triggerObj actionPanelView
        @event updatedActionData 当动作面板修改了动作的数据时触发
        @param {String} actionId 动作id
        @param {Object} actionData 修改了的动作数据（只包括修改了的字段）
        @param {Object} [options]
        **/
        onActionPanelUpdatedAction: function(actionId, actionData, options){
            var actionModel;

            options = options || {};

            console.debug(
                'Controller receive that panel %s updated action %s attributes %O, and set to model',
                this.panelName, actionId, actionData
            );

            options[PANEL_NAME_2_FLAG[this.panelName]] = true;
            actionColl
                .get(actionId)
                .set(actionData, options);
        },

        /**
        @triggerObj boneTreePanelView
        @event removedBone 当有骨骼视图被删除时触发
        @param {Array} bones 骨骼的id
        @param {Object} [options]
        **/
        onBoneTreePanelRemoveBone: function(bones, options){
            console.debug(
                'Controller receive that panel %s removed bones %s, then sync to model',
                this.panelName, JSON.stringify(bones)
            );

            options = options || {};
            options[PANEL_NAME_2_FLAG[this.panelName]] = true;

            boneColl.remove(bones, options);
        },

        /**
        @triggerObj bonePropPanelView|workspacePanelView
        @event updatedBone 当骨骼属性面板或工作区面板更新了骨骼数据时触发
        @param {String} boneId 骨骼的id
        @param {Object} updatedBoneData 新的骨骼数据（只包含有更新的字段）
        **/
        onCertainPanelUpdatedBoneData: function(boneId, updatedBoneData){
            var options = {},
                keyframeData, keyframeModel;

            console.debug(
                'Controller receive that panel %s updated bone %s attributes %O, and set to model',
                this.panelName, boneId, updatedBoneData
            );

            if(this.panelName in PANEL_NAME_2_FLAG){
                options[PANEL_NAME_2_FLAG[this.panelName]] = true;
            }

            keyframeData = extractKeyframeData(updatedBoneData);
            // 如果有更新关键帧的字段
            if(keyframeData){
                keyframeModel = keyframeColl
                    .findWhere({
                        action: actionPanelView.getActiveActionId(),
                        bone: boneTreePanelView.getActiveBoneId(),
                        time: timeLinePanelView.now
                    });
                // 如果对应的关键已存在，直接修改它
                if(keyframeModel){
                    keyframeModel.set(keyframeData, options);
                }
                // 否则用完整的关键帧数据创建一个关键帧
                else{
                    // 先获取完整的骨骼数据，
                    // 再从中提取关键帧model需要的字段，
                    // 最后补充action, bone, time字段，即得到完整的关键帧数据
                    keyframeColl.add( _.extend(
                        extractKeyframeData( this.getBoneData() ),
                        {
                            action: actionPanelView.getActiveActionId(),
                            bone: boneTreePanelView.getActiveBoneId(),
                            time: timeLinePanelView.now
                        }
                    ) );
                }
            }

            boneData = extractBoneData(updatedBoneData);
            // 如果有更新骨骼的字段
            if(boneData){
                boneColl.get(boneId).set(boneData);
            }
        },

        onCertainPanelChangedActiveBone: function(boneId, options){
            var frameData, boneModel;

            options = options || {};
            options.silentChangedActiveBone = true;

            console.debug(
                'Controller receive that panel %s changed active bone to %s, and sync active bone to other panels',
                this.panelName, boneId
            );

            if(this !== workspacePanelView){
                workspacePanelView.changeActiveBone(boneId, options);
            }
            if(this !== boneTreePanelView){
                boneTreePanelView.changeActiveBone(boneId, options);
            }
            if(this !== bonePropPanelView){
                frameData = keyframeColl.getFrameData({
                    action: actionPanelView.getActiveActionId(),
                    bone: boneId,
                    time: timeLinePanelView.now
                });
                if(!frameData) return;
                boneModel = boneColl.get(boneId);

                bonePropPanelView.changeBoneTo(
                    _.extend( frameData, boneModel.toJSON() ),
                    options
                );
            }
        },

        /**
        以指定的时间、激活骨骼、激活动作来创建一个关键帧，如果这样的关键帧已存在，则不创建
        @param {Number} time 指定的时间
        **/
        onTimeLinePanelToAddKeyframe: function(time){
            var keyframeModel, attrs;

            attrs = {
                time: time,
                bone: boneTreePanelView.getActiveBoneId(),
                action: actionPanelView.getActiveActionId()
            };

            console.debug(
                'Controller receive that panel %s want to add keyframe with attributes %O',
                this.panelName, time
            );

            keyframeModel = keyframeColl.findWhere(attrs);

            if(keyframeModel){
                console.debug(
                    'Keyframe with attributes %O already exists, no need to add',
                    attrs
                );
            }
            else{
                console.debug('Controller add keyframe with attributes %O');
                // 用骨骼属性面板当前显示的数据补全关键帧的各个字段
                attrs = _.extend(
                    extractKeyframeData(bonePropPanelView.getBoneData()),
                    attrs
                );
                keyframeColl.add(attrs);
            }
        },

        /**
        将指定的关键帧删除
        @param {Array} ids 要删除的关键帧的id
        **/
        onTimeLinePanelToRemoveKeyframe: function(ids){
            var keyframeModels;

            console.debug(
                'Controller receive that panel %s want to remove keyframes %O',
                this.panelName, ids
            );

            keyframeModels = ids.map(function(id){
                return this.get(id);
            }, keyframeColl);
            keyframeColl.remove(keyframeModels);
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
        },

        onTimeLinePanelChangedNowTime: function(now){
            var boneId;

            console.debug(
                'Controller receive that panel %s changed its now time to %s',
                this.panelName, now
            );

            boneId = boneTreePanelView.getActiveBoneId();
            displayBoneData( now, boneId, actionPanelView.getActiveActionId() );
        },

        /**
        @triggerObj boneTreePanelView
        @event changeBoneParent 当骨骼数面板中把 `changedBone` 的父骨骼改为 `parent` 时触发
        @param {String} changedBone 被移动骨骼的id
        @param {String} parent 被移动骨骼的新父骨骼的id
        @param {Object} options
            @param {Number} options.childrenAmount
        **/
        onBoneTreePanelChangeBoneParent: function(changedBone, parent, options){

            console.debug(
                'Controller receive that panel %s change parent of bone %s to %s, and set to model',
                this.panelName, changedBone, parent
            );

            boneColl
                .get(changedBone)
                .set('parent', parent, options);
        }
        /****** End: view event handler ******/
    };


    /**
    将关键帧model需要的数据从混合骨骼数据中抽离出来。

    所谓混合骨骼数据，是指混入了 `KeyframeModel` 中的字段的骨骼数据。
    在骨骼的view中，骨骼数据和帧数据共同决定骨骼的展示；但在model层中，骨骼数据和帧数据是分开存储的。

    @param {Object} boneAndFrameData 混合骨骼数据
    @return {Object|null} 如果有，返回关键帧数据；否则返回 `null`
    **/
    function extractKeyframeData(boneAndFrameData){
        var keyframeData = {}, i, prop,
            propList = KEYFRAME_MODEL_PROPS,
            hasProp = false;

        for(i = 0; prop = propList[i]; ++i){
            if(prop in boneAndFrameData){
                keyframeData[prop] = boneAndFrameData[prop];
                hasProp = true;
            }
        }

        return hasProp ? keyframeData : null;
    }

    /**
    将骨骼model需要的数据从混合骨骼数据中抽离出来
    @param {Object} boneAndFrameData 混合骨骼数据
    @return {Object|null} 如果有，返回骨骼数据；否则返回 `null`
    **/
    function extractBoneData(boneAndFrameData){
        var boneData = {}, i, prop,
            propList = BONE_MODEL_PROPS,
            hasProp = false;

        for(i = 0; prop = propList[i]; ++i){
            if(prop in boneAndFrameData){
                boneData[prop] = boneAndFrameData[prop];
                hasProp = true;
            }
        }

        return hasProp ? boneData : null;
    }

    /**
    将指定的混合骨骼数据（由指定的帧和骨骼混合而得）展示到骨骼属性面板和工作区面板。
    如果指定的混合骨骼数据不存在，什么也不做
    @param {Number} time 指定帧的时间
    @param {String} bone 指定骨骼的id
    @param {String} action 指定动作的id
    @param {Object} [options]
        以下参数表示各个面板的视图是否已更新，已更新的不必再次更新
        @param {Boolean} [options.hasUpdatedBoneProp=false]
        @param {Boolean} [options.hasUpdatedWorkspace=false]
    **/
    function displayBoneData(time, bone, action, options){
        var fields, frameData, boneData;

        fields = {
            time: time,
            bone: bone,
            action: action
        };
        frameData = keyframeColl.getFrameData(fields);
        if(!frameData) return;

        // TODO: 先判断相应的骨骼model是否存在，再 `toJSON()`
        boneData = _.extend( frameData, boneColl.get(bone).toJSON() );

        options = options || {};

        !options.hasUpdatedBoneProp && bonePropPanelView.updateProp(boneData);
        !options.hasUpdatedWorkspace && workspacePanelView.updateBone(bone, boneData);
    }
});
