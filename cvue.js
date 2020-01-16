/*
    实现双向绑定，首先要对数据进行劫持监听。所以需要一个observer监听器，用来监听所有的属性。如果有属性变化，就要通知订阅者看是否需要更新。
    因为订阅者有很多个，所以需要一个消息订阅器Dep来专门收集这些订阅者，然后在observer和watcher之间进行统一管理。
    接着还需要一个指令解析器Compile,对每个节点元素进行遍历和解析，将相关指令对应初始化成一个订阅器watcher,并替换模板数据或绑定相应的函数，
    此时订阅者watcher接受到属性变化时，就会执行相应的函数，从而更新视图。
*/
class Cvue{
    constructor(options){
        this.options = options;
        this.data = options.data;
        this.observer(this.data);
        this.compile(options.el)
    }
    //劫持监听
    defineReact(data, key, val){
        var dep = new Dep();
        this.observer(val);  //递归
        Object.defineProperty(data, key, {
            get(){
                console.log('读取')
                if(Dep.target){
                    dep.addSub(Dep.target)
                }
                return val;
            },
            set(newValue){
                if(val == newValue){
                    return;
                }
                val = newValue;
                dep.notify(newValue);  //如果监听到变化，通知所有的订阅者
            }
        })
    }
    observer(data){
        if(!data || typeof data !== 'object'){
            return;
        }
        Object.keys(data).forEach(key => {
            this.defineReact(data, key, data[key]);
        })
    }
    compile(el){
        var ele = document.querySelector(el);
        this.compileNode(ele);
    }
    compileNode(element){
        var childNodes = element.childNodes;
        Array.from(childNodes).forEach(node => {
            if(node.nodeType == 1){
                var attrs = node.attributes;
                Array.from(attrs).forEach(attr => {
                    var attrName = attr.name;
                    var attrValue = attr.value;
                    if(attrName.indexOf('c-') == 0){
                        attrName = attrName.substr(2)
                        if(attrName == 'model'){
                            node.value = this.data[attrValue];
                        }
                    }
                    node.addEventListener('input',e => {
                        this.data[attrValue] = e.target.value;
                    });
                    new Watcher(this,attrValue,newValue => {
                        node.value = newValue;
                    })
                })
            }else if(node.nodeType == 3){
                var text = node.textContent;
                var reg = /\{\{(.*)\}\}/;
                if(reg.test(text)){
                    node.textContent = this.data[RegExp.$1]
                    new Watcher(this,RegExp.$1,newValue => {
                        node.textContent = newValue;
                    })
                }
            }
            if(node.childNodes.length > 0){
                this.compileNode(node);
            }
        })
    }
}

//消息订阅器
class Dep{
    constructor(){
        this.subs = []
    }
    addSub(sub){
        this.subs.push(sub);
    }
    notify(newValue){
        this.subs.forEach(v => {
            v.update(newValue); 
        })
    }
}
//订阅者
/*
    订阅者在初始化时需要把自己添加到消息订阅器中。而我们已经知道监听器在get的时候执行了添加订阅者的操作，所以我们只需要在订阅者初始化的时候触发对应的get函数去执行添加订阅器的操作就可以了，
    要触发get函数，只要获取对应的属性就可以了。这里还有一个细节，只有在watcher初始化的时候才会添加订阅者，所以需要做一个判断。我们可以在订阅器上加个东西:Dep.target上缓存下订阅者，执行之后，再清空.
*/
class Watcher{
    constructor(vm, exp, cb){
        Dep.target = this;
        vm.data[exp];  //获取属性，触发get函数添加订阅者
        this.cb = cb;
        Dep.target = null;
    }
    update(newValue){
        this.cb(newValue);
    }
}