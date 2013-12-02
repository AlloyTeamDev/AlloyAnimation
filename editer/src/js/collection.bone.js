/**
骨骼collection
@module
**/
define([
    'Backbone',
    'model.Bone'
], function(
    Backbone,
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

    return new BoneCollection();
});
