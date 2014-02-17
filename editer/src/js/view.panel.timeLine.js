/**
时间轴面板的view
@module
**/
define([
    'jquery',
    'view.panel',
    'tmpl!html/panel.timeLine.html', 'tmpl!html/panel.timeLine.timeLine.html'
], function(
    $,
    Panel,
    panelTmpl, timeLineTmpl
){
    var TimeLinePanel;

    /**
    @class TimeLinePanel
    @extends Panel
    **/
    TimeLinePanel = Panel.extend({
        el: '#js-timeLinePanel',
        initialize: function(){
            // 当前时刻
            this.now = 0;
            // 坐标轴的步长（单位为px），即每个数字所示刻度之间的距离
            this._axisStep = 50;
            // 坐标轴每个刻度之间的距离
            this._axisSubStep = 10;

            // 复用父类的`initialize`方法
            TimeLinePanel.__super__.initialize.apply(this, arguments);
        },
        render: function(timeLinesData){
            // 渲染空面板
            this.$el.html( panelTmpl({
                now: this.now,
                axisStep: this._axisStep
            }) );

            if(timeLinesData){
                timeLinesData.forEach(function(timeLineData){
                    this.addTimeline(timeLineData);
                }, this);
            }

            // 缓存DOM元素
            this._$bd = this.$el.children('.bd');
            this._$nowVernier = this._$bd.children('.js-nowVernier');

            return this;
        },

        /**
        添加一个时间轴view到此面板中
        @method addTimeline
        @param {Array} keyframes 此时间轴上的关键帧的数据
        **/
        addTimeline: function(keyframes){
            this._$bd.append( timeLineTmpl({keyframes: keyframes}) );
            return this;
        },

        events: {
            'click .js-timeLine': '_onClickTimeLine'
        },

        _onClickTimeLine: function($event){
            var $target = $($event.target),
                // 鼠标到所点击的 `.js-timeLine` 左边的距离
                left = $event.pageX - $target.offset().left,
                axisSubStep = this._axisSubStep,
                remainder = left % axisSubStep;

            // 将表示当前时刻的游标移到最近的刻度上
            left = left - remainder;
            if(remainder > axisSubStep / 2){
                left += axisSubStep;
            }
            this._$nowVernier.css('left', left + 'px');
        }
    });

    return new TimeLinePanel({panelName: 'time-line'});
});
