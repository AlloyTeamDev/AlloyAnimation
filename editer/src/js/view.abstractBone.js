/**
抽象视图，不应用于实例化，而是抽象出共有的部分，以给别的类来继承。
此抽象类是工作区面板、骨骼树面板中的骨骼视图类的公共抽象
@moduel
@exports 抽象的骨骼视图类
**/
define([
    'backbone'
], function(Backbone){
    var EMPTY_FUNC = function(){};
    var AbstractBone;

    AbstractBone = Backbone.View.extend({
        attributes: {
            'class': 'js-bone'
        },

        initialize: function(){
            // 表示父子关系的引用
            this.children = [];
            this.parent = null;
        },

        /**
        将骨骼的根DOM元素插入DOM容器中，并为其添加html id
        如果提供的骨骼数据中有子骨骼的数据，不创建、不渲染子骨骼。
        @method render
        @param {Object} boneData 骨骼的数据
            @param {String} boneData.id
            @param {String} boneData.name
            @param {Number} boneData.texture
            @param {Number} boneData.jointX
            @param {Number} boneData.jointY
            @param {Number} boneData.rotate
            @param {Number} boneData.w
            @param {Number} boneData.h
            @param {Number} boneData.x
            @param {Number} boneData.y
            @param {Number} boneData.z
            @param {Number} boneData.opacity
            @param {Object[]} boneData.children
            @param {String} boneData.parent
        @param {DOMElement} container 要插入的DOM容器
        @praram {Object} [options]
            @param {Boolean} [options.updated=false] 是否已更新
            TODO: 实现下面这个可选参数的逻辑
            @param {Number} [options.index=this.children.length] 指定插入为第几个子骨骼，序号从0开始
        @return this
        **/
        render: function(boneData, container, options){
            options = options || {};

            this.id = boneData.id;

            !options.updated && this.update(boneData);

            this.$el
                .attr( 'id', this.constructor.id2HtmlId(boneData.id) )
                .appendTo(container);

            return this;
        },

        /**
        激活此骨骼，表示开始操作此骨骼
        @return this
        **/
        activate: function(){
            console.debug('Activate bone %s in panel %s', this.id, this.constructor._panelName);

            this.$el.addClass('js-activeBone');

            return this;
        },

        /**
        取消激活此骨骼，表示结束操作此骨骼
        @return this
        **/
        deactivate: function(){
            this.$el.removeClass('js-activeBone');

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

            // 对外通知：此骨骼添加了一个子骨骼
            this.trigger('addChild', child, this, options);

            return child;
        },

        /**
        彻底删除此骨骼view。
        @return this
        **/
        remove: function(){
            var parent, brothers;

            // 删除父子骨骼之间的相互引用
            if( ( parent = this.parent ) &&
                ( brothers = parent.children )
            ){
                // 删除在父骨骼中的引用
                brothers.splice(brothers.indexOf(this), 1);
                // 删除对父骨骼的引用
                delete this.parent;
            }

            // 解除监听DOM事件，删除DOM元素，解除绑定在view实例上的事件
            AbstractBone.__super__.remove.call(this);

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

            MAP = this.FIELD_2_METHOD;
            for(field in MAP){
                if( !MAP.hasOwnProperty(field) ) continue;
                if(field in data) this[MAP[field]](data[field]);
            }

            return this;
        },

        /*
        Start: 原子性的设置或获取骨骼数据的方法 
        请使用这些方法或 `update()` 来修改骨骼的数据，
        而不是 `this.$el` ，以保证缓存数据的正确性
        */

        // **指向空函数的方法，表示子类必须要实现的方法**

        /**
        设置或获取骨骼名
        @param {String} [name] 要设置成的名字
        @return {this|String} this，或骨骼名
        **/
        name: EMPTY_FUNC,

        /**
        设置或获取骨骼的纹理图
        @param {String} [url] 要设置成的纹理图的url
        @return {this|String} this, 或纹理图的url
        **/
        texture: EMPTY_FUNC,
        
        /**
        设置或获取关节的水平坐标。
        @param {Number} [x] 要设置成的水平坐标
        @return {this|Number}
        **/
        jointX: EMPTY_FUNC,

        /**
        设置或获取关节的垂直坐标。
        @param {Number} [y] 要设置成的水平坐标
        @return {this|Number}
        **/
        jointY: EMPTY_FUNC,

        /**
        设置或获取骨骼的旋转角度。
        @param {Number} [angle] 要设置成的旋转角度
        @return {this|Number}
        **/
        rotate: EMPTY_FUNC,

        /**
        设置或获取骨骼的宽度
        @param {Number} [w] 要设置成的宽度
        @return {this|Number}
        **/
        width: EMPTY_FUNC,

        /**
        设置或获取骨骼的高度
        @param {Number} [h] 要设置成的高度
        @return {this|Number}
        **/
        height: EMPTY_FUNC,

        /**
        设置或获取骨骼的水平坐标
        @param {Number} [x] 要设置成的水平坐标
        @return {this|Number}
        **/
        positionX: EMPTY_FUNC,

        /**
        设置或获取骨骼的竖直坐标
        @param {Number} [y] 要设置成的竖直坐标
        @return {this|Number}
        **/
        positionY: EMPTY_FUNC,

        /**
        设置或获取骨骼的垂直屏幕方向上的坐标
        @param {Number} [z] 要设置成的坐标
        @return {this|Number}
        **/
        positionZ: EMPTY_FUNC,

        /**
        设置或获取骨骼的透明度
        @param {Number} [alpha] 要设置成的透明度
        @return {this|Number}
        **/
        opacity: EMPTY_FUNC,


        /* Start: 私有成员 */

        // 将数据字段名映射到设置相应字段的方法名
        FIELD_2_METHOD: {
            name: 'name',
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
        }

        /* End: 私有成员 */
    }, {
        // 所在的面板名，用于构成骨骼的html id
        // **子类要覆盖这个属性**
        _panelName: 'unknown',

        /**
        获取骨骼的html id，其前缀表示这是工作区面板中的骨骼
        @param {String} id 骨骼的id
        @return {String} 骨骼的html id
        **/
        id2HtmlId: function(id){
            var panelName = this._panelName;
            return 'js-'
                + (panelName ? panelName + '-' : '')
                + 'bone-'
                + id;
        },

        /**
        从骨骼的html id中获取骨骼id
        @param {String} htmlId 骨骼的html id
        @return {String} 骨骼的id
        **/
        htmlId2Id: function(htmlId){
            return htmlId.split('-').pop();
        },
    });

    return AbstractBone;
});
