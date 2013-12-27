# AlloyStick骨骼动画编辑器

## 命名规范

### js

- 引用jquery对象的变量，请用 `$` 作为变量名的开头
- 类名首字母大写，实例名首字母小写
- 一个类的属性/方法，如果已下划线 `_` 开头，表示是私有属性/方法

### html

- 有在js中使用的class/id名，请在加上前缀 `js-`
- class/id名用 `-` 做分隔，跟html属性名的分隔方式保持一致


## 代码缩进

请使用4个空格作为缩进，以保证在任何编辑器下都保持一致的缩进长度。
如果是Sublime，可以在项目配置中添加如下配置：

```JSON
"tab_size": 4,
"translate_tabs_to_spaces": true
```

## js代码注释规范

遵循(YUIDoc规范)[http://yui.github.io/yuidoc/syntax/]

### 除了YUIDoc规范定义的tag，增加如下tag

- exports 表示模块暴露的对象
- triggerObj 表示事件是在哪个对象上触发

## js console

请预埋 `console.debug()` 输出程序执行的主要步骤，表示程序的执行流程，以便于调试和上报错误。
请不要删除这些表示程序执行流程的 `console.debug()` 语句，发布时可以覆盖 `console.debug` 接口，保存传入的信息，用于上报错误。
