/**
骨骼属性面板的view
@module
**/
define([
    'jquery', 'underscore',
    'view.panel',
    'tmpl!html/panel.boneProp.html', 'tmpl!html/panel.boneProp.bd.html'
], function(
    $, _,
    Panel,
    bonePropTmpl, bdTmpl
){
    var BonePropPanel;
    var bind = _.bind,
        isNaN = _.isNaN;

    BonePropPanel = Panel.extend({
        initialize: function(){
            // 复用父类的`initialize`方法
            BonePropPanel.__super__.initialize.apply(this, arguments);

            [
                '_onInputPropVal',
                '_onChangeTextureFile'
            ].forEach(function(method){
                this[method] = bind(this[method], this);
            }, this);
        },

        render: function(boneData){
            // 渲染面板
            this.$el.html( bonePropTmpl({ bone: boneData }) );

            // 缓存DOM元素
            // $bd的子元素会在 `changeBoneTo()` 中被复写，所以不要缓存
            this._$bd = this.$('.bd');

            return this;
        },

        changeBoneTo: function(boneData, options){
            if(this._boneId === boneData.id) return this;

            console.debug(
                'Panel %s change to bone %s',
                this.panelName, boneData.id
            );

            this._boneId = boneData.id;
            this._$bd.html( bdTmpl({ bone: boneData }) );
        },

        updateProp: function(boneData, options){
            var propName, $propValField,
                $bd = this._$bd;

            $bd.on('change', '.js-propVal', this._preventPopupOnChangeProp);

            $propValInput = $bd.find('.js-propVal');
            for(propName in boneData){
                if( !boneData.hasOwnProperty(propName) ) continue;
                $propValInput
                    .filter('[data-prop-name="' + propName + '"]')
                    .val(boneData[propName]);
            }

            $bd.off('change', '.js-propVal', this._preventPopupOnChangeProp);

            console.debug('Panel %s updated properties %O', this.panelName, boneData);
        },

        getBoneData: function(){
            var boneData = {};

            this._$bd.find('.js-propVal').each(function(i){
                var $propVal = $(this),
                    propName = $propVal.data('prop-name');
                boneData[propName] = $propVal.val();
                if($propVal.attr('type') === 'number'){
                    boneData[propName] = +boneData[propName];
                }
            });

            return boneData;
        },

        events: {
            /**
            IE 9 does not fire an input event when the user removes
            characters from input filled by keyboard, cut, or drag
            operations.
            **/
            'input .js-propVal': '_onInputPropVal',
            'click #js-boneProp-texture': '_onClickTexture',
            'change #js-boneProp-texture-file': '_onChangeTextureFile'
        },

        _onInputPropVal: function($event){
            var $target = $($event.target),
                propName = $target.data('prop-name'),
                propVal = $target.val(),
                boneData = {};

            if($target.attr('type') === 'number'){
                propVal = Number(propVal);

                if( isNaN(propVal) ){
                    // TODO: 显示提示给用户
                    return;
                }
            }
            boneData[propName] = propVal;

            console.debug('Panel %s changed bone %s data: %O',
                this.panelName, this._boneId, boneData
            );

            this.trigger('updatedBoneData', this._boneId, boneData);
        },

        _preventPopupOnChangeProp: function($event){
            $event.stopPropagation();
        },

        _onClickTexture: function(){
            this._$bd.find('#js-boneProp-texture-file').click();
        },

        _onChangeTextureFile: function($event){
            var panel = this,
                $bd = this._$bd,
                $fileInput,
                file, reader;

            // TODO: 
            // 1) 验证是否图片
            // 2) 处理多个图片
            file = $event.target.files[0];

            if(!file) return;

            console.debug(
                'Panel %s change texture to %s',
                this.panelName, file.name
            );

            $bd.find('#js-boneProp-texture').val(file.name);
            reader = new FileReader();
            reader.onload = function(){
                panel.trigger('updatedBoneData', panel._boneId, {
                    texture: this.result
                });
                reader.onload = null;
                reader = null;
            };
            reader.readAsDataURL(file);
        }
    });

    return new BonePropPanel({
        panelName: 'bone-prop',
        el: '#js-bonePropPanel'
    });
});
