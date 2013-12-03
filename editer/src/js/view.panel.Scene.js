/**
景物面板的view
@module
**/
define([
    'jquery',
    'view.Panel',
    'tmpl!html/panel.scene.bone.html'
], function(
    $,
    PanelView,
    boneTmpl
){
    var ScenePanelView, BoneView;

    /**
    @class ScenePanelView
    @extends PanelView
    **/
    ScenePanelView = PanelView.extend({
        /**
        Start: backbone内置属性/方法
        **/
        el: $('#js-scenePanel'),
        events: {
            'click .addBtn': '_onClickAddBtn'
        },
        initialize: function(){
            // TODO: 支持通过拖拽上传纹理图来创建骨骼

            // 复用父类的`initialize`方法
            this.constructor.__super__.initialize.apply(this, arguments);
        },
        /**
        渲染此面板
        @method render
        @param {Array} [bonesData] 多个骨骼的当前数据
        **/
        render: function(bonesData){
            this.$el
                .html( this.panelTmpl({
                    type: 'scene',
                    title: '景物'
                }) );

            // 缓存DOM元素
            this.$viewport = this.$('.viewport');

            return this;
        },
        /**
        End: backbone内置属性/方法
        **/

        /**
        添加一个骨骼view到此面板中
        @method addBone
        @param {Object} data 骨骼的当前数据
        **/
        addBone: function(data){
            var boneView = new BoneView(data);

            boneView
                .render(data)
                .$el.appendTo(this.$viewport);

            return this;
        },

        /**
        Event handler for DOM event `click .addBtn`
        @private
        @method _onClickAddBtn
        @param {Object} jquery event object
        **/
        _onClickAddBtn: function($event){
            var $inputBoneImg = this.$('.js-inputBoneImg'),
                textureUrl;

            // TODO: 这里并不能获取到textureUrl，这么写只是说明一下这个方法做了什么，获取textureUrl有待进一步实现
            $inputBoneImg.click();
            textureUrl = $inputBoneImg.val();

            if(!textureUrl) return this;

            this.trigger('clickAddBtn', textureUrl);
        }
    });

    /**
    景物面板中的一个骨骼的view
    @class BoneView
    @extends Backbone.View
    **/
    BoneView = Backbone.View.extend({
        /**
        Start: backbone内置属性/方法
        **/
        attributes: {
            class: 'js-bone'
        },
        /**
        @method initialize
        @param {Object} bone 骨骼的数据
        **/
        initialize: function(bone){
            // TODO:
            // 添加对DOM事件的监听，支持拖拽调整位置、角度等，完成一次拖拽后
            // 这些DOM事件的handler可以定义为此类的私有方法或本模块内的函数，
            // 当完成一次调整后，触发事件，带上调整后的位置、角度等数据
        },
        /**
        渲染此骨骼
        @method render
        @param {Object} boneData 骨骼的数据
        **/
        render: function(boneData){
            this.$el
                .html( boneTmpl({
                    // TODO: 传入需要的数据
                }) );

            return this;
        }
        /**
        End: backbone内置属性/方法
        **/
    });

    return new ScenePanelView();
});
