/**
骨骼数面板的view
@module
**/
define([
    'jquery', 'underscore',
    'view.panel.abstractSkeleton', 'view.abstractBone',
    'tmpl!html/panel.boneTree.html', 'tmpl!html/panel.boneTree.bone.html'
], function(
    $, _,
    AbstractSkeleton, AbstractBone,
    boneTreeTmpl, boneTmpl
){
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

            // 保存具体的骨骼构造函数，覆盖从父类继承过来的抽象的骨骼构造函数
            this._Bone = Bone;

            this.onMouseMove = bind(this.onMouseMove, this);

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

        events: {
            'mousedown': 'onMouseDownBone',
            'mouseup .js-bone': 'onMouseUpBone',
            'click .js-data-list-toggle': 'onClickDataListToggle',
            'input .js-field-input': 'onInputFieldVal'
        },

        onMouseDownBone: function($event){
            var $target = $($event.target),
                $bone;

            if( ( $target.hasClass('js-bone') && ($bone = $target) ) ||
                ( $bone = $target.parentsUntil(this.$el, '.js-bone') ).length
            ){
                this._mouseDownBone = $bone.data('bone-id');
                this.$el.on('mousemove', this.onMouseMove);
            }
        },

        onMouseMove: function($event){
            var $target = $($event.target),
                $targetBone;

            // 获取鼠标当前所在的骨骼
            if( this._mouseDownBone &&
                ( ( $target.hasClass('js-bone') && ($targetBone = $target) ) ||
                ( $targetBone = $target.parentsUntil(this.$el, '.js-bone').eq(0) ).length )
            ){
                if($targetBone.data('bone-id') === this._mouseDownBone) return;
                this._dragingBone = this._mouseDownBone;
                this._mouseDownBone = null;
                console.debug('Draging bone %s', this._dragingBone);

            }
        },

        onMouseUpBone: function($event){
            var $target = $($event.target),
                $targetBone, $dragingBone,
                targetBoneId, dragingBoneId,
                panel;

            if( this._dragingBone &&
                (   ( $target.hasClass('js-bone') && ($targetBone = $target) ) ||
                    ( $targetBone = $target.parentsUntil(this.$el, '.js-bone').eq(0) ).length
                )
            ){
                $dragingBone = this._boneHash[this._dragingBone].$el

                targetBoneId = $targetBone.data('bone-id');
                dragingBoneId = $dragingBone.data('bone-id');

                if(targetBoneId === dragingBoneId) return;

                $dragingBone.detach();

                panel = this;
                setTimeout(function(){
                    $dragingBone.appendTo($targetBone);

                    panel.trigger('dragedBoneTo', dragingBoneId, targetBoneId);

                    panel = null;
                    $targetBone = null;
                    $dragingBone = null;

                    console.debug(
                        'End draging bone %s, appent it to %s',
                        dragingBoneId,
                        targetBoneId
                    );
                }, 300);

                $target = null;
                this._dragingBone = null;
            }

            this.$el.off('mousemove', this.onMouseMove);
        },

        // 单击展开/收缩骨骼的数据列表
        onClickDataListToggle: function($event){
            $($event.target)
                .toggleClass('js-data-list-toggle-off')
                .parentsUntil(this.$el, '.js-bone')
                .eq(0)
                .children('.js-data-list')
                .toggleClass('js-hide');
        },

        // TODO: 验证输入内容的正确性
        onInputFieldVal: function($event){
            var $fieldInput = $($event.target),
                $bone, boneId, fieldName, fieldVal, bone;

            if( ( $bone = $fieldInput.parentsUntil(this.$el, '.js-bone').eq(0) ).length ){
                boneId = $bone.data('bone-id');

                // TODO: 抽离这部分可复用的验证
                if( !boneId || !(boneId in this._boneHash) ){
                    console.error('Bone id wrong when change field input, bone id is %s', boneId);
                }
                else if( !( fieldName = $fieldInput.data('field-name') ) ){
                    console.error('Field name wrong when change field input. bone id: %s, field name: %s', boneId, fieldName);
                }
                else{
                    bone = this._boneHash[boneId];
                    bone[bone.FIELD_2_METHOD[fieldName]](
                        $fieldInput.val(),
                        {
                            onlyCache: true
                        }
                    );
                    this.trigger(
                        'changedBone',
                        boneId,
                        fieldName,
                        $fieldInput.val()
                    );
                }
            }
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
                this._$name.val(val);
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
        },

    }, {
        // 覆盖继承自父类的同名属性，用于构成骨骼的html id
        _panelName: 'boneTree'
    });

    return new BoneTreePanel();
});
