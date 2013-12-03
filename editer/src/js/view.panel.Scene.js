/**
景物面板的view
@module
**/
define([
    'jquery',
    'view.Panel'
], function(
    $,
    PanelView
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

            return this;
        },
        /**
        End: backbone内置属性/方法
        **/

        /**
        添加一个骨骼view到景物面板中
        **/
        addBone: function(){

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

    return new ScenePanelView();
});
