/**
骨骼model
@module
**/
define([
    'Backbone.Relational', 'relationalScope'
], function(
    Backbone, relationalScope
){
    var BoneModel;

    /**
    @class BoneModel
    @extends Backbone.RelationalModel
    **/
    BoneModel = Backbone.RelationalModel.extend({
        /**
        Start: backbone内置属性/方法
        **/
        id: 'name',
        defaults: {
            name: 'unknown'
        },
        relation: [{
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
        }]
        /**
        Start: backbone内置属性/方法
        **/
    });

    relationalScope.BoneModel = BoneModel;

    return BoneModel;
});
