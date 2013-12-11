/**
骨骼collection
@module
**/
define([
    'Backbone', 'relationalScope',
    'model.Bone'
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
        model: BoneModel,
        fetch: function(){

        }
        /**
        End: backbone内置属性/方法
        **/
    });

    return new BoneCollection();
});
