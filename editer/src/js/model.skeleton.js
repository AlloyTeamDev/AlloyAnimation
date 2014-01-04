/**
骨架model，一个骨架相当于一个骨骼树，由零个或更多个骨骼组成，其中只有一个骨骼作为根骨骼，其它骨骼是根骨骼的直接或间接子骨骼。
@module
**/
define([
    'Backbone.Relational', 'relationalScope', 'underscore',
    'model.bone', 'modelUtil'
], function(
    Backbone, relationalScope, _,
    BoneModel, util
){
    var SkeletonModel, handler;

    /**
    @class SkeletonModel
    @extends Backbone.RelationalModel
    **/
    SkeletonModel = Backbone.RelationalModel.extend({
        /**
        Start: backbone内置属性/方法
        **/
        defaults: {
            name: 'Unknown Skeleton'
        },
        initialize: function(){
            var id = util.createId();
            console.debug('Create a skeleton model with id %s', id);
            this.set('id', id);

            // 初始化 `this._boneHash`
            // 它是所有骨骼model组成的hash，用id索引
            this._boneHash = {};
            (function initBoneHash(boneModel){
                if(!boneModel) return;
                this._boneHash[boneModel.get('id')] = boneModel;
                boneModel.get('children').forEach(function(childBoneModel){
                    initBoneHash.call(this, childBoneModel);
                }, this);
            }).call(this, this.get('root'));
        },
        relations: [{
            // 有且只有一个骨骼作为根骨骼
            type: 'HasOne',
            key: 'root',
            relatedModel: 'BoneModel'
        }],
        /**
        End: backbone内置属性/方法
        **/

        /**
        获取一个子骨骼的父骨骼model
        @parem {String} childId 子骨骼id
        @return {BoneModel|undefined} 父骨骼的model实例或`undefined`
        **/
        getParent: function(childId){
            var id, parent;

            for(id in this._boneHash){
                if(!this._boneHash.hasOwnProperty(id) || id === childId) continue;
                parent = this._boneHash[id];
                if(parent.hasChild(childId)) return parent;
            }
        },
        /**
        获取此骨架中的某个骨骼model，或所有骨骼model
        @param {String} [id] 指定骨骼的id
        @return {BoneModel|BoneModel[]}
        **/
        getBone: function(id){
            if(id) return this._boneHash[id];
            else return _.values(this._boneHash);
        },
        /**
        给这个骨架添加一个或多个骨骼，并触发 `addBone` 事件。
        如果所提供的数据中包含有子骨骼的数据，则添加之。
        如果是添加为跟骨骼，触发 `addRoot` 事件
        @param {Object|Object[]} boneData 一个或多个骨骼的数据
        @param {Object} [options]
            @param {String} [options.parent] 父骨骼的id。如果没有此参数，且骨架中还没有根骨骼，则添加为根骨骼
            @param {Boolean} [options.silent=false] 如果为 `true` ，则不触发事件
        @return {BoneModel|BoneModel[]|undefined} 如果成功添加，返回所添加的骨骼的model实例，否则返回 `undefined`。
            注意：返回的骨骼model实例中，可能包含有子骨骼
        **/
        addBone: function(boneData, options){
            var boneModel, id, isRoot;

            options = options || {};

            // 添加骨骼，并获取骨骼model实例
            if(options.parent){
                boneModel = this._boneHash[options.parent].get('children').add(boneData);
            }
            else if(!this.get('root')){
                if(!_.isArray(boneData)){
                    boneModel = this.get('root').set(boneData);
                    isRoot = true;
                }
                else{
                    console.error('Can not use an array of bone data %O to create a root bone', boneData);
                    return;
                }
            }
            else{
                console.error('Can not add the bone %O to the skeleton without providing parent bone\'s id', boneData);
                return;
            }

            // 保存骨骼model实例的引用
            this._boneHash[boneModel.get('id')] = boneModel;

            // 触发事件
            if(!options.silent){
                this.trigger('addBone', boneModel, this, options);
                if(isRoot){
                    this.trigger('addRoot', boneModel, this, options);
                }
            }

            return boneModel;
        },
        /**
        移除一个骨骼，及其子骨骼，并触发 `removeBone` 事件。
        如果移除的是根骨骼，还要触发 `removeRoot` 事件。
        如果有子骨骼，先移除其子骨骼。
        @param {String} id 要移除的骨骼的id
        @param {BoneModel|undefined} 被删除的骨骼的model实例，或 `undefined` 表示没有该骨骼
        @param {Object} [options]
            @param {Boolean} [options.silent=false] 如果为 `true` ，则不触发事件
            @param {Boolean} [options.unbind=true] 如果为 `true` ，则移除此骨骼model实例上的事件监听
        **/
        removeBone: function(id, options){
            var removedBone,
                childColl,
                parentBone,
                rootBone,
                isRoot;

            options = _.defaults(options, {silent: false, unbind: true});

            // 检验要移除的骨骼是否存在
            removedBone = this._boneHash[id];
            if(!removedBone){
                console.error('Can not remove bone %s that is not in the skeleton %O ', id, this.toJSON());
            }

            // 先递归移除要移除骨骼的子骨骼
            if((childColl = removedBone.get('children')) && childColl.length){
                childColl.pluck('id').forEach(function(childId){
                    this.removeBone(childId);
                }, this);
            }

            // 再移除要移除的骨骼
            parentBone = this.getParent(id);
            if(parentBone){
                parentBone.get('children').remove(removedBone);
            }
            else{
                rootBone = this.get('root');
                if(!rootBone || rootBone.get('id') !== id){
                    return;
                }
                else{
                    this.set('root', null);
                    isRoot = true;
                }
            }

            // 删除骨骼model实例的引用
            delete this._boneHash[id];

            // 触发事件
            if(options.silent){
                this.trigger('removeBone', removedBone, this, options);
                if(isRoot){
                    this.trigger('removeRoot', removedBone, this, options);
                }
            }

            return removedBone;
        }
    });

    relationalScope.SkeletonModel = SkeletonModel;    

    return SkeletonModel;
});
