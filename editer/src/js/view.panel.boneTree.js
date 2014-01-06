/**
骨骼数面板的view
@module
**/
define([
    'underscore',
    'view.panel.abstractSkeleton', 'view.abstractBone',
    'tmpl!html/panel.boneTree.html', 'tmpl!html/panel.boneTree.bone.html'
], function(
    _,
    AbstractSkeleton, AbstractBone,
    boneTreeTmpl, boneTmpl
){
    var BoneTreePanel, Bone;

    /**
    @class BoneTreePanel
    @extends AbstractSkeleton
    **/
    BoneTreePanelView = PanelView.extend({
        el: '#js-boneTreePanel',

        initialize: function(){
            // 复用父类的`initialize`方法
            BoneTreePanel.__super__.initialize.apply(this, arguments);

            // 此面板中所有骨骼view构成的hash，用骨骼的id索引
            this._boneHash = {};
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

            // 缓存DOM元素
            this._$bd = this.$el.children('.bd');

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
        },

        activate: function(){

        },

        deactivate: function(){

        },

        addChild: function(data, options){

        },

        remove: function(){

        },

        update: function(){

        }
    }, {
        // 用于构成骨骼的html id
        _panelName: 'boneTree'
    });

    return new BoneTreePanel();
});
