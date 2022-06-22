import { Value } from "./value";

/**Defines the base mapper function type
 * @typedef {(value:*)=>*} MapperFunction*/

/**Defines a proxy value which can be used to quickly pointe multiple value listeners to another value*/
export class ValueProxy extends Value {
    /**
     * @param {Value} [value] value to proxy
     * @param {MapperFunction} [readMapper] mapper function to change original value for users of the proxy
     * @param {MapperFunction} [writeMapper] mapper function to change values set on the proxy before relaying them to the original*/
    constructor(value, readMapper, writeMapper) {
        super(undefined, undefined);
        this.___constructor(value, readMapper, writeMapper);
    }

    /**Changes the value the proxy points to
     * @param {Value} value */
    set proxy(proxy) {}

    /**Returns the value this proxies
     * @returns {Value}*/
    get proxy() {}

    /**Sets the mapper function of the proxy value for reading values
     * @param {MapperFunction} map */
    set mapperRead(map) {}

    /**Returns the currently set mapper function for reading values
     * @returns {MapperFunction} */
    get mapperRead() {}

    /**Default mapper function for reading values
     * @param {*} val 
     * @returns {*}*/
    ___mapperRead(val) {}

    /**Sets the mapper function of the proxy value for reading values
     * @param {MapperFunction} map */
    set mapperWrite(map) {}

    /**Returns the currently set mapper function for reading values
     * @returns {MapperFunction} */
    get mapperWrite() {}

    /**Default mapper function for writing values
     * @param {*} val 
     * @returns {*}*/
    ___mapperWrite(val) {}

    /**Generates the listener which is passed to the proxys point
     * @returns {ValueListener}
     * @protected*/
    ___generateFunc() {}

    /**This adds a function as an event listener to the value
     * @param {ValueListener} func
     * @returns {ValueListener}*/
    addListener(func, run) {}

    /**This removes a function as an event listener from the value
     * @param {ValueListener} func
     * @returns {ValueListener}*/
    removeListener(func) {}

    /** This method prematurely disconnects the proxy access from the access it is connected to*/
    cleanUp() {}

    /** This gets the curent access type
     * @returns {ValueType|Promise<ValueType>} */
    get get() {}

    /** This sets the value and dispatches an event
     * @param {ValueType} val */
    set set(val) {}

    /** This method can compare a value to the internal value
     * @param {ValueType} val
     * @returns {boolean} true if different, false if same*/
    compare(val) {}
}

/** This function adapts the given value sub class to a proxy class
 * @param {typeof Value} Proxy the proxy class to create/populate
 * @param {typeof Value} Extends the original Value class the proxy proxies, used for type checks*/
export let valueProxyCreator = (Proxy, Extends) => {
    /**
     * @param {Value} proxy value to proxy
     * @param {MapperFunction} readMapper mapper function to change original value for users of the proxy
     * @param {MapperFunction} writeMapper mapper function to change values set on the proxy before relaying them to the original*/
    Proxy.prototype.___constructor = function(proxy, readMapper, writeMapper) {
        if (proxy) {
            this.proxy = proxy;
        }
        if (readMapper) {
            this.mapperRead = readMapper;
        }
        if (writeMapper) {
            this.mapperWrite = writeMapper;
        }
    }

    Object.defineProperties(Proxy.prototype, {
        proxy: {
            set(proxy) {
                if (proxy instanceof Extends) {
                    if (this.___listener) {
                        if (this.___proxy) {
                            this.___proxy.removeListener(this.___listener);
                        }
                        this.___listener = proxy.addListener(this.___generateFunc(), true);
                    }
                    this.___proxy = proxy;
                } else {
                    console.warn('None Value passed');
                }
            },
            get() {
                return this.___proxy
            }
        },
        mapperRead: {
            set(map) {
                if (typeof map === 'function') {
                    this.___mapperRead = map;
                } else {
                    console.warn('Mapper must be function');
                }
            },
            get() {
                return this.___mapperRead
            }
        },
        mapperWrite: {
            set(map) {
                if (typeof map === 'function') {
                    this.___mapperWrite = map;
                } else {
                    console.warn('Mapper must be function');
                }
            },
            get() {
                return this.___mapperWrite;
            }
        },
        get: {
            get() {
                if (this.___proxy) {
                    let val = this.___proxy.get;
                    if (val instanceof Promise) {
                        return (async () => {
                            return this.___mapperRead(await val);
                        })()
                    } else {
                        return this.___mapperRead(val);
                    }
                }
            }
        },
        set: {
            set(val) {
                if (this.___proxy) {
                    this.___proxy.set = this.___mapperWrite(val);
                }
            }
        }
    });


    /**Default mapper function for reading values
     * @param {*} val 
     * @returns {*}*/
    Proxy.prototype.___mapperRead = function(val) {
        return val;
    }

    /**Default mapper function for writing values
     * @param {*} val 
     * @returns {*}*/
    Proxy.prototype.___mapperWrite = function(val) {
        return val;
    }

    /**Generates the listener which is passed to the proxys point
     * @returns {ValueListener} */
    Proxy.prototype.___generateFunc = function() {
        return (val, self) => {
            val = this.___mapperRead(val);
            for (let i = 0, m = this.___valueListeners.length; i < m; i++) {
                try {
                    this.___valueListeners[i](val, this);
                } catch (e) {
                    console.warn('Failed while calling value listeners ', e);
                }
            }
        }
    }

    /**This adds a function as an event listener to the value
     * @param {ValueListener} func
     * @returns {ValueListener}*/
    Proxy.prototype.addListener = function(func, run) {
        if (typeof func == 'function') {
            if (!this.___valueListeners) {
                /**This stores all value listeners
                 * @type {[ValueListener]}
                 * @protected*/
                this.___valueListeners = [];
                this.___listener = this.___generateFunc();
                if (this.___proxy) {
                    this.___proxy.addListener(this.___listener);
                }
            }
            this.___valueListeners.push(func);
            if (this.___proxy && run) {
                let val = this.get;
                if (val instanceof Promise) {
                    val.then((value) => func(value, this))
                } else {
                    func(val, this);
                }
            }
            return func;
        } else {
            console.warn('Listener must be function');
        }
    }

    /**This removes a function as an event listener from the value
     * @param {ValueListener} func
     * @returns {ValueListener}*/
    Proxy.prototype.removeListener = function(func) {
        if (typeof func == 'function') {
            let index = this.___valueListeners.indexOf(func);
            if (index != -1) {
                this.___valueListeners.splice(index, 1);
            }
            if (this.___listener) {
                if (this.___proxy) {
                    this.___proxy.removeListener(this.___listener);
                }
                delete this.___listener;
                delete this.___valueListeners;
            }
            return func;
        }
    }

    /** This method prematurely disconnects the proxy access from the access it is connected to*/
    Proxy.prototype.cleanUp = function() {
        if (this.___listener) {
            if (this.___proxy) {
                this.___proxy.removeListener(this.___listener);
                delete this.___proxy;
            }
            delete this.___listener;
            delete this.___valueListeners;
        }
    }

    /** This method can compare a value to the internal value
     * @param {ValueType} val
     * @returns {boolean} true if different, false if same*/
    Proxy.prototype.compare = function(val) {
        return val != this.get;
    }
}
valueProxyCreator(ValueProxy, Value);