define([
    'exports',
    'view.panel.workspace'
], function(
    exports,
    workspaceView
){

    // 模拟上传骨骼纹理图
    function uploadTexture(texture){
        var img = new Image(),
            boneData = {};

        img.src = boneData.texture = texture || 'img/defaultTexture.gif';
        img.onload = function(){
            if(img.width){
                boneData.w = img.width;
                boneData.jointX = img.width / 2;
            }
            if(img.height){
                boneData.h = img.height;
                boneData.jointY = img.height / 2;
            }
            workspaceView.trigger('addBone', boneData);
        };
    }

    exports.init = function(){
        uploadTexture();
    };
});
