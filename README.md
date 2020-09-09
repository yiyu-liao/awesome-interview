### 思路

根据题目的描述，如果使用业界的mvvm前端框架，很快就能完成题目的需求，但这样又会少了很多意思，于是我的想法是，能否参考vue，react等框架，自己实现一个mvvm的demo出来，把之前所了解的的理论概念实践起来。

### 实践

Proxy + Snabbom

浏览器dom节点的创建，更新等操作是非常消耗性能的，于是使用sanbbdom虚拟dom的管理dom的变化，通过proxy拦截filter条件变量set方法，在条件发生变化时候，触发生成最新的vnode，通过sanbbdom的diff计算，尽可能复用原有的dom节点。在细节处理中，简单增加了一个cache缓存，优化查找分类的效率。

online: https://codesandbox.io/s/xmind-75dqm?file=/index.html






