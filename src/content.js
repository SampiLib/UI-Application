import './content.scss'
import '../styling/common';
import { remToPx } from "./common"
import { grey } from '@sampilib/colors';
import { attachSimpleEventHandler, E } from '../common/events';
import { initWebComponentWithOptions, WebComponent } from '../common/webComponent';
import { addThemeVariable } from '@sampilib/theme';

addThemeVariable('contentBackGround', ['UI'], grey['50'], grey['900']);
addThemeVariable('contentTextColor', ['UI'], grey['900'], grey['300']);
addThemeVariable('scrollBarColor', ['UI', 'Scrollbar'], grey['400'], grey['800']);
addThemeVariable('scrollBarHover', ['UI', 'Scrollbar'], grey['600'], grey['600']);

/**The storage type for content minimum size
 * @typedef {Object} ContentMinSize
 * @property {number} width 
 * @property {number} height */

/**Defines base options for creating content
 * @typedef {Object} ContentBaseOptions
 * @property {HTMLElement} container container element for the content
 * @property {Content} parent parent content for the content */


/**All event types available for content
 * @enum {string} */
export let ContentEventTypes = {
    NAME: 'name',
    SYMBOL: 'symbol',
    NOTIFICATION: 'notification',
    REMOVED: 'removed',
    CLOSING: 'closing',
    CLOSEABLE: 'closeable',
    FOCUSED: 'focused',
    MINSIZE: 'minSize',
}
let ContentEventTypesItterable = Object.values(ContentEventTypes);

/**Contains the last selected content
 * @type {Content}
 * @readonly*/
export let selectedContent = null;

/**Content class */
export class Content extends WebComponent {
    /** Builds content
     * @param {ContentBaseOptions} options */
    constructor(options) {
        super();
        this.initEHandler(ContentEventTypesItterable);
        /**Stores a list of child contents
         * @type {[Content]}
         * @private*/
        this.___children = [];
        /**Stores the parent of the content if any
         * @type {Content} 
         * @private */
        this.___parent = null;
        /**Stores the container of the content, some events are passed to the container
         * @type {import("./context").Context|import("./windows").UIWindow|ContentContainer}
         * @private */
        this.___container = null;
        /**Stores the container of the content, some events are passed to the container
         * @type {Boolean}
         * @private */
        this.___closeable = true;
        /**Stores wether the content has been closed
         * @type {Boolean}
         * @private */
        this.___closed = false;
        //Adds a listener to handle when content is selected
        this.addEventListener('focusin', (e) => {
            e.stopPropagation();
            this.select(true);
        });
        //Key listener
        this.onkeydown = (ev) => {
            ev.stopPropagation();
            this.__keyboard(ev)
        };
        //Key listener
        this.onkeyup = (ev) => {
            ev.stopPropagation();
            this.__keyboardUp(ev)
        };
        this.classList.add('content');
        this.tabIndex = 0;
    }

    /**Options toggeler
     * @param {ContentBaseOptions} options*/
    options(options) {
        if (typeof options.parent !== 'undefined') { this.parent = options.parent; }
        if (typeof options.container !== 'undefined') { this.container = options.container; }
    }

    /**Creates an instance of the button
     * @param {ContentBaseOptions} options
     * @returns {Content}*/
    static create(options) {}

    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-content'; }

    /** Keyboard event processed for content
     * @param {KeyboardEvent} event
     * @protected */
    __keyboard(event) {}

    /** Keyboard event processed for content
     * @param {KeyboardEvent} event
     * @protected */
    __keyboardUp(event) {}

    /**Set the container of the content, which will recieve some events from the content
     * @param {HTMLElement}*/
    set container(cont) {
        if (cont instanceof HTMLElement) {
            this.___container = cont;
        } else {
            this.___container = null
        }
    }

    /**Gets the container of the content
     * @returns {HTMLElement} */
    get container() {
        return this.___container;
    }

    /**Gets the container of the content
     * @returns {HTMLElement} */
    get topContainer() {
        if (this.___container) {
            return this.___container.topContainer;
        } else {
            return this;
        }
    }

    /**Returns the layer of the window the content is part of or 0 if content is not part of a window
     * @returns {number}*/
    get layer() {
        let top = this.topContainer;
        if (top instanceof require("./windows").UIWindow) {
            return top.layer;
        } else {
            return 0;
        }
    }

    /**This sets the parent content of the content
     * @param {Content} content */
    set parent(content) {
        if (this.___parent != null && this.___parent != content) {
            this.___parent.__removeChild(this);
        }
        if (content instanceof Content) {
            this.___parent = content;
            this.___parent.__addChild(this);
        } else {
            this.___parent = null;
        }
    };

    /**Returns the parent content of the content
     * @returns {Content} */
    get parent() {
        return this.___parent;
    };

    /**Returns all the children of the content
     * @param {boolean} recursive set true to include childrens chilren recursively
     * @returns {[Content]} */
    children(recursive) {
        if (recursive) {
            let res = [...this.___children];
            for (let i = 0, n = this.___children.length; i < n; i++) {
                res.push(...this.___children[i].children(true));
            }
        } else {
            return [...this.___children];
        }
    };

    /**This adds a child to this content 
     * @param {Content} content 
     * @private*/
    __addChild(content) {
        let index = this.___children.indexOf(content);
        if (index == -1) {
            this.___children.push(content);
        }
    };

    /**Removes a child content from the content
     *  @returns {Content}
     * @private */
    __removeChild(content) {
        let index = this.___children.indexOf(content);
        if (index != -1) {
            this.___children.splice(index, 1);
        }
    };

    /**This focuses this content within its container*/
    focus() {
        this.dispatchE(ContentEventTypes.FOCUSED);
    }

    /**This selects the content in its parent, if the content is already selected, it will 
     * @param {boolean} dontFocus if true, selection does not focus*/
    select(dontFocus) {
        if (this != selectedContent) {
            selectedContent = this;
            if (!dontFocus) { super.focus(); }
            this.focus();
            if (this.___children.length > 0) {
                let container = this.___container;
                let children = this.___children;
                let containers = [];
                let contents = [];
                for (let i = 0, m = children.length; i < m; i++) {
                    let container2 = children[i].___container;
                    if (container2 != null && container2 != container) {
                        let index = containers.indexOf(container2);
                        if (index == -1) {
                            containers.push(container2);
                            contents.push(children[i]);
                        }
                    }
                }
                for (let i = 0, m = contents.length; i < m; i++) {
                    contents[i].focus();
                }
            }
        }
    }

    /**This removes the content from its parent
     * @returns {Content} */
    remove() {
        if (this.___container) {
            super.remove();
            this.dispatchE(ContentEventTypes.REMOVED);
            this.___container = null;
            return this;
        }
    }

    /**The long name of the content
     * @returns {string} */
    get longName() {
        return this.name;
    }

    /**The symbol for the content
     * @param {()=>SVGElement} symFunc function returning an svg*/
    set symbol(symFunc) {
        if (typeof symFunc === 'function') {
            /**Stores the function which generates the content icon
             * @type {()=>SVGElement}
             * @private */
            this.___symFunc = symFunc;
            this.dispatchE(ContentEventTypes.SYMBOL, new E({ symFunc }));
        } else {
            console.warn('None function passed');
        }
    }
    /**Returns the symbol for the content
     * @returns {SVGElement} */
    get symbol() {
        return this.___symFunc;
    }

    /**This sets the name of the content
     * @param {string} name as short as possible, use longName for more details*/
    set name(name) {
        /**Stores a buffer of the contents name
         * @type {string}
         * @private */
        this.___name = String(name);
        this.dispatchE(ContentEventTypes.NAME, new E({ name: this.___name }));
    }

    /**Returns the short name of the content
     * @returns {string}*/
    get name() {
        return this.___name || '';
    }

    /**This sets the minimum size of the content
     * @param {ContentMinSize} min*/
    set minSize(min) {
        if (typeof min === 'object' && typeof min.width === 'number' && typeof min.height === 'number') {
            /**Stores the minimum size of the content
             * @type {{width:number,height:number}}
             * @private */
            this.___minSize = { width: min.width, height: min.height };
            this.dispatchE(ContentEventTypes.MINSIZE, new E(this.___minSize));
        } else {
            console.warn('Invalid object passed as size');
        }
    }

    /**Returns the minimum size of the content
     * @returns {ContentMinSize}*/
    get minSize() {
        return this.___minSize || { width: remToPx(12), height: remToPx(12) };
    }

    /**Sets if the content is closeable
     * @param {boolean} c*/
    set closeable(c) {
        this.___closeable = Boolean(c);
        this.dispatchE(ContentEventTypes.CLOSEABLE, new E({ closeable: this.___closeable }));
    }

    /**Gets wether the content is closeable
     * @returns {boolean}*/
    get closeable() {
        return this.___closeable;
    }

    /**This closes the content and cleans up any references
     * @param {*} [data] data to pass to closing listeners
     * @returns {Promise<{content:Content,reason:string}>} promise for when closing is finished*/
    async close(data) {
        if (this.___closing) { return; }
        /**Stores if the content is in the process of closing
         * @type {boolean}
         * @private */
        this.___closing = true;
        this.dispatchE(ContentEventTypes.CLOSING, new E({ closing: false }));
        let children = this.children();
        for (let i = 0, n = children.length; i < n; i++) {
            try {
                await children[i].close();
            } catch (e) {
                console.warn('Failed while closing child content', e);
            }
        }
        try {
            var reason = await this.onClose(data);
        } catch (e) {
            console.warn('Failed while closing content', e);
        }
        if (reason) {
            this.___closing = false;
            this.dispatchE(ContentEventTypes.CLOSING, new E({ closing: true }));
            return { content: this, reason: reason }
        }
        if (this.___closePromises) {
            for (let i = 0; i < this.___closePromises.length; i++) {
                this.___closePromises[i](data);
            }
        }
        this.remove();
        this.___closed = true;
    }

    /**On close event for handling when the content should be closed, overwrite if content should do anything on closing
     * @param {*} data data passed in close method
     * @returns {string} if closing content is not accepted, return anything truthy*/
    async onClose(data) { return };

    /**Returns a promise for when the content is closed
     * promise returns closing data for content
     * @returns {Promise<{}>} */
    get whenClosed() {
        if (!this.___closePromises) {
            /**Stores the promises to resolve when window closes
             * @type {[()]}
             * @private */
            this.___closePromises = [];
        }
        return new Promise((resolver) => {
            this.___closePromises.push(resolver)
        });
    }


    /**Returns true if the content has been closed
     * @returns {boolean} */
    get isClosed() {
        return this.___closed;
    }

    /**This add the listener to the event handler 
     * @param {(ContentEventTypes)} type which event to add
     * @param {(event:E)} listener the listener function to add
     * @returns {(event:E)} */
    addEListener(type, listener) {}

    /**This removes the listener from the event handler 
     * @param {(ContentEventTypes)} type which event to add
     * @param {(event:E)} listener the listener function to remove
     * @returns {(event:E)} */
    removeEListener(type, listener) {}

    /**This dispatches the event
     * @param {(ContentEventTypes)} type which event to add
     * @param {E} event event object*/
    dispatchE(type, event) {}
}
attachSimpleEventHandler(Content.prototype);
initWebComponentWithOptions(Content);
export let content = Content.create;


/**Defines base options for creating content
 * @typedef {Object} ContentContainerBaseOptions
 * @property {Content} content */

/**Content class */
export class ContentContainer extends WebComponent {
    constructor() {
        super();
        this.initEHandler([ContentEventTypes.REMOVED]);
        /**Stores a list of child contents
         * @type {Content}
         * @private */
        this.__content = null;

        this.classList.add('contentContainer');
        this.tabIndex = -1;
        this.appendChild(this.__content = document.createElement('div'));
    }

    /**Options toggeler
     * @param {ContentContainerBaseOptions} options*/
    options(options) {
        if (options.content instanceof Content) {
            this.content = options.content;
        }
    }

    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-contentcontainer'; }

    /**Creates an instance of the content
     * @param {ContentContainerBaseOptions} options
     * @returns {ContentContainer}*/
    static create(options) {}

    /**Gets the container of the content
     * @returns {HTMLElement} */
    get topContainer() {
        if (this.___container) {
            return this.___container.topContainer;
        } else {
            return this;
        }
    }

    /**This changes the content of the window
     * @param {Content} cont*/
    set content(cont) {
        if (cont instanceof Content) {
            if (cont.isClosed) {
                console.warn('Content is closed');
                return;
            }
            cont.remove();
            if (this.__content instanceof Content) {
                this.__content.removeEListener(ContentEventTypes.REMOVED, this.__removedListener);
            }
            cont.container = this;
            this.replaceChild(cont, this.__content);
            this.__content = cont;
            /**Stores the remove listener for the content
             * @type {()}
             * @private */
            this.__removedListener = cont.addEListener(ContentEventTypes.REMOVED, (e) => {
                this.__removeContent(e.target);
            });
        } else {
            console.warn('None content set');
        }
    }

    /**This returns the content of the 
     * @returns {Content}*/
    get content() {
        return this.__content
    }

    /**This method removes a content from the window
     * @param {Content} 
     * @private */
    __removeContent(content) {
        content.removeEListener(ContentEventTypes.REMOVED, this.__removedListener);
        this.appendChild(this.__content = document.createElement('div'));
    }

    /**This add the listener to the event handler 
     * @param {('lastClosed')} type which event to add
     * @param {(event:E)} listener the listener function to add
     * @returns {(event:E)} */
    addEListener(type, listener) {}

    /**This removes the listener from the event handler 
     * @param {('lastClosed')} type which event to add
     * @param {(event:E)} listener the listener function to remove
     * @returns {(event:E)} */
    removeEListener(type, listener) {}

    /**This dispatches the event
     * @param {('lastClosed')} type which event to add
     * @param {E} event event object*/
    dispatchE(type, event) {}
}
attachSimpleEventHandler(ContentContainer.prototype);
initWebComponentWithOptions(ContentContainer);
export let contentContainer = ContentContainer.create;