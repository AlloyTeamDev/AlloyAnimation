/**
关键帧collection
@module
**/
define([
    'Backbone', 'relationalScope',
    'model.keyframe'
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
        comparator: 'time',
        toJSON: function(options){
            var json;
            if('time' in options){
                json = this.where({time: options.time})[0].toJSON();
                json = [json];
            }
            else{
                json = this.constructor.__super__.toJSON.call(this, options);
            }
            return json;
        }
        /**
        End: backbone内置属性/方法
        **/
    });

    relationalScope.KeyframeCollection = KeyframeCollection;

    return KeyframeCollection;
});
