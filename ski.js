function isAsyncIterable(v) {
    return v instanceof Object && Symbol.asyncIterator in v;
}

class AsyncStream {
    _new(source) {
        return new this.constructor(source);
    }
    static define(name, operator) {
        //
        AsyncStream.prototype[name] = function (...args) {
            let result = operator(this, ...args);
            return result instanceof AsyncStream ? result : isAsyncIterable(result) ? this._new(result) : result;
        };
    }
}

async function* call(source, method, ...args) {
    for await (const value of source)
        yield value[method](...args);
}

AsyncStream.define('call', call);

async function collect(source) {
    let list = [];
    for await (let value of source)
        list.push(value);
    return list;
}

AsyncStream.define('collect', collect);

async function* filter(source, test = Boolean, index = 0) {
    for await (const value of source)
        if (test(value, index++))
            yield value;
}
async function* filterValue(source, filterValue) {
    for await (const value of source)
        if (value == filterValue)
            yield value;
}

AsyncStream.define('filter', filter);
AsyncStream.define('filterValue', filterValue);

async function find(source, predicate, index = 0) {
    for await (const value of source)
        if (predicate(value, index++))
            return value;
    return new Promise(() => { });
}

AsyncStream.define('find', find);

function first(source) {
    return source[Symbol.asyncIterator]()
        .next()
        .then(({ value }) => value);
}

AsyncStream.define('first', first);

async function* flat(source) {
    for await (const value of source)
        isAsyncIterable(value) ? yield* value : yield value;
}

AsyncStream.define('flat', flat);

async function forEach(source, next, index = 0) {
    for await (const value of source)
        next(value, index++);
}

AsyncStream.define('forEach', forEach);

async function listen(source, listener) {
    for await (const value of source)
        listener(value);
}

AsyncStream.define('listen', listen);

async function log(source, ...args) {
    let index = 0;
    for await (const value of source)
        console.log(++index + 'º', ...args, value);
}

AsyncStream.define('log', log);

async function* map(source, next, index = 0) {
    for await (const value of source)
        yield next(value, index++);
}

AsyncStream.define('map', map);

const UNINITIALIZED = new Error('UNINITIALIZED');
class Memoize extends AsyncStream {
    constructor(source) {
        super();
        this.source = source;
    }
    async *[Symbol.asyncIterator]() {
        for await (let value of this.source) {
            this.value = value;
            yield value;
        }
    }
    set value(value) {
        Object.defineProperty(this, 'value', { value, writable: true });
    }
    get value() {
        throw UNINITIALIZED;
    }
}
function memoize(source) {
    return new Memoize(source);
}

AsyncStream.define('memoize', memoize);

async function* modify(source, next, index = 0) {
    for await (const value of source) {
        next(value, index++);
        yield value;
    }
}

AsyncStream.define('modify', modify);

async function* pick(source, property) {
    for await (const data of source)
        yield data[property];
}

AsyncStream.define('pick', pick);

async function* reduce(source, callbackfn, initial) {
    let previous = initial !== null && initial !== void 0 ? initial : (await source[Symbol.asyncIterator]().next()).value;
    for await (const value of source)
        yield (previous = callbackfn(previous, value));
}

AsyncStream.define('reduce', reduce);

async function* run(source, callback, index = 0) {
    for await (const value of source) {
        callback(value, index++);
        yield value;
    }
}

AsyncStream.define('run', run);

async function* start(source, value) {
    yield value;
    yield* source;
}

AsyncStream.define('start', start);

const FOREVER = new Promise(() => { });
var Trigger;
(function (Trigger) {
    Trigger[Trigger["SIGNAL"] = 0] = "SIGNAL";
    Trigger[Trigger["DATA"] = 1] = "DATA";
})(Trigger || (Trigger = {}));
function trigger(source, emitter, context) {
    const signals = source[Symbol.asyncIterator]();
    let iterable;
    let iterator;
    let signal = next(signals, Trigger.SIGNAL);
    let future = FOREVER;
    let finished = 0;
    return asyncGenerator();
    function create(value) {
        return emitter.call(context, value);
    }
    function next(asynciterator, type) {
        return asynciterator.next().then(s => ({ ...s, type }));
    }
    async function* asyncGenerator() {
        while (finished < 2) {
            let { value, done, type } = await Promise.race([signal, future]);
            if (type == Trigger.SIGNAL) {
                if (done) {
                    finished++;
                    signal = FOREVER;
                }
                else {
                    iterable = create(value);
                    iterator = iterable[Symbol.asyncIterator]();
                    future = next(iterator, Trigger.DATA);
                    signal = next(signals, Trigger.SIGNAL);
                }
            }
            else if (type == Trigger.DATA) {
                if (done) {
                    finished++;
                    future = FOREVER;
                }
                else {
                    future = next(iterator, Trigger.DATA);
                    yield value;
                }
            }
        }
    }
}

AsyncStream.define('trigger', trigger);

async function* until(source, ...stop) {
    const stopCondiction = stop.map(event => { var _a, _b; return (_b = (_a = event[Symbol.asyncIterator]) === null || _a === void 0 ? void 0 : _a.call(event).next()) !== null && _b !== void 0 ? _b : event; });
    var finished = false;
    Promise.race(stopCondiction).finally(() => (finished = true));
    for await (let value of source) {
        if (finished)
            return;
        yield value;
    }
}

AsyncStream.define('until', until);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

class SelfPromise extends Promise {
    constructor(executor = (_s, _j) => { }) {
        let resolve, reject;
        super((s, j) => {
            resolve = s;
            reject = j;
            // Promise requires you to accept an executor parameter on the constructor and call it
            return executor(s, j);
        });
        this.resolve = resolve;
        this.reject = reject;
    }
}
class PublicPromise extends SelfPromise {
}
function instantPromise(value) {
    return Object.assign(Promise.resolve(value), {
        then(onfulfilled) {
            return onfulfilled(value);
        },
    });
}

var _AsyncEmitter_instances;
class AsyncEmitter extends SelfPromise {
    constructor() {
        super(...arguments);
        _AsyncEmitter_instances.add(this);
        //
        this.tail = this.newlink();
        this.head = this.tail;
    }
    newlink() {
        return { value: new PublicPromise() };
    }
    getnext(generator) {
        var _a;
        return generator.done ? generator : ((_a = generator.next) !== null && _a !== void 0 ? _a : (generator.next = this.newlink()));
    }
    [(_AsyncEmitter_instances = new WeakSet(), Symbol.asyncIterator)]() {
        const generator = __classPrivateFieldGet(this, _AsyncEmitter_instances).call(this, this.head || this.tail);
        return {
            [Symbol.asyncIterator]: () => this[Symbol.asyncIterator](),
            next: () => generator.next(),
            return: (value) => this.return(value),
            throw: (error) => this.throw(error),
        };
    }
    yield(value) {
        return this.yieldMany([value]);
    }
    yieldMany(values) {
        delete this.head;
        this.tail.value.resolve(values);
        this.tail = this.getnext(this.tail);
    }
    async async(values) {
        for await (let value of values)
            this.push(value);
    }
    push(value) {
        this.pushMany([value]);
    }
    async pushMany(values) {
        var _a;
        (_a = this.head) !== null && _a !== void 0 ? _a : (this.head = this.tail);
        this.tail.value.resolve(values);
        this.tail = this.getnext(this.tail);
    }
    async return(value) {
        this.tail.done = true;
        this.tail.value.resolve([value]);
        this.resolve(value);
        return { value, done: true };
    }
    async throw(error) {
        this.tail.done = true;
        this.tail.value.reject(error);
        this.reject(error);
        return { value: undefined, done: true };
    }
}

class AsyncIterableStream extends AsyncStream {
    constructor(source) {
        super();
        this.source = source;
        //
        this.emitter = new AsyncEmitter();
        this.dispatch(source);
    }
    async dispatch(source) {
        isAsyncIterable(source) ? await this.emitter.async(source) : this.emitter.pushMany(source);
        this.emitter.return();
    }
    [Symbol.asyncIterator]() {
        return this.emitter[Symbol.asyncIterator]();
    }
}
// class SyncIterableStream<T> extends AsyncStream<T> {
//   constructor(private source: Iterable<T>) {
//     super()
//   }
//   protected _new<U>(source: Iterable<U | Promise<U>> | AsyncIterable<U>): AsyncStream<U> {
//     return Symbol.iterator in source ? new SyncIterableStream(source as Iterable<U>) : new AsyncIterableStream(source)
//   }
//   [Symbol.asyncIterator](): AsyncIterableIterator<T> {
//     let iterator = this.source[Symbol.iterator]()
//     return {
//       next(n: any) {
//         return instantPromise(iterator.next(n))
//       },
//       [Symbol.asyncIterator]: () => this[Symbol.asyncIterator](),
//     }
//   }
// }
function stream(source) {
    return source instanceof AsyncStream ? source : new AsyncIterableStream(source);
}
// export function emit<T>(source: Iterable<T>): AsyncStream<T> {
//   return new SyncIterableStream(source)
// }

class WeakMapOfMaps {
    constructor() {
        this.map = new WeakMap();
    }
    getMap(index) {
        return (this.map.has(index) || this.map.set(index, new Map())) && this.map.get(index);
    }
    get(object, index, init, miss = false) {
        if (miss)
            return init();
        const propertyMap = this.getMap(object);
        return (propertyMap.has(index) || propertyMap.set(index, init())) && propertyMap.get(index);
    }
}
class SetMap$1 {
    constructor() {
        this.map = new WeakMap();
    }
    getSet(index) {
        return (this.map.has(index) || this.map.set(index, new Set())) && this.map.get(index);
    }
    add(index, value) {
        this.getSet(index).add(value);
        return this;
    }
    clear(index) {
        this.getSet(index).clear();
    }
    delete(index, value) {
        return this.getSet(index).delete(value);
    }
    has(index, value) {
        return this.getSet(index).has(value);
    }
}

async function* domEvent(element, type) {
    const emitter = new AsyncEmitter();
    const listener = (event) => emitter.yield(event);
    element.addEventListener(type, listener);
    emitter.finally(() => element.removeEventListener(type, listener));
    yield* emitter;
}

function delay(result, milisseconds = 0) {
    return new Promise(resolve => setTimeout(resolve, milisseconds, result));
}
function sleep(milisseconds) {
    return new Promise(resolve => setTimeout(resolve, milisseconds));
}

const spied$2 = new WeakMap();
/**
 * Watch changes to object properties
 * Modifies the original object to turn it into an observable
 * turns object { prop1: v1, prop2: v1, __proto__: otherObject }
 * into
 * { __proto__: Proxy({ ...object, __proto__: otherObject }) }
 * @returns async generator of [key, value] changes
 */
async function* spyObject(object) {
    //
    if (spied$2.has(object))
        return yield* spied$2.get(object);
    const stream = new AsyncEmitter();
    const ownKeys = new Set(Object.keys(object));
    const clone = Object.create(Object.getPrototypeOf(object), Object.getOwnPropertyDescriptors(object));
    const proxy = new Proxy(clone, {
        set(target, property, value, receiver) {
            const old = Reflect.get(target, property, receiver);
            value !== old && Reflect.set(target, property, value, object) && stream.yield({ target, property, old, value });
            if (!ownKeys.has(property)) {
                wrapProperty(object, property, proxy);
                ownKeys.add(property);
            }
            return true;
        },
        // get(target, property, receiver) {
        //   const value = Reflect.get(target, property, receiver)
        //   if (sideEffectProcedures.has(value))
        //     return (...args) => {
        //  // ok to call before because yield promise will only resolve after
        //       this[espionage].yield([undefined, null])
        //       return value.apply(target, args)
        //     }
        //   return value
        // },
    });
    for (const key of ownKeys)
        wrapProperty(object, key, proxy);
    Object.setPrototypeOf(object, proxy);
    spied$2.set(object, stream);
    yield* stream;
    //TODO: reset object if not shared
}
// TODO: const sideEffectProcedures = new Set([Array.prototype.push])
function wrapProperty(object, key, proxy) {
    delete object[key] &&
        Object.defineProperty(object, key, {
            get() {
                return Reflect.get(proxy, key, this);
            },
            set(v) {
                Reflect.set(proxy, key, v, this);
            },
            enumerable: true,
            configurable: true,
        });
}

const spied$1 = new WeakMapOfMaps();
function findPropertyDescriptor(target, prop) {
    let descriptor;
    let object = target;
    do {
        descriptor = Object.getOwnPropertyDescriptor(object, prop);
    } while (!descriptor && (object = Object.getPrototypeOf(object)));
    return descriptor || { value: target[prop], configurable: true, enumerable: true };
}
function isInstance(object) {
    return typeof object == 'object' && object?.constructor && object instanceof object.constructor;
}
function spyProperty(target, property, originalDescriptor = findPropertyDescriptor(target, property)) {
    //
    return asyncGenerator(spied$1.get(target, property, watch));
    async function* asyncGenerator(changes) {
        if (isInstance(target) && property in target)
            yield {
                target,
                property,
                old: undefined,
                value: target[property],
            };
        yield* changes;
    }
    function watch() {
        const stream = new AsyncEmitter();
        const hasGetSetter = !('value' in originalDescriptor);
        const instanceValues = new WeakMap();
        Object.defineProperty(target, property, {
            get() {
                return hasGetSetter
                    ? originalDescriptor.get?.call(this)
                    : instanceValues.has(this)
                        ? instanceValues.get(this)
                        : originalDescriptor.value;
            },
            set(value) {
                let old = this[property];
                hasGetSetter ? originalDescriptor.set.call(this, value) : instanceValues.set(this, value);
                if (value !== old)
                    stream.push({
                        target: this,
                        property,
                        old,
                        value,
                    });
            },
            configurable: true,
            enumerable: true,
        });
        stream.finally(() => Object.defineProperty(target, property, originalDescriptor));
        return stream;
    }
}

function changes(source) {
    return source[Symbol.asyncIterator]();
}
const then = Symbol.for('then');
const spied = new WeakMapOfMaps();
function spyNestedProxy(changes, run) {
    //
    const asyncIterator = () => (run?.(changes) ?? changes)[Symbol.asyncIterator]();
    return new Proxy(function dummyFunction() { }, {
        get(_, property) {
            switch (property) {
                case 'then':
                    // setTimeout(0) lets other Promises have priority executing
                    return (onfullfilled => delay(asyncIterator()).then(onfullfilled));
                // return <PromiseLike<any>['then']>(
                //   (onfullfilled => new Promise(resolve => setTimeout(() => resolve(onfullfilled!(asyncIterator())), 0)))
                // )
                case Symbol.asyncIterator:
                    return asyncIterator;
                case then:
                    property = 'then';
                default:
                    return spied.get(changes, property, () => {
                        let source;
                        let propertyChanges = changes
                            .trigger(({ root, value }) => {
                            source = root;
                            return spyProperty(value, property);
                        })
                            .map(change => {
                            return {
                                ...change,
                                root: source || change.target,
                            };
                        });
                        return spyNestedProxy(propertyChanges, run);
                    });
            }
        },
        apply(_dummyfn, self, args) {
            if (run)
                return run.call(self, changes, ...args);
            let results = changes.map(change => ({
                ...change,
                value: change.value.apply(change.target, args),
            }));
            return spyNestedProxy(results, run);
        },
        has(_target, _property) {
            return true;
        },
    });
}
function spyNested(object, run) {
    return spied.get(object, '', () => {
        const initialSignal = stream([
            {
                root: isInstance(object) ? object : undefined,
                value: object,
                target: object,
                property: undefined,
            },
        ]);
        return spyNestedProxy(initialSignal, run);
    });
}

// implementation
function spy(object, property, descriptor) {
    return property === true
        ? spyObject(object)
        : property && typeof property != 'function'
            ? spyProperty(object, property, descriptor)
            : spyNested(object, property);
}

class Mixin {
    superclass;
    //
    constructor(superclass) {
        this.superclass = superclass;
    }
    with(...mixins) {
        return mixins.reduce((superclass, mixin) => mixin(superclass), this.superclass);
    }
}

class SetMap {
    map = new Map();
    get(index) {
        return (this.map.has(index) || this.map.set(index, new Set())) && this.map.get(index);
    }
    has(index, value) {
        return this.get(index).has(value);
    }
    add(index, value) {
        return this.get(index).add(value);
    }
}
const injected = new SetMap();
/**
 * Modifies object prototype chain and inserts a mixin on any
 * existing class definition.
 * ```
 * class AnyClass extends OtherClass
 *
 * inject(AnyClass.prototype, mixin)
 *
 * // is equivalent to
 *
 * class Mixin extends OtherClass
 * class AnyClass extends Mixins
 * ```
 * @param prototype Function.prototype
 * @param mixin Mixin function
 */
function inject(constructor, mixin) {
    if (!injected.has(constructor, mixin)) {
        const superclass = Object.getPrototypeOf(constructor);
        const middleclass = mixin(superclass);
        Object.setPrototypeOf(constructor.prototype, middleclass.prototype);
        Object.setPrototypeOf(constructor, middleclass);
        injected.add(constructor, mixin);
    }
    return constructor;
}
/**
 * If class B extends A or extends any class that extends A
 * and class M extends A
 * class M can be injected between B and A,
 * creating a new class M'
 * making B extends M' extends (...) extends A
 * B will inherit all M methods
 * @param constructor
 * @param otherClass
 */
function injectClass(constructor, otherClass) {
    const commonClass = Object.getPrototypeOf(otherClass);
    const superClass = Object.getPrototypeOf(constructor);
    if (!commonClass.isPrototypeOf(constructor))
        return false;
    const middleclass = class extends superClass {
    };
    const { constructor: _c, ...methods } = Object.getOwnPropertyDescriptors(otherClass.prototype);
    const { prototype: _p, ...staticMethods } = Object.getOwnPropertyDescriptors(otherClass);
    Object.defineProperties(middleclass.prototype, methods);
    Object.defineProperties(middleclass, staticMethods);
    Object.setPrototypeOf(constructor.prototype, middleclass.prototype);
    Object.setPrototypeOf(constructor, middleclass);
    return true;
}
function hook(prototype, method, fn) {
    const original = prototype[method];
    Object.defineProperty(prototype, method, {
        value(...args) {
            const result = original.call(this, ...args);
            return fn(this, result, ...args);
        },
        configurable: true,
    });
}
function init(constructor, fn) {
    inject(constructor, superclass => class extends superclass {
        constructor(...args) {
            super(...args);
            fn(this, ...args);
        }
    });
}

const dashCase$1 = (name) => name.replace(/([A-Z])/g, '-$1').toLowerCase();
function mixinAttributes(superclass) {
    const superclassAttributes = superclass;
    const attributesMixin = class extends superclass {
        //
        static get observedAttributes() {
            return [...this.attributeChanged.keys()];
        }
        static attributeChanged = new Map(superclassAttributes.attributeChanged);
        static defineAttribute(attribute, { get, set, value } = {}) {
            let dashedName = dashCase$1(attribute);
            this.attributeChanged.set(dashedName, set);
            let defaultvalue = get?.call(this) ?? value;
            function getter() {
                return this.getAttribute(dashedName) ?? (this.hasAttribute(dashedName) ? true : defaultvalue);
            }
            function setter(value) {
                // elementAttributes.isDefined!(this) ?
                typeof value == 'string'
                    ? this.setAttribute(dashedName, value)
                    : value === true
                        ? this.setAttribute(dashedName, '')
                        : this.removeAttribute(dashedName);
                // : (defaultvalue = value)
            }
            Object.defineProperty(this.prototype, attribute, {
                get: getter,
                set: setter,
                enumerable: true,
                configurable: true,
            });
        }
        static isDefined(element) {
            const result = element.matches(':defined');
            result && delete this.isDefined && (this.isDefined = () => true);
            return result;
        }
        attributeChangedCallback(name, old, value) {
            if (old != value)
                attributesMixin.attributeChanged.get(name)?.call(this, value);
        }
    };
    return attributesMixin;
}

const $inlineEvents = Symbol('inlineEvents');
function mixinEvents(superclass) {
    const eventsMixin = class extends mixinAttributes(superclass) {
        //
        [$inlineEvents] = new Map(this[$inlineEvents]);
        static defineEvent(name) {
            let eventname = name.toLowerCase();
            if (!eventname.startsWith('on'))
                throw "inline event name must start with 'on' like 'onclick'";
            let type = eventname.slice(2);
            function getter() {
                return this[$inlineEvents].get(eventname) || null;
            }
            function setter(value) {
                if (typeof value != 'function')
                    value = null;
                const inlineEvents = this[$inlineEvents];
                inlineEvents.has(name) && this.removeEventListener(type, inlineEvents.get(name));
                inlineEvents.set(eventname, value);
                value && this.addEventListener(type, value);
            }
            function attributeChanged(value) {
                setter.call(this, typeof value == 'string' ? new Function('event', value) : null);
            }
            this.attributeChanged.set(eventname, attributeChanged);
            Object.defineProperty(this.prototype, name, {
                get: getter,
                set: setter,
                enumerable: true,
                configurable: true,
            });
        }
    };
    return eventsMixin;
}

function mixinElements(superclass) {
    const elementsMixin = class extends superclass {
        //
        static defineElement(name, selector) {
            Object.defineProperty(this.prototype, name, {
                get() {
                    return this.shadowRoot?.querySelector(selector);
                },
                enumerable: true,
                configurable: true,
            });
        }
        attachShadow(init) {
            let root = super.attachShadow(init);
            return root;
        }
    };
    return elementsMixin;
}

const dashCase = (name) => name.replace(/([A-Z])/g, '-$1').toLowerCase();
const cssvar = (property) => '--' + dashCase(property);
const hiddenStyle = `position:absolute;width:0px;height:0px;overflow:hidden;pointer-events:none`;
function mixinCssProperties(superclass) {
    const superclassCssProperties = superclass;
    const cssPropertiesMixin = class extends superclass {
        //
        static cssPropertyChanged = new Map(superclassCssProperties.cssPropertyChanged);
        static defineCSSProperty(name, { set } = {}, _syntax = '*') {
            const dashedName = cssvar(name);
            this.cssPropertyChanged.set(dashedName, set);
            function getter() {
                return getComputedStyle(this).getPropertyValue(dashedName);
            }
            function setter(value) {
                this.style.setProperty(dashedName, value);
            }
            Object.defineProperty(this.prototype, name, {
                get: getter,
                set: setter,
                enumerable: true,
                configurable: true,
            });
        }
        cssObserverHost;
        constructor(...args) {
            super(...args);
            this.cssObserverHost = this.createCssObserverHost();
            for (const property of new.target.cssPropertyChanged.keys())
                this.observeCssProperty(property);
        }
        observeCssProperty(property, _syntax = '<number>') {
            const el = document.createElement('css-observer');
            el.style['width'] = `calc(var(${property},0)*1px)`;
            el.style['color'] = `var(${property},transparent)`;
            el.style.transition = `width 0.001s, color 0.001s`;
            el.dataset.property = property;
            el.dataset.value = getComputedStyle(this).getPropertyValue(property);
            el.dataset.value && this.notifyCssPropertyChange(property, el.dataset.value, '');
            this.cssObserverHost.append(el);
        }
        createCssObserverHost() {
            const hostElement = document.createElement('css-observer');
            hostElement.setAttribute('style', hiddenStyle);
            hostElement.setAttribute('aria-hidden', 'true');
            this.shadowRoot.append(hostElement);
            hostElement.addEventListener('transitionrun', event => {
                let target = event.composedPath()[0];
                let property = target.dataset.property;
                let oldvalue = target.dataset.value;
                let value = getComputedStyle(this).getPropertyValue(property);
                event.stopPropagation();
                this.notifyCssPropertyChange(property, value, oldvalue);
            });
            return hostElement;
        }
        notifyCssPropertyChange(property, value, oldvalue) {
            cssPropertiesMixin.cssPropertyChanged.get(property)?.call(this, value);
            this.cssPropertyChangedCallback?.(property, oldvalue, value);
        }
    };
    return cssPropertiesMixin;
}

function attributes(properties) {
    return (elementClass) => {
        let attributesClass = mixinAttributes(elementClass);
        for (const [name, value] of Object.entries(properties))
            attributesClass.defineAttribute(name, { value });
        return attributesClass;
    };
}

function baseURI(value) {
    return (superclass) => class extends superclass {
        attachShadow(init) {
            const root = super.attachShadow(init);
            Object.defineProperty(root, 'baseURI', {
                value,
                enumerable: true,
                configurable: true,
            });
            return root;
        }
        relativeURL(url) {
            return new URL(url, value).href;
        }
    };
}

function content(contentFragment) {
    return (superclass) => class extends superclass {
        constructor(...args) {
            super(...args);
            this.attachShadow({ mode: 'open' }).append(contentFragment.cloneNode(true));
        }
    };
}

function cssProperties(properties) {
    return (elementClass) => {
        let cssPropsClass = mixinCssProperties(elementClass);
        for (const [name, syntax] of Object.entries(properties))
            cssPropsClass.defineCSSProperty(name, undefined, syntax);
        return cssPropsClass;
    };
}

function elements(selectors) {
    return (elementClass) => {
        let elementsClass = mixinElements(elementClass);
        for (const [name, selector] of Object.entries(selectors))
            elementsClass.defineElement(name, selector);
        return elementsClass;
    };
}

function htmlContent(innerHTML) {
    const htmltemplate = document.createElement('template');
    htmltemplate.innerHTML = innerHTML;
    return content(htmltemplate.content);
}

function events(events) {
    let mixin = (elementClass) => {
        let eventsClass = mixinEvents(elementClass);
        for (let name of Object.keys(events))
            eventsClass.defineEvent(name);
        return eventsClass;
    };
    return mixin;
}

class BaseDecorator {
    typed() {
        return this.decorator.bind(this);
    }
    bind() {
        return this.decorator.bind(this);
    }
    static decorator() {
        return this.length == 0 ? new this().bind() : (...args) => new this(...args).bind();
    }
}

class PropertyDecorator extends BaseDecorator {
    //
    decorator(prototype, property, descriptor) {
        let result = this.decorateProperty({
            prototype,
            constructor: prototype.constructor,
            property,
            descriptor,
        });
        if (result)
            Object.defineProperty(prototype, property, { ...result, configurable: true, enumerable: true });
    }
    params;
}

/**
 * only string or boolean types are allowed for attributes
 */
class AttrDecorator extends PropertyDecorator {
    decorateProperty({ constructor, property, descriptor } = this.params) {
        inject(constructor, mixinAttributes).defineAttribute(property, descriptor);
    }
}
const attr = AttrDecorator.decorator();

const classmap = new WeakMap();
class ClassDecorator extends BaseDecorator {
    decorator(constructor) {
        let result = this.decorateClass({
            constructor,
            prototype: constructor.prototype,
        });
        if (result && result !== constructor)
            classmap.set(constructor, result);
        return result;
    }
    params;
}
/**
 * awaits for other decorators that may alter the constructor
 * can't return a new constructor
 *
 * assuming
 *
 * let decoratorA: <T, U>(c: T): U
 * let decoratorB: <T, U>(c: T): U
 * let decoratorC: <U>(c: U): U
 *
 * @decoratorA
 * @decoratorC // <-- lazy decorator
 * @decoratorB
 * class ABC {}
 *
 * decoratorC will wait for decoratorA and decoratorB to be applied before executing
 * it can be used when you need the final class definition
 * but do not want to require the decorator to be placed first
 *
 */
class LazyClassDecorator extends ClassDecorator {
    decorateClass(params) {
        setTimeout(() => this.decorateFinalizedClass({
            ...params,
            constructor: this.getFinalConstructor(params.constructor),
        }), 1);
    }
    getFinalConstructor(constructor) {
        while (classmap.has(constructor))
            constructor = classmap.get(constructor);
        return constructor;
    }
}

class BaseURIDecorator extends ClassDecorator {
    uri;
    constructor(uri) {
        super();
        this.uri = uri;
    }
    decorateClass({ constructor } = this.params) {
        return baseURI(this.uri)(constructor);
    }
}
const baseuri = BaseURIDecorator.decorator();

/**
 * find element in element shadowroot by ID
 * HTML Element type required
 */
class ByIdDecorator extends PropertyDecorator {
    decorateProperty({ property } = this.params) {
        return {
            get() {
                return this.shadowRoot?.querySelector('#' + property.toString()) || undefined;
            },
        };
    }
}
const byId = ByIdDecorator.decorator();

class MethodDecorator extends BaseDecorator {
    decorator(prototype, property, descriptor) {
        let result = this.decorateMethod({
            prototype,
            constructor: prototype.constructor,
            property,
            descriptor: descriptor,
        });
        if (result)
            Object.defineProperty(prototype, property, {
                ...result,
                configurable: true,
                enumerable: true,
            });
    }
    params;
}

class CachedDecorator extends MethodDecorator {
    decorateMethod({ property, descriptor } = this.params) {
        return {
            get() {
                let value = descriptor.get();
                Object.defineProperty(this, property, { value, configurable: true, enumerable: true });
                return value;
            },
        };
    }
}
const cached = CachedDecorator.decorator();

class CssPropertyDecorator extends PropertyDecorator {
    syntax;
    constructor(syntax) {
        super();
        this.syntax = syntax;
    }
    decorateProperty({ constructor, property, descriptor } = this.params) {
        inject(constructor, mixinCssProperties).defineCSSProperty(property, descriptor, this.syntax);
    }
}
const cssproperty = CssPropertyDecorator.decorator();
/**
 * string properties only
 */
const cssp = cssproperty('*');

class TagDecorator extends LazyClassDecorator {
    tag;
    constructor(tag) {
        super();
        this.tag = tag;
    }
    decorateFinalizedClass({ constructor } = this.params) {
        customElements.define(this.tag, constructor);
    }
}
const tag = TagDecorator.decorator();

/**
 * HTML Element type required
 */
class ElementDecorator extends PropertyDecorator {
    query;
    constructor(query) {
        super();
        this.query = query;
    }
    decorateProperty({ constructor, property } = this.params) {
        inject(constructor, mixinElements).defineElement(property, this.query);
    }
}
const element = ElementDecorator.decorator();

class HTMLDecorator extends ClassDecorator {
    //
    mixin;
    constructor(template, ...substitutions) {
        super();
        this.mixin = htmlContent(String.raw(template, ...substitutions));
    }
    decorateClass({ constructor } = this.params) {
        return this.mixin(constructor);
    }
}
const html = HTMLDecorator.decorator();

/**
 * turns a function into a getter and setter that stores the value
 *
 * class A {
 *  @prop name(value: any): void { console.log('name changed', value) }
 * }
 *
 * let a = new A();
 * a.name = 'test' // logs 'name changed', 'test'
 *
 * a.name // returns 'test'
 */
class PropDecorator extends MethodDecorator {
    decorateMethod({ descriptor } = this.params) {
        let store = new WeakMap();
        return {
            get() {
                return store.get(this);
            },
            set(value) {
                store.set(this, value);
                descriptor.set?.call(this, value);
            },
        };
    }
}
const prop = PropDecorator.decorator();

class EventDecorator extends PropertyDecorator {
    decorateProperty({ constructor, property } = this.params) {
        inject(constructor, mixinEvents).defineEvent(property);
    }
}
class EventListenerDecorator extends MethodDecorator {
}
class PreventDefaultDecorator extends EventListenerDecorator {
    decorateMethod({ descriptor } = this.params) {
        return {
            value(event) {
                event.preventDefault();
                return descriptor.value.call(this, event);
            },
        };
    }
}
class StopPropagationDecorator extends EventListenerDecorator {
    decorateMethod({ descriptor } = this.params) {
        return {
            value(event) {
                event.stopPropagation();
                return descriptor.value.call(this, event);
            },
        };
    }
}
class MatchesDecorator extends EventListenerDecorator {
    selectors;
    constructor(selectors) {
        super();
        this.selectors = selectors;
    }
    decorateMethod({ descriptor } = this.params) {
        let selectors = this.selectors;
        return {
            value(event) {
                event.target instanceof Element && event.target.matches(selectors) && descriptor.value.call(this, event);
            },
        };
    }
}
const event = EventDecorator.decorator();
const preventDefault = PreventDefaultDecorator.decorator();
const stopPropagation = StopPropagationDecorator.decorator();
const matches = MatchesDecorator.decorator();

class ParameterDecorator extends BaseDecorator {
    decorator(prototype, property, parameterIndex) {
        return this.decorateParameter({
            prototype,
            constructor: prototype.constructor,
            property,
            descriptor: Object.getOwnPropertyDescriptor(prototype, property),
            parameterIndex,
        });
    }
    params;
}

class GenericDecorator extends BaseDecorator {
    classParams;
    parameterParams;
    methodParams;
    propertyParams;
    decorate(target, property, extra) {
        switch ([typeof target, typeof property, typeof extra].toString()) {
            case 'function,undefined,undefined':
                this.decorateClass({ prototype: target.prototype, constructor: target });
                break;
            case 'object,string,number':
            case 'object,symbol,number':
                this.decorateParameter({
                    prototype: target,
                    constructor: target.constructor,
                    property,
                    descriptor: Object.getOwnPropertyDescriptor(target, property),
                    parameterIndex: extra,
                });
                break;
            case 'object,string,object':
            case 'object,symbol,object':
                this.decorateMethod({
                    prototype: target,
                    constructor: target.constructor,
                    property,
                    descriptor: extra,
                });
                break;
            case 'object,string,undefined':
            case 'object,symbol,undefined':
                this.decorateProperty({
                    prototype: target,
                    constructor: target.constructor,
                    property,
                    descriptor: (extra || Object.getOwnPropertyDescriptor(target, property)),
                });
                break;
        }
    }
}

class LinkEvent extends MethodDecorator {
    cls;
    type;
    changes;
    constructor(cls, type, changes) {
        super();
        this.cls = cls;
        this.type = type;
        this.changes = changes;
    }
    decorateMethod({ constructor, descriptor } = this.params) {
        if (constructor === this.cls)
            stream(this.changes)
                .trigger(({ root, value: element }) => stream(domEvent(element, this.type)).map(event => ({ root, event })))
                .listen(({ root, event }) => {
                descriptor.value.call(root, event);
            });
    }
}
class Emitter {
    type;
    eventConstructor;
    //
    constructor(type, eventConstructor) {
        this.type = type;
        this.eventConstructor = eventConstructor;
    }
    // used only to retrieve the type
    event;
    from(constructor) {
        return spy(constructor.prototype, (changes, prototype, property, descriptor) => new LinkEvent(constructor, this.type, changes).decorator(prototype, property, descriptor));
    }
    at(element) {
        return (target, _method, descriptor) => {
            init(target.constructor, self => element.addEventListener(this.type, event => descriptor.value.call(self, event)));
        };
    }
    root(selector) {
        return (target, _method, descriptor) => hook(target, 'attachShadow', (self, root) => {
            root.addEventListener(this.type, event => {
                event.target instanceof Element &&
                    event.target.matches(selector) &&
                    descriptor.value.call(self, event);
            });
            return root;
        });
    }
    emit(target, ...args) {
        return target.dispatchEvent(this.create(...args));
    }
    create(...args) {
        return new this.eventConstructor(this.type, ...args);
    }
}

const onabort = new Emitter('abort', UIEvent);
const onanimationcancel = new Emitter('animationcancel', AnimationEvent);
const onanimationend = new Emitter('animationend', AnimationEvent);
const onanimationiteration = new Emitter('animationiteration', AnimationEvent);
const onanimationstart = new Emitter('animationstart', AnimationEvent);
const onauxclick = new Emitter('auxclick', MouseEvent);
const onbeforeinput = new Emitter('beforeinput', InputEvent);
const onblur = new Emitter('blur', FocusEvent);
const oncancel = new Emitter('cancel', Event);
const oncanplay = new Emitter('canplay', Event);
const oncanplaythrough = new Emitter('canplaythrough', Event);
const onchange = new Emitter('change', Event);
const onclick = new Emitter('click', MouseEvent);
const onclose = new Emitter('close', Event);
const oncompositionend = new Emitter('compositionend', CompositionEvent);
const oncompositionstart = new Emitter('compositionstart', CompositionEvent);
const oncompositionupdate = new Emitter('compositionupdate', CompositionEvent);
const oncontextmenu = new Emitter('contextmenu', MouseEvent);
const oncuechange = new Emitter('cuechange', Event);
const ondblclick = new Emitter('dblclick', MouseEvent);
const ondrag = new Emitter('drag', DragEvent);
const ondragend = new Emitter('dragend', DragEvent);
const ondragenter = new Emitter('dragenter', DragEvent);
const ondragexit = new Emitter('dragexit', Event);
const ondragleave = new Emitter('dragleave', DragEvent);
const ondragover = new Emitter('dragover', DragEvent);
const ondragstart = new Emitter('dragstart', DragEvent);
const ondrop = new Emitter('drop', DragEvent);
const ondurationchange = new Emitter('durationchange', Event);
const onemptied = new Emitter('emptied', Event);
const onended = new Emitter('ended', Event);
const onerror = new Emitter('error', ErrorEvent);
const onfocus = new Emitter('focus', FocusEvent);
const onfocusin = new Emitter('focusin', FocusEvent);
const onfocusout = new Emitter('focusout', FocusEvent);
const ongotpointercapture = new Emitter('gotpointercapture', PointerEvent);
const oninput = new Emitter('input', Event);
const oninvalid = new Emitter('invalid', Event);
const onkeydown = new Emitter('keydown', KeyboardEvent);
const onkeypress = new Emitter('keypress', KeyboardEvent);
const onkeyup = new Emitter('keyup', KeyboardEvent);
const onload = new Emitter('load', Event);
const onloadeddata = new Emitter('loadeddata', Event);
const onloadedmetadata = new Emitter('loadedmetadata', Event);
const onloadstart = new Emitter('loadstart', Event);
const onlostpointercapture = new Emitter('lostpointercapture', PointerEvent);
const onmousedown = new Emitter('mousedown', MouseEvent);
const onmouseenter = new Emitter('mouseenter', MouseEvent);
const onmouseleave = new Emitter('mouseleave', MouseEvent);
const onmousemove = new Emitter('mousemove', MouseEvent);
const onmouseout = new Emitter('mouseout', MouseEvent);
const onmouseover = new Emitter('mouseover', MouseEvent);
const onmouseup = new Emitter('mouseup', MouseEvent);
const onpause = new Emitter('pause', Event);
const onplay = new Emitter('play', Event);
const onplaying = new Emitter('playing', Event);
const onpointercancel = new Emitter('pointercancel', PointerEvent);
const onpointerdown = new Emitter('pointerdown', PointerEvent);
const onpointerenter = new Emitter('pointerenter', PointerEvent);
const onpointerleave = new Emitter('pointerleave', PointerEvent);
const onpointermove = new Emitter('pointermove', PointerEvent);
const onpointerout = new Emitter('pointerout', PointerEvent);
const onpointerover = new Emitter('pointerover', PointerEvent);
const onpointerup = new Emitter('pointerup', PointerEvent);
const onprogress = new Emitter('progress', ProgressEvent);
const onratechange = new Emitter('ratechange', Event);
const onreset = new Emitter('reset', Event);
const onresize = new Emitter('resize', UIEvent);
const onscroll = new Emitter('scroll', Event);
const onsecuritypolicyviolation = new Emitter('securitypolicyviolation', SecurityPolicyViolationEvent);
const onseeked = new Emitter('seeked', Event);
const onseeking = new Emitter('seeking', Event);
const onselect = new Emitter('select', Event);
const onselectionchange = new Emitter('selectionchange', Event);
const onselectstart = new Emitter('selectstart', Event);
const onstalled = new Emitter('stalled', Event);
const onsubmit = new Emitter('submit', Event);
const onsuspend = new Emitter('suspend', Event);
const ontimeupdate = new Emitter('timeupdate', Event);
const ontoggle = new Emitter('toggle', Event);
const ontouchcancel = new Emitter('touchcancel', window.TouchEvent);
const ontouchend = new Emitter('touchend', window.TouchEvent);
const ontouchmove = new Emitter('touchmove', window.TouchEvent);
const ontouchstart = new Emitter('touchstart', window.TouchEvent);
const ontransitioncancel = new Emitter('transitioncancel', TransitionEvent);
const ontransitionend = new Emitter('transitionend', TransitionEvent);
const ontransitionrun = new Emitter('transitionrun', TransitionEvent);
const ontransitionstart = new Emitter('transitionstart', TransitionEvent);
const onvolumechange = new Emitter('volumechange', Event);
const onwaiting = new Emitter('waiting', Event);
const onwheel = new Emitter('wheel', WheelEvent);
const onafterprint = new Emitter('afterprint', Event);
const onbeforeprint = new Emitter('beforeprint', Event);
const onbeforeunload = new Emitter('beforeunload', BeforeUnloadEvent);
const oncompassneedscalibration = new Emitter('compassneedscalibration', Event);
const ondevicemotion = new Emitter('devicemotion', DeviceMotionEvent);
const ondeviceorientation = new Emitter('deviceorientation', DeviceOrientationEvent);
const ondeviceorientationabsolute = new Emitter('deviceorientationabsolute', DeviceOrientationEvent);
const ongamepadconnected = new Emitter('gamepadconnected', GamepadEvent);
const ongamepaddisconnected = new Emitter('gamepaddisconnected', GamepadEvent);
const onhashchange = new Emitter('hashchange', HashChangeEvent);
const onmousewheel = new Emitter('mousewheel', Event);
const onoffline = new Emitter('offline', Event);
const ononline = new Emitter('online', Event);
const onorientationchange = new Emitter('orientationchange', Event);
const onpagehide = new Emitter('pagehide', PageTransitionEvent);
const onpageshow = new Emitter('pageshow', PageTransitionEvent);
const onpopstate = new Emitter('popstate', PopStateEvent);
const onreadystatechange = new Emitter('readystatechange', ProgressEvent);
const onstorage = new Emitter('storage', StorageEvent);
const onunload = new Emitter('unload', Event);
const onvrdisplayactivate = new Emitter('vrdisplayactivate', Event);
const onvrdisplayblur = new Emitter('vrdisplayblur', Event);
const onvrdisplayconnect = new Emitter('vrdisplayconnect', Event);
const onvrdisplaydeactivate = new Emitter('vrdisplaydeactivate', Event);
const onvrdisplaydisconnect = new Emitter('vrdisplaydisconnect', Event);
const onvrdisplaypresentchange = new Emitter('vrdisplaypresentchange', Event);

const itself = Symbol('self');
class FunctionProxy {
    fn;
    //
    constructor(fn) {
        this.fn = fn;
    }
    proxyhandler = {
        //
        get: (target, property, receiver) => {
            if (property === itself)
                return target;
            const value = this.get(target, property, receiver);
            return value && typeof value === 'object' ? this.wrap(value) : value;
        },
        defineProperty: () => false,
        deleteProperty: () => false,
        set: () => false,
        setPrototypeOf: () => false,
    };
    wrap(value) {
        return typeof value == 'object' ? new Proxy(value, this.proxyhandler) : value;
    }
    unwrap(value) {
        return (value && value[itself]) || value;
    }
    run(...args) {
        let argsproxy = args.map(arg => this.wrap(arg));
        return this.unwrap(this.fn(...argsproxy));
    }
}

class LiveFunction extends FunctionProxy {
    //
    dependencies = new Map();
    promises = new Set();
    enabled = true;
    constructor(fn) {
        super(fn);
    }
    async next(generator) {
        let promise = generator.next();
        this.promises.add(promise);
        let { done } = await promise;
        this.promises.delete(promise);
        !done && this.next(generator);
        this.enabled = this.promises.size > 0;
    }
    addDependency(dependency) {
        let memo = stream(dependency).memoize();
        this.dependencies.set(dependency, memo);
        this.next(memo[Symbol.asyncIterator]());
        return memo;
    }
    get(target, property) {
        let value = target[property];
        return isAsyncIterable(value) ? (this.dependencies.get(value) || this.addDependency(value)).value : value;
    }
    async *run(...args) {
        let argsproxy = args.map(arg => this.wrap(arg));
        while (this.enabled) {
            try {
                if (!done)
                    yield this.unwrap(this.fn(...argsproxy));
            }
            catch (e) {
                if (e != UNINITIALIZED)
                    throw e;
            }
            if (this.promises.size == 0)
                return;
            var { done } = await Promise.race(this.promises);
        }
    }
}

class LiveExpression extends LiveFunction {
    constructor(expression, context, name) {
        super(Object.assign(new Function('__scope__', `with (__scope__) return (${expression || undefined})`).bind(context), {
            toString: () => `function ${name}() { return ${expression} }`,
        }));
    }
    get(target, property) {
        if (property === Symbol.unscopables)
            return target[property];
        return super.get(target, property);
    }
}

const datamap = new WeakMap();
const $nodedata = Symbol('nodedata');
function nodedata(node) {
    let data = datamap.get(node);
    if (!data) {
        let parentData = node instanceof ShadowRoot
            ? streamValues(node.host)
            : node instanceof Attr && node.ownerElement
                ? nodedata(node.ownerElement)
                : node.parentNode
                    ? nodedata(node.parentNode)
                    : Object.prototype;
        datamap.set(node, (data = Object.create(parentData)));
    }
    return data;
}
function streamValues(object) {
    return spy(object, changes => stream(changes).pick('value'));
}

class SkiComponent extends HTMLElement {
    static with = new Mixin(SkiComponent).with;
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

Response.prototype.document = async function () {
    let text = await this.text();
    let template = document.createElement('template');
    template.innerHTML = text;
    return template.content;
};

const imports = new Set();
let ImportComponent = class ImportComponent extends HTMLElement {
    //
    target = this.attachShadow({ mode: 'open' });
    async connectedCallback() {
        if (this.getAttribute('src'))
            throw Error(this.localName + ' src tag is required');
        this.import(this.target);
    }
    get baseURI() {
        let src = this.getAttribute('src');
        return new URL(src, this.getRootNode().baseURI).href;
    }
    async import(container) {
        if (imports.has(this.baseURI))
            return;
        let base = document.createElement('base');
        base.href = this.baseURI;
        try {
            const response = await fetch(base.href);
            const content = await response.document();
            document.head.prepend(base);
            container.append(content);
            imports.add(base.href);
        }
        catch (e) {
            throw new Error(`${e}\n\tat <${this.localName}> src ('${base.href}')`);
        }
        finally {
            base.remove();
        }
    }
};
ImportComponent = __decorate([
    tag('ski-import')
], ImportComponent);

const onRequestData = new Emitter('requestdata', class extends Event {
    target;
    set skidata(data) {
        this.target.skidata = data;
    }
});
let SkiData = class SkiData extends HTMLElement {
    //
    onrequestdata = onRequestData.event;
    skidata;
    get [$nodedata]() {
        onRequestData.emit(this);
        return this.skidata;
    }
};
__decorate([
    event
], SkiData.prototype, "onrequestdata", void 0);
SkiData = __decorate([
    tag('ski-data')
], SkiData);

const IMPORT_REGEXP = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:"(?:.*?)")|(?:'(?:.*?)'))[\s]*?(?:;|$|)/g;
const addOriginToImports = (content, basepath) => content.replace(IMPORT_REGEXP, substring => {
    let [_import, _from, _end] = substring.split(/'|"/);
    let origin_from = new URL(_from, basepath);
    return `${_import}'${origin_from}'${_end}`;
});
async function importContent(content, basepath) {
    content = addOriginToImports(content, basepath);
    let blob = new Blob([content], { type: 'text/javascript' });
    let dynamic_url = URL.createObjectURL(blob) + '#';
    try {
        return await import(dynamic_url);
    }
    finally {
        URL.revokeObjectURL(dynamic_url);
    }
}
function importModuleContent(script, basepath = document.baseURI) {
    const result = script.src
        ? import(new URL(script.src, basepath).href)
        : importContent(script.innerHTML, basepath);
    return script.type == 'module' ? result : undefined;
}

let SkiComponentDeclaration = class SkiComponentDeclaration extends HTMLElement {
    //
    content;
    componentClass;
    constructor() {
        super();
        if (this.firstElementChild instanceof HTMLTemplateElement)
            this.content = this.firstElementChild.content;
        else {
            this.content = document.createDocumentFragment();
            this.content.append(...this.childNodes);
        }
        this.createComponent();
    }
    get templateAttributes() {
        return Object.fromEntries(this.getAttribute('attributes')
            ?.trim()
            .split(/,?\s+/)
            .map(name => [name, undefined]) ?? []);
    }
    get name() {
        return this.getAttribute('name');
    }
    get extends() {
        return this.getAttribute('extends') || undefined;
    }
    async createComponent() {
        const componentBaseURI = this.getRootNode().baseURI;
        const modules = await Promise.all(Array.from(this.content.querySelectorAll('script')).map(module => (module.remove(), importModuleContent(module, componentBaseURI)))).then(list => Object.assign({}, ...list));
        const componentClass = modules.default || (await this.createClass(this.extends));
        const componentWithTemplate = new Mixin(componentClass).with(content(this.content), baseURI(componentBaseURI));
        customElements.define(this.name || componentClass['is'], componentWithTemplate);
        this.componentClass = componentClass;
    }
    async createClass(extendsComponent) {
        if (extendsComponent)
            await customElements.whenDefined(extendsComponent);
        const baseComponent = extendsComponent ? customElements.get(extendsComponent) : HTMLElement;
        return new Mixin(baseComponent).with(attributes(this.templateAttributes));
    }
};
SkiComponentDeclaration = __decorate([
    tag('ski-component')
], SkiComponentDeclaration);

class ExpressionAttributeDecorator extends MethodDecorator {
    decorateMethod({ constructor, property, descriptor } = this.params) {
        inject(constructor, mixinAttributes).defineAttribute(property, {
            async set(expression = '') {
                const evaluator = new LiveExpression(expression, this, property);
                const stream = evaluator.run(nodedata(this));
                for await (const result of stream)
                    descriptor.set(result);
            },
        });
    }
}
const expression_attr = ExpressionAttributeDecorator.decorator();

class SkiCondiction extends HTMLElement {
    //
    wrapperBegin = document.createComment(`<${this.localName}>`);
    wrapperEnd = document.createComment(`</${this.localName}>`);
    content = Array.from(this.childNodes);
    fallback = [];
    constructor() {
        super();
        this.content = Array.from(this.childNodes);
        if (this.nextElementSibling instanceof SkiElse) {
            this.fallback = Array.from(this.nextElementSibling.childNodes);
            this.nextElementSibling.remove();
        }
        this.replaceWith(this.wrapperBegin);
        this.wrapperBegin.after(this.wrapperEnd);
        this.toggle(false);
    }
    removeNodes(nodeList) {
        nodeList.forEach(node => node.remove());
    }
    toggle(show) {
        this.wrapperBegin.after(...(show ? this.content : this.fallback));
        this.removeNodes(show ? this.fallback : this.content);
    }
}
let SkiIf = class SkiIf extends SkiCondiction {
    set if(result) {
        this.toggle(result);
    }
};
__decorate([
    expression_attr
], SkiIf.prototype, "if", null);
SkiIf = __decorate([
    tag('ski-if')
], SkiIf);
let SkiUnless = class SkiUnless extends SkiCondiction {
    set unless(result) {
        this.toggle(!result);
    }
};
__decorate([
    expression_attr
], SkiUnless.prototype, "unless", null);
SkiUnless = __decorate([
    tag('ski-unless')
], SkiUnless);
let SkiElse = class SkiElse extends HTMLElement {
};
SkiElse = __decorate([
    tag('ski-else')
], SkiElse);

let SkiList = class SkiList extends HTMLElement {
    //
    wrapperBegin = document.createComment(`<${this.localName}>`);
    wrapperEnd = document.createComment(`</${this.localName}>`);
    nodeMap = new WeakMap();
    templateContent;
    nodes = [];
    constructor() {
        super();
        if (this.firstElementChild instanceof HTMLTemplateElement)
            this.templateContent = this.firstElementChild.content;
        else {
            this.templateContent = document.createDocumentFragment();
            this.templateContent.append(...this.childNodes);
        }
        this.replaceWith(this.wrapperBegin);
        this.wrapperBegin.after(this.wrapperEnd);
    }
    set of(value) {
        const varname = this.getAttribute('for');
        const indexname = this.getAttribute('index');
        const nodes = value.map((item, index) => {
            const node = this.getNode(item);
            const data = varname ? { [varname]: item, [indexname || 'index']: index } : typeof item == 'object' ? item : {};
            const d = nodedata(node);
            for (const childNode of node.childNodes)
                childNode[$nodedata] = Object.create(d, { [$nodedata]: { value: data } });
            return node;
        });
        this.nodes.forEach(node => nodes.includes(node) || node.remove());
        this.wrapperBegin.after(...nodes);
        this.nodes = nodes;
    }
    getNode(item) {
        let node = item && typeof item == 'object' && this.nodeMap.get(item);
        if (!node) {
            node = this.templateContent.cloneNode(true);
            item && typeof item == 'object' && this.nodeMap.set(item, node);
        }
        return node;
    }
};
SkiList = __decorate([
    tag('ski-list')
], SkiList);

let SkiSwitch = class SkiSwitch extends HTMLElement {
    cases;
    active = this;
    constructor() {
        super();
        this.cases = Array.from(this.children).filter(element => element instanceof SkiCase);
        this.switch(undefined);
    }
    set switch(result) {
        this.active.replaceWith((this.active = this.match(result)));
    }
    match(value) {
        return (this.cases.find(element => element.case == value) ||
            this.cases.find(element => element.default) ||
            document.createComment(`<${this.nodeName}>`));
    }
};
__decorate([
    expression_attr
], SkiSwitch.prototype, "switch", null);
SkiSwitch = __decorate([
    tag('ski-switch')
], SkiSwitch);
let SkiCase = class SkiCase extends HTMLElement {
    case;
    default;
};
__decorate([
    attr
], SkiCase.prototype, "case", void 0);
__decorate([
    attr
], SkiCase.prototype, "default", void 0);
SkiCase = __decorate([
    tag('ski-case')
], SkiCase);

class SkiSync extends HTMLElement {
    get target() {
        const targetId = this.getAttribute('target');
        const target = targetId ? document.getElementById(targetId) : this.parentElement;
        if (!target)
            throw new Error('Missing target');
        return target;
    }
    connectedCallback() {
        this.remove();
        for (const attr of this.attributes)
            this.execute(attr);
    }
    async execute(attr) {
        const expression = new LiveExpression(attr.value, this.target, attr.name);
        const stream = expression.run(nodedata(this.target));
        for await (let data of stream)
            attr.name.endsWith('?')
                ? this.toggle(attr.name.slice(0, -1), Boolean(data), attr)
                : this.apply(attr.name, data, attr);
    }
}

const camelCase = (name) => name.replace(/-([a-z])/g, g => g[1].toUpperCase());
let SkiSetAttr = class SkiSetAttr extends SkiSync {
    apply(name, value) {
        if (name.includes('.') || typeof value == 'object' || typeof value == 'function') {
            let chain = name.split('.').map(camelCase);
            let property = chain.pop();
            let object = chain.reduce((data, name) => data[name] ?? data[name], this.target);
            object[property] = value;
        }
        else {
            this.target.setAttribute(name, value);
        }
    }
    toggle(name, enable) {
        this.target.toggleAttribute(name, enable);
    }
};
SkiSetAttr = __decorate([
    tag('ski-attr')
], SkiSetAttr);

/**
 * Toggle element classes defined as attribute with live updates
 * @param attr An attribute with name starting with . (dot)
 * The attribute name can be chained like .name1.name2.name3
 *
 * @explample condictional element class
 * ```html
 * <span .name1.name2="expressionA" .name3="expressionB">text</span>
 * ```
 * will be transformed into:
 * ```html
 * <span class="name1 name2">text</span>
 * ```
 * if expressionA evaluates to `true` and expressionB evaluates to `false`
 *
 * if expression is missing, the condiction is considered to be truty and the class is added to the element class list
 * @explample conditionless element class
 * ```html
 * <span .name1 .name2>text</span>
 * ```
 * will be transformed into:
 * ```html
 * <span class="name1 name2">text</span>
 * ```
 */
let SkiSetClass = class SkiSetClass extends SkiSync {
    apply(name, enable, attr) {
        const classes = name.split('.');
        const toggle = enable || (enable === undefined && Boolean(attr.value));
        for (let name of classes)
            name && this.target.classList.toggle(name, toggle);
    }
    toggle = this.apply;
};
SkiSetClass = __decorate([
    tag('ski-class')
], SkiSetClass);

let SkiSetStyle = class SkiSetStyle extends SkiSync {
    apply(name, value) {
        this.target.style.setProperty(name, value);
    }
    toggle() { }
};
SkiSetStyle = __decorate([
    tag('ski-style')
], SkiSetStyle);
const UNITS = ['px', 'em', 'ex', 'ch', 'rem', 'lh', 'vw', 'vh', 'vmin', 'vmax', 'deg', 'grad', 'rad', 'turn', 's', 'ms'];
for (let unit of UNITS)
    Object.defineProperty(Number.prototype, unit, {
        get() {
            return this + unit;
        },
    });
Object.defineProperty(Number.prototype, 'percent', {
    get() {
        return this + '%';
    },
});

let SkiVal = class SkiVal extends HTMLElement {
    //
    value;
    constructor() {
        super();
        this.run(this.getAttribute('value') || this.textContent || '');
    }
    async run(expression) {
        const text = document.createTextNode('');
        this.replaceWith(text);
        const evaluator = new LiveExpression(expression, text, 'expression');
        const evalStream = evaluator.run(nodedata(text));
        for await (let value of evalStream) {
            if (!text.ownerDocument) {
                evalStream.return(null);
                break;
            }
            text.textContent = String(value);
        }
    }
};
__decorate([
    attr
], SkiVal.prototype, "value", void 0);
SkiVal = __decorate([
    tag('ski-val')
], SkiVal);
var SkiVal$1 = SkiVal;

let SkiStringTemplate = class SkiStringTemplate extends SkiVal$1 {
    //
    async run(expression) {
        super.run('`' + expression + '`');
    }
};
SkiStringTemplate = __decorate([
    tag('ski-string')
], SkiStringTemplate);

export { $inlineEvents, $nodedata, AsyncEmitter, AsyncStream, ClassDecorator, Emitter, GenericDecorator, ImportComponent, LazyClassDecorator, LiveExpression, LiveFunction, MethodDecorator, Mixin, ParameterDecorator, PropertyDecorator, PublicPromise, SelfPromise, SetMap$1 as SetMap, SkiCase, SkiComponentDeclaration, SkiElse, SkiIf, SkiSwitch, SkiUnless, UNINITIALIZED, WeakMapOfMaps, attr, attributes, baseURI, baseuri, byId, cached, changes, content, cssProperties, cssp, cssproperty, delay, domEvent, element, elements, event, events, expression_attr, hook, html, htmlContent, init, inject, injectClass, instantPromise, isAsyncIterable, matches, memoize, mixinAttributes, mixinCssProperties, mixinElements, mixinEvents, nodedata, onabort, onafterprint, onanimationcancel, onanimationend, onanimationiteration, onanimationstart, onauxclick, onbeforeinput, onbeforeprint, onbeforeunload, onblur, oncancel, oncanplay, oncanplaythrough, onchange, onclick, onclose, oncompassneedscalibration, oncompositionend, oncompositionstart, oncompositionupdate, oncontextmenu, oncuechange, ondblclick, ondevicemotion, ondeviceorientation, ondeviceorientationabsolute, ondrag, ondragend, ondragenter, ondragexit, ondragleave, ondragover, ondragstart, ondrop, ondurationchange, onemptied, onended, onerror, onfocus, onfocusin, onfocusout, ongamepadconnected, ongamepaddisconnected, ongotpointercapture, onhashchange, oninput, oninvalid, onkeydown, onkeypress, onkeyup, onload, onloadeddata, onloadedmetadata, onloadstart, onlostpointercapture, onmousedown, onmouseenter, onmouseleave, onmousemove, onmouseout, onmouseover, onmouseup, onmousewheel, onoffline, ononline, onorientationchange, onpagehide, onpageshow, onpause, onplay, onplaying, onpointercancel, onpointerdown, onpointerenter, onpointerleave, onpointermove, onpointerout, onpointerover, onpointerup, onpopstate, onprogress, onratechange, onreadystatechange, onreset, onresize, onscroll, onsecuritypolicyviolation, onseeked, onseeking, onselect, onselectionchange, onselectstart, onstalled, onstorage, onsubmit, onsuspend, ontimeupdate, ontoggle, ontouchcancel, ontouchend, ontouchmove, ontouchstart, ontransitioncancel, ontransitionend, ontransitionrun, ontransitionstart, onunload, onvolumechange, onvrdisplayactivate, onvrdisplayblur, onvrdisplayconnect, onvrdisplaydeactivate, onvrdisplaydisconnect, onvrdisplaypresentchange, onwaiting, onwheel, preventDefault, prop, sleep, spy, spyNested, stopPropagation, stream, tag, then };
//# sourceMappingURL=ski.js.map
