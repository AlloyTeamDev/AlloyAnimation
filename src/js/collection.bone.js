/**
骨骼collection的类
@module
**/
define([
    'backbone',
    'model.bone', 'modelUtil'
], function(
    Backbone,
    Bone, util
){
    var BoneCollection,
        createId = util.createId;

    /**
    @class BoneCollection
    @extends Backbone.Collection
    **/
    BoneCollection = Backbone.Collection.extend({
        model: Bone,

        initialize: function(){
            this.id = createId();
            console.debug('A new bone collection %s is created', this.id);

            // 为变化打log
            this.on('add', this._onAdd);
            this.on('remove', this._onRemove);
        },

        _onAdd: function(bone){
            console.debug(
                'Bone collection %s added bone %s',
                this.id, bone.id
            );
        },

        _onRemove: function(bone){
            console.debug(
                'Bone collection %s removed bone %s',
                this.id, bone.id
            );
        }
    });

    return BoneCollection;
});
