/**
骨骼model的类
@module
**/
define([
    'underscore', 'backbone.relational', 'relationalScope',
    'modelUtil', 'model.keyframe', 'collection.keyframe', 'collection.Bone'
], function(
    _, Backbone, relationalScope,
    util
){
    var findWhere = _.findWhere,
        extend = _.extend,
        createId = util.createId,
        Bone;

    /**
    @class Bone
    @extends Backbone.RelationalModel
    **/
    Bone = Backbone.RelationalModel.extend({
        /**
        Start: backbone内置属性/方法
        **/
        defaults: {
            // 骨骼的名字
            name: 'bone',
            // 纹理图的url
            texture: 'img/defaultTexture.gif'
        },
        relations: [{
            // 有多个关键帧，组成一个关键帧集合
            type: 'HasMany',
            key: 'keyframes',
            relatedModel: 'Keyframe',
            collectionType: 'KeyframeCollection',
            reverseRelation: {
                // 一个关键帧集合对应一个骨骼
                key: 'bone'
            }
        }, {
            // 有多个子骨骼
            type: 'HasMany',
            key: 'children',
            relatedModel: 'Bone',
            collectionType: 'BoneCollection'
        }, {
            // 有一个父骨骼
            type: 'HasOne',
            key: 'parent',
            relatedModel: 'Bone',
            includeInJSON: 'id'
        }],

        initialize: function(){
            var id;

            // 创建骨骼id
            id = createId();
            console.debug('A new bone model %s is created', id);
            this.set('id', id);

            ++Bone._boneCount;
            // 设置默认骨骼名
            this.set('name', 'bone' + Bone._boneCount);
        },

        /**
        @param {Object} [options]
            @param {Number} [options.time] 只获取指定时间点的数据
            @param {Boolean} [options.mixin=true] 是否将关键帧的数据混入到骨骼数据中。只有当设置了 `options.time` 时才有效
        **/
        toJSON: function(options){
            var keyframeData,
                boneJson;

            options = options || {};

            boneJson = Bone.__super__.toJSON.call(this, options);
            if('time' in options){
                keyframeData = findWhere(boneJson.keyframes, {time: options.time});
                delete boneJson.keyframes;

                if(keyframeData){
                    delete keyframeData.id;
                    delete keyframeData.bone;
                    extend(boneJson, keyframeData);
                }
                else{
                    // TODO: 支持获取关键帧范围内某个时间点的数据，即指定的时间点不一定是关键帧所在的时间点
                    console.warn(
                        'Cannot find keyframe with time %s in the model of bone %s',
                        options.time, boneJson.id
                    );
                }
            }

            return boneJson;
        },

        fetch: function(){},

        save: function(){},
        /**
        End: backbone内置属性/方法
        **/

        /**
        判断是否含有子骨骼，或是否含有某个指定的子骨骼
        @method hasChild
        @param {String} [id] 子骨骼id
        @return {Boolean}
        @example
            bodyBone.hasChild() 是否有子骨骼
            bodyBone.hasChild(headBone.get('id')) 是否有某个子骨骼
        **/
        hasChild: function(id){
            var childBoneColl;

            if( (childBoneColl = this.get('children')).length ){
                if(id) return !!childBoneColl.get(id);
                else return true;
            }
            else{
                return false;
            }
        }
    }, {
        // 骨骼实例的数量
        _boneCount: 0
    });

    relationalScope.Bone = Bone;

    return Bone;
});
