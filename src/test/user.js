define([
    'exports',
    'view.panel.workspace'
], function(
    exports,
    workspaceView
){
    // 模拟上传骨骼纹理图
    // 暴露在全局下方便调试
    exports.uploadTexture = window.uploadTexture = function(parent, texture){
        var img = new Image(),
            boneData = {};

        parent && (boneData.parent = parent);
        img.src = boneData.texture = texture || 'img/defaultTexture.png';
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
    };
});
