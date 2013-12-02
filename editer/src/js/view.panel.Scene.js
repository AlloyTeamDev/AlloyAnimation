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
    var ScenePanelView;

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
            // TODO: 支持拖拽上传纹理图
            'click .addBtn': '_onClickAddBtn'
        },
        initialize: function(){
            // 复用父类的`initialize`方法
            this.constructor.__super__.initialize.apply(this, arguments);
        },
        render: function(){
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

            $inputBoneImg.click();
            textureUrl = $inputBoneImg.val();

            if(!textureUrl) return this;

            this.trigger('clickAddBtn', textureUrl);
        }
    });

    return new ScenePanelView();
});
