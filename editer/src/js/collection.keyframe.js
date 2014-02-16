/**
关键帧collection
@module
**/
define([
    'backbone', 'relationalScope',
    'model.keyframe', 'modelUtil'
], function(
    Backbone, relationalScope,
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

        comparator: 'time',

        initialize: function(){
            this.id = createId();
            console.debug('A new keyframe collection %s is created', this.id);

            // 为变化打log
            this.on('add', this._onAdd);
            this.on('remove', this._onRemove);
        },

        toJSON: function(options){
            var keyframeModel;

            options = options || {};
            if( 'time' in options &&
                ( keyframeModel = this.findWhere({time: options.time}) )
            ){
                return [keyframeModel.toJSON()];
            }
            else{
                return KeyframeCollection.__super__.toJSON.call(this, options);
            }
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

    relationalScope.KeyframeCollection = KeyframeCollection;

    return KeyframeCollection;
});
