/**
时间轴面板的view
@module
**/
define([
    'jquery',
    'view.panel'
], function(
    $,
    Panel
){
    var TimeLinePanel;

    /**
    @class TimeLinePanel
    @extends Panel
    **/
    TimeLinePanel = Panel.extend({
        /**
        Start: backbone内置属性/方法
        **/
        el: $('#js-timeLinePanel'),
        initialize: function(){
            // 当前时刻
            this.now = 0;

            // 复用父类的`initialize`方法
            TimeLinePanel.__super__.initialize.apply(this, arguments);
        },
        render: function(timeLinesData){
            this.$el
                .html( this.panelTmpl({
                    type: 'timeLine',
                    title: '时间轴'
                }) );

            if(timeLinesData){
                timeLinesData.forEach(function(timeLineData){
                    this.addTimeline(timeLineData);
                }, this);
            }

            return this;
        },
        /**
        End: backbone内置属性/方法
        **/

        /**
        添加一个时间轴view到此面板中
        @method addTimeline
        @param {Array} keyframes 此时间轴上的关键帧的数据
        **/
        addTimeline: function(keyframes){
            return this;
        }
    });

    return new TimeLinePanel({panelName: 'time-line'});
});
