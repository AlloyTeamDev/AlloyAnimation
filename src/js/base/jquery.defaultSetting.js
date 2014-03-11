/**
对jquery的基础配置
@module
@exports undefined
**/
define([
    'jquery', 'underscore',
    'base/detector'
], function($, _, detector){
    // Wrap in a document ready call, because jQuery writes
    // cssHooks at this time and will blow away your functions
    // if they exist.
    $(function($){
        var // 有符浮点数的正则，匹配例子：-1, -1.1, -.1, -1.10
            FLOAT = '(?:-?\\d+(?:\\.\\d\\d*)?)|(?:-?\\.\\d+)',
            // 将transform的变换函数名映射到相匹配正则，
            // 有多个变换函数时要保持这里的顺序
            // TODO: 1)支持更多的变换函数; 2)单元测试
            // @param {String} $1 旋转的角度（不带单位）
            ROTATE_FUNC_REG = new RegExp('rotate\\((' + FLOAT + ')(?:deg)?\\)', 'i'),
            // @param {String} $1 x方向上的缩放
            // @param {String} [$2] y方向上的缩放
            SCALE_FUNC_REG = new RegExp('scale\\((' + FLOAT + ')(?:,?\\s*(' + FLOAT + '))?\\)', 'i');
        var validProp, prop,
            validFormOf = detector.validFormOf;

        validProp = {
            transformOriginX: null,
            transformOriginY: null,
            transform: null,
            userSelect: null
        };
        for(prop in validProp){
            if( !validProp.hasOwnProperty(prop) ) continue;
            validProp[prop] = validFormOf(prop);
        }

        $.cssHooks.transformOriginX = {
            get: function(elem, computed, extra){
                if(validProp.transformOriginX){
                    return elem.style[ validProp.transformOriginX ];
                }
            },
            set: function(elem, value){
                if(validProp.transformOriginX){
                    elem.style[ validProp.transformOriginX ] = value;
                }
            }
        };
        $.cssHooks.transformOriginY = {
            get: function(elem, computed, extra){
                if(validProp.transformOriginY){
                    return elem.style[ validProp.transformOriginY ];
                }
            },
            set: function(elem, value){
                if(validProp.transformOriginY){
                    elem.style[ validProp.transformOriginY ] = value;
                }
            }
        };

        $.cssHooks.backgroundImage = {
            get: function(elem, computed, extra){
                return computed.slice(4, -1);
            },
            set: function(elem, value){
                elem.style.backgroundImage = 'url(' + value + ')';
            }
        };

        /**
        用jquery的 `.css()` 方法设置或获取css属性 `transform` 时：
        支持自动添加适当的浏览器厂商前缀；
        支持设置多个变换函数，而只会覆盖同名的变换函数，不覆盖不同名的；
        **/
        $.cssHooks.transform = {
            get: function(elem, computed, extra){
                return elem.style[validProp.transform];
            },
            /**
            @example set(elem, options)
                对于新值中的每一个变换函数：
                若存在于旧值中，替换旧值中的这个变换函数；
                若不存在，按 `options.funcOrder` 中指定的顺序添加进去
                @param {DOMElement} elem
                @param {Object} options
                    @param {String} options.val
                        要设置成的新值，最多包括一个变换函数，或者是 `none` 或 `matrix` 。
                        如果旧值中有同名的变换函数，替换之，且顺序不变；
                        如果没有，将新值插入到最后。
                        如果需要保证变换函数的顺序，请使用参数 `options.funcOrder`
                    @param {Array} [options.funcOrder]
                        变换函数名组成的数组，表示所设置的变换函数（如果需要设置）要按照这个顺序来设置。
                        TODO: 有待支持此参数
            @example set(elem, newVal)
                @param {DOMElement} elem
                @param {String} newVal 要设置的新值，直接覆盖整个 `transform` 属性
            **/
            set: function(elem){
                var prop = validProp.transform,
                    val, newVal;

                if(typeof arguments[1] === 'string'){
                    elem.style[prop] = arguments[1];
                    return;
                }

                newVal = arguments[1].val;

                // 如果新值为matrix或 `none` ，直接设置新值
                if( newVal.search(/(matrix)|(none)/i) !== -1 ){
                    elem.style[prop] = newVal;
                    return;
                }

                // TODO: 考虑这里是不是应该使用 `getComputedStyle`
                val = elem.style[prop];
                // 如果旧值不存在，直接设置新值
                if(!val){
                    elem.style[prop] = newVal;
                    return;
                }
                val = val.trim();
                // 如果旧值为 `none` ，直接设置新值
                if(val === 'none'){
                    elem.style[prop] = newVal;
                    return;
                }

                [
                    ROTATE_FUNC_REG,
                    SCALE_FUNC_REG
                ].forEach(function(FUNC_REG){
                    var valMatched, isInVal;
                    valMatched = newVal.match(FUNC_REG);
                    if(valMatched && valMatched[0]){
                        isInVal = false;
                        val = val.replace(FUNC_REG, function(){
                            isInVal = true;
                            return valMatched[0];
                        });
                        !isInVal && (val += ' ' + valMatched[0]);
                    }
                });
                // 此时 `val` 已经成了新值
                elem.style[prop] = val;
            }
        };

        $.cssHooks['userSelect'] = {
            get: function(elem, computed, extra){
                return elem.style[validProp.userSelect];
            },
            set: function(elem, newVal){
                elem.style[validProp.userSelect] = newVal;
            }
        };
    });

    // 显式的写出来返回undefined，是因为此模块约定为返回undefined，
    // 避免被修改成返回其他的东西。
    // 使用此模块的地方已经将此模块的输出视为undefined
    return undefined;
});
