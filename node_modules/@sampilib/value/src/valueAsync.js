import { Value, ValueLimiter, ValueType } from "./value";


export class ValueAsync extends Value {
    /**The initial value can be passed at creation
     * @param {ValueLimiter} [limiter] function to limit setting the value
     * @param {()} setup function used to setup cyclic value retrieval
     * @param {()} cleanup function used to cleanup cyclic value retrieval
     * @param {(val:*)} setter function used to change the value
     * @param {()=>*} getter function used to get the value once */
    constructor(limiter, setup, cleanup, setter, getter) {
        super(undefined, limiter);
        if (typeof setup === "function") {
            /**This is called when the getter is used
             * @param {ValueType} val
             * @protected*/
            this.__cyclicSetup = setup;
        }
        if (typeof cleanup === "function") {
            /**This is called when the getter is used
             * @param {Value} self
             * @protected*/
            this.__cyclicCleanup = cleanup;
        }
        if (typeof setter === "function") {
            /**This is called when the getter is used
             * @param {ValueType} val
             * @protected*/
            this.__setValueOnce = setter;
        }
        if (typeof getter === "function") {
            /**This is called when the getter is used
             * @protected*/
            this.__getValueOnce = getter;
        }
    }

    /** This get the curent value
     * @returns {ValueType|Promise<ValueType>} */
    get get() {
        if (this.___hasValue) {
            return this.___value;
        } else {
            return new Promise((a) => {
                if (!this.___asyncListeners) {
                    /**This stores all async listeners
                     * @type {[ValueListener]}
                     * @private*/
                    this.___asyncListeners = [];
                    if (!this.___ordering) {
                        this.__getValueOnce(this);
                    }
                }
                this.___asyncListeners.push(a);
            });
        }
    }

    /** Used when local resources sets the value 
     * @param {ValueType} val */
    set set(val) {
        val = this.__limiter(val);
        if (this.___value === val || val === undefined) {
            return;
        }
        this.__setValueOnce(val, this);
    }

    /**This is called when the getter is used
     * @param {ValueType} val
     * @protected*/
    __setValueOnce(val) {

    }

    /**This is called when the getter is used
     * @protected*/
    __getValueOnce() {

    }

    /**This is called when the getter is used
     * @param {Value} self
     * @protected*/
    __cyclicSetup(self) {

    }

    /**This is called when the getter is used
     * @param {Value} self
     * @protected*/
    __cyclicCleanup(self) {

    }

    /** Used when async value is retrieved from server
     * @param {ValueType} val*/
    set setValueFromCyclic(val) {
        if (this.___value !== val) {
            /**This stores all async listeners
             * @type {ValueType}
             * @private*/
            this.___value = val;
            delete this.___ordering;
            this.setValueFromOnce = val;
            if (this.hasListener) {
                /**This stores all async listeners
                 * @type {boolean}
                 * @private*/
                this.___hasValue = true;
                this.update();
            }
        }
    }

    /** Used when async value is retrieved from server
     * @param {ValueType} val*/
    set setValueFromOnce(val) {
        if (this.___asyncListeners) {
            for (let i = 0; i < this.___asyncListeners.length; i++) {
                this.___asyncListeners[i](val);
            }
            delete this.___asyncListeners;
        }
    }

    /**Overwrite this function to listen to managment events such as when value and unit listeners are added
     * @param {boolean} type is true on first listener and false on last listener*/
    onListener(type) {
        if (type) {
            this.__cyclicSetup(this);
            /**This stores all async listeners
             * @type {boolean}
             * @private*/
            this.___ordering = true;
        } else {
            this.__cyclicCleanup(this);
            delete this.___hasValue;
        }
    }
}