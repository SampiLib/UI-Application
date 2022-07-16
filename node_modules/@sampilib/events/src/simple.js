import { E, EListener } from "./event.js"

/**Defines the layout of the storage of sub event listeners
 * @typedef {{[s:string]:[EListener]}} SimpleEventStorage */
/**Defines the layout of the sub event listener addition options 
 * @typedef {Object} SimpleEventOptions
 * @property {boolean} once wether to only listen for the event once then the listener will remove itself*/

/**Simple event handler class
 * Can be extended to other classes which needs event handling*/
export class SimpleEventHandler {
    /**Any data to pass to the event listeners must be given in the constructor
     * @param {[string]} types parameters to pass to the listeners*/
    constructor(types) { this.initEHandler(types); }
    /**This initializes the event handler with a preset of event types
     * it must be called during construction or types must be provided to attacher
     * @param {[string]} types */
    initEHandler(types) {
        if (typeof this.___simpleListeners___ !== 'object') {
            /** @type {SimpleEventStorage}*/
            this.___simpleListeners___ = {};
        }
        if (types instanceof Array) {
            for (let i = 0, n = types.length; i < n; i++) {
                this.___simpleListeners___[types[i]] = [];
            }
        } else {
            console.warn('None array passed');
        }
    }
    /**This add the listener to the event handler 
     * @param {string|[string]} type which event to add
     * @param {EListener} listener the listener function to add, return true to remove listener when called
     * @param {SimpleEventOptions} options options for adding listener
     * @returns {EListener} */
    addEListener(types, listener, options) {
        if (typeof listener !== 'function') { console.warn('None function passed as listener'); return; }
        if (typeof types === 'string') { types = [types]; }
        if (types instanceof Array) {
            for (let i = 0, n = types.length; i < n; i++) {
                if (types[i] in this.___simpleListeners___) {
                    if (options && options.once) {
                        let liste = listener;
                        listener = (e) => { liste(e); return true; }
                    }
                    let type = this.___simpleListeners___[types[i]];
                    let index = type.indexOf(listener);
                    if (index == -1) { type.push(listener); } else { console.warn('Listener already in handler'); }
                } else { console.warn('Listener type not in handler'); }
            }
        } else { console.warn('Invalid type passed for type'); return; }
        return listener;
    }
    /**This removes the listener from the event handler 
     * @param {string|[string]} types which event to remove
     * @param {(E)=>} listener the listener function to remove
     * @returns {(E)=>} */
    removeEListener(types, listener) {
        if (typeof listener !== 'function') { console.warn('None function passed as listener'); return; }
        if (typeof types === 'string') { types = [types]; }
        if (types instanceof Array) {
            for (let i = 0, n = types.length; i < n; i++) {
                if (types[i] in this.___simpleListeners___) {
                    let type = this.___simpleListeners___[types[i]];
                    let index = type.indexOf(listener);
                    if (index != -1) {
                        type.splice(index, 1);
                    } else { console.warn('Listener not in handler'); }
                } else { console.warn('Listener type not in handler'); }
            }
        } else { console.warn('Invalid type passed for type'); return; }
        return listener;
    }
    /**This dispatches the event
     * event object will be frozen
     * @param {string} type which event to dispatch
     * @param {E} event event object*/
    dispatchE(type, event = new E()) {
        if (event instanceof E) {
            if (!Object.isFrozen(event)) {
                event.type = type;
                event.target = this;
            }
            Object.freeze(event);
            let funcs = this.___simpleListeners___[type];
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
                    } catch (e) {
                        console.warn('Failed while dispatching event', e);
                    }
                }
            }
        } else {
            console.warn('None Event passed');
        }
    }
    /**This removes all listeners of a type from the event handler 
     * @param {string|[string]} type which event to remove*/
    resetEListeners(type) {
        if (typeof type === 'string') { type = [type]; }
        if (type instanceof Array) {
            for (let i = 0, n = type.length; i < n; i++) {
                if (type[i] in this.___simpleListeners___) {
                    this.___simpleListeners___[type[i]] = [];
                } else { console.warn('Listener type not in handler'); }
            }
        } else { console.warn('Invalid type passed for type'); }
    }
}


/**This attaches a simple event handler to the given object
 * @param {{}} object the object to attach to
 * @param {[string]} [types] optional types to instantly initialize handler */
export let attachSimpleEventHandler = (object, types) => {
    let prot = SimpleEventHandler.prototype;

    /**@see SimpleEventHandler.initEHandler */
    object.initEHandler = prot.initEHandler;
    if (types) { object.initEHandler(types); }

    /**@see SimpleEventHandler.addEListener */
    object.addEListener = prot.addEListener;

    /**@see SimpleEventHandler.removeEListener */
    object.removeEListener = prot.removeEListener;

    /**@see SimpleEventHandler.dispatchE */
    object.dispatchE = prot.dispatchE;

    /**@see SimpleEventHandler.resetEListeners */
    object.resetEListeners = prot.resetEListeners;
}