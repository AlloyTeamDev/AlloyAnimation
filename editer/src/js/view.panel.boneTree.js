/**
骨骼数面板的view
@module
**/
define([
    'underscore',
    'view.panel.abstractSkeleton', 'view.abstractBone',
    'tmpl!html/panel.boneTree.bone.html'
], function(
    _,
    AbstractSkeleton, AbstractBone,
    boneTmpl
){
    var BoneTreePanelView, Bone;

    /**
    @class BoneTreePanelView
    @extends AbstractSkeleton
    **/
    BoneTreePanelView = AbstractSkeleton.extend({
        el: $('#js-boneTreePanel'),

        initialize: function(){
            // 骨骼view的哈希，键为骨骼的id，值为骨骼view的实例
            this._boneHash = {};

            // 复用父类的`initialize`方法
            BoneTreePanelView.__super__.initialize.apply(this, arguments);
        },

        render: function(bonesData){
            this.$el
                .html( this.panelTmpl({
                    type: 'boneTree',
                    title: '骨骼树'
                }) );

            // 如果有传入骨骼数据，渲染出骨骼view
            if(bonesData){
                bonesData.forEach(function(boneData){
                    this.addBone(boneData);
                }, this);
            }

            // 缓存DOM元素
            this.$bd = this.$('>.bd');

            return this;
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
            // TODO:
            // 拖拽调整骨骼位置，
            // 抛出事件move，带上自身id，目标父骨骼的id
        },
        /**
        @param {Object} boneData 骨骼的数据
        @param {DOMElement} container 要插入的容器
        **/
        render: function(boneData, container){
            // TODO: 连带渲染子骨骼，如果`boneData`中有子骨骼的数据

            this.$el.html(boneTmpl(boneData))
                .appendTo(container);

            return this;
        }
    }, {
        // 用于构成骨骼的html id
        _panelName: 'boneTree'
    });

    return new BoneTreePanelView();
});
