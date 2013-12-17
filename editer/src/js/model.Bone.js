//骨骼model
define([
    'Backbone.Relational', 'relationalScope'
], function(
    Backbone, relationalScope
){
    var BoneModel;

    var PI = Math.PI,
        deg = PI/180, //角度换弧度
        rad = 180/PI;  //弧度换角度

    /**
    @class BoneModel
    @extends Backbone.RelationalModel
    **/
    BoneModel = Backbone.RelationalModel.extend({

        defaults : {
            name : 'unknown',
            x : 0,
            y : 0,
            w : 'auto',
            h : 'auto',
            rotation : 0,
            textureUrl : null,
            joint : [],  //统一处理采用单位px
        },
       
        relation : [{
            // 有多个关键帧
            type: Backbone.HasMany,
            key: 'keyframes',
            relatedModel: 'KeyframeModel',
            relatedCollection: 'KeyframeCollection'
        }, {
            // 有一个父骨骼
            type: Backbone.HasOne,
            key: 'parent',
            relatedModel: 'BoneModel'
        }],

        initialize : function(){
            console.log('bone initial');
            console.log(this.textureUrl)
        }


        
    });

    relationalScope.BoneModel = BoneModel;

    return BoneModel;
});
