require.config({
    // 定义文件、路径的简写
    paths: {
        'tmpl': 'base/require.tmpl',
        'jquery': 'base/jquery',
        'underscore': 'base/underscore',
        'Backbone': 'base/Backbone',
        'html': '../html'
    },
    // 对没有定义为AMD模块的第三方类库框架，在此补充定义该模块的依赖和输出
    shim: {
        'underscore': {
            exports: '_'
        },
        'Backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        }
    }
});

require([
    'controller'
], function(controller){
    // TODO: 判断是否高级浏览器；登陆

    controller.init();
});
