/** Defines extendable event object
 * @typedef {Object} EObject
 * @property {*} data
 * @property {*} target */

/**Event class
 * contains the needed data to dispatch an event*/
export class E {
    /**Any data to pass to the event listeners must be given in the constructor
     * @param {{}} data parameters to pass to the listeners*/
    constructor(data) { this.data = data; }
}

/**Type for event listener function
 * @typedef {(event:E)=>boolean} EListener */