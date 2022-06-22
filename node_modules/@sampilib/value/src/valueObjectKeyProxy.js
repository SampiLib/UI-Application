import { Value, ValueListener } from "./value";
import { MapperFunction } from "./valueProxy";

export class ValueObjectKeyProxy extends Value {
    /**
     * @param {string} key key to extract from the object
     * @param {Value} [proxy] value to proxy
     * @param {MapperFunction} [readMapper] mapper function to change original value for users of the proxy
     * @param {MapperFunction} [writeMapper] mapper function to change values set on the proxy before relaying them to the original*/
    constructor(key, proxy, readMapper, writeMapper) {
        super(undefined, undefined);
        this.___key = key;
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

    /**Changes the value the proxy points to
     * @param {Value} value */
    set proxy(proxy) {
        if (proxy instanceof Value) {
            if (this.___listener) {
                if (this.___proxy) {
                    this.___proxy.removeListener(this.___listener);
                }
                this.___listener = proxy.addListener(this.___generateFunc(), true);
            }
            /**
             * @type {Value}
             * @protected */
            this.___proxy = proxy;
        } else {
            console.warn('None Value passed');
        }
    }

    /**Returns the value this proxies
     * @returns {Value}*/
    get proxy() {
        return this.___proxy
    }

    /**Sets the mapper function of the proxy value for reading values
     * @param {MapperFunction} map */
    set mapperRead(map) {
        if (typeof map === 'function') {
            this.___mapperRead = map;
        } else {
            console.warn('Mapper must be function');
        }
    }

    /**Returns the currently set mapper function for reading values
     * @returns {MapperFunction} */
    get mapperRead() {
        return this.___mapperRead
    }

    /**Default mapper function for reading values
     * @param {*} val 
     * @returns {*}*/
    ___mapperRead(val) {
        return val
    }

    /**Sets the mapper function of the proxy value for reading values
     * @param {MapperFunction} map */
    set mapperWrite(map) {
        if (typeof map === 'function') {
            this.___mapperWrite = map;
        } else {
            console.warn('Mapper must be function');
        }
    }

    /**Returns the currently set mapper function for reading values
     * @returns {MapperFunction} */
    get mapperWrite() {
        return this.___mapperWrite;
    }

    /**Default mapper function for writing values
     * @param {*} val 
     * @returns {*}*/
    ___mapperWrite(val) {
        return val
    }

    /**Generates the listener which is passed to the proxys point
     * @returns {ValueListener}
     * @protected*/
    ___generateFunc() {
        return (val) => {
            if (typeof val === 'object') {
                val = this.___mapperRead(val[this.___key]);
                for (let i = 0, m = this.___valueListeners.length; i < m; i++) {
                    try {
                        this.___valueListeners[i](val, this);
                    } catch (e) {
                        console.warn('Failed while calling value listeners ', e);
                    }
                }
            }
        }
    }

    /**This adds a function as an event listener to the value
     * @param {ValueListener} func
     * @returns {ValueListener}*/
    addListener(func, run) {
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
                let val = this.___proxy.get;
                try {
                    if (val instanceof Promise) {
                        return val.then((val) => { return this.___mapperRead(val[this.___key]) });
                    } else {
                        func(this.___mapperRead(val[this.___key]), this);
                    }
                } catch (e) {
                    console.warn('Failed while calling value listeners ', e);
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
    removeListener(func) {
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
    cleanUp() {
        if (this.___listener) {
            if (this.___proxy) {
                this.___proxy.removeListener(this.___listener);
                delete this.___proxy;
            }
            delete this.___listener;
            delete this.___valueListeners;
        }
    }

    /** This gets the curent access type
     * @returns {ValueType|Promise<ValueType>} */
    get get() {
        if (this.___proxy) {
            let val = this.___proxy.get;
            if (val instanceof Promise) {
                return val.then((val) => {
                    if (typeof val === 'object') {
                        return this.___mapperRead(val[this.___key])
                    } else {
                        return val;
                    }
                });
            } else {
                if (typeof val === 'object') {
                    return this.___mapperRead(val[this.___key]);
                } else {
                    return val;
                }
            }
        }
    }

    /** This sets the value and dispatches an event
     * @param {ValueType} val */
    set set(val) {
        if (this.___proxy) {
            let buff = this.___proxy.get;
            if (buff instanceof Promise) {
                return val.then((buff) => {
                    if (typeof buff === 'object') {
                        buff[this.___key] = this.___mapperWrite(val)
                        this.___proxy.set = buff;
                    } else {
                        this.___proxy.set = this.___mapperWrite(val);
                    }
                });
            } else {
                if (typeof buff === 'object') {
                    buff[this.___key] = this.___mapperWrite(val)
                    this.___proxy.set = buff;
                } else {
                    this.___proxy.set = this.___mapperWrite(val);
                }
            }
        }
    }

    /** This method can compare a value to the internal value
     * @param {ValueType} val
     * @returns {boolean} true if different, false if same*/
    compare(val) {
        return val != this.get;
    }
}