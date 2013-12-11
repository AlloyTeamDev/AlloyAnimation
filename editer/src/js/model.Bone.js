/**
骨骼model
@module
**/
define([
    'Backbone.Relational', 'relationalScope',
    'modelUtil', 'model.Keyframe', 'collection.Keyframe', 'collection.Bone'
], function(
    Backbone, relationalScope,
    util
){
    var BoneModel;

    /**
    @class BoneModel
    @extends Backbone.RelationalModel
    **/
    BoneModel = Backbone.RelationalModel.extend({
        /**
        Start: backbone内置属性/方法
        **/
        defaults: {
            name: 'unknown'
        },
        relations: [{
            // 有多个关键帧，组成一个关键帧集合
            type: 'HasMany',
            key: 'keyframes',
            relatedModel: 'KeyframeModel',
            collectionType: 'KeyframeCollection',
            reverseRelation: {
                // 一个关键帧集合对应一个骨骼
                key: 'bone'
            }
        }, {
            // 有多个子骨骼
            type: 'HasMany',
            key: 'children',
            relatedModel: 'BoneModel',
            collectionType: 'BoneCollection'
        }],
        /**
        End: backbone内置属性/方法
        **/

        /**
        判断是否含有子骨骼，或是否含有某个指定的子骨骼
        @method hasChild
        @param {String} [id] 子骨骼id
        @return {Boolean}
        @example
            bodyBoneModel.hasChild() 是否有子骨骼
            bodyBoneModel.hasChild(headBoneModel.get('id')) 是否有某个子骨骼
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
    });

    relationalScope.BoneModel = BoneModel;

    return BoneModel;
});
