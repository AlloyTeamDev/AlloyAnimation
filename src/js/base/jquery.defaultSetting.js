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
            // TODO:
            // transform属性中的变换函数的顺序会对变换产生影响，
            // 不要改变变换函数的顺序
            set: function(elem, newVal){
                var MATCHER = /^(\w)+\(.+\)$/i,
                    SPLITER = ' ';
                var prop = validProp.transform,
                    val, i, j, funcName;

                // 如果新值为matrix矩阵或 `none` ，直接设置
                if( newVal.search(/(matrix)|(none)/i) !== -1
                ){
                    elem.style[prop] = newVal;
                    return;
                }

                val = elem.style[prop];
                if(val){
                    val = val.trim();
                    if(val === 'none'){
                        elem.style[prop] = newVal;
                        return;
                    }

                    // 如果旧值中，存在一个变换函数与新值中的某个变换函数同名，
                    // 则移除旧值中的这个变换函数，
                    // 并将新值中相应的变换函数移出，添加到旧值末尾。
                    // 添加到末尾，有利于在连续设置同一个变换函数时尽快遍历到该函数，而当新值中没有变换函数时，即可提前结束遍历
                    newVal = newVal.split(SPLITER);
                    val = val.split(SPLITER);
                    i = val.length;
                    while(i--){
                        if( !(funcName = val[i].match(MATCHER)[1]) ) continue;
                        j = newVal.length;
                        while(j--){
                            if(newVal[j].indexOf(funcName) === -1) continue;
                            val.splice(i, 1);
                            val.push(newVal.splice(j, 1));
                            break;
                        }
                        if(!newVal.length) break;
                    }

                    // 如果新值中还有变换函数，添加到旧值末尾
                    if(newVal.length){
                        val.concat(newVal);
                    }

                    // 此时旧值就是新值了
                    elem.style[prop] = val;
                }
                else{
                    elem.style[prop] = newVal;
                    return;
                }
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
