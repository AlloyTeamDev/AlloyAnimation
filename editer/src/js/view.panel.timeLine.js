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
            // 复用父类的`initialize`方法
            TimeLinePanel.__super__.initialize.apply(this, arguments);

            // 当前时刻
            this.now = 0;

            // 这些事件回调函数虽然是此类的方法，但是并不通过 `events` 配置来绑定，
            // 所以绑定其执行上下文为此类的实例，
            // 以便跟通过 `events` 配置的事件回调函数的执行上下文保持一致
            [
                '_onMouseMoveWithKeyframe',
                '_oneMouseUpWithKeyframe'
            ].forEach(function(method){
                this[method] = _.bind(this[method], this);
            }, this);

            // 坐标轴的步长（单位为px），即所显示的每个数字对应刻度之间的距离
            this._AXIS_STEP = 50;
            // 坐标轴每个小刻度之间的距离
            this._AXIS_SUB_STEP = 10;
            // 每个小刻度所表示的数字增量
            this._INCREASE_PER_SUB_STEP = 1;

            // 正在拖拽的关键帧元素的id
            this._$dragingKeyframe = null;
            // 正在拖拽的关键帧所在的时间轴
            this._$timeLine = null;
            // 正在拖拽的关键帧所在的时间轴相对于文档左边的偏移
            this._timeLineOffsetLeft = null;
            // 拖拽关键帧的过程中，鼠标是否有移动
            this._isMouseMoved = false;
            // 拖拽关键帧的过程中做的标记，以免拖拽移动关键帧的同时移动游标
            this._notMoveVernier = false;
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
                    time: keyframeData.time,
                    left: this._time2Left(keyframeData.time)
                }));
            return this;
        },

        events: {
            'click .js-timeLine, .js-axis': '_onClickTimeLineOrAxis',
            'mousedown .js-keyframe': '_onMouseDownKeyframe',
            'click .js-keyframe': '_onClickKeyframe',
            'click .js-timeLine': '_onClickTimeLine'
        },

        // 当点击时间轴或坐标轴时，将表示当前时刻的游标移到离鼠标最近的刻度上
        _onClickTimeLineOrAxis: function($event){
            if(this._notMoveVernier){
                this._notMoveVernier = false;
                return;
            }

            // 获取 `.js-timeLine` 或 `.js-axis`
            var $currentTarget = $($event.currentTarget);
            // 鼠标到所点击的 `.js-timeLine` 左边的距离
            var left = $event.pageX - $currentTarget.offset().left;
            var newTime;

            // 将表示当前时刻的游标移到最近的刻度上
            left = this._makeNearby(left);
            this._$nowVernier.css('left', left + 'px');

            // 修改当前时刻，触发事件
            newTime = this._left2Time(left);
            if(newTime !== this.now){
                this.now = newTime;
                console.debug(
                    'Panel %s change now time to %s',
                    this.panelName, this.now
                );

                this.trigger('changedNowTime', this.now);
            }
        },

        _onMouseDownKeyframe: function($event){
            var $keyframe = $($event.currentTarget);

            this._$dragingKeyframe = $keyframe;
            this._$timeLine = $keyframe.parentsUntil(this._$bd, '.js-timeLine');
            this._timeLineOffsetLeft = this._$timeLine.offset().left;

            console.debug(
                'Panel %s start draging keyframe element %o',
                this.panelName, this._$dragingKeyframe.get(0)
            );

            this.$el
                .on('mousemove', this._onMouseMoveWithKeyframe)
                .one('mouseup', this._oneMouseUpWithKeyframe);
        },

        _onMouseMoveWithKeyframe: function($event){
            var $keyframe, left;

            console.debug(
                'Panel %s draging keyframe element %o',
                this.panelName, this._$dragingKeyframe.get(0)
            );

            $keyframe = this._$dragingKeyframe;
            if( !$keyframe || !$keyframe.length ) return;

            // 将关键帧移到离鼠标最近的刻度上
            left = $event.pageX - this._timeLineOffsetLeft;
            left = this._makeNearby(left);
            $keyframe
                .css('left', left + 'px')
                .data('time', this._left2Time(left));

            this._isMouseMoved = true;
        },

        _oneMouseUpWithKeyframe: function($event){
            var $keyframe, $timeLine,
                keyframeId, time;

            this.off('mousemove', this._onMouseMoveWithKeyframe)

            console.debug(
                'Panel %s end draging keyframe element %o',
                this.panelName, this._$dragingKeyframe.get(0)
            );

            $keyframe = this._$dragingKeyframe;
            keyframeId = $keyframe.attr('id').split('-').pop();
            time = this._left2Time(
                this._makeNearby( parseInt($keyframe.css('left')) )
            );
            console.debug(
                'Panel %s change keyframe %s to time %s',
                this.panelName, keyframeId, time
            );

            // 如果放开鼠标左键时，鼠标还在所拖动的关键帧所在时间轴的上方，
            // 那么会触发时间轴的click事件，做个标记告诉该click事件的回调函数，
            // 以免拖拽移动关键帧的同时移动游标
            if( $($event.target).parentsUntil(this._$bd).is(this._$timeLine) &&
                // 如果鼠标没有移动，说明是点击，不是拖拽，那就不应该不移动游标
                this._isMouseMoved
            ){
                this._notMoveVernier = true;
            }

            this.$el.off('mousemove', this._onMouseMoveWithKeyframe)

            // 重置与拖拽关键帧有关的状态
            this._$dragingKeyframe = null;
            this._$timeLine = null;
            this._timeLineOffsetLeft = null;
            this._isMouseMoved = false;

            this.trigger('updatedKeyframe', keyframeId, {time: time});
        },

        _onClickKeyframe: function($event){
            var $keyframe = $($event.currentTarget);

            // 如果点击关键帧的同时还按着ctrl键，复选所点击的关键帧；
            // 否则单选所点击的关键帧
            if($event.originalEvent.ctrlKey){
                $keyframe.addClass('js-selected');
            }
            else{
                this._$bd
                    .children('.js-timeLine')
                    .find('.js-keyframe.js-selected')
                    .not($keyframe)
                    .removeClass('js-selected');
                $keyframe.addClass('js-selected');
            }
        },

        // 当点击时间轴时，如果点击的不是关键帧，取消选中的关键帧
        _onClickTimeLine: function($event){
            if( $($event.target).hasClass('js-keyframe') ) return;

            this._$bd
                .children('.js-timeLine')
                .find('.js-keyframe.js-selected')
                .removeClass('js-selected');
        },

        _left2Time: function(left){
            return left / this._AXIS_SUB_STEP / this._INCREASE_PER_SUB_STEP;
        },

        _time2Left: function(time){
            return time * this._INCREASE_PER_SUB_STEP * this._AXIS_SUB_STEP;
        },

        // 将所提供的left调节成最接近的刻度的left
        _makeNearby: function(left){
            var AXIS_SUB_STEP = this._AXIS_SUB_STEP,
                remainder = left % AXIS_SUB_STEP;

            left = left - remainder;
            if(remainder > AXIS_SUB_STEP / 2){
                left += AXIS_SUB_STEP;
            }

            return left;
        }
    });

    return new TimeLinePanel({panelName: 'time-line'});
});
