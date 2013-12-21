/**
关键帧collection
@module
**/
define([
    'Backbone', 'relationalScope',
    'model.Keyframe'
], function(
    Backbone, relationalScope,
    KeyframeModel
){
    var KeyframeCollection;

    /**
    @class KeyframeCollection
    @extends Backbone.Collection
    **/
    KeyframeCollection = Backbone.Collection.extend({
        /**
        Start: backbone内置属性/方法
        **/
        model: KeyframeModel,
        comparator: 'time'
        /**
        End: backbone内置属性/方法
        **/
    });

    relationalScope.KeyframeCollection = KeyframeCollection;

    return KeyframeCollection;
});
