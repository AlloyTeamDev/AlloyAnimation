require.config({
    // 定义文件、路径的简写
    paths: {
        'base': 'base/',
        'test': '../test/',
        'tmpl': 'base/require.tmpl',
        'jquery': 'base/jquery',
        'jquery.defaultSetting': 'base/jquery.defaultSetting',
        'underscore': 'base/underscore',
        'backbone': 'base/backbone',
        'backbone.relational': 'base/backbone.relational',
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
        },
        'backbone.relational': {
            deps: ['backbone'],
            exports: 'Backbone'
        }
    }
});

require([
    'controller',
    'jquery.defaultSetting',
    'test/userOperate'
], function(controller, $, userOperate){
    // TODO: 判断是否高级浏览器；登陆

    controller.init();
    userOperate.init();
});
