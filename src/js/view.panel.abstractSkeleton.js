/**
抽象视图，不应用于实例化，而是抽象出共有的部分，以给别的类来继承。
此抽象类是工作区视图类、骨骼树视图类的公共抽象，
这两个视图类都需要实现、维护骨骼树的结构
@module
@exports 抽象的骨骼框架视图的类
**/
define([
    'view.panel', 'view.abstractBone'
], function(Panel, AbstractBone){
    var AbstractSkeleton;

    AbstractSkeleton = Panel.extend({
        initialize: function(){
            // 复用父类的initialize方法
            AbstractSkeleton.__super__.initialize.apply(this, arguments);

            // 此面板中所有骨骼view构成的hash，用骨骼的id索引
            this._boneHash = {};

            // 当前被激活的骨骼
            // **只要有骨骼，总有一个骨骼处于激活状态**
            this._activeBone = null;

            // 这个骨骼框架中的骨骼的构造函数
            // **子类要使用继承自 `AbstractBone` 的类覆盖此属性**
            this._Bone = AbstractBone;

            // 骨骼的默认DOM容器，
            // 如果没有指定父骨骼，也没有激活骨骼，这添加到此容器中
            // **子类要覆盖此属性**
            this._boneDefaultContainer = this.el;
        },

        /* Start: 对本面板中的骨骼的增删改 */

        /**
        使用所提供的骨骼数据，给此面板创建并添加一个骨骼，并激活之。
        如果所提供的骨骼数据中有指定父骨骼，添加为它的子骨骼；
        如果没有指定父骨骼，添加为根骨骼；
        @param {Object} boneData 要添加的骨骼的数据
        @param {Object} [options]
        @return {this._Bone} 新创建的骨骼实例
        **/
        addBone: function(boneData, options){
            var parentBone, bone;

            if(boneData.parent){
                parentBone = this._boneHash[boneData.parent];
                bone = parentBone.addChild(boneData, options);
                this._boneHash[boneData.id] = bone;

                console.debug(
                    'Panel %s add bone %s as child of bone %s',
                    this.panelName, boneData.id, boneData.parent
                );
            }
            else{
                bone = new this._Bone();
                bone.render(
                    boneData,
                    this._boneDefaultContainer,
                    options
                );
                this._boneHash[boneData.id] = bone;

                console.debug(
                    'Panel %s add bone %s as a root bone',
                    this.panelName, bone.id
                );
            }

            this.changeActiveBone(bone.id);
            
            return bone;
        },

        /**
        将指定的骨骼从此骨架中删除。
        @param {String} id 骨骼的id
        @param {Object} [options]
        @return this
        **/
        removeBone: function(id, options){
            var bone = this._boneHash[id];

            if(!bone){
                console.warn(
                    'Panel %s remove bone %s that does not exist in this panel',
                    this.panelName, id
                );
            }

            // 删除指定的骨骼及其子骨骼
            bone.remove();

            // 删除此骨架对指定骨骼的引用
            delete this._boneHash[id];

            return this;
        },

        /**
        更新此面板中的某个骨骼
        @param {String} id 骨骼的id
        @param {Object} data 要更新的数据
        @param {Object} [options]
        @return this
        **/
        updateBone: function(id, data, options){
            var bone, siblings;

            // 更新父子骨骼view的引用关系
            if(data.parent){
                bone = this._boneHash[id];
                // 如果原来有父骨骼，删除在原来的父骨骼中的引用
                if(bone.parent){
                    siblings = bone.parent.children;
                    siblings.splice(siblings.indexOf(bone), 1);
                }
                // 引用新的父骨骼
                bone.parent = this._boneHash[data.parent];
                // 将自身引用插入到新的父骨骼中
                // TODO: 先始终插入为第一个子骨骼，后续支持指定插入为第几个子骨骼
                bone.parent.children.unshift(bone);
            }

            this._boneHash[id].update(data, options);

            console.debug(
                'Panel %s updated bone %s to %O',
                this.panelName, id, data
            );

            return this;
        },

        /**
        改变此面板中的激活骨骼，
        并且如果改变产生，触发 `changedActiveBone` 事件，带上激活骨骼的id作为参数。
        只要有骨骼，就有骨骼处于激活状态，并且只有一个激活骨骼。
        @param {String} boneId 要激活的骨骼的id
        @param {Object} [options]
            @param {Boolean} [options.silentChangedActiveBone=false]
                    不触发 `changedActiveBone` 事件
        @return {Boolean} true: 有改变；false: 没改变
        **/
        changeActiveBone: function(boneId, options){
            var isChanged = true;
                oldActiveBone = this._activeBone;

            options = options || {};

            if(oldActiveBone){
                if(oldActiveBone.id === boneId) isChanged = false;
                oldActiveBone.deactivate();
            }
            if( this._activeBone = this._boneHash[boneId] ){
                this._activeBone.activate();
            }
            else{
                console.warn(
                    'Panel %s activate bone %s which is nonexistent in this panel',
                    this.panelName,
                    boneId
                );
                return;
            }

            if( !options.silentChangedActiveBone &&
                isChanged
            ){
                this.trigger('changedActiveBone', boneId);
            }

            return true;
        }

        /* End: 对本面板中的骨骼的增删改 */
    });

    return AbstractSkeleton;    
});
