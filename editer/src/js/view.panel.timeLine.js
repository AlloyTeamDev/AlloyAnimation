/**
时间轴面板的view
@module
**/
define([
    'jquery', 'underscore',
    'view.panel',
    'tmpl!html/panel.timeLine.html', 'tmpl!html/panel.timeLine.timeLine.html', 'tmpl!html/panel.timeLine.keyframe.html'
], function(
    $, _,
    Panel,
    panelTmpl, timeLineTmpl, keyframeTmpl
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
            // 坐标轴的步长（单位为px），即所显示的每个数字对应刻度之间的距离
            this._AXIS_STEP = 50;
            // 坐标轴每个小刻度之间的距离
            this._AXIS_SUB_STEP = 10;
            // 每个小刻度所表示的数字增量
            this._INCREASE_PER_SUB_STEP = 1;

            // 复用父类的`initialize`方法
            TimeLinePanel.__super__.initialize.apply(this, arguments);
        },

        /**
        @param {Array} [timeLinesData]
        **/
        render: function(timeLinesData){
            // 渲染空面板
            this.$el.html( panelTmpl({
                now: this.now,
                axisStep: this._AXIS_STEP,
                axisSubStep: this._AXIS_SUB_STEP
            }) );

            if(timeLinesData){
                timeLinesData.forEach(function(timeLineData){
                    this.addTimeLine(timeLineData);
                }, this);
            }

            // 缓存DOM元素
            this._$bd = this.$el.children('.bd');
            this._$nowVernier = this._$bd.children('.js-nowVernier');

            return this;
        },

        /**
        添加一个时间轴view到此面板中
        @method addTimeLine
        @param {String} boneId 此时间轴对应的骨骼
        @param {Array} [keyframesData] 此时间轴上的关键帧的数据
        **/
        addTimeLine: function(boneId, keyframesData){
            var timeLineData = {
                    boneId: boneId
                };
            if(keyframesData){
                timeLineData.keyframes = keyframesData;
                timeLineData.time2Left = _.bind(this._time2Left, this);
            }
            this._$bd.append( timeLineTmpl(timeLineData) );
            return this;
        },

        /**
        为指定的骨骼对应的时间轴添加关键帧
        @param {String} boneId
        @param {Object} keyframeData
        @return this
        **/
        addKeyframe: function(boneId, keyframeData){
            this._$bd
                .find('.js-timeLine[data-bone-id="' + boneId + '"]')
                .append(keyframeTmpl({
                    id: keyframeData.id,
                    left: this._time2Left(keyframeData.time)
                }));
            return this;
        },

        events: {
            'click .js-timeLine, .js-axis': '_onClickTimeLine',
            'mousedown .js-keyframe': '_onMouseDownKeyframe'
        },

        _onClickTimeLine: function($event){
            // 获取 `.js-timeLine` 或 `.js-axis`
            var $target = $($event.currentTarget);
            // 鼠标到所点击的 `.js-timeLine` 左边的距离
            var left = $event.pageX - $target.offset().left;
            var AXIS_SUB_STEP = this._AXIS_SUB_STEP;
            var remainder = left % AXIS_SUB_STEP;
            var newTime;

            // 将表示当前时刻的游标移到最近的刻度上
            left = left - remainder;
            if(remainder > AXIS_SUB_STEP / 2){
                left += AXIS_SUB_STEP;
            }
            this._$nowVernier.css('left', left + 'px');

            // 修改当前时刻，触发事件
            newTime = this._left2Time(left);
            if(newTime !== this.now){
                this.now = newTime;
                console.debug(
                    'Panel %s change now time to %s',
                    this.panelName, this.now
                );

                this.trigger('changedNowTime');
            }
        },

        _onMouseDownKeyframe: function($event){

        },

        _left2Time: function(left){
            return left / this._AXIS_SUB_STEP / this._INCREASE_PER_SUB_STEP;
        },

        _time2Left: function(time){
            return time * this._INCREASE_PER_SUB_STEP * this._AXIS_SUB_STEP;
        }
    });

    return new TimeLinePanel({panelName: 'time-line'});
});
