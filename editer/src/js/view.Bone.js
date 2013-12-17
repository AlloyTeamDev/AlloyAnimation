//骨骼view
define(['Backbone','jquery'], function(Backbone,$){
    var BoneView;

    BoneView = Backbone.View.extend({

    	tagName : 'img',

    	className : 'bone',

    	model : null,

        isActive : false,

        initialize : function(){
            //这个dom节点上不常改动的属性
            if(this.model){
                console.log('证明是initialize是 view 或 model 对象 赋值完成后才执行的')
            }
            
            this.el.id = this.cid;
            this.$el.attr('draggable',false);
            this.$el.attr('src',this.model.get('textureUrl'));

            //具体view的长宽赋值给model
            // this.model.set({
            //     w : this.$el.width(), 
            //     h: this.$el.height()
            // });
            //之后才开始监听model
            this.listenTo(this.model, 'change', this.render);
        },

        render : function(){
            console.log('bone view is render.... ');

            var data = this.model.toJSON();  
            var joint = data.joint;
            if(joint.length != 2){
                originText = '50% 50%';
            }else{
                originText = joint[0] +'px '+ joint[1] +'px';
            }

            this.$el.css({
                '-webkit-transform-origin': originText,
                '-webkit-transform': 'rotate('+ data.rotate +'deg)',
                'left': data.x,
                'top' : data.y,
                'width' : _.isString(data.w) ? 'auto' : data.w,
                'height': _.isString(data.h) ? 'auto' : data.h
            });

            return this.el;
        },

        events : {
            'click':'setBoneActive'
        },

        //TODO 下面4个方法是否与model打通的问题
        //TODO 是否直接返回model的数据,TODO transform属性如果不是只有rotate的情况兼容

        //@return 弧度
        getRotateDeg : function(){
            var transform_str = this.el.style.webkitTransform;
            var rotate_str= transform_str.slice(transform_str.indexOf('(')+1,transform_str.indexOf(')')) || '0';
            return rotate_str.replace('deg','')*1*Math.PI/180; 
        },

        getSize : function(){
            return {
                w: this.$el.width(),
                h: this.$el.height()
            }
        },

        // 区分跟jQuery的position()方法，position方法在旋转后得到是旋转空间矩形的leftTop，这个是原生的leftTop(不受旋转影响)
        getLeftTop : function (){
            var x = this.$el.css('left').replace('px','')*1 || 0;
            var y = this.$el.css('top').replace('px','')*1 || 0;
            return { x : x , y: y};
        },

        getCenter : function (boneElement){
            var size = this.getSize();
            var leftTop = this.getLeftTop();

            return {
                x: leftTop.x+size.w/2, 
                y: leftTop.y+size.h/2
            };
        },

        getRectCenter : function(boneElement){
            var dom_size = this.getSize();
            var rect_pos = this.$el.position();
            return {x: rect_pos.left+dom_size.w/2, y:rect_pos.top+dom_size.h/2};
        }




    });

    return BoneView;
});
