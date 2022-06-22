import { Value, ValueType, ValueLimiter } from "./value";

/**The function type for array value listeners
 * the index of addition or deletion is the first argument
 * the amount of items is positive for addition or negative for removals
 * values contains any new elements added to the array
 * @typedef {(index:number,amount:number,values:[ValueType],self:Value)} ArrayValueListener */

export class ValueArray extends Value {
    /**The initial value can be passed at creation
     * @param {[ValueType]} init
     * @param {ValueLimiter} [limiter] function to limit setting the value
     * @param {ValueLimiter} [elementLimiter] limiter function for elements added to array */
    constructor(init, limiter, elementLimiter) {
        super(undefined, limiter);
        if (typeof init === 'undefined') {
            /**The array 
             * @type {[ValueType]}
             * @protected */
            this.___value = [];
        } else {
            if (init instanceof Array) {
                this.___value = init;
            } else {
                console.warn('None array passed');
            }
        }
        if (elementLimiter) {
            this.elementLimiter = elementLimiter;
        }
    }

    /**Changes the limiter function
     * @param {ValueLimiter} limiter*/
    set elementLimiter(limiter) {
        if (typeof limiter === 'function') {
            /**
             * @type {ValueLimiter}
             * @protected */
            this.__elementLimiter = limiter;
        } else {
            console.warn('Limiter must be function');
        }
    }

    /**This adds a function as an event listener to the value
     * @param {ArrayValueListener} func
     * @returns {ArrayValueListener}*/
    addArrayListener(func) {
        if (typeof func == 'function') {
            if (!this.___arrayValueListeners) {
                /**This stores all value listeners
                 * @type {[ArrayValueListener]}
                 * @private*/
                this.___arrayValueListeners = [];
            }
            this.___arrayValueListeners.push(func);
            return func;
        } else {
            console.warn('Listener must be function');
        }
    }

    /**This removes a function as an event listener from the value
     * @param {ArrayValueListener} func
     * @returns {ArrayValueListener}*/
    removeArrayListener(func) {
        if (typeof func == 'function') {
            let index = this.___arrayValueListeners.indexOf(func);
            if (index != -1) {
                this.___arrayValueListeners.splice(index, 1);
            }
            if (this.___arrayValueListeners.length == 0) {
                delete this.___arrayValueListeners;
            }
            return func;
        } else {
            console.warn('Listener must be function');
        }
    }

    /**Calls all array listeners
     * @param {number} index 
     * @param {number} amount 
     * @param {[ValueType]} values 
     * @protected */
    ___callArrayListeners(index, amount, values) {
        if (this.___arrayValueListeners) {
            Object.freeze(values);
            for (let i = 0, m = this.___arrayValueListeners.length; i < m; i++) {
                try {
                    this.___arrayValueListeners[i](index, amount, values, this);
                } catch (e) {
                    console.warn('Failed while calling value listeners ', e);
                }
            }
        }
    }

    /**Adds an element to the back of the array
     * @param {[ValueType]} elem */
    push(...elem) {
        if (this.__elementLimiter) {
            for (let i = 0; i < elem.length; i++) {
                elem[i] = this.__elementLimiter(elem[i]);
            }
        }
        let i = this.___value.length;
        this.___value.push(...elem);
        this.___callArrayListeners(i, elem.length, elem)
    }

    /**Adds an element to the front of the array
     * @param {[ValueType]} elem */
    unshift(...elem) {
        if (this.__elementLimiter) {
            for (let i = 0; i < elem.length; i++) {
                elem[i] = this.__elementLimiter(elem[i]);
            }
        }
        this.___value.unshift(...elem);
        this.___callArrayListeners(0, elem.length, elem)
    }

    /**Removes an element from the back of the array
     * @returns {ValueType} elem */
    pop() {
        let len = this.___value.length;
        let res = this.___value.pop();
        if (len > this.___value.length) {
            this.___callArrayListeners(this.___value.length, -1)
        }
        return res;
    }

    /**Removes an element from the front of the array
     * @returns {ValueType} elem */
    shift() {
        let len = this.___value.length;
        let res = this.___value.shift();
        if (len > this.___value.length) {
            this.___callArrayListeners(0, -1)
        }
        return res;
    }

    /** Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param {number} start The zero-based location in the array from which to start removing elements.
     * @param {number} deleteCount The number of elements to remove.
     * @param {[ValueType]} elem Elements to insert into the array in place of the deleted elements.
     * @returns {[ValueType]} An array containing the elements that were deleted.*/
    splice(start, deleteCount, ...elem) {
        let res = this.___value.splice(start, deleteCount, ...elem);
        if (res.length) {
            this.___callArrayListeners(start, -res.length);
        }
        if (elem) {
            this.___callArrayListeners(start, elem.length, elem);
        }
        return res;
    }

    /**Returns the index of the first occurrence of a value in an array, or -1 if it is not present.
     * @param {ValueType} val The value to locate in the array
     * @param {number} fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0
     * @returns {number}*/
    indexOf(val, fromIndex) {
        return this.___value.indexOf(val, fromIndex);
    }

    /**Empties array of all elements*/
    empty() {
        this.___value = [];
        this.update();
    }

    /**Removes the given element if it exists
     * @param {ValueType|[ValueType]} val 
     * @param {*} fromIndex */
    removeIfExist(val) {
        let i;
        while ((i = this.___value.indexOf(val)) != -1) {
            this.___value.splice(i, 1);
            this.___callArrayListeners(i, -1);
        }
    }

    /**Gets the value from the given index
     * @param {number} index
     * @returns {ValueType} */
    getIndex(index) {
        return this.___value[index];
    }

    /**Sets the value from the given index
     * @param {number} index
     * @param {ValueType} value
     * @returns {ValueType} */
    setIndex(index, value) {
        if (this.___value[index] != value) {
            if (index > this.___value.length) {
                let len = index - this.___value.length + 1
                this.___callArrayListeners(this.___value.length, len, Array(len).fill(undefined))
            }
            this.___value[index] = value;
            this.___callArrayListeners(index, 0, [value]);
        }
    }

    /** This returns 
     * @returns {[ValueType]|Promise<[ValueType]>} */
    get get() {
        return this.___value;
    }

    /** This sets the value and dispatches an event
     * @param {[ValueType]} val */
    set set(val) {
        if (val instanceof Array) {
            val = this.__limiter(val, this)
            if (this.___value === val || val === undefined) {
                return;
            }
            this.___value = val;
            this.update();
        }
    }

    /** Allows for plus equal and minum equals and those types of tricks
     * @returns {[ValueType]} val */
    get set() { return this.get; }

    /** This method can compare a value to the internal value
     * @param {ValueType} val
     * @returns {boolean} true if different, false if same*/
    compare(val) {
        switch (typeof val) {
            case 'object': {
                if (val instanceof Array) {
                    if (val.length == this.___value.length) {
                        for (let i = 0; i < this.___value.length; i++) {
                            if (this.___value[i] != val[i]) {
                                return true;
                            }
                        }
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            }
            default:
                return true;
        }
    }
}