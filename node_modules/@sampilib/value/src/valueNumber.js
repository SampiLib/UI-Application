import { ValueMulti } from "./valueMulti";

/**Sums up values from other Values only numbers*/
export class ValueSum extends ValueMulti {
    /**Overwriteable method for reading from multiple values
     * @param {[*]} values
     * @returns {*} 
     * @protected*/
    __multiFuncRead(vals) {
        let sum = 0;
        for (let i = 0; i < vals.length; i++) {
            sum += vals[i];
        }
        return sum;
    }

    /**Overwriteable method for writing to multiple values
     * it gets the written value and an array of Values to write to
     * @param {*} value
     * @param {[Value]} values
     * @param {[*]} valuesBuffer
     * @protected*/
    __multiFuncWrite(value, values, valuesBuffer) {
        let diff = (value - this.___value) / this.__values.length;
        for (let i = 0; i < this.__values.length; i++) {
            values[i] = valuesBuffer[i] + diff;
        }
    }
}

/**Finds average of other values*/
export class ValueAverage extends ValueMulti {
    /**Overwriteable method for reading from multiple values
     * @param {[*]} values
     * @returns {*} 
     * @protected*/
    __multiFuncRead(vals) {
        let sum = 0;
        for (let i = 0; i < vals.length; i++) {
            sum += vals[i];
        }
        return sum / vals.length;
    }

    /**Overwriteable method for writing to multiple values
     * it gets the written value and an array of Values to write to
     * @param {*} value
     * @param {[Value]} values
     * @param {[*]} valuesBuffer
     * @protected*/
    __multiFuncWrite(value, values) {
        let diff = (value - this.___value);
        for (let i = 0; i < this.__values.length; i++) {
            values[i] = valuesBuffer[i] + diff;
        }
    }
}