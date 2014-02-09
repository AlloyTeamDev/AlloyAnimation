/**
骨骼属性面板的view
@module
**/
define([
    'jquery',
    'view.panel',
    'tmpl!html/panel.boneProp.html'
], function(
    $,
    Panel,
    bonePropTmpl
){
    var BonePropPanel = Panel.extend({
        el: '#js-bonePropPanel',

        initialize: function(){
            // 复用父类的`initialize`方法
            BonePropPanel.__super__.initialize.apply(this, arguments);
        },

        render: function(boneData){
            // 渲染空面板
            this.$el.html( bonePropTmpl() );

            return this;
        }
    });

    return new BonePropPanel();
});
