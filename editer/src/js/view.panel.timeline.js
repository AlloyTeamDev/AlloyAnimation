/**
时间轴面板的view
@module
**/
define([
    'jquery',
    'view.Panel'
], function(
    $,
    PanelView
){
    var TimeLinePanelView;

    /**
    @class TimeLinePanelView
    @extends PanelView
    **/
    TimeLinePanelView = PanelView.extend({
        /**
        Start: backbone内置属性/方法
        **/
        el: $('#js-timelinePanel'),
        initialize: function(){
            // 复用父类的`initialize`方法
            this.constructor.__super__.initialize.apply(this, arguments);
        },
        render: function(){
            this.$el
                .html( this.panelTmpl({
                    type: 'timeline',
                    title: '时间轴'
                }) );

            return this;
        }
        /**
        End: backbone内置属性/方法
        **/
    });

    return new TimeLinePanelView();
});
