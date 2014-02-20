/**
关键帧collection
@module
**/
define([
    'backbone',
    'model.keyframe', 'modelUtil'
], function(
    Backbone,
    Keyframe, util
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
        },

        /**
        获取某个补帧的数据。
        如果与这个补帧相邻的关键帧有两个，用这两个关键帧计算补帧的数据；
        如果与这个补帧相邻的关键帧只有一个，直接使用这个相邻关键帧的数据作为补帧的数据；
        如果所指定的帧其实是个关键帧，而不是补帧，返回这个关键帧的数据；
        @param {Object} fields 唯一标识某个帧的三个字段
            @param {String} fields.action
            @param {String} fields.bone
            @param {String} fields.time
        **/
        getFrameData: function(fields){
            var time, keyframes, keyframe, nextKeyframe,
                prevData, nextData,
                i, l, prop, frameData;

            time = fields.time;
            delete fields.time;

            keyframes = this.where(fields);

            keyframes.sort(function(a, b){
                return a.time - b.time;
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
                neighbourKeyframes = keyframes[i + 1];
                if(time > keyframe.get('time') && time < nextKeyframe.get('time')){
                    prevData = keyframe.toJSON();
                    nextData = nextKeyframe.toJSON();
                }
            }

            frameData = {};
            for(prop in prevData){
                if(!prevData.hasOwnProperty(prop)) continue;
                frameData[prop] = (0 + prevData[prop] + nextData[prop]) / 2;
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
        }
    });

    return KeyframeCollection;
});
