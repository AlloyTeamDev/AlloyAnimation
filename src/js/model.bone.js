/**
骨骼model的类
@module
**/
define([
    'underscore', 'backbone',
    'modelUtil', 'model.keyframe', 'collection.keyframe', 'collection.Bone'
], function(
    _, Backbone,
    util
){
    var findWhere = _.findWhere,
        extend = _.extend,
        createId = util.createId,
        Bone;

    /**
    @class Bone
    @extends Backbone.Model
    **/
    Bone = Backbone.Model.extend({
        // 约定这些默认字段就是骨骼model的全部字段（除了id）
        defaults: {
            // 骨骼的名字
            name: 'bone',
            // 纹理图的url
            texture: 'img/defaultTexture.png',
            // 父骨骼的id
            parent: null
        },

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

    return Bone;
});
