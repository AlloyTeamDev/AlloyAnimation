/**
relational model/collection 的命名空间。
需要产生关联的 model/collection 要在此命名空间下添加其构造函数，以建立关联，
否则，如果直接依赖需要关联的 model/collection，容易产生循环依赖
@module
**/
define([
    'Backbone.Relational'
], function(
    Backbone
){
    var scope = {};

    // 添加一个命名空间，在这个命名空间上添加各个类的构造函数，
    // 使得能根据构造函数名的字符串找到相应的构造函数
    Backbone.Relational.store.addModelScope(scope);

    return scope;
});
