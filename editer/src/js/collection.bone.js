/**
骨骼collection的类
@module
**/
define([
    'Backbone', 'relationalScope',
    'model.bone'
], function(
    Backbone, relationalScope,
    BoneModel
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
        model: BoneModel
        /**
        End: backbone内置属性/方法
        **/
    });

    relationalScope.BoneCollection = BoneCollection;

    return BoneCollection;
});
