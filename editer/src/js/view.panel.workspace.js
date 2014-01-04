/**
工作区面板的view
@module
@exports 工作区面板的view实例
**/
define([
    'jquery', 'underscore',
    'model.bone', 'collection.bone',
    'view.panel', 'view.bone', 'view.workspace.transformUtils',
    'tmpl!html/panel.workspace.bone.html', 'tmpl!html/workspace.html'
], function(
    $, _,
    BoneModel, BoneCollection,
    PanelView, BoneView, TransformUtilsView,
    boneTmpl, workspaceTmpl
){
    var WorkspacePanelView, SkeletonView, BoneView, helper;

    //单位变量
    var PI = Math.PI,
        deg = PI/180,//角度换弧度
        rad = 180/PI;//弧度换角度

    //辅助变量
    var isDraging = false,isRotating = false,isResizing = false;
    var resizing_point = null;
    var offsetX,offsetY,
        old_mouseX,old_mouseY,
        old_pos = null,
        old_size = null,
        old_rotate = 0;

    var offsetAngle = 0;

    var $workspace = null;  // = WorkspacePanelView.$workspace
    var transformUtils = null;
    // 减少搜索作用域链的局部变量
    var win = window,
        Math = win.Math;

    /**
    @class WorkspacePanelView
    @extends PanelView
    **/
    var WorkspacePanelView = PanelView.extend({

        el: '#js-workspacePanel',

        $workspace: null,  //TODO workspace replace js-workspacePanel or rename workspace

        activeBoneView: null,

        boneCollection: new BoneCollection(),

        boneViews: {},

        pageOffset: null,

        initialize: function(){
            // 复用父类的initialize方法
            this.constructor.__super__.initialize.apply(this, arguments);

            // 渲染空面板
            this.$el.html( workspaceTmpl());
            // 减少命名长度 
            this.$workspace = $workspace = this.$('#workspace');
            // 此面板中所有骨架的view构成的hash，用id索引
            this._skeletonHash = {};
            // 此面板中所有骨骼的view构成的hash，用id索引
            this._boneHash = {};
            
            var offset = $workspace.offset();
            this.pageOffset = {
                x: offset.left,
                y: offset.top
            };
            //附属性view的init或render(必须要等workspace init之后才能自身init等有强依赖的)
            transformUtils = new TransformUtilsView();

            // 特性检测 TODO 考虑这里应该放到什么地方
            if(!window.FileReader){
                alert('Your browser dont\'t support FileReader');
            }
        },

        /**
        渲染此面板
        @method render
        @param {Array} [skeletonsData] 多个骨架的的当前数据
        **/
        render: function(skeletonsData){
            this.$el
                .html( this.panelTmpl({
                    type: 'workspace',
                    title: '工作区'
                }) );

            // 缓存DOM元素
            this.$viewport = this.$('.viewport');

            // 如果有传入骨架数据，渲染出骨架view
            if(skeletonsData){
                skeletonsData.forEach(function(skeletonData){
                    this.addSkeleton(skeletonData);
                }, this);
            }

            return this;
        },

        /**
        获取此面板中的某个骨架view，或所有骨架view
        @param {String} [id] 指定骨架的id
        @return {SkeletonView|SkeletonView[]}
        **/
        getSkeleton: function(id){
            if(id) return this._skeletonHash[id];
            else return _.values(this._skeletonHash);
        },

        /**
        创建一个骨架view，并添加到此面板中
        @method addSkeleton
        @param {Object} data 骨架的当前数据
        @return 所添加的骨架的view实例
        **/
        addSkeleton: function(data){
            var skeleton, boneId;

            // 创建骨架view，并插入DOM中
            (skeleton = this._skeletonHash[data.id] = new SkeletonView())
                .render(data, this.el);

            // 将骨架中已有的骨骼保存起来
            skeleton.getBone().forEach(function(bone){
                this._boneHash[bone.id] = bone;
            }, this);
            // 监听这个骨架的事件，如果有添加骨骼，保存新添加的骨骼
            skeleton.on('addBone', this._onSkeleonAddBone, this);

            return skeleton;
        },

        /**
        获取此面板中的某个骨骼view，或所有骨骼view
        @param {String} [id] 指定骨骼的id
        @return {BoneView|BoneView[]}
        **/
        getBone: function(id){
            if(id) return this._boneHash[id];
            else return _.values(this._boneHash);
        },

        // 配置要委派的DOM事件
        events: {
            'dragover': function(){ return false }, //这个函数是是需要的,不然会按照浏览器的默认行为
            'drop': 'onDrop',
            'click': 'onClick',
            'mousedown active': 'mousedownActive',
            'mousedown resize_point': 'mousedownResizePoint',
            'mousedown rotate_point': 'mousedownRotatePoint',
            'mousemove': 'onMousemove',
            'mouseup': 'onMouseup'
        },

        onDrop: function(e){
            var e = event;  //这里有个注意的地方，jquery帮你封event，而且里面居然没有我们需要的数据
            var _this = this;
            e.stopPropagation();
            e.preventDefault();
           
            this.$('#empty_wording').hide();

            var files = e.dataTransfer.files;
            for(var i =0; i<files.length; i++){
                var reader = new FileReader();
                reader.readAsDataURL(files[i]);

                //FileReader是一种异步文件读取机制，所以多文件读取的时候要用闭包
                reader.onload = (function(r){
                    return function(){
                        var bone = new BoneModel({'texture':r.result});  //注意不能直接传string
                        _this.addBone(bone);
                    }
                })(reader);
            }
        },

        onClick: function(e){
            var target = e.target;
            if($(target).hasClass('bone')){
                this.setBoneActive(target);
            }else{
                this.setAllBoneNormal();
            }
        },

        mousedownActive: function(e){
            isDraging = true;

            old_mouseX = event.pageX || event.clientX;
            old_mouseY = event.pageY || event.clientY;

            //不能使用 position方法有得到的left top 并不是原来没有旋转的左上角的left top
            //pre_pos = $(this).position();
            //var $elem = $(activeBone);

            //后来发现拖拽可以跟旋转没有关系
            //var angle = getRotateDeg(activeBone); 
            //var center = getCenter(activeBone);
            // var afterRotatePos = afterRotate(leftTopPos.x,leftTopPos.y,center,angle);
            // pre_pos = afterRotatePos;
            pre_pos = this.activeBoneView.getLeftTop();

            // console.log('mouseX,mouseY',event.pageX,event.pageY);
            // console.log('pre_pos',pre_pos);
        },
            
        mousedownResizePoint: function(e){
            isResizing = true;
            resizing_point = e.target;
            old_mouseX = event.pageX || event.clientX;
            old_mouseY = event.pageY || event.clientY;

            old_pos = this.activeBoneView.getLeftTop();
            old_size = this.activeBoneView.getSize();
        },
      
        mousedownRotatePoint: function(e){
            isRotating = true;
            var activeBoneView = this.activeBoneView;

            //注意rotate要计算的是旋转后的占据区域位置，不是原生位置，所以center计算的不是dom的中心
            var rect_center = activeBoneView.getRectCenter();
            //注意这里的mouse_pos是相对于workspace的pos，非page pos
            var mouse_pos = {
                x: (event.pageX || event.clientX) - this.pageOffset.x, 
                y: (event.pageY || event.clientY) - this.pageOffset.y
            };

            offsetAngle = Math.atan2(rect_center.y-mouse_pos.y, mouse_pos.x-rect_center.x);
            offsetAngle = (Math.PI/2- offsetAngle)*(180/Math.PI);

            old_rotate = activeBoneView.getRotateDeg()*rad;

            // var size = this.activeBoneView.getSize();
            // var originText = size.w/2+ 'px ' + size.y/2 + 'px';
            // activeBoneView.$el.css({'-webkit-transform-origin': originText});

            activeBoneView.model.set({ 'joint': [] });  //目前空值joint，render的时候就是中心
            // $transform.css({'-webkit-transform-origin': originText});
        },

        onMousemove: function(e){

            if( this.activeBoneView == null ) return;

            var $elem = this.activeBoneView.$el;
            var bone = this.activeBoneView.model;

            if(isDraging){
                var mouseX = event.pageX || event.clientX;
                var mouseY = event.pageY || event.clientY;

                var new_left = pre_pos.x + (mouseX - old_mouseX);
                var new_top = pre_pos.y + (mouseY - old_mouseY);

                bone.set({x: new_left, y: new_top});
            }

            if(isResizing && resizing_point){
                var new_mouseX = event.pageX || event.clientX;
                var new_mouseY = event.pageY || event.clientY;
                var angle = this.activeBoneView.getRotateDeg();

                //变换坐标，变换回没有旋转的坐标
                var old_changeMouse = changeCoordinate(old_mouseX,old_mouseY,-angle);  
                var new_changeMouse = changeCoordinate(new_mouseX,new_mouseY,-angle);
                // var diffX = old_mouseX - new_mouseX;
                // var diffY = old_mouseY - new_mouseY;
                diffX = old_changeMouse.x - new_changeMouse.x;
                diffY = old_changeMouse.y - new_changeMouse.y;


                //TODO 暂时不使用transform来设置 
                //var matrix_str = $(activeBone).css('-webkit-transform');  //TODO 得到的matrix在后面输出数据可能有用
                //var transform_str = activeBone.style.webkitTransform;
                //注意第一次的时候为空情况，要赋值0，0
                // var transform_val= transform_str.slice(transform_str.indexOf('(')+1,transform_str.indexOf(')')) || '0,0';
                // var transform_arry = transform_val.split(',');
                // var translateX = transform_arry[0].replace('px','')*1;
                // var translateY = transform_arry[1].replace('px','')*1;

                var new_pos, new_size;
                var originArray = [];
                var $resizing_point = $(resizing_point);

                if($resizing_point.hasClass('top')){          
                    new_size = {w: old_size.w, h:old_size.h + diffY};
                    new_pos = {x: old_pos.x , y: old_pos.y - diffY};
                    //originText =  old_size.w/2+'px '+ (old_size.h/2+diffY) +'px';
                    originArray = [old_size.w/2, old_size.h/2+diffY];
                }
                if($resizing_point.hasClass('bottom')){
                    new_pos = old_pos;
                    new_size = {w: old_size.w, h:old_size.h - diffY};
                    //originText =  old_size.w/2+'px '+ old_size.h/2 +'px';
                    originArray = [old_size.w/2, old_size.h/2];
                }
                if($resizing_point.hasClass('left')){
                    new_pos = {x: old_pos.x- diffX, y: old_pos.y};
                    new_size = {w: old_size.w+diffX, h:old_size.h};
                    //originText =  (old_size.w/2+diffX)+'px '+ old_size.h/2 +'px';
                    originArray = [old_size.w/2+diffX ,old_size.h/2];
                }
                if($resizing_point.hasClass('right')){
                    new_pos = old_pos;
                    new_size = {w: old_size.w-diffX, h:old_size.h};
                    //originText =  old_size.w/2+'px '+ old_size.h/2 +'px';
                    originArray = [old_size.w/2, old_size.h/2];
                }
                if($resizing_point.hasClass('leftTop')){
                    new_pos = {x: old_pos.x - diffX, y: old_pos.y-diffY};
                    new_size = {w: old_size.w+diffX, h:old_size.h+diffY};
                    //originText =  (old_size.w/2+diffX)+'px '+ (old_size.h/2+diffY) +'px';
                    originArray = [old_size.w/2+diffX, old_size.h/2+diffY];
                }
                if($resizing_point.hasClass('rightTop')){
                    new_pos = {x: old_pos.x, y: old_pos.y-diffY};
                    new_size = {w: old_size.w-diffX, h:old_size.h+diffY};
                    //originText =  old_size.w/2+'px '+ (old_size.h/2+diffY) +'px';
                    originArray = [old_size.w/2, old_size.h/2+diffY];
                }
                if($resizing_point.hasClass('rightBottom')){
                    new_pos = old_pos;
                    new_size = {w: old_size.w-diffX, h:old_size.h-diffY};
                    //originText =  old_size.w/2+'px '+ old_size.h/2 +'px';
                    originArray = [old_size.w/2, old_size.h/2];
                }
                if($resizing_point.hasClass('leftBottom')){
                    new_pos = {x: old_pos.x-diffX, y: old_pos.y};
                    new_size = {w: old_size.w+diffX, h:old_size.h-diffY};
                    //originText =  (old_size.w/2+diffX)+'px '+ old_size.h/2 +'px';
                    originArray = [old_size.w+diffX, old_size.h-diffY];
                }

                //友好交互处理,缩小缩到一定比例后，最少长宽为10
                new_size.w = new_size.w < 10 ? 10 : new_size.w;
                new_size.h = new_size.h < 10 ? 10 : new_size.h;  

                bone.set({
                    'x': new_pos.x,
                    'y': new_pos.y,
                    'w': new_size.w,
                    'h': new_size.h,
                    'joint': originArray
                });
            }

            if(isRotating){
                // /TODO center部分目前是不变的，之后要改成根据“关节改变”
                var rect_center = this.activeBoneView.getRectCenter();

                var new_mousePos = {
                    x: (event.pageX || event.clientX) - this.pageOffset.x, 
                    y: (event.pageY || event.clientY) - this.pageOffset.y
                };

                var new_angle = Math.atan2(rect_center.y-new_mousePos.y, new_mousePos.x-rect_center.x);
                new_angle = (Math.PI/2- new_angle)*(180/Math.PI);
                new_angle = new_angle-offsetAngle+old_rotate;

                // console.log('new:',new_angle);
                // console.log('offset:',offsetAngle);
                // console.log('old_rotate:',old_rotate);
                bone.set({'rotate': new_angle});
            }
        },

        onMouseup: function(e){
            isDraging = false;
            isResizing = false;
            isRotating = false;

            resizing_point = null;
        },

        addBone: function(bone){
            var boneView = new BoneView({'model':bone});
            this.boneCollection.add(bone);
            this.boneViews[boneView.cid] = boneView; 
            $workspace.append(boneView.render());
        },

        setBoneActive: function (boneElement){
            var boneViewID = boneElement.id;
            this.activeBoneView = this.boneViews[boneViewID];
            this.activeBoneView.isActive = true;
            var $activeBone = this.activeBoneView.$el;

            if(this.activeBoneView.cid != boneViewID){
                $activeBone.removeClass('active');
            }
            $activeBone.addClass('active');
            
            transformUtils.paste(this.activeBoneView);
        },

        setAllBoneNormal: function(){

            if(this.activeBoneView){

                this.activeBoneView.isActive = true;
                this.activeBoneView.$el.removeClass('active');
                transformUtils.offPaste();

                this.activeBoneView = null;
                transformUtils.$el.hide();
            }
        }
    });

    // 坐标变换
    function changeCoordinate(x1,y1,r){
        var x = x1*Math.cos(r) - y1*Math.sin(r);
        var y = x1*Math.sin(r) + y1*Math.cos(r);
        return {x:x, y:y};
    }

    // 真正的求出某点根据bone旋转角度旋转后所在位置
    function afterRotate(x1,y1,center,angle){
        var x0 = center.x;
        var y0 = center.y;

        //假设坐标系原点在骨骼中心上，进行旋转公式,得到在中心坐标上的x2,y2
        var _x1 = x1 - x0;
        var _y1 = y1 - y0;
        _pos = changeCoordinate(_x1,_y1,angle);
        var _x2 = _pos.x;
        var _y2 = _pos.y;

        //最后把中心平移回去原坐标
        return {
            x: _x2 + x0,
            y: _y2 + y0
        }
    }


    /**
    专用于此面板的骨架view
    @class SkeletonView
    @extends Backbone.View
    **/
    SkeletonView = Backbone.View.extend({
        attributes: {
            'class': 'js-skeleton'
        },
        initialize: function(){
            this.$el.css({
                'position': 'relative'
            });

            // 所有骨骼的view组成的hash，用id索引
            this._boneHash = {};
            // 根骨骼的view
            this.root = void 0;

            // TODO: 支持通过拖拽上传纹理图来创建骨骼
        },
        /**
        @method render
        @param {Object} skeletonData 骨架的数据
            @param {Object} skeletonData.root
        @param {DOMElement} [container] 要插入的DOM容器
        @return this
        **/
        render: function(skeletonData, container){
            // 创建根骨骼
            (this.root = this._boneHash[skeletonData.root.id] = new BoneView())
                .on('addChild', this._onAddChild, this)
                .render(skeletonData.root, this.el);

            // TODO: 如果有子骨骼的数据，创建之

            container && this.$el.appendTo(container);

            return this;
        },
        _onAddChild: function(child, parent, options){
            this._boneHash[child.id] = child;
            this.trigger('addBone', child, this, options);
        },

        /**
        获取某个骨骼，或所有骨骼
        @param {String} [boneId] 骨骼的id
        @return {BoneView}
        **/
        getBone: function(boneId){
            if(boneId) return this._boneHash[boneId];
            else return _.values(this._boneHash);
        }
    });

    /**
    专用于此面板的骨骼view
    @class BoneView
    @extends Backbone.View
    **/
    BoneView = Backbone.View.extend({
        /**
        Start: backbone内置属性/方法
        **/
        attributes: {
            'class': 'js-bone'
        },
        initialize: function(){
            // 默认的骨骼位置
            this.$el.css({
                'position': 'absolute',
                'left': '20px',
                'top': '20px'
            });
        },
        /**
        将骨骼数据填入html模板，并将得到的html片段填入此视图的根元素当中。
        不填入其子骨骼，也不执行将根元素插入DOM中的操作
        @method render
        @param {Object} boneData 骨骼的数据
            @param {String} boneData.name
            @param {String} boneData.texture
            @param {Array} boneData.children
        @param {DOMElement} [container] 要插入的DOM容器
        @return this
        **/
        render: function(boneData, container){
            this.id = boneData.id;
            this.$el
                .attr({
                    'id': boneId2boneHtmlId(boneData.id)
                });
            this.update(boneData);

            container && this.$el.appendTo(container);

            return this;
        },
        /**
        End: backbone内置属性/方法
        **/

        /**
        根据传入的几何数据，更新骨骼图形
        @param {Object} data
        **/
        update: function(data){

        }
    }, {
        /**
        获取骨骼的html id，其前缀表示这是工作区面板中的骨骼
        @param {String} id 骨骼的id
        @return {String} 骨骼的html id
        **/
        boneHtmlId: function(id){
            return 'js-workspace-bone-' + id;
        },
        /**
        从骨骼的html id中获取骨骼id
        @param {String} elId 骨骼的html id
        @return {String} 骨骼的id
        **/
        boneId: function(elId){
            return elId.split('-').pop();
        }
    });

    return new WorkspacePanelView();
});
