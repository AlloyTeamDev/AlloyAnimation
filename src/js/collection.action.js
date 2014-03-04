/**
动作collection
@module
**/
define([
    'backbone',
    'model.action', 'modelUtil'
], function(
    Backbone,
    Action, util
){
    var ActionCollection,
        createId = util.createId;

    /**
    @class ActionCollection
    @extends Backbone.Collection
    **/
    ActionCollection = Backbone.Collection.extend({
        model: Action,

        initialize: function(){
            this.id = createId();
            console.debug('A new action collection %s is created', this.id);

            // 为变化打log
            this.on('add', this._onAdd);
            this.on('remove', this._onRemove);
        },

        _onAdd: function(bone){
            console.debug(
                'Action collection %s added action %s',
                this.id, bone.id
            );
        },

        _onRemove: function(bone){
            console.debug(
                'Action collection %s removed action %s',
                this.id, bone.id
            );
        }
    });

    return ActionCollection;
});
