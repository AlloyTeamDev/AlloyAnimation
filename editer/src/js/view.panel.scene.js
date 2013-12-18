/**
景物面板的view
@module
**/
define([
    'jquery', 'underscore',
    'view.Panel',
    'tmpl!html/panel.scene.bone.html'
], function(
    $, _,
    PanelView,
    boneTmpl
){
    var ScenePanelView, SkeletonView, BoneView, helper;

    /**
    @class ScenePanelView
    @extends PanelView
    **/
    ScenePanelView = PanelView.extend({
        /**
        Start: backbone内置属性/方法
        **/
        el: $('#js-scenePanel'),
        events: {
            'click .addBtn': '_onClickAddBtn'
        },
        initialize: function(){
            // 所有骨架的view组成的hash，用id索引
            this._skeletonHash = {};
            this._boneHash = {};

            // 复用父类的`initialize`方法
            this.constructor.__super__.initialize.apply(this, arguments);
        },
        /**
        渲染此面板
        @method render
        @param {Array} [skeletonsData] 多个骨架的的当前数据
        **/
        render: function(skeletonsData){
            this.$el
                .html( this.panelTmpl({
                    type: 'scene',
                    title: '景物'
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
        End: backbone内置属性/方法
        **/

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
            var skeletonView;

            // 创建骨架view，并插入DOM中
            (skeletonView = this._skeletonHash[data.id] = new SkeletonView())
                .render(data)
                .$el
                .appendTo(this.$viewport);

            // 监听这个骨架的事件，如果有添加骨骼，保存骨骼的引用
            skeletonView.on('addBone', this._onSkeleonAddBone, this);

            return skeletonView;
        },
        /**
        一个事件回调函数，专用于此面板中的骨架的 `addBone` 事件
        @triggerObj {SkeletonView}
        @event addBone 当骨架view中添加骨骼时触发
        @param {BoneView} boneView
        @param {SkeletonView}
        **/
        _onSkeleonAddBone: function(boneView, skeletonView, options){
            this._boneHash[boneView.id] = boneView;
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

        /**
        Event handler for DOM event `click .addBtn`
        @private
        @method _onClickAddBtn
        @param {Object} jquery event object
        **/
        _onClickAddBtn: function($event){
            var $inputBoneImg = this.$('.js-inputBoneImg'),
                textureUrl;

            // TODO: 这里并不能获取到textureUrl，这么写只是说明一下这个方法做了什么，获取`textureUrl`有待进一步实现
            $inputBoneImg.click();
            textureUrl = $inputBoneImg.val();

            if(!textureUrl) return;

            this.trigger('clickAddBtn', textureUrl);
        }
    });

    /**
    专用于此面板的骨架view
    @class SkeletonView
    @extends Backbone.View
    **/
    SkeletonView = Backbone.View.extend({
        /**
        Start: backbone内置属性/方法
        **/
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
        **/
        render: function(skeletonData){
            this.addBone(skeletonData.root);

            return this;
        },
        /**
        End: backbone内置属性/方法
        **/

        /**
        创建一个骨骼view，并添加到此面板中。
        如果所提供的骨骼数据中有子骨骼，则创建并添加子骨骼view
        @method addBone
        @param {Object} data 骨骼的当前数据
        @param {Object} {options}
            @param {String} {options.parent} 父骨骼的id
        @return 所添加的骨骼的view实例
        **/
        addBone: function(data, options){
            var boneView, $container;

            options = options || {};

            // 设置DOM容器
            if(options.parent){
                // 这里要用子选择器将范围限定在当前骨骼
                $container = this._boneHash[options.parent].$el.children('.js-children');
            }
            // 如果没有提供父骨骼id，且骨架中还没有根骨骼，则添加为根骨骼
            else if(!this.root){
                $container = this.$el;
            }

            // 创建骨骼view，并插入DOM容器中
            (boneView = this._boneHash[data.id] = new BoneView())
                .render(data)
                .$el
                .appendTo($container);

            // 如果有子骨骼的数据，添加子骨骼view
            if(data.children && data.children.length){
                data.children.forEach(function(childData){
                    this.addBone(childData, {parent: data.id});
                }, this);
            }

            // 触发事件
            this.trigger('addBone', boneView, this, options);

            return boneView;
        },
        /**
        删除一个骨骼，及其子元素，
        包括解除对DOM事件的监听，删除DOM元素，解除绑定在此骨骼的view实例上的事件，删除view实例
        @param {String} id 要删除的元素的id
        **/
        removeBone: function(id){
            var boneView, $children, i, id;

            boneView = this._boneHash[id];
            $children = boneView.$el.children('.children').children('.js-bone');

            // 先递归删除子骨骼
            if($children.length){
                for(i = 0; i < $children.length; ++i){
                    id = BoneView.boneId( $children.eq(i).attr('id') );
                    this.removeBone(id);
                }
            }

            // 再删除自己：
            // 解除对DOM事件的监听，删除DOM元素，解除绑定在此骨骼的view实例上的事件
            boneView.remove();
            // 删除view实例
            boneView = null;
            delete this._boneHash[id];

            return this;
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
        **/
        render: function(boneData){
            this.id = boneData.id;
            this.$el
                .attr({
                    'id': BoneView.boneHtmlId(boneData.id),
                    'title': boneData.name
                })
                .html(boneTmpl(boneData));

            // TODO:
            // 添加对DOM事件的监听，支持拖拽调整位置、角度等，
            // 这些DOM事件的handler可以定义为此类的私有方法或本模块内的函数，
            // 当完成一次调整后，触发`drop`事件，带上调整后的位置、角度等数据

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
        获取骨骼的html id，其前缀表示这是景物面板中的骨骼
        @param {String} id 骨骼的id
        @return {String} 骨骼的html id
        **/
        boneHtmlId: function(id){
            return 'js-scene-bone-' + id;
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

    return new ScenePanelView();
});
