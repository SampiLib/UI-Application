/**The supported value types for the value class
 * @typedef {*} ValueType */
/**The function type for value limiting
 * @typedef {(value:ValueType,self:Value)=>boolean} ValueLimiter returns true to block value change*/
/**The function type for value listeners
 * @typedef {(value:ValueType,self:Value)} ValueListener */

/**The value class is a container for a value which can have events listeners registered*/
export class Value {
    /**The initial value can be passed at creation
     * @param {ValueType} init
     * @param {ValueLimiter} [limiter] function to limit setting the value*/
    constructor(init, limiter) {
        if (limiter) {
            this.limiter = limiter;
        }
        if (typeof init !== 'undefined') {
            /**This stores the value 
             * @type {ValueType}
             * @protected*/
            this.___value = init;
        }
    }

    /**Default function for limiting the value
     * @param {ValueType} val 
     * @returns {ValueType}
     * @protected  */
    __limiter(val) { return val; }

    /**Changes the limiter function
     * @param {ValueLimiter} limiter*/
    set limiter(limiter) {
        if (typeof limiter === 'function') {
            /**
             * @type {ValueLimiter}
             * @protected */
            this.__limiter = limiter;
        } else {
            console.warn('Limiter must be function');
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
                 * @private*/
                this.___valueListeners = [];
                this.__onListenerCaller(true)
            }
            this.___valueListeners.push(func);
            if (run) {
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
    removeListener(func) {
        if (typeof func == 'function') {
            if (this.___valueListeners) {
                let index = this.___valueListeners.indexOf(func);
                if (index != -1) {
                    this.___valueListeners.splice(index, 1);
                }
                if (this.___valueListeners.length == 0) {
                    this.__onListenerCaller(false)
                    delete this.___valueListeners;
                }
            }
            return func;
        } else {
            console.warn('Listener must be function');
        }
    }

    /** This get the curent value
     * @returns {ValueType|Promise<ValueType>} */
    get get() {
        return this.___value;
    }

    /** This sets the value and dispatches an event
     * @param {ValueType} val */
    set set(val) {
        val = this.__limiter(val, this)
        if (this.___value === val || val === undefined) {
            return;
        }
        this.___value = val;
        this.update();
    }

    /** Allows for plus equal and minum equals and those types of tricks
     * @returns {ValueType} val */
    get set() { return this.get; }

    /** This sends an update without changing the value, can be used for more complex values*/
    update() {
        if (this.___valueListeners) {
            for (let i = 0, m = this.___valueListeners.length; i < m; i++) {
                try {
                    this.___valueListeners[i](this.___value, this);
                } catch (e) {
                    console.warn('Failed while calling value listeners ', e);
                }
            }
        }
    }

    /** This method can compare a value to the internal value
     * @param {ValueType} val
     * @returns {boolean} true if different, false if same*/
    compare(val) {
        return val != this.___value;
    }

    /**Provides support for object equals common function*/
    objectEquals(val) { return !this.compare(val); }

    //############################################################################
    //Management
    /**Overwrite this function to listen to managment events such as when value and unit listeners are added
     * @param {boolean} type is true on first listener and false on last listener
     * @param {Value} self*/
    onListener(type, self) {}

    /**Caller for onListener function 
     * @param {} 
     * @private*/
    __onListenerCaller(type) {
        try {
            this.onListener(type, this);
        } catch (e) {
            console.warn('Failed while calling on listener for ' + type, e);
        }
    }

    /** Returns wether the value has listeners
     * @returns {boolean} */
    get hasListener() {
        return Boolean(this.___valueListeners);
    }
}