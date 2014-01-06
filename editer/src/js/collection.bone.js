/**
骨骼collection的类
@module
**/
define([
    'backbone', 'relationalScope',
    'model.bone'
], function(
    Backbone, relationalScope,
    Bone
){
    var BoneCollection;

    /**
    @class BoneCollection
    @extends Backbone.Collection
    **/
    BoneCollection = Backbone.Collection.extend({
        /**
        Start: backbone内置属性/方法
        **/
        model: Bone
        /**
        End: backbone内置属性/方法
        **/
    });

    relationalScope.BoneCollection = BoneCollection;

    return BoneCollection;
});
