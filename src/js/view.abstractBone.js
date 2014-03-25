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

            // 骨骼在任意时刻都会处于且只处于一个状态。
            // 默认状态为非激活态
            this._state = AbstractBone.DEACTIVE;
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

        // Start: 使骨骼状态转换的方法

        /**
        激活此骨骼，并展示激活样式，表示开始操作此骨骼。
        如果已处于此状态，什么也不做
        @return this
        **/
        activate: function(){
            if(this._state === AbstractBone.ACTIVE_STYLE_SHOWN) return this;

            this.$el
                // 确保有这个class
                .addClass('js-activeBone')
                // 确保没有这个class
                .removeClass('js-activeStyleHidden');

            this._state = AbstractBone.ACTIVE_STYLE_SHOWN;

            console.debug(
                'Panel %s activate bone %s',
                // 使用子类的构造函数上提供的面板名
                this.constructor._panelName, this.id
            );

            return this;
        },

        /**
        取消激活此骨骼，表示结束操作此骨骼。
        如果已处于此状态，什么也不做
        @return this
        **/
        deactivate: function(){
            if(this._state === AbstractBone.DEACTIVE) return this;

            this.$el
                // 确保没有这两个class
                .removeClass('js-activeBone js-activeStyleHidden');

            this._state = AbstractBone.DEACTIVE;

            console.debug(
                'Panel %s deactivate bone %s',
                // 使用子类的构造函数上提供的面板名
                this.constructor._panelName, this.id
            );

            return this;
        },

        /*
        如果是激活骨骼，隐藏其激活样式；
        如果不是激活骨骼，什么也不做（确保此状态只能从激活且展示激活样式的状态进入）；
        */
        hideActiveStyle: function(){
            if( this._state === AbstractBone.ACTIVE_STYLE_HIDDEN ||
                this._state === AbstractBone.DEACTIVE
            ){
                return this;
            }

            this.$el.addClass('js-activeStyleHidden');

            console.debug(
                'Panel %s hide active style of bone %s',
                // 使用子类的构造函数上提供的面板名
                this.constructor._panelName, this.id
            );

            return this;
        },

        // End: 使骨骼状态转换的方法

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
        按 **后序遍历** 的顺序删除子骨骼和此骨骼。
        注意：此方法还会删除此骨骼在父骨骼中的引用（即父骨骼对此骨骼的引用）
        @return this
        **/
        remove: function(){
            var l, children, child,
                removed = [],
                parent, siblings;

            // 如果有子骨骼，先递归删除子骨骼
            children = this.children;
            while(l = children.length){
                // 删除此骨骼对子骨骼的引用
                child = children.shift();
                // 删除子骨骼
                removed.push(child.remove());
            }

            // 删除父骨骼对此骨骼的引用
            if( (parent = this.parent) ){
                siblings = parent.children;
                siblings.splice(siblings.indexOf(this), 1);
            }
            // 删除此骨骼对父骨骼的引用
            delete this.parent;

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
            for(field in data){
                if( !data.hasOwnProperty(field) ) continue;
                if(field in MAP) this[MAP[field]](data[field]);
            }

            return this;
        },

        /**
        **后序遍历** 以此骨骼为根骨骼的骨骼树。
        对遍历到的每一个骨骼，提供给 `iterator` 函数执行需要的操作，
        @param {Function} iterator
        @param {Object} context `iterator` 的执行上下文
        @return this
        **/
        traversal: function(iterator, context){
            // 先递归遍历子骨骼
            // 对各个子骨骼的遍历顺序，按 `children` 数组中的前后顺序
            this.children.forEach(function(child){
                child.traversal(iterator, context);
            });

            iterator.call(context, this);
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
        // **子类要覆盖这个属性** ，提供所在的面板名
        _panelName: 'unknownPanel',

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

        // 骨骼状态值的常量：
        // 非激活态
        DEACTIVE: 0,
        // 激活态，且展示激活样式
        ACTIVE_STYLE_SHOWN: 1,
        // 激活态，但不展示激活样式
        ACTIVE_STYLE_HIDDEN: 2
    });

    return AbstractBone;
});
