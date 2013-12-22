/**
骨架collection
@module
**/
define([
    'Backbone', 'relationalScope',
    'model.skeleton'
], function(
    Backbone, relationalScope,
    SkeletonModel
){
    var SkeletonCollection;

    /**
    @class SkeletonCollection
    @extends Backbone.Collection
    **/
    SkeletonCollection = Backbone.Collection.extend({
        model: SkeletonModel,
        fetch: function(){

        },
        save: function(){

        }
    });

    relationalScope.SkeletonCollection = SkeletonCollection;

    return SkeletonCollection;
});
