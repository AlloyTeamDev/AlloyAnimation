/**
骨骼树面板的view
@module
**/
define([
    'jquery', 'jquery.defaultSetting', 'underscore',
    'view.panel.abstractSkeleton', 'view.abstractBone',
    'tmpl!html/panel.boneTree.html', 'tmpl!html/panel.boneTree.bone.html'
], function(
    $, undefined, _,
    AbstractSkeleton, AbstractBone,
    boneTreeTmpl, boneTmpl
){
    var PANEL_NAME = 'boneTree';
    var bind = _.bind;
    var BoneTreePanel, Bone;

    /**
    @class BoneTreePanel
    @extends AbstractSkeleton
    **/
    BoneTreePanel = AbstractSkeleton.extend({
        el: '#js-boneTreePanel',

        initialize: function(){
            // 复用父类的`initialize`方法
            BoneTreePanel.__super__.initialize.apply(this, arguments);

            // 这些事件回调函数虽然是此类的方法，但是并不通过 `events` 配置来绑定，
            // 所以绑定其执行上下文为此类的实例，
            // 以便跟通过 `events` 配置的事件回调函数的执行上下文保持一致
            [
                'oneMouseMoveAfterMouseDownBone',
                'oneMouseUpAfterDragBone'
            ].forEach(function(method){
                this[method] = bind(this[method], this);
            }, this);

            // 保存具体的骨骼构造函数，覆盖从父类继承过来的抽象的骨骼构造函数
            this._Bone = Bone;

            this._listeningMouseMoveEvent = false;
            this._mouseDownBone = null;
            this._dragingBone = null;
        },

        render: function(bonesData){
            // 渲染空面板
            this.$el.html( boneTreeTmpl() );

            // 如果有传入骨骼数据，渲染出骨骼view
            if(bonesData && bonesData.length){
                bonesData.forEach(function(boneData){
                    this.addBone(boneData);
                }, this);
            }

            // 缓存DOM元素：
            this._$bd = this.$el.children('.bd');
            // 新骨骼的默认DOM容器
            this._boneDefaultContainer = this._$bd.get(0);

            return this;
        },

        // 覆盖父类的同名方法
        updateBone: function(id, data, options){
            var $boneEl, $newParentEl;

            // 如果改变了某个骨骼的父骨骼，更新父子骨骼的DOM结构
            if(data.parent){
                $boneEl = this._boneHash[id].$el;
                $newParentEl = this._boneHash[data.parent].$el;

                setTimeout(function(){
                    // TODO: 先始终插入为第一个子骨骼，后续支持指定插入为第几个子骨骼
                    $boneEl.insertAfter($newParentEl.children('.js-name'));

                    $newParentEl = null;
                    $boneEl = null;     
                }, 300);
                // TODO: 先弄个300ms的延迟，后续再做移动骨骼的动画
            }

            // 复用父类的同名方法
            BoneTreePanel.__super__.updateBone.apply(this, arguments);
        },

        // 获取激活骨骼的id
        getActiveBoneId: function(){
            return this._activeBone.id;
        },

        events: {
            'mousedown': 'onMouseDownBone',
            'mouseup .js-bone': 'onMouseUpBone',
            'click .js-bone': 'onClickBone',
            'click .js-addBoneBtn': 'onClickAddBoneBtn',
            'click .js-removeBoneBtn': 'onClickRemoveBoneBtn'
        },

        onMouseDownBone: function($event){
            var $target = $($event.target),
                $bone;

            // 判断是否在拖拽.js-bone
            if( ( $target.hasClass('js-bone') && ($bone = $target) ) ||
                ( $bone = $target.parentsUntil(this.$el, '.js-bone') ).length
            ){
                this._mouseDownBone = $bone.data('bone-id') + '';

                // 确定是在拖拽.js-bone时，才监听mousemove事件，
                // 以免频繁触发不必要事件回调
                if(!this._listeningMouseMoveEvent){
                    // 这个mousemove事件，触发一次即可说明是在拖拽
                    this.$el.one(
                        'mousemove',
                        this.oneMouseMoveAfterMouseDownBone
                    );
                    this._listeningMouseMoveEvent = true;
                }
            }
        },

        // 如果鼠标按下之后、放开之前有移动，说明是在拖拽，
        // 设置当前正在拖拽的骨骼id，并停止监听mousemove事件。
        // 这个事件回调函数，应在执行一次后就解除绑定
        oneMouseMoveAfterMouseDownBone: function($event){
            this._dragingBone = this._mouseDownBone;
            this._mouseDownBone = null;
            this._listeningMouseMoveEvent = false;

            // 阻止在拖拽骨骼的过程中选中文本
            this.$el.css('user-select', 'none');
            // 拖拽结束后取消阻止
            this.$el.one('mouseup', this.oneMouseUpAfterDragBone);

            console.debug('Draging bone %s', this._dragingBone);
        },

        // 取消在拖拽骨骼的过程中对选中文本的阻止
        oneMouseUpAfterDragBone: function($event){
            this.$el.css('userSelect', 'text');
        },

        // DOUBT: 
        // 拖拽放开后，这个事件回调函数会触发两次，why?
        // 而且第二次触发时，有时 `this._draginBone` 有值，有时没有，why?
        onMouseUpBone: function($event){
            var $targetBone, $dragingBone,
                targetBoneId, dragingBoneId,
                panel;

            // 如果正在拖拽骨骼
            if( this._dragingBone ){
                $dragingBone = this._boneHash[this._dragingBone].$el;
                $targetBone = $($event.currentTarget);

                dragingBoneId = this._dragingBone;
                targetBoneId = $targetBone.data('bone-id') + '';

                console.debug(
                    'End draging bone %s when mouse is on bone %s',
                    dragingBoneId, targetBoneId
                );

                // 如果目标骨骼是所拖拽骨骼的子骨骼，直接返回；
                // 否则，将所拖拽骨骼添加为目标骨骼的子骨骼
                if( $targetBone.parentsUntil(this._$bd).is($dragingBone) ) return;
                
                if(targetBoneId === this._dragingBone){
                    console.debug('End draging bone %s, still at origin place', targetBoneId);
                    this._dragingBone = null;
                    return;
                }

                // 维护父子骨骼view的引用关系
                this.updateBone(dragingBoneId, {parent: targetBoneId});

                $dragingBone.detach();
                panel = this;

                panel.trigger(
                    'changeBoneParent',
                    dragingBoneId, targetBoneId,
                    // 注意：是在被拖拽的骨骼还没重新插入DOM的时候计算的
                    // 参数含义详见controller
                    {
                        childrenAmount: $dragingBone.find('.js-bone').length
                    }
                );

                this._dragingBone = null;
            }

            $target = null;

            // 如果没有进行拖拽，则需要在mouseup事件的回调函数中停止监听mousemove事件
            if(this._listeningMouseMoveEvent){
                this.$el.off('mousemove', this.oneMouseMoveAfterMouseDownBone);
                this._listeningMouseMoveEvent = false;
            }
        },

        onClickBone: function($event){
            var $target = $($event.currentTarget),
                targetBoneId = $target.data('bone-id') + '';

            // 避免点击事件冒泡到父骨骼，使得最后激活的是父骨骼
            $event.stopPropagation();

            this.changeActiveBone(targetBoneId);
        },

        onClickAddBoneBtn: function(){
            // TODO: 暂时先这么写着先
            require('test/user').uploadTexture();

            // this.trigger('addBone');
        },

        /**
        删除激活骨骼（及其子骨骼），并切换其父骨骼为激活骨骼，
        如果没有父骨骼，则切换其他根骨骼为激活骨骼
        **/
        onClickRemoveBoneBtn: function(){
            var activeBone = this._activeBone,
                toRemove, boneId, bone;

            console.debug(
                'Panel %s\'s remove-bone button is clicked when bone %s is active',
                this.panelName, activeBone.id
            );

            // 从最底部的子骨骼开始删除，
            // 并收集要删除骨骼的id（最底部的子骨骼先收集到）
            toRemove = [];
            activeBone.traversal(function(bone){
                this.removeBone(bone.id);
                toRemove.push(bone.id);
            }, this);

            // 再切换激活骨骼，因为如果删除的是根骨骼，需要遍历出一个根骨骼来激活
            if(activeBone.parent){
                this.changeActiveBone(activeBone.parent.id);
            }
            else{
                for(boneId in this._boneHash){
                    if( !this._boneHash.hasOwnProperty(boneId) ) continue;
                    bone = this._boneHash[boneId];
                    if(!bone.parent){
                        this.changeActiveBone(bone.id);
                        break;
                    }
                }
            }

            this.trigger('removedBone', toRemove);
        }
    });

    /**
    @class Bone
    @extends AbstractBone
    **/
    Bone = AbstractBone.extend({
        attributes: {
            'class': 'js-bone'
        },

        /**
        @param {Object} [options]
        **/
        initialize: function(options){
            // 复用父类上的方法
            Bone.__super__.initialize.apply(this, arguments);

            // 缓存骨骼的数据
            // 避免每次获取数据时，都要访问dom
            this._cache = {};
        },

        render: function(boneData, container, options){
            var $el, fieldElHash;
            options = options || {};

            options.updated = true;

            ($el = this.$el)
                .html( boneTmpl({
                    data: boneData
                }) )
                // 保存骨骼id在DOM中。DOM操作时方便得知操作的是哪个骨骼
                .data('bone-id', boneData.id);

            // 缓存DOM元素：
            this._$name = $el.children('.js-name');
            this._$width = $el.find('.js-width');
            this._$height = $el.find('.js-height');
            this._$jointX = $el.find('.js-jointX');
            this._$jointY = $el.find('.js-jointY');
            this._$x = $el.find('.js-x');
            this._$y = $el.find('.js-y');
            this._$z = $el.find('.js-z');
            this._$rotate = $el.find('.js-rotate');
            this._$opacity = $el.find('.js-opacity');

            // 复用父类上的方法
            Bone.__super__.render.apply(this, arguments);
        },

        activate: function(){
            // 复用父类的方法
            Bone.__super__.activate.apply(this, arguments);
        },

        deactivate: function(){
            // 复用父类的方法
            Bone.__super__.deactivate.apply(this, arguments);
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        name: function(val, options){
            if(val !== void 0){
                this._cache.name = val;
                if(options && options.onlyCache) return this;
                this._$name.text(_.escape(val));
                return this;
            }
            else{
                return this._cache.name;
            }
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        jointX: function(val, options){
            if(val !== void 0){
                this._cache.jointX = val;
                if(options && options.onlyCache) return this;
                this._$jointX.val(val);
                return this;
            }
            else{
                return this._cache.jointX;
            }
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        jointY: function(val, options){
            if(val !== void 0){
                this._cache.jointY = val;
                if(options && options.onlyCache) return this;
                this._$jointY.val(val);
                return this;
            }
            else{
                return this._cache.jointY;
            }
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        rotate: function(val, options){
            if(val !== void 0){
                this._cache.rotate = val;
                if(options && options.onlyCache) return this;
                this._$rotate.val(val);
                return this;
            }
            else{
                return this._cache.rotate;
            }
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        width: function(val, options){
            if(val !== void 0){
                this._cache.width = val;
                if(options && options.onlyCache) return this;
                this._$width.val(val);
                return this;
            }
            else{
                return this._cache.width;
            }
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        height: function(val, options){
            if(val !== void 0){
                this._cache.height = val;
                if(options && options.onlyCache) return this;
                this._$height.val(val);
                return this;
            }
            else{
                return this._cache.height;
            }
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        positionX: function(val, options){
            if(val !== void 0){
                this._cache.positionX = val;
                if(options && options.onlyCache) return this;
                this._$positionX.val(val);
                return this;
            }
            else{
                return this._cache.positionX;
            }
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        positionY: function(val, options){
            if(val !== void 0){
                this._cache.positionY = val;
                if(options && options.onlyCache) return this;
                this._$positionY.val(val);
                return this;
            }
            else{
                return this._cache.positionY;
            }
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        positionZ: function(val, options){
            if(val !== void 0){
                this._cache.positionZ = val;
                if(options && options.onlyCache) return this;
                this._$positionZ.val(val);
                return this;
            }
            else{
                return this._cache.positionZ;
            }
        },

        /**
        设置或获取
        @param {Number} [val] 要设置成的新值
        @param {Object} [options]
            @param {Boolean} [options.onlyCache=false] 是否只更新缓存
        @return {this|Number}
        **/
        opacity: function(val, options){
            if(val !== void 0){
                this._cache.opacity = val;
                if(options && options.onlyCache) return this;
                this._$opacity.val(val);
                return this;
            }
            else{
                return this._cache.opacity;
            }
        }
    }, {
        // 覆盖继承自父类的同名属性，用于构成骨骼的html id
        _panelName: PANEL_NAME
    });

    return new BoneTreePanel({panelName: PANEL_NAME});
});
