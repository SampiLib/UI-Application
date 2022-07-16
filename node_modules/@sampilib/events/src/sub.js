import { E, EListener } from "./event.js"

//This event handler allows for listeners to specify more precisely what to listen to, to prevent too many listeners on the same event doing nothing

/**Defines the layout of the storage of sub event listeners
 * @typedef {{[s:string]:{$_f_$:[EListener]$_s_$:SubEventStorage}}} SubEventStorage */
/**Defines the layout of the sub event listener addition options 
 * @typedef {Object} SubEventDispatchOptions
 * @property {[string]} SubEventDispatchOptions.sub tree list of sub event to listen to
 * example ['a','b','c'] listens to sub event 'c' in subevent 'b' in subevent 'a' in event type
 * @typedef {SimpleEventOptions & SubEventDispatchOptions} SubEventOptions */

/**Simple event handler class
 * Can be extended to other classes which needs event handling*/
export class SubEventHandler {
    /**Any data to pass to the event listeners must be given in the constructor
     * @param {[string]} types parameters to pass to the listeners*/
    constructor(types) { this.initEHandler(types); }
    /**This initializes the event handler with a preset of event types
     * it must be called during construction or types must be provided to attacher
     * @param {[string]} types */
    initEHandler(types) {
        if (typeof this.___simpleListeners___ !== 'object') {
            /** @type {SubEventStorage}*/
            this.___simpleListeners___ = {};
        }
        if (types instanceof Array) {
            for (let i = 0, n = types.length; i < n; i++) {
                this.___simpleListeners___[types[i]] = { '$_f_$': [] };
            }
        } else {
            console.warn('None array passed');
        }
    }
    /**This add the listener to the event handler 
     * @param {string|[string]} type which event to add
     * @param {EListener} listener the listener function to add, return true to remove listener when called
     * @param {SubEventOptions} options the options for the listener
     * @returns {EListener} */
    addEListener(types, listener, options) {
        if (typeof listener !== 'function') { console.warn('None function passed as listener'); return; }
        if (typeof types === 'string') { types = [types]; }
        if (types instanceof Array) {
            for (let i = 0, n = types.length; i < n; i++) {
                if (types[i] in this.___simpleListeners___) {
                    //Handles listeners with the once options
                    if (options && options.once) {
                        let liste = listener;
                        listener = (e) => { liste(e); return true; }
                    }
                    let type = this.___simpleListeners___[types[i]];
                    if (options && options.sub instanceof Array) {
                        for (let i = 0, n = options.sub.length; i < n; i++) {
                            if (!('$_s_$' in type)) { type['$_s_$'] = {}; }
                            if (!(options.sub[i] in type['$_s_$'])) {
                                type['$_s_$'][options.sub[i]] = { '$_f_$': [] }
                            }
                            type = type['$_s_$'][options.sub[i]];
                        }
                    }

                    let index = type['$_f_$'].indexOf(listener);
                    if (index == -1) { type['$_f_$'].push(listener); } else { console.warn('Listener already in handler'); }
                } else { console.warn('Listener type not in handler'); }
            }
        } else { console.warn('Invalid type passed for type'); return; }
        return listener;
    }
    /**This removes the listener from the event handler 
     * @param {string|[string]} types which event to remove
     * @param {(E)=>} listener the listener function to remove
     * @param {SubEventDispatchOptions} options the options for the listener
     * @returns {(E)=>} */
    removeEListener(types, listener, options) {
        if (typeof listener !== 'function') { console.warn('None function passed as listener'); return; }
        if (typeof types === 'string') { types = [types]; }
        if (types instanceof Array) {
            for (let i = 0, n = types.length; i < n; i++) {
                if (types[i] in this.___simpleListeners___) {
                    let type = this.___simpleListeners___[types[i]];
                    if (options && options.sub instanceof Array) {
                        for (let i = 0, n = options.sub.length; i < n; i++) {
                            if (type['$_s_$']) {
                                if (!(options.sub[i] in type['$_s_$'])) { console.warn('Listener not in handler'); return; }
                                type = type['$_s_$'][options.sub[i]];
                            } else { console.warn('Listener not in handler'); return; }
                        }
                    }
                    let index = type['$_f_$'].indexOf(listener);
                    if (index != -1) { type['$_f_$'].splice(index, 1); } else { console.warn('Listener not in handler'); }
                } else { console.warn('Listener type not in handler'); }
            }
        } else { console.warn('Invalid type passed for type'); return; }
        return listener;
    }
    /**This dispatches the event
     * @param {string} type which event to dispatch
     * @param {E} event event object
     * @param {SubEventDispatchOptions} options */
    dispatchE(type, event = new E(), options) {
        if (event instanceof E) {
            event.type = type;
            event.target = this;
            Object.freeze(event);
            let typ = this.___simpleListeners___[type];
            if (options && options.sub instanceof Array) {
                for (let i = 0, n = options.sub.length + 1; i < n; i++) {
                    this.__dispatchLevel(typ['$_f_$'], event);
                    if (typ['$_s_$']) {
                        if (!(options.sub[i] in typ['$_s_$'])) { break; }
                        typ = typ['$_s_$'][options.sub[i]];
                    } else { break; }
                }
            } else {
                this.__dispatchLevel(typ['$_f_$'], event);
            }
        } else {
            console.warn('None Event passed');
        }
    }
    /**Dispatches a sub level in the handler
     * @param {[EListener]} funcs
     * @param {E} event
     * @private */
    __dispatchLevel(funcs, event) {
        if (funcs.length > 0) {
            if (funcs.length > 1) {
                funcs = [...funcs];
            }
            for (let i = 0, n = funcs.length; i < n; i++) {
                try {
                    if (funcs[i](event)) {
                        funcs.splice(i, 1);
                        n--;
                        i--;
                    }
                } catch (e) { console.warn('Failed while dispatching event', e); }
            }
        }
    }
    /**This removes all listeners of a type from the event handler 
     * @param {string|[string]} type which event to remove*/
    resetEListeners(type) {
        if (typeof type === 'string') { type = [type]; }
        if (type instanceof Array) {
            for (let i = 0, n = type.length; i < n; i++) {
                if (type[i] in this.___simpleListeners___) {
                    this.___simpleListeners___[type[i]] = { '$_f_$': [] };
                } else { console.warn('Listener type not in handler'); }
            }
        } else { console.warn('Invalid type passed for type'); }
    }
}