define(['exports'], function(exports){
    var win = window,
        Math = win.Math,
        atan = Math.atan;

    /**
    计算水平向右向量旋转到与所提供的向量平行时，所转过的角度， **取值范围为(-180, 180]，顺时针方向为正**
    @param {Number} hori 所提供的向量的水平分量
    @param {Number} vert 所提供的向量的竖直分量
    @return {Number} 所转过的角度
    **/
    exports.rotationAngle = function(hori, vert){
        // 建立用于此函数的坐标轴：
        // 水平向右为x轴，竖直向下为y轴

        var ANGLE_2_RADIAN = 57.29577951308232,
            angle;

        // 特殊角度，直接返回，避免浮点运算，提高性能
        if(hori === 0){
            if(vert > 0) return 90;
            else if(vert < 0) return -90;
            else throw new Error('Invalid arguments');
        }
        if(vert === 0){
            if(hori > 0) return 0;
            else if(hori < 0) return 180;
            else throw new Error('Invalid arguments');
        }

        if(hori > 0){
            // 第一象限
            if(vert > 0) return atan(vert / hori) * ANGLE_2_RADIAN;
            // 第四象限
            else return -atan(-vert / hori) * ANGLE_2_RADIAN;
        }
        else{
            // 第二象限
            if(vert > 0) return 180 - atan(vert / -hori) * ANGLE_2_RADIAN;
            // 第三象限
            else return 180 + atan(vert / hori) * ANGLE_2_RADIAN;
        }
    };

    /**
    提供一个点在原坐标系中的坐标，以及原坐标系到新坐标系的变换，
    计算这个点在新坐标系中的坐标
    @param {Number} oldX 在原坐标系中的x轴坐标
    @param {Number} oldY 在原坐标系中的y轴坐标
    @param {Object} [transformer] 原坐标系经过的变换
        @param {Number} [transformer.radian=0] 关于原坐标系的原点顺时针旋转的 **弧度**
        @param {Number} [transformer.xMove=0] 沿着原坐标系x轴正方向的平移
        @param {Number} [transformer.yMove=0] 沿着原坐标系y轴正方向的平移
        @param {Boolean} [transformer.turnOverX=false] 是否关于x轴翻转
        @param {Boolean} [transformer.turnOverY=false] 是否关于y轴翻转
    @return {Array} coord
        @return {Numer} coord[0] 同一个点在新坐标系中的x轴坐标
        @return {Numer} coord[1] 同一个点在新坐标系中的y轴坐标
    **/
    exports.transformCoordSys = function(oldX, oldY, transformer){
        var _Math = Math,
            cos = _Math.cos,
            sin = _Math.sin,
            radian = transformer.radian || 0,
            x = oldX,
            y = oldY;

        // 先平移
        transformer.xMove && ( x = oldX = oldX - transformer.xMove );
        transformer.yMove && ( y = oldY = oldY - transformer.yMove );

        // 再旋转
        radian && ( x = oldX * cos(radian) + oldY * sin(radian) );
        radian && ( y = oldY * cos(radian) - oldX * sin(radian) );

        // 再翻转
        transformer.turnOverX && (x *= -1);
        transformer.turnOverY && (y *= -1);

        return [x, y];
    };

    /**
    将角度转换为弧度
    @param {Number} angle 角度
    @return {Number} 对应的弧度
    **/
    exports.radianOf = function(angle){
        // 0.017453292519943295 = PI / 180
        return angle * 0.017453292519943295;
    };

    /**
    将弧度转换为角度
    @param {Number} radian 弧度
    @return {Number} 对应的角度
    **/
    exports.angleOf = function(radian){
        // 57.29577951308232 = 180 / PI
        return radian * 57.29577951308232;
    };
});
