/**
关键帧collection
@module
**/
define([
    'backbone', 'relationalScope',
    'model.keyframe'
], function(
    Backbone, relationalScope,
    Keyframe
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
        model: Keyframe,
        comparator: 'time',
        toJSON: function(options){
            var json;

            options = options || {};
            if('time' in options){
                json = this.where({time: options.time})[0].toJSON();
                json = [json];
            }
            else{
                json = KeyframeCollection.__super__.toJSON.call(this, options);
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
