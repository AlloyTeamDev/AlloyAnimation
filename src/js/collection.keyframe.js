/**
关键帧collection
@module
**/
define([
    'backbone',
    'model.keyframe', 'util',
    'base/tween'
], function(
    Backbone,
    Keyframe, util,
    tween
){
    var KeyframeCollection,
        createId = util.createId;

    /**
    @class KeyframeCollection
    @extends Backbone.Collection
    **/
    KeyframeCollection = Backbone.Collection.extend({
        model: Keyframe,

        initialize: function(){
            this.id = createId();
            console.debug('A new keyframe collection %s is created', this.id);

            // 为变化打log
            this.on('add', this._onAdd);
            this.on('remove', this._onRemove);

            this.on('invalid', this._onInvalid);
        },

        /**
        获取某个帧的数据。
        如果所指定的帧是关键帧，返回这个关键帧的数据；
        如果所指定的帧不是关键帧，而是补帧：
        如果与这个补帧左右相邻的关键帧有两个，用这两个关键帧根据用户选定的缓动函数来计算补帧的数据；
        如果与这个补帧左右相邻的关键帧只有一个，直接使用这个关键帧的数据作为补帧的数据；
        @param {Object} fields 唯一标识某个帧的三个字段
            @param {String} fields.action
            @param {String} fields.bone
            @param {String} fields.time
        @return {Object|null}
            如果指定的帧不存在，返回 `null` ；否则返回指定帧的数据
        **/
        getFrameData: function(fields){
            var time, keyframes, keyframe, nextKeyframe,
                prevData, nextData,
                i, l, prop, frameData,
                attrsNotNumber;

            time = fields.time;
            delete fields.time;

            keyframes = this.where(fields);

            if(!keyframes.length){
                console.debug('No frame with attributes %O', fields);
                return null;
            }

            keyframes.sort(function(a, b){
                return a.get('time') - b.get('time');
            });

            if(time <= keyframes[0].get('time') ){
                return keyframes[0].toJSON();
            }
            if(time >= keyframes[keyframes.length - 1].get('time')){
                return keyframes[keyframes.length - 1].toJSON();
            }

            for(i = 0, l = keyframes.length; i < l; ++i){
                keyframe = keyframes[i];
                if(time === keyframe.get('time')) return keyframe.toJSON();
                nextKeyframe = keyframes[i + 1];
                if(time > keyframe.get('time') && time < nextKeyframe.get('time')){
                    prevData = keyframe.toJSON();
                    nextData = nextKeyframe.toJSON();
                    break;
                }
            }

            frameData = {};
            attrsNotNumber = Keyframe.attrsNotNumber;
            for(prop in prevData){
                if(!prevData.hasOwnProperty(prop)) continue;

                if(attrsNotNumber.indexOf(prop) === -1){
                    // TODO: 
                    // 目前先使用默认的缓动函数linear，
                    // 后续支持设置缓动函数时，再根据用户选取的缓动函数来选择
                    frameData[prop] = tween.linear(
                        time - prevData.time,
                        prevData[prop],
                        nextData[prop] - prevData[prop],
                        nextData.time - prevData.time
                    );
                }
                else if(prop === 'id'){
                    frameData[prop] = null;
                }
                else{
                    frameData[prop] = prevData[prop];
                }
            }
            return frameData;
        },

        _onAdd: function(bone){
            console.debug(
                'Keyframe collection %s added keyframe %s',
                this.id, bone.id
            );
        },

        _onRemove: function(bone){
            console.debug(
                'Keyframe collection %s removed keyframe %s',
                this.id, bone.id
            );
        },

        _onInvalid: function(model, error){
            this.trigger('recoverBoneProp', model);
        }
    });

    return KeyframeCollection;
});
