/**
工作区面板的view
@module
@exports 工作区面板的view实例
**/
define([
    'jquery', 'underscore', 'backbone',
    'tmpl!html/panel.workspace.bone.html', 'tmpl!html/workspace.html', 'tmpl!html/panel.workspace.transformUtil.html',
    'view.panel',
    'base/math'
], function(
    $, _, Backbone,
    boneTmpl, workspaceTmpl, transformUtilTmpl,
    PanelView,
    math
){
    var WorkspacePanelView, BoneView;

    // 减少搜索作用域链的局部变量
    var win = window,
        Math = win.Math;

    /**
    @class WorkspacePanelView
    @extends PanelView
    **/
    var WorkspacePanelView = PanelView.extend({

        // 使用DOM中已有的元素作为此view的根元素
        el: '#js-workspacePanel',

        initialize: function(){
            // 复用父类的initialize方法
            this.constructor.__super__.initialize.apply(this, arguments);

            // 此面板中所有骨骼view构成的hash，用骨骼的id索引
            this._boneHash = {};

            // 当前被激活的骨骼
            // **只要有骨骼，总有一个骨骼处于激活状态**
            this._activeBone = null;
            // 重置调节骨骼时的状态表示
            this._resetState();

            // 保存在实例上，避免搜索作用域链，尤其是在频繁调用的函数中
            this._cos = Math.cos;
            this._sin = Math.sin;
            this._atan = Math.atan;
            this._pow = Math.pow;
            this._180_DIV_PI = 180 / Math.PI;
            this._PI_DIV_180 = Math.PI / 180;
            this._stringify = win.JSON.stringify;
            this._rotationAngle = math.rotationAngle;
        },

        /**
        渲染此面板
        @method render
        @param {Array} [bonesData] 多个骨骼的的当前数据
        **/
        render: function(bonesData){
            // 渲染空面板
            this.$el.html( workspaceTmpl());

            // 如果有传入骨架数据，渲染出骨架view
            if(bonesData && bonesData.length){
                bonesData.forEach(function(boneData){
                    this.addBone(boneData);
                }, this);
            }
            // 缓存DOM元素：
            // 工作区面板的坐标系元素，其位置表示坐标系原点，
            // x轴水平向右，y轴竖直向下，
            // 骨骼的坐标就是相对于这个坐标系而言的
            this._$coordSys = this.$el.children('.js-coordinate-system');

            return this;
        },


        /* Start: 对本面板中的骨骼的增删改 */

        /**
        如果有激活骨骼，用所给的数据创建骨骼并添加为激活骨骼的子骨骼。
        如果没有激活骨骼（即还没有任何骨骼），添加此骨骼并激活之。
        如果所添加骨骼的数据中带有子骨骼的数据，递归添加子骨骼。
        @param {Object} boneData 所添加的骨骼的数据
        @param {Object} [options]
        @return {BoneView} 新创建的实例
        **/
        addBone: function(boneData, options){
            var bone, childrenData;

            if(this._activeBone){
                bone = this._addBone(boneData, this._activeBone, options);
            }
            else{
                bone = this._addBone(boneData, options);
                this.changeActiveBone(bone.id);
            }
            return bone;
        },

        /**
        彻底移除指定的骨骼。
        如果指定的骨骼有子骨骼，先递归移除子骨骼。
        @param {String} id 骨骼的id
        @param {Object} [options]
        @return {BoneView[]} 所移除的骨骼组成的数组。移除的过程中会断开它们的父子关系
        **/
        removeBone: function(id, options){
            var bone, children, removedBones;

            bone = this._getBone(id, options);
            removedBones = [];
            if( (children = bone.children) && children.length ){
                children.forEach(function(child){
                    removedBones.concat( this.removeBone(child.id, options) );
                }, this);
            }

            bone.remove();
            removedBones.push(bone);

            delete this._boneHash[id];
            return removedBones;
        },

        /**
        更新此面板中的某个骨骼
        @param {String} id 骨骼的id
        @param {Object} data 要更新的数据
        @param {Object} options
        @return this
        **/
        updateBone: function(id, data, options){
            this._getBone(id, options)
                .update(data);
            return this;
        },

        /* End: 对本面板中的骨骼的增删改 */

        // 配置要委派的DOM事件
        events: {
            // 这个函数是是需要的,不然会按照浏览器的默认行为
            'dragover': function(){ return false },
            'drop': 'onDrop',
            'click': 'onClick',
            'mousedown .js-activeBone': 'onMouseDownActiveBone',
            'mousedown .js-resize': 'onMouseDownResizePoint',
            'mousedown .js-rotate': 'onMouseDownRotatePoint',
            'mousedown .js-joint': 'onMouseDownJoint',
            'mousemove': 'onMouseMove',
            'mouseup': 'onMouseUp'
        },

        onDrop: function(e){
            var panel = this,
                files, reader, i;

            //这里有个注意的地方，jquery帮你封event，而且里面居然没有我们需要的数据
            e = window.event;
            e.stopPropagation();
            e.preventDefault();
           
            files = e.dataTransfer.files;
            for(i = 0; i < files.length; i++){
                reader = new FileReader();
                // 先监听事件，再读取数据，等待事件触发
                reader.onload = onload;
                reader.readAsDataURL(files[i]);
            }

            this.$('#empty_wording').hide();

            /**
            写成函数声明而不是函数表达式，以免每循环一次重复创建一个函数对象
            @triggerObj {FileReader} `reader`
            @event onload
            **/
            function onload(){
                // 使用 `this` 即可访问到触发 `onload` 事件的 `reader`
                var texture = this.result,
                    img = new Image(),
                    boneData;
                img.src = texture;
                boneData = {
                    texture: texture
                };
                if(img.width){
                    boneData.w = img.width;
                    boneData.jointX = img.width / 2;
                }
                if(img.height){
                    boneData.h = img.height;
                    boneData.jointY = img.height / 2;
                }

                // 通知外界
                panel.trigger('addBone', boneData);
            }
        },

        onClick: function($event){
            var $target = $($event.target),
                $bone;

            // 当点击此面板时，如果点击了某个骨骼，改变激活元素为所点击的元素。
            // **只要有骨骼，总有一个骨骼处于激活状态**
            if( ( $target.hasClass('js-bone') && ($bone = $target) ) ||
                ( $bone = $target.parentsUntil(this.$el, '.js-bone') ).length
            ){
                this.changeActiveBone( boneHtmlId2boneId($bone.attr('id')) );
            }
        },

        onMouseDownActiveBone: function($event){
            var bone;

            // 不是鼠标左键，直接返回，避免不必要的运算
            if($event.which !== 1) return;

            console.debug('Start adjust active bone: move');

            this._isMoving = true;

            this._mouseOldX = $event.pageX;
            this._mouseOldY = $event.pageY;

            bone = this._activeBone;
            this._boneOldX = bone.positionX();
            this._boneOldY = bone.positionY();
        },
            
        onMouseDownResizePoint: function($event){
            var bone;

            // 不是鼠标左键，直接返回，避免不必要的运算
            if($event.which !== 1) return;

            console.debug('Start adjust active bone: resize bone & reposition joint at ratio');

            this._isResizing = true;

            this._mouseOldX = $event.pageX;
            this._mouseOldY = $event.pageY;

            bone = this._activeBone
            this._boneOldX = bone.positionX();
            this._boneOldY = bone.positionY();
            this._boneOldW = bone.width();
            this._boneOldH = bone.height();

            this._$joint = bone.$el.children('.js-joint');
            this._jointOldX = bone.jointX();
            this._jointOldY = bone.jointY();

            // 避免事件冒泡到骨骼元素，进入moving状态
            $event.stopPropagation();
        },

        onMouseDownRotatePoint: function($event){
            var bone, jointX, jointY;

            // 如果按下的不是鼠标左键，则直接返回，避免不必要的运算
            if($event.which !== 1) return;

            console.debug('Start adjust active bone: rotate');

            this._isRotating = true;

            bone = this._activeBone;
            this._boneOldRotate = bone.rotate();

            // 骨骼在无旋转的情况下相对于文档的偏移，加上关节相对于骨骼在骨骼无旋转的情况下的坐标，就得到关节此时相对于文档的坐标
            jointOffsetLeft =
                this._jointOldOffsetLeft =
                bone.offsetLeftOnRotate0() + bone.jointX();
            jointOffsetTop =
                this._jointOldOffsetTop =
                bone.offsetTopOnRotate0() + bone.jointY();

            // 再用鼠标此时的坐标减去得到的关节坐标，就得到此时的关节鼠标向量（从关节指向鼠标的向量）。
            // 最后即可计算出此时（开始调节旋转角度时），水平向左向量顺时针旋转到与关节鼠标向量时所转过的角度
            this._joint2MouseOldRotate = this._rotationAngle(
                $event.pageX - jointOffsetLeft,
                $event.pageY - jointOffsetTop
            );

            // 这句输出用于调试旋转
            // console.debug(
            //     'Bone old rotate %fdeg, joint-mouse vector old rotate %fdeg, joint old offset {%f, %f}',
            //     this._boneOldRotate,
            //     this._joint2MouseOldRotate,
            //     this._jointOldOffsetLeft, this._jointOldOffsetTop
            // );

            // 避免事件冒泡到骨骼元素，进入moving状态
            $event.stopPropagation();
        },

        onMouseDownJoint: function($event){
            var bone;

            // 不是鼠标左键，直接返回，避免不必要的运算
            if($event.which !== 1) return;

            console.debug('Start adjust active bone: move joint');

            this._isMovingJoint = true;

            this._mouseOldX = $event.pageX;
            this._mouseOldY = $event.pageY;

            bone = this._activeBone;
            this._jointOldX = bone.jointX();
            this._jointOldY = bone.jointY();

            // 缓存的关节控制点
            this._$joint = $($event.target);

            // 避免事件冒泡到骨骼元素，进入moving状态
            $event.stopPropagation();
        },

        // TODO:
        // 可以实现监测这个函数的运行时间，如果时长太长，或太频繁，
        // 可以选择性的执行其中的计算，比如每两次执行一次
        onMouseMove: function($event){
            // 建立用于此函数中的坐标系：
            // 原点为骨骼的关节点，
            // x轴为水平向右按顺时针旋转rotate度的方向，
            // y轴为竖直向下按顺时针旋转rotate度的方向，
            // 其中rotate为 **进入此函数时** 骨骼按顺时针旋转的角度，
            // 此函数结束前，坐标系不变；重新进入此函数，重新建立坐标系

                // 改变了的骨骼数据
            var changedData,
                // 激活的骨骼
                bone,
                // 如果正在调节大小，表示骨骼当前的旋转角度；
                // 如果正在调节旋转角度，表示调节前骨骼的旋转角度；
                rotate,
                // 旋转角度对应的弧度
                rotateRadian,
                // 鼠标位置在水平、竖直方向上的变化量（当前位置相对于起始位置的变化量），
                // **鼠标移动向量** 由这两个分量构成
                mouseHoriVar, mouseVertVar,
                // 骨骼宽、高的变化量，宽、高的方向与x, y轴平行
                widthVar, heightVar,
                // 骨骼旋转角度的变化量，
                // 即鼠标起始位置与关节点连成的直线，关于关节点旋转多少度，到达鼠标当前位置与关节点连成的直线。
                // 取值范围为 [-180deg, 180deg]
                variationRotate,
                // 关节点分别到鼠标起始位置与当前位置构成的向量
                jointOldVector, jointVector,
                // 关节点相对于骨骼的当前坐标
                jointX, jointY,
                joint2MouseRotate,
                joint2MouseVectorHori, joint2MouseVectorVert,
                cos, sin, pow;

            // 如果没有激活骨骼，直接返回
            if( !(bone = this._activeBone) ) return;

            changedData = this._boneChangedData = this._boneChangedData || {};

            // TODO: 先判断是否需要这些数据
            mouseHoriVar = $event.pageX - this._mouseOldX
            mouseVertVar = $event.pageY - this._mouseOldY
            rotate = bone.rotate();
            rotateRadian = rotate * this._PI_DIV_180;
            jointX = bone.jointX();
            jointY = bone.jointY();
            cos = this._cos;
            sin = this._sin;
            pow = this._pow;

            if(this._isMoving){
                // 变化量不为0才做出修改
                if(mouseHoriVar){
                    bone.positionX(
                        changedData.x = this._boneOldX + mouseHoriVar
                    );
                }
                if(mouseVertVar){
                    bone.positionY(
                        changedData.y = this._boneOldY + mouseVertVar
                    );
                }

                // 清除无效缓存
                this._offsetTop = null;
                this._offsetLeft = null;
            }

            // TODO: 兼容缩小到0的边界情况
            if(this._isResizing){
                // 骨骼宽、高的变化量，就是鼠标移动向量（在水平竖直坐标系中）在此函数的坐标系的x, y轴上的投影
                widthVar = mouseHoriVar * cos(rotateRadian) + mouseVertVar * sin(rotateRadian);
                heightVar = mouseVertVar * cos(rotateRadian) - mouseHoriVar * sin(rotateRadian);

                // 宽高变换量不为0时才修改宽高
                widthVar && bone.width(changedData.w = this._boneOldW + widthVar);
                heightVar && bone.height(changedData.h = this._boneOldH + heightVar);

                // 清除无效缓存
                this._offsetTop = null;
                this._offsetLeft = null;
            }

            if(this._isRotating){
                joint2MouseRotate = this._rotationAngle(
                    (joint2MouseVectorHori = $event.pageX - this._jointOldOffsetLeft),
                    (joint2MouseVectorVert = $event.pageY - this._jointOldOffsetTop)
                );
                // 此时的关节鼠标向量相对水平向左向量的旋转角度，
                // 减去开始调节时关节鼠标向量相对水平向左向量的旋转角度，
                // 就得到关节鼠标向量转过的角度，即骨骼旋转角度的变化量
                bone.rotate(
                    changedData.rotate = joint2MouseRotate - this._joint2MouseOldRotate + this._boneOldRotate
                );

                // 这句输出用于调试旋转
                // console.debug(
                //     'bone rotate %fdeg, joint-mouse vector rotate %fdeg, joint-mouse vector {%f, %f}, mouse position {%f, %f}',
                //     changedData.rotate,
                //     joint2MouseRotate,
                //     joint2MouseVectorHori,
                //     joint2MouseVectorVert,
                //     $event.pageX, $event.pageY
                // );
            }

            // BUG: 关节点的移动跟鼠标不一致
            // TODO: 实现移动关节点时，骨骼不动
            if(this._isMovingJoint){
                // 用于操作关节点位置的html元素，其left/top属性是相对于骨骼元素在无旋转时的左上角，有旋转时，相对于这个角旋转后的位置
                // this._$joint.css({
                //     left: 
                //     top: 
                // });

                // 而表示关节点的 `transform-origin` 属性，其坐标是相对于骨骼div无旋转时左上角所在的那个点，而这个点不随着旋转改变
                bone.jointX( changedData.jointX =
                        mouseHoriVar * cos(rotateRadian) +
                        mouseVertVar * sin(rotateRadian) +
                        this._jointOldX
                    )
                    .jointY( changedData.jointY =
                        mouseVertVar * cos(rotateRadian) -
                        mouseHoriVar * sin(rotateRadian) +
                        this._jointOldY
                    );
                
            }
        },

        onMouseUp: function($event){
            var activeBone;

            if( !(this._isMoving ||
                this._isResizing ||
                this._isRotating ||
                this._isMovingJoint)
            ){
                return;
            }

            console.debug(
                'End adjust active bone, change data: ' +
                this._stringify(this._boneChangedData)
            );

            // 拖拽调节结束时，再通知外界骨骼的数据有更新，
            // 而不是一边拖拽一边频繁的通知外界。
            // 并且是如果有数据更新，才通知外界
            if(this._boneChangedData){                
                this.trigger('updateBone', this._activeBone.id, this._boneChangedData);
            }

            // 重置调节骨骼时的状态表示
            this._resetState();
        },

        /**
        改变此面板中的激活骨骼。
        只要有骨骼，就有骨骼处于激活状态，并且只有一个激活骨骼。
        @param {String} boneId 要激活的骨骼的id
        @return this
        **/
        changeActiveBone: function(boneId){
            var oldActiveBone = this._activeBone;
            if(oldActiveBone){
                if(oldActiveBone.id === boneId) return this;
                oldActiveBone.deactivate();
            }
            (this._activeBone = this._boneHash[boneId]).activate();

            return this;
        },


        /***** Start: 私有属性/方法 *****/

        // 重置调节骨骼时的状态表示
        _resetState: function(){
            // 表示当前状态的各种私有属性
            // 是否正在调节已激活骨骼的位置
            this._isMoving = false;
            // 是否正在调节已激活骨骼的旋转
            this._isRotating = false;
            // 是否正在调节已激活骨骼的大小
            this._isResizing = false;
            // 是否正在调节已激活骨骼的关节位置
            this._isMovingJoint = false;

            // 开始调节时，鼠标相对于 `document` 的坐标
            this._mouseOldX = null;
            this._mouseOldY = null;

            // 开始调节时，骨骼的坐标
            this._boneOldX = null;
            this._boneOldY = null;

            // 开始调节时，骨骼的大小
            this._boneOldW = null;
            this._boneOldH = null;

            // 关节元素的jquery对象，
            // 在开始调节时缓存起来，调节时不用频繁搜索DOM，
            // 每次调节结束，断开引用，以免内存泄漏
            this._$joint = null;

            // 开始调节时，关节的坐标
            this._jointOldX = null;
            this._jointOldY = null;

            // 开始调节时，关节相对于文档的坐标
            this._jointOldOffsetLeft = null;
            this._jointOldOffsetTop = null;

            // 开始调节旋转角度时，水平向左向量顺时针旋转到，与关节鼠标向量（从关节指向鼠标的向量）平行时，所转过的角度
            this._joint2MouseOldRotate = null;

            // 在调节骨骼的过程中，有修改过的数据的最新值。
            // 只在调节过程中有值。没包含的字段，表示没有修改
            this._boneChangedData = null;

            return this;
        },

        /**
        使用提供的骨骼数据创建骨骼，并添加为指定父骨骼的子骨骼。
        如果有子骨骼的数据，递归添加子骨骼
        @param {Object} boneData 要添加的骨骼的数据
        @param {BoneView} [parentBone] 要添加为哪个骨骼的子骨骼
        @param {Object} [options]
        @return {BoneView} 所创建的骨骼
        **/
        _addBone: function(boneData, parentBone, options){
            var bone, childrenData;

            if(!parentBone){
                options = parentBone;
                parentBone = undefined;

                (bone = this._boneHash[boneData.id] = new BoneView())
                    .render(boneData, this._$coordSys.get(0), options);
            }
            else{
                bone
                    = this._boneHash[boneData.id]
                    = parentBone.addChild(boneData, options);
            }

            if( (childrenData = boneData.children) && childrenData.length ){
                childrenData.forEach(function(childData){
                    this._addBone(childData, bone);
                }, this);
            }
            return bone;
        },

        /**
        获取此面板中的某个骨骼view，或所有骨骼view
        @param {String} [id] 指定骨骼的id
        @param {Object} [options]
        @return {BoneView|BoneView[]}
        **/
        _getBone: function(id, options){
            if(id) return this._boneHash[id];
            else return _.values(this._boneHash);
        }
        /***** End: 私有属性/方法 *****/
    });


    /**
    专用于此面板的骨骼view
    @class BoneView
    @extends Backbone.View
    **/
    BoneView = Backbone.View.extend({
        attributes: {
            'class': 'js-bone'
        },

        transformUtilTmpl: transformUtilTmpl,

        initialize: function(){
            this.children = [];
            this.$el.attr('draggable', false);

            // 几何数据的单位
            this.SIZE_UNIT = 'px';

            // 缓存骨骼的数据
            // 避免每次获取数据时，都要访问dom
            this._texture = null;
            this._jointX = null;
            this._jointY = null;
            this._rotate = null;
            this._w = null;
            this._h = null;
            this._x = null;
            this._y = null;
            this._z = null;
            this._opacity = null;
        },

        /**
        将骨骼数据填入html模板，并将得到的html片段填入此视图的根元素当中。
        如果提供的骨骼数据中有子骨骼的数据，不创建子骨骼。
        @method render
        @param {Object} boneData 骨骼的数据
            @param {String} boneData.name
            @param {String} boneData.texture
            @param {Array} boneData.children
        @param {DOMElement} container 要插入的DOM容器
        @praram {Object} [options]
        @return this
        **/
        render: function(boneData, container, options){
            this.id = boneData.id;
            this.$el
                .attr({
                    'id': boneId2boneHtmlId(boneData.id)
                });
            this.update(boneData);

            this.$el.appendTo(container);

            return this;
        },

        /**
        激活此骨骼，表示开始操作此骨骼
        @return this
        **/
        activate: function(){
            console.debug('Activate bone ' + this.id);

            // TODO: 缓存 `.js-transform-util` 元素
            this.$el
                .addClass('js-activeBone')
                .append(this.transformUtilTmpl())
                .children('.js-joint')
                .css({
                    left: this.jointX(),
                    top: this.jointY()
                });

            return this;
        },

        /**
        取消激活此骨骼，表示结束操作此骨骼
        @return this
        **/
        deactivate: function(){
            this.$el
                .removeClass('js-activeBone')
                .children('.js-transform-util')
                .remove();

            console.debug('Deactivate bone ' + this.id);

            return this;
        },

        /**
        给此骨骼添加一个子骨骼。
        @method addChild
        @param {Object} data 子骨骼的数据
        @param {Object} [options]
        @return 所添加的子骨骼view
        **/
        addChild: function(data, options){
            var child, grandChildrenData;

            // 创建子骨骼view，并插入DOM容器中
            (child = new this.constructor).render(data, this.el, options);

            // 保存父子骨骼之间的相互引用
            child.parent = this;
            this.children.push(child);

            // 通知：此骨骼添加了一个子骨骼
            this.trigger('addChild', child, this, options);

            return child;
        },

        /**
        彻底删除此骨骼view。
        @return this
        **/
        remove: function(){
            var parent, brothers;

            if( ( parent = this.parent ) &&
                ( brothers = parent.children )
            ){
                // 删除在父骨骼中的引用
                brothers.splice(brothers.indexOf(this), 1);
                // 删除对父骨骼的引用
                delete this.parent;
            }

            // 解除监听DOM事件，删除DOM元素，解除绑定在view实例上的事件
            this.constructor.__super__.remove.call(this);

            return this;
        },

        /**
        一次更新骨骼的多项数据
        @param {Object} data
            @param {Number} [data.texture]
            @param {Number} [data.jointX]
            @param {Number} [data.jointY]
            @param {Number} [data.rotate]
            @param {Number} [data.w]
            @param {Number} [data.h]
            @param {Number} [data.x]
            @param {Number} [data.y]
            @param {Number} [data.z]
            @param {Number} [data.opacity]
        @return this
        **/
        update: function(data){
            var MAP, field;
            if(!data) return this;

            MAP = this._FIELD_2_METHOD;
            for(field in MAP){
                if( !MAP.hasOwnProperty(field) ) continue;
                if(field in data) this[MAP[field]](data[field]);
            }

            return this;
        },

        /***** Start: 原子性的设置或获取骨骼数据的方法 *****/

        /* 请使用这些方法或 `update()` 来修改骨骼的数据，而不是 `this.$el` ，以保证缓存数据的正确性 */
        
        /**
        设置或获取骨骼的纹理图。
        因为给jquery的 `.css()` 方法添加了钩子，
        可以直接用url来设置 `backgroundImage` 属性，
        或直接从 `backgroundImage` 属性获取url
        @param {String} [url] 要设置成的纹理图的url
        @return {BoneView|String} this, 或纹理图的url
        **/
        texture: function(url){
            if(url !== void 0){
                this.$el.css('backgroundImage', url);
                return this;
            }
            else{
                return this._texture;
            }
        },

        /**
        设置或获取关节的水平坐标。
        因为给jquery的 `.css()` 方法添加了钩子，
        用 `.css()` 方法设置 `transformOriginX` 属性时，能自动添加浏览器厂商前缀
        @param {Number} [x] 要设置成的水平坐标
        **/
        jointX: function(x){
            return this._styleInSizeUnit('transformOriginX', x, '_jointX');
        },

        /**
        设置或获取关节的垂直坐标。
        因为给jquery的 `.css()` 方法添加了钩子，
        用 `.css()` 方法设置 `transformOriginY` 属性时，能自动添加浏览器厂商前缀
        @param {Number} [y] 要设置成的水平坐标
        **/
        jointY: function(y){
            return this._styleInSizeUnit('transformOriginY', y, '_jointY');
        },

        /**
        设置或获取骨骼的旋转角度。
        因为给jquery的 `.css()` 方法添加了钩子，
        用jquery的 `.css()` 方法设置或获取css属性 `transform` 时：
        支持自动添加适当的浏览器厂商前缀；
        支持设置多个变换函数，而只会覆盖同名的变换函数，不覆盖不同名的；
        @param {Number} angle
        **/
        rotate: function(angle){
            if(angle !== void 0){
                typeof angle !== 'number' && console.debug('Warn: attribute type wrong');
                this.$el.css('transform', 'rotate(' + angle + 'deg)');
                this._rotate = angle;
                return this;
            }
            else{
                return this._rotate;
            }
        },

        width: function(w){
            return this._styleInSizeUnit('width', w, '_w');
        },

        height: function(h){
            return this._styleInSizeUnit('height', h, '_h');
        },

        /**
        设置或获取骨骼的水平坐标
        @param {Number} [x] 要设置成的水平坐标
        @return {BoneView|Number}
        **/
        positionX: function(x){
            // 清理缓存数据
            this._offsetLeft = null;
            return this._styleInSizeUnit('left', x, '_x');
        },

        /**
        设置或获取骨骼的垂直坐标
        @param {Number} [y] 要设置成的垂直坐标
        @return {BoneView|Number}
        **/
        positionY: function(y){
            // 清理缓存数据
            this._offsetTop = null;
            return this._styleInSizeUnit('top', y, '_y');
        },

        positionZ: function(z){
            if(z !== void 0){
                typeof z !== 'number' && console.debug('Warn: attribute type wrong');
                this.$el.css('zIndex', z);
                this._z = z;
                return this;
            }
            else{
                return this._z;
            }
        },

        opacity: function(alpha){
            if(alpha !== void 0){
                typeof alpha !== 'number' && console.debug('Warn: attribute type wrong');
                this.$el.css('opacity', alpha);
                this._opacity = alpha;
                return this;
            }
            else{
                return this._opacity;
            }
        },

        /**
        获取旋转角度为0时，相对于文档左边的偏移
        @return {Number}
        **/
        offsetLeftOnRotate0: function(){
            var offset;

            // 如果有缓存数据，直接返回
            if(this._offsetLeft != null){
                return this._offsetLeft;
            }

            offset = this._offsetOnRotate0();
            // 将数据缓存起来
            this._offsetTop = offset.top;
            return this._offsetLeft = offset.left;
        },

        offsetTopOnRotate0: function(){
            var offset;

            // 如果有缓存数据，直接返回
            if(this._offsetTop != null){
                return this._offsetTop;
            }

            offset = this._offsetOnRotate0();
            // 将数据缓存起来
            this._offsetLeft = offset.left;
            return this._offsetTop = offset.top;
        },

        /***** End: 原子性的设置或获取骨骼数据的方法 *****/

        // 将数据字段名映射到设置相应字段的方法名
        _FIELD_2_METHOD: {
            texture: 'texture',
            jointX: 'jointX',
            jointY: 'jointY',
            rotate: 'rotate',
            w: 'width',
            h: 'height',
            x: 'positionX',
            y: 'positionY',
            z: 'positionZ',
            opacity: 'opacity'
        },

        _styleInSizeUnit: function(prop, val, cacheProp){
            if(val !== void 0){
                typeof val !== 'number' && console.debug('Warn: attribute type wrong');
                this.$el.css(prop, val + this.SIZE_UNIT);
                this[cacheProp] = val;
                return this;
            }
            else{
                return this[cacheProp];
            }
        },

        /**
        获取旋转角度为0时，相对于文档的坐标。
        请确保在调用此方法时，骨骼元素在DOM中。
        @return {Object} position
            @return {Object} position.left
            @return {Object} position.top
        **/
        _offsetOnRotate0: function(){
            var $cloneEl, offset;

            // 复制一个一样的元素，但使其透明且旋转角度为0，获取其相对于文档的坐标即可
            offset = ($cloneEl = this.$el.clone(false, false))
                .empty()
                .css({
                    opacity: 0,
                    transform: 'rotate(0deg)'
                })
                .insertAfter(this.el)
                .offset();
            $cloneEl.remove();
            $cloneEl = null;

            return offset;
        }
    });


    /***** Start: helper function *****/

    /**
    获取骨骼的html id，其前缀表示这是工作区面板中的骨骼
    @param {String} id 骨骼的id
    @return {String} 骨骼的html id
    **/
    function boneId2boneHtmlId(id){
        return 'js-workspace-bone-' + id;
    }

    /**
    从骨骼的html id中获取骨骼id
    @param {String} htmlId 骨骼的html id
    @return {String} 骨骼的id
    **/
    function boneHtmlId2boneId(htmlId){
        return htmlId.split('-').pop();
    }
    /***** End: helper function *****/

    return new WorkspacePanelView();
});
