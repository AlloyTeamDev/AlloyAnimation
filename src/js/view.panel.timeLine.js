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

            // 缓存DOM元素：
            // 面板主体
            this._$bd = this.$el.children('.bd');
            // 表示当前时刻的游标
            this._$nowVernier = this._$bd.children('.js-nowVernier');
            // 表示鼠标在哪一时刻的游标
            this._$mouseVernier = this._$bd.children('.js-mouseVernier');

            return this;
        },

        /**
        TODO: 支持指定父骨骼与添加为第几个子骨骼
        添加一个时间轴view到此面板中，一个骨骼对应一条时间轴
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
            // TODO: 并不是每次都应该 `append` 的
            this._$bd.append( timeLineTmpl(timeLineData) );
            return this;
        },

        /**
        删除指定骨骼对应的时间轴
        @param {String} boneId
        @return this
        **/
        removeTimeLine: function(boneId){
            console.debug(
                'Panel %s remove timeline for bone %s',
                this.panelName, boneId
            );
            
            this._$bd
                .children('[data-bone-id="' + boneId + '"]')
                .remove();
            return this;
        },

        /**
        移动时间轴的位置。一个骨骼对应一条时间轴。
        此方法将 `boneId` 对应的时间轴，已经 `boneId` 对应骨骼的子骨骼，按顺序一起移到 `parentId` 对应的时间轴后面第一个。
        TODO: 先始终插入为第一个子骨骼，后续支持指定插入为第几个子骨骼
        @param {String} boneId 被移动的时间轴对应的骨骼的id
        @param {String} parentId 被移动的时间轴对应骨骼的父骨骼id
        @param {Object} options
        **/
        moveTimeLine: function(boneId, parentId, options){
            // TODO: 后续考虑使用统一的机制，以骨骼id为后缀构造统一的时间轴元素的id
            var $parent = this._$bd.children('[data-bone-id="' + parentId + '"]'),
                $toMove = this._$bd.children('[data-bone-id="' + boneId + '"]'),
                nextEl;

            $toMove = $toMove
                .nextAll()
                .slice(0, options.childrenAmount)
                // When all elements are members of the same document, 
                // the resulting collection from .add() will be sorted in document order.
                // If the collection consists of elements from different 
                // documents or ones not in any document, the sort order is undefined
                .add($toMove);
            $toMove
                .detach()
                .insertAfter($parent);
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

            console.debug(
                'Panel %s add keyframe %s',
                this.panelName, keyframeData.id
            );

            return this;
        },

        /**
        删除指定的关键帧
        @example
            removeKeyframe([id])
            @param {Array} keyframes 指定关键帧的id组成的数组
        @example
            removeKeyframe(id)
            @param {String} keyframes 指定关键帧的id
        **/
        removeKeyframe: function(ids){
            ids = _.isArray(ids) ? ids : [ids];
            console.debug(
                'Panel %s remove keyframe %s',
                this.panelName, JSON.stringify(ids)
            );

            ids.forEach(function(id){
                this.find('#js-keyframe-' + id).remove();
            }, this._$bd.children('.js-timeLine'));
        },

        events: {
            'click .js-addKeyframeBtn': '_onClickAddKeyframeBtn',
            'click .js-removeKeyframeBtn': '_onClickRemvoeKeyframeBtn',
            // 先绑定 `_onClickTimeLine` ，再绑定 `_onClickTimeLineOrAxis` ，
            // 因为它们触发的事件有先后关系
            'click .js-timeLine': '_onClickTimeLine',
            'click .js-timeLine, .js-axis': '_onClickTimeLineOrAxis',
            'mousemove .js-timeLine, .js-axis': '_onMouseMoveTimeLineOrAxis',
            'mousedown .js-keyframe': '_onMouseDownKeyframe'
        },

        _onClickAddKeyframeBtn: function(){
            console.debug('Panel %s\'s add-keyframe button is clicked', this.panelName);
            this.trigger('toAddKeyframe', this.now);
        },

        _onClickRemvoeKeyframeBtn: function(){
            var $selectedKeyframes, keyframesToRemove, jq;
            console.debug('Panel %s\'s delete-keyframe button is clicked', this.panelName);

            $selectedKeyframes = this._$bd.children('.js-timeLine').find('.js-keyframe.js-selected');
            if($selectedKeyframes.length){
                keyframesToRemove = [];
                jq = $;
                // 获取要删除的关键帧的id
                $selectedKeyframes.each(function(i, selectedKeyframe){
                    keyframesToRemove.push(
                        jq(selectedKeyframe)
                            .attr('id').split('-').pop()
                    );
                });
                this.trigger('toRemoveKeyframe', keyframesToRemove);
            }
        },

        // 当点击时间轴时，触发表示切换激活骨骼的事件；
        // 并且，如果点击的不是关键帧，取消选中的关键帧
        _onClickTimeLine: function($event){
            var boneId;

            boneId = $($event.currentTarget).data('bone-id') + '';
            console.debug(
                'Panel %s change active bone to %s',
                this.panelName, boneId
            );
            this.trigger('changedActiveBone', boneId);

            if( $($event.target).hasClass('js-keyframe') ) return;

            this._$bd
                .children('.js-timeLine')
                .find('.js-keyframe.js-selected')
                .removeClass('js-selected');
        },

        // 当点击时间轴或坐标轴时，将表示当前时刻的游标移到离鼠标最近的刻度上，
        // 并触发表示切换当前时刻的事件
        _onClickTimeLineOrAxis: function($event){
            var $currentTarget, left, newTime;

            if(this._notMoveVernier){
                this._notMoveVernier = false;
                return;
            }

            // 获取所点击的时间轴或坐标轴
            $currentTarget = $($event.currentTarget);
            // 鼠标到$currentTarget的左边的距离
            left = $event.pageX - $currentTarget.offset().left;

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

            // 防止在拖拽的过程中选中文本
            this.$el.css('user-select', 'none');
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

            // 解除防止在拖拽的过程中选中文本
            this.$el.css('user-select', 'text');

            this.trigger('updatedKeyframe', keyframeId, {time: time});
        },

        // 当在.bd中移动鼠标时，显示游标以表示鼠标当前在哪一帧
        _onMouseMoveTimeLineOrAxis: function($event){
            var $currentTarget, left;

            // 获取所点击的时间轴或坐标轴
            $currentTarget = $($event.currentTarget);
            // 鼠标到$currentTarget的左边的距离
            left = $event.pageX - $currentTarget.offset().left;

            // 将表示当前时刻的游标移到最近的刻度上
            left = this._makeNearby(left);
            this._$mouseVernier
                .css('left', left + 'px');
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
