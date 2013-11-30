require.config({
    // 定义文件、路径的简写
    paths: {
        'tmpl': 'base/require.tmpl',
        'jquery': 'base/jquery',
        'underscore': 'base/underscore',
        'backbone': 'base/backbone',
        'html': '../html'
    },
    // 对没有定义为AMD模块的第三方类库框架，在此补充定义该模块的依赖和输出
    shim: {
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        }
    }
});

require([
    // 'login',
    'controller'
], function(controller){
    controller.init();
});
