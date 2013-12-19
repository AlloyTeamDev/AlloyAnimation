/**
骨骼数面板的view
@module
**/
define([
    'jquery', 'underscore',
    'view.Panel',
    'tmpl!html/panel.boneTree.bone.html'
], function(
    $, _,
    PanelView,
    boneTmpl
){
    var BoneTreePanelView, BoneView,
        helper;

    /**
    @class BoneTreePanelView
    @extends PanelView
    **/
    BoneTreePanelView = PanelView.extend({
        /**
        Start: backbone内置属性/方法
        **/
        el: $('#js-boneTreePanel'),
        initialize: function(){
            // 骨骼view的哈希，键为骨骼的id，值为骨骼view的实例
            this._boneHash = {};

            // 复用父类的`initialize`方法
            this.constructor.__super__.initialize.apply(this, arguments);
        },
        render: function(bonesData){
            this.$el
                .html( this.panelTmpl({
                    type: 'boneTree',
                    title: '骨骼树'
                }) );

            // 如果有传入骨骼数据，渲染出骨骼view
            if(bonesData){
                bonesData.forEach(function(boneData){
                    this.addBone(boneData);
                }, this);
            }

            // 缓存DOM元素
            this.$bd = this.$('>.bd');

            return this;
        },
        /**
        End: backbone内置属性/方法
        **/

        /**
        将一个骨骼的view添加到骨骼树中，遵循父子关系
        @method addBone
        @param {Object} boneData 骨骼的数据
        @param {Object} [options] 可选的参数
            @param {String} [options.parent] 父骨骼的id
        **/
        addBone: function(boneData, options){
            var $container,
                boneView,
                boneElId,
                parentElId;

            options = options || {};

            // 设置要插入的DOM容器
            if(options.parent){
                parentElId = BoneView.boneHtmlId(options.parent);
                $container = this.$bd.find('#' + parentElId + '>.js-children');
            }
            else{
                $container = this.$bd;
            }

            // 创建一个骨骼view实例，并保存其引用
            boneView = this._boneHash[boneData.id] = new BoneView({
                // 设置此视图的根元素上的html属性
                id: BoneView.boneHtmlId(boneData.id)
            });

            // 监听这个骨骼view的事件
            boneView.on('remove', this.removeBone, this);

            boneView.render(boneData, $container.get(0));

            // 添加子骨骼
            if(boneData.children){
                boneData.children.forEach(function(childBoneData, i){
                    this.addBone(childBoneData, {
                        parent: boneData.id,
                        at: i
                    });
                }, this);
            }

            return this;
        },
        /**
        从骨骼树中移除一个骨骼view
        @param {String} id 骨骼的id
        **/
        removeBone: function(id){
            this._boneHash[id].remove();
            return this;
        },
        /**
        将一个骨骼view移动到
        @param {String} bone 要移动的骨骼的DOM元素或其id
        @param {String} [parent] 父骨骼的DOM元素或其id
        **/
        moveBone: function(bone, parent){
            var $bone, $container;

            $bone = _.isString(bone) ?
                this.$bd.find('#' + BoneView.boneHtmlId(bone)) :
                $(bone);
            $container = _.isString(parent) ?
                this.$bd.find('#' + BoneView.boneHtmlId(id) + '>.js-children') :
                this.$bd;
            // TODO: 移出，移入
        }
    });

    /**
    @class BoneView
    @extends Backbone.View
    **/
    BoneView = Backbone.View.extend({
        attributes: {
            'class': 'js-bone'
        },
        /**
        @param {Object} [options]
        **/
        initialize: function(options){
            // TODO:
            // 拖拽调整骨骼位置，
            // 抛出事件move，带上自身id，目标父骨骼的id
        },
        /**
        @param {Object} boneData 骨骼的数据
        @param {DOMElement} container 要插入的容器
        **/
        render: function(boneData, container){
            // TODO: 连带渲染子骨骼，如果`boneData`中有子骨骼的数据

            this.$el.html(boneTmpl(boneData))
                .appendTo(container);

            return this;
        }
    }, {
        /**
        获取骨骼的html id，其前缀表示这是骨骼树面板中的骨骼
        @param {String} id 骨骼model的id
        @return {String} 骨骼的html id
        **/
        boneHtmlId: function(id){
            return 'js-boneTree-bone-' + id;
        }
    });

    return new BoneTreePanelView();
});
