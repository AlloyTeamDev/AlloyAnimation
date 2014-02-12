/**
骨骼属性面板的view
@module
**/
define([
    'jquery',
    'view.panel',
    'tmpl!html/panel.boneProp.html', 'tmpl!html/panel.boneProp.bd.html'
], function(
    $,
    Panel,
    bonePropTmpl, bdTmpl
){
    var BonePropPanel = Panel.extend({
        el: '#js-bonePropPanel',

        initialize: function(){
            // 复用父类的`initialize`方法
            BonePropPanel.__super__.initialize.apply(this, arguments);
        },

        render: function(boneData){
            // 渲染面板
            this.$el.html( bonePropTmpl({ bone: boneData }) );

            // 缓存DOM元素
            this._$bd = this.$('.bd');

            return this;
        },

        changeBone: function(boneData){
            if(this._boneId === boneData) return this;

            this._boneId = boneData.id;
            this._$bd.html( bdTmpl({ bone: boneData }) );
        }
    });

    return new BonePropPanel();
});
