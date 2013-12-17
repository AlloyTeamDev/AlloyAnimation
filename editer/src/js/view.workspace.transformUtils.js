//骨骼变形 辅助元素
define(['Backbone','jquery'], function(Backbone,$){

var TransformUtilsView = Backbone.View.extend({
	
	el : '#transformUtils',

	resizePoint : {},

	rotatePoint : {},

	utilLine : {},

	model : null,  // is a boneModel

    initialize : function(){
        //TODO 辅助节点的大小可以实时赋值
        this.resizePoint = {
            w : 6,
            h : 6,
            top : this.$('.resize_point.top'),
            right : this.$('.resize_point.right'),
            bottom : this.$('.resize_point.bottom'),
            left : this.$('.resize_point.left'),

            leftTop : this.$('.resize_point.leftTop'),
            rightTop : this.$('.resize_point.rightTop'),
            leftBottom : this.$('.resize_point.leftBottom'),
            rightBottom : this.$('.resize_point.rightBottom')
        };
        this.rotatePoint ={
            w : 15,
            h : 15,
            leftTop : this.$('.rotate_point.leftTop'),
            rightTop : this.$('.rotate_point.rightTop'),
            leftBottom : this.$('.rotate_point.leftBottom'),
            rightBottom : this.$('.rotate_point.rightBottom')
        };
        this.utilLine = {
            top : this.$('.util_line.top'),
            right : this.$('.util_line.right'),
            bottom : this.$('.util_line.bottom'),
            left : this.$('.util_line.left')
        };

    },

    render : function(){
        if(!this.model) return;

        var bone = this.model.toJSON();

        var resizePoint = this.resizePoint;
        var rotatePoint = this.rotatePoint;
        var utilLine = this.utilLine;
        
        var size = {w: bone.w, h: bone.h};
        var leftTop_css = { left: -resizePoint.w, top: -resizePoint.h };
        var rightTop_css = { left: size.w , top: -resizePoint.h };
        var rightBottom_css = { left: size.w , top: size.h };
        var leftBottom_css = { left: -resizePoint.w , top: size.h };

        this.$el.hide();

        resizePoint.leftTop.css(leftTop_css);
        resizePoint.rightTop.css(rightTop_css);
        resizePoint.rightBottom.css(rightBottom_css);
        resizePoint.leftBottom.css(leftBottom_css);

        $('.util_line.hori').width(size.w);
        $('.util_line.vert').height(size.h);
        utilLine.top.css('top',-resizePoint.h/2);
        utilLine.right.css('left',size.w+resizePoint.w/2);
        utilLine.bottom.css('top',size.h+resizePoint.h/2);
        utilLine.left.css('left',-resizePoint.w/2);

        rotatePoint.leftTop.css({left: leftTop_css.left - rotatePoint.w, top: leftTop_css.top - rotatePoint.h});
        rotatePoint.rightTop.css({ left: rightTop_css.left + resizePoint.w , top: rightTop_css.top - rotatePoint.h });
        rotatePoint.rightBottom.css({ 
            left: rightBottom_css.left + resizePoint.w, 
            top: rightBottom_css.top + resizePoint.h
        });
        rotatePoint.leftBottom.css({ left: leftBottom_css.left-rotatePoint.w , top: leftBottom_css.top+resizePoint.h});
        
        // TODO 这种直接通过 CSSStyleDeclaration 来赋值不成功,导致这部分代码跟boneView的render代码一致
        //$transform[0].style = activeBone.style;  
        if(bone.joint.length != 2){
            originText = '50% 50%';
        }else{
            originText = bone.joint[0] +'px '+ bone.joint[1] +'px';
        }
        this.$el.css({
            width:size.w,
            height:size.h,
            left : bone.x,
            top : bone.y,
            '-webkit-transform-origin': originText,
            '-webkit-transform': 'rotate('+ bone.rotate +'deg)',
        })

        this.$el.show();

        return this.$el;
    },

    paste : function(boneView){
    	this.model = boneView.model;
        //由于下面的render 需要bone的具体数值，把width和height做了具体赋值
        if(this.model.get('w') == 'auto' || this.model.get('h') == 'auto'){
            this.model.set(boneView.getSize());  
        }
    	this.listenTo(this.model, 'change', this.render);
        this.render();
    },

    offPaste : function(){
    	if(this.model){
    		this.stopListening(this.model, 'change');
    		this.model = null;
            this.$el.hide();
    	} 
    }

});

return TransformUtilsView;

});
