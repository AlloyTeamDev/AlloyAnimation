require.config({
    // 定义文件、路径的简写
    paths: {
        'base': 'base/',
        'tmpl': 'base/require.tmpl',
        'jquery': 'base/jquery',
        'jquery.defaultSetting': 'base/jquery.defaultSetting',
        'underscore': 'base/underscore',
        'Backbone': 'base/Backbone',
        'Backbone.Relational': 'base/Backbone.Relational',
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
        },
        'Backbone.Relational': {
            deps: ['Backbone'],
            exports: 'Backbone'
        }
    }
});

require([
    'controller',
    'jquery.defaultSetting'
], function(controller, $){
    // TODO: 判断是否高级浏览器；登陆

    controller.init();
});
