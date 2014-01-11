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
            'mouseup .js-bone': 'onMouseUpBone'
        },

        onMouseDownBone: function($event){
            var $target = $($event.target),
                $bone;

            if( ( $target.hasClass('js-bone') && ($bone = $target) ) ||
                ( $bone = $target.parentsUntil(this.$el, '.js-bone') ).length
            ){
                this._dragingBone = Bone.htmlId2Id( $bone.attr('id') );
                console.debug('Start draging bone ' + this._dragingBone);
            }
        },

        onMouseUpBone: function($event){
            var $target = $($event.target),
                $targetBone, $dragingBone,
                targetBoneId, dragingBoneId,
                panel;

            if( this._dragingBone &&
                (( $target.hasClass('js-bone') && ($targetBone = $target) ) ||
                ( $targetBone = $target.parentsUntil(this.$el, '.js-bone').eq(0) ).length)
            ){
                $dragingBone = this._boneHash[this._dragingBone].$el

                targetBoneId = Bone.htmlId2Id( $targetBone.attr('id') );
                dragingBoneId = Bone.htmlId2Id( $dragingBone.attr('id') );

                if(targetBoneId === dragingBoneId) return;

                $dragingBone.detach();

                panel = this;
                setTimeout(function(){
                    $dragingBone.appendTo($targetBone);

                    panel.trigger('dragBone', dragingBone, targetBone);

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
            this._texture = null;
            this._jointX = null;
            this._jointY = null;
            this._rotate = null;
            this._w = null;
            this._h = null;
            this._x = null;
            this._y = null;
            this._z = null;
            this._opacity = null;
        },

        render: function(boneData, container, options){
            var $el;
            options = options || {};

            options.updated = true;
            $el = this.$el.html( boneTmpl(boneData) );
            $el.children('.js-name').attr('contenteditable', 'true');

            // 缓存DOM元素：
            this._$name = $el.children('.js-name');

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
        设置或获取骨骼名
        @param {String} [name] 要设置成的名字
        @return {this|String} this，或骨骼名
        **/
        name: function(name){
            if(name !== void 0){
                this._$name.text(name);
                // 缓存数据，避免频繁访问DOM
                this._name = name;
                return this;
            }
            else{
                return this._name || '';
            }
        }
    }, {
        // 覆盖继承自父类的同名属性，用于构成骨骼的html id
        _panelName: 'boneTree'
    });

    return new BoneTreePanel();
});
