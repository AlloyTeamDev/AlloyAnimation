/**
关键帧collection
@module
**/
define([
    'backbone',
    'model.keyframe', 'modelUtil'
], function(
    Backbone,
    Keyframe, util
){
    var KeyframeCollection,
        createId = util.createId;

    /**
    @class KeyframeCollection
    @extends Backbone.Collection
    **/
    KeyframeCollection = Backbone.Collection.extend({
        model: Keyframe,

        initialize: function(){
            this.id = createId();
            console.debug('A new keyframe collection %s is created', this.id);

            // 为变化打log
            this.on('add', this._onAdd);
            this.on('remove', this._onRemove);
        },

        _onAdd: function(bone){
            console.debug(
                'Keyframe collection %s added keyframe %s',
                this.id, bone.id
            );
        },

        _onRemove: function(bone){
            console.debug(
                'Keyframe collection %s removed keyframe %s',
                this.id, bone.id
            );
        }
    });

    return KeyframeCollection;
});
