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

            // 复用父类的`initialize`方法
            TimeLinePanel.__super__.initialize.apply(this, arguments);
        },
        render: function(timeLinesData){
            // 渲染空面板
            this.$el.html(panelTmpl());

            if(timeLinesData){
                timeLinesData.forEach(function(timeLineData){
                    this.addTimeline(timeLineData);
                }, this);
            }

            this._$bd = this.$el.children('.bd');

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
        }
    });

    return new TimeLinePanel({panelName: 'time-line'});
});
