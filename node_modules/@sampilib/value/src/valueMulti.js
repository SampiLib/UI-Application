import { Value } from "./value";

/**Performs an operation on multiple values */
export class ValueMulti extends Value {
    /**
     * @param {[Value]} values list of values to perform multi operation on
     * @param {(values:[*])=>*} readFunc overwrite for reading from multiple values
     * @param {(value:*,values:[*],valuesBuffer:[*])=>} writeFunc overwrite for writing to multiple values*/
    constructor(values, readFunc, writeFunc) {
        super();
        /**Stores all values to connect to
         * @type {[Value]}
         * @protected*/
        this.__values = [];
        /**Buffer of all values
         * @type {[number]}
         * @protected*/
        this.__valuesBuffer = [];
        if (typeof values !== 'undefined') {
            this.values = values;
        }
        if (typeof readFunc !== 'undefined') {
            this.multiReadFunction = readFunc;
        }
        if (typeof writeFunc !== 'undefined') {
            this.multiWriteFunction = writeFunc;
        }
    }

    /**Sets the values to sum up
     * @param {[Value]} val */
    set values(val) {
        if (val instanceof Array) {
            for (let i = 0; i < val.length; i++) {
                if (!(val[i] instanceof Value)) {
                    console.warn('None value passed');
                    return;
                }
            }
            this.__disconnect();
            this.__values = val;
            if (this.hasListener) {
                this.__connect();
            }
        } else {
            console.warn('None array passed');
        }
    }

    /**Sets the values to sum up
     * @param {(values:[*])=>*} func */
    set multiReadFunction(func) {
        if (typeof func === 'function') {
            this.__multiFuncRead = func;
            if (this.hasListener) {
                super.set = this.__multiFuncRead(this.__valuesBuffer);
            }
        } else {
            console.warn('None function passed');
        }
    }

    /**Sets the values to sum up
     * @param {(value:*,values:[*],valuesBuffer:[*])=>} func */
    set multiWriteFunction(func) {
        if (typeof func === 'function') {
            this.__multiFuncWrite = func;
        } else {
            console.warn('None function passed');
        }
    }

    /**
     * @param {boolean} type */
    onListener(type) {
        if (type) {
            this.__connect();
        } else {
            this.__disconnect();
        }
    }

    /** This sets the value and dispatches an event
     * @param {ValueType} val */
    set set(val) {
        let values = [];
        this.__multiFuncWrite(val, values, this.__valuesBuffer);
        for (let i = 0; i < this.__values.length; i++) {
            this.__values[i].set = values[i];
        }
    }

    /** This get the curent value
     * @returns {ValueType|Promise<ValueType>} */
    get get() {
        if (this.hasListener) {
            return super.get;
        } else {
            let promise = false;
            let buffer = [];
            for (let i = 0; i < this.__values.length; i++) {
                buffer[i] = this.__values[i].get;
                if (buffer[i] instanceof Promise) {
                    buffer[i].then((val) => { buffer[i] = val; })
                    promise = true;
                }
            }
            if (promise) {
                return new Promise((a) => {
                    Promise.all(buffer).then((vals) => { a(this.__multiFuncRead(vals)) })
                })
            } else {
                return this.__multiFuncRead(buffer);
            }
        }
    }

    /**Connects listeners to all values
     * this must be overwritten to 
     * @private*/
    __connect() {
        for (let i = 0; i < this.__values.length; i++) {
            this.__valuesListeners[i] = this.__values[i].addListener((val) => {
                this.__valuesBuffer[i] = Number(val);
                super.set = this.__multiFuncRead(this.__valuesBuffer);
            }, true);
        }
    }

    /**Disconnects listeners from all values
     * @private*/
    __disconnect() {
        if (this.hasListener) {
            for (let i = 0; i < this.__values.length; i++) {
                this.__values[i].removeListener(this.__valuesListeners[i]);
            }
        }
        /**
         * @type {[()]}
         * @private*/
        this.__valuesListeners = [];
    }

    /**Overwriteable method for reading from multiple values
     * @param {[*]} values
     * @returns {*} 
     * @protected*/
    __multiFuncRead(values) {}

    /**Overwriteable method for writing to multiple values
     * it gets the written value and an array of Values to write to
     * @param {*} value
     * @param {[*]} values
     * @param {[*]} valuesBuffer
     * @protected*/
    __multiFuncWrite(value, values, valuesBuffer) {}
}