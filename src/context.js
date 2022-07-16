import './context.scss'
import '../styling/common';
import { close } from '@sampilib/icons';
import { Content, ContentEventTypes, selectedContent, ContentBaseOptions, ContentContainer } from "./content";
import { attachContextMenu } from "./contextMenu";
import { initWebComponent, initWebComponentWithOptions, WebComponent } from '../common/webComponent';
import { remToPx, scale, touch } from './common';

import { E } from '@sampilib/events';
import { addThemeVariable } from '@sampilib/theme';
import { blue, grey, orange } from '@sampilib/colors';

addThemeVariable('snapperContentHighlight', ['UI', 'Tabs'], '#9E9E9E60', '#61616160');
addThemeVariable('snapperTabsHighlight', ['UI', 'Tabs'], '#9E9E9E90', '#61616190');
addThemeVariable('tabBackGround', ['UI', 'Tabs'], grey['200'], grey['800']);
addThemeVariable('tabColor', ['UI', 'Tabs'], grey['400'], grey['600']);
addThemeVariable('tabColorHover', ['UI', 'Tabs'], grey['500'], grey['500']);
addThemeVariable('tabColorCloserHover', ['UI', 'Tabs'], grey['600'], grey['600']);
addThemeVariable('tabColorSelect', ['UI', 'Tabs'], grey['50'], grey['900']);
addThemeVariable('tabCornerRadius', ['UI', 'Tabs'], '0rem', '0rem');
addThemeVariable('tabTextColor', ['UI', 'Tabs'], grey['900'], grey['300']);
addThemeVariable('tabFocusColor', ['UI', 'Tabs'], orange['900'], orange['600']);
addThemeVariable('tabIconColor', ['UI', 'Tabs'], grey['900'], grey['300']);
addThemeVariable('contextGroupBackGroundColor', ['UI', 'Context Group'], grey['400'], grey['900']);
addThemeVariable('contextGroupIconColor', ['UI', 'Context Group'], grey['900'], grey['300']);
addThemeVariable('contextGroupSizerColor', ['UI', 'Context Group'], blue['300'], blue['600']);
addThemeVariable('contextGroupDeviderColor', ['UI', 'Context Group'], grey['500'], grey['600']);

//#####################################################################################################################################################################################
//#     _____            _            _      ##########################################################################################################################################
//#    / ____|          | |          | |     ##########################################################################################################################################
//#   | |     ___  _ __ | |_ _____  _| |_    ##########################################################################################################################################
//#   | |    / _ \| '_ \| __/ _ \ \/ / __|   ##########################################################################################################################################
//#   | |___| (_) | | | | ||  __/>  <| |_    ##########################################################################################################################################
//#    \_____\___/|_| |_|\__\___/_/\_\\__|   ##########################################################################################################################################
//#####################################################################################################################################################################################

//Listener for ui scale to recalculate window min sizes
let tabsHeight = remToPx(2);
touch.addListener((val) => {
    tabsHeight = remToPx((val ? 2.3 : 1.8));
});
scale.addListener((val) => {
    tabsHeight = remToPx((touch.get ? 2.3 : 1.8));
});

let contextDropper = document.createElement('ui-contextdropper'); {
    contextDropper.ondragover = (ev) => {
        ev.stopPropagation();
        if (draggingTab) {
            ev.preventDefault();
        }
    }
    contextDropper.dropTarget = null;
    contextDropper.center = new Image();
    contextDropper.center.src = require('./icons/content_tab.svg');
    contextDropper.appendChild(contextDropper.center).classList.add('center');
    contextDropper.center.ondragenter = (ev) => {
        contextDropper.dropTarget = contextDropper.center;
        ev.stopPropagation();
        if (draggingTab) { contextDropper.count++; }
    }
    contextDropper.right = new Image();
    contextDropper.right.src = require('./icons/split_internal_right.svg');
    contextDropper.appendChild(contextDropper.right).classList.add('right');
    contextDropper.right.ondragenter = (ev) => {
        contextDropper.dropTarget = contextDropper.right;
        ev.stopPropagation();
        if (draggingTab) { contextDropper.count++; }
    }
    contextDropper.left = new Image();
    contextDropper.left.src = require('./icons/split_internal_left.svg');
    contextDropper.appendChild(contextDropper.left).classList.add('left');
    contextDropper.left.ondragenter = (ev) => {
        contextDropper.dropTarget = contextDropper.left;
        ev.stopPropagation();
        if (draggingTab) { contextDropper.count++; }
    }
    contextDropper.top = new Image();
    contextDropper.top.src = require('./icons/split_internal_up.svg');
    contextDropper.appendChild(contextDropper.top).classList.add('top');
    contextDropper.top.ondragenter = (ev) => {
        contextDropper.dropTarget = contextDropper.top;
        ev.stopPropagation();
        if (draggingTab) { contextDropper.count++; }
    }
    contextDropper.bottom = new Image();
    contextDropper.bottom.src = require('./icons/split_internal_down.svg');
    contextDropper.appendChild(contextDropper.bottom).classList.add('bottom');
    contextDropper.bottom.ondragenter = (ev) => {
        contextDropper.dropTarget = contextDropper.bottom;
        ev.stopPropagation();
        if (draggingTab) { contextDropper.count++; }
    }
    contextDropper.count = 0;
    contextDropper.ondragenter = (ev) => {
        contextDropper.dropTarget = null;
        ev.stopPropagation();
        if (draggingTab) { contextDropper.count++; }
    }
    contextDropper.ondragleave = (ev) => {
        ev.stopPropagation();
        if (draggingTab) {
            contextDropper.count--;
            if (contextDropper.count === 0) { contextDropper.remove(); }
        }
    }
}

/**Defines options for context
 * @typedef {Object} ContextInternalOptions
 * @property {boolean|('auto')} tabs whether the context tabs are shown
 * @property {[Content]} content list of content to add to context
 * @property {boolean} dropTarget whether the context is a droptarget
 * @property {boolean} autoClose whether the context should auto close
 *
 * Defines options for context
 * @typedef {ContentBaseOptions & ContextInternalOptions} ContextOptions*/

export class Context extends Content {
    constructor() {
        super();
        /**List of all stored contents in order
         * @type {[Content]}
         * @private*/
        this.__contents = [];
        /**The currently focused content in the context
         * @type {Content}
         * @private*/
        this.__lastSelected = this.__focused = null;
        /**Container for tabs
         * @type {HTMLDivElement}
         * @private */
        this.__tabs = null;
        /**List of tabs for content
         * @type {[Tab]}
         * @private */
        this.__tabsList = [];
        /**Wether the tabs are shown or not
         * @type {boolean}
         * @private */
        this.__tabsShown = true;
        /**Mode for tab showing, 0 = manual, 1 = auto
         * @type {number}
         * @private */
        this.__tabMode = 0;
        /**The currently focused content in the context
         * @type {Tab}
         * @private*/
        this.__focusedTab = null;
        /**Whether content can be dropped in this context
         * @type {boolean}
         * @private*/
        this.__dropTarget = false;
        /**Whether context is closed when all content are removed
         * @type {boolean}
         * @private*/
        this.__autoClose = false;

        this.ondragenter = (ev) => {
            ev.stopPropagation();
            if (draggingTab) {
                contextDropper.count = 0;
                if (this.__dropTarget) {
                    contextDropper.classList.remove('groups', 'center');
                    if (this.___container instanceof ContextContainer) {
                        if (this.__contents.includes(draggingTab.__content)) {
                            if (this.__contents.length > 1) {
                                this.appendChild(contextDropper);
                                contextDropper.classList.add('groups');
                            }
                        } else {
                            this.appendChild(contextDropper);
                            contextDropper.classList.add('center');
                            if (this.__contents.length > 0) {
                                this.appendChild(contextDropper);
                                contextDropper.classList.add('groups');
                            }
                        }
                    } else {
                        if (!this.__contents.includes(draggingTab.__content)) {
                            this.appendChild(contextDropper);
                            contextDropper.classList.add('center');
                        }
                    }
                }
            }
        }

        this.ondrop = (ev) => {
            ev.stopPropagation();
            if (draggingTab) {
                switch (contextDropper.dropTarget) {
                    case contextDropper.center: {
                        this.addContent(draggingTab.__content);
                        this.__focusContent(draggingTab.__content);
                        break;
                    }
                    case contextDropper.left: { this.___container.__split(this, ContextContainerSplitWay.LEFT, draggingTab.__content); break; }
                    case contextDropper.right: { this.___container.__split(this, ContextContainerSplitWay.RIGHT, draggingTab.__content); break; }
                    case contextDropper.top: { this.___container.__split(this, ContextContainerSplitWay.UP, draggingTab.__content); break; }
                    case contextDropper.bottom: { this.___container.__split(this, ContextContainerSplitWay.DOWN, draggingTab.__content); break; }
                }
            }
        }
        this.classList.add('contentContainer');
        let tabsContainer = this.appendChild(document.createElement('div'));
        tabsContainer.appendChild(this.__tabs = document.createElement('div')).classList.add('tabs');
        this.__tabs.ondragenter = (ev) => {
            ev.stopPropagation();
        }
        this.__tabs.ondragleave = (ev) => {
            ev.stopPropagation();
        }
        this.__tabs.onwheel = (e) => {
            tabsContainer.scrollBy(e.deltaY, 0);
        };
    }

    /** Builds context
     * @param {ContextOptions} options*/
    options(options) {
        super.options(options);
        if (typeof options.tabs !== 'undefined') {
            this.tabs = options.tabs;
        } else {
            this.tabs = true;
        }
        if (typeof options.dropTarget !== 'undefined') {
            this.dropTarget = options.dropTarget;
        }
        if (typeof options.autoClose !== 'undefined') {
            this.autoClose = options.autoClose;
        } else {
            this.autoClose = true;
        }
        if (options.content instanceof Array) {
            for (var i = 0, m = options.content.length; i < m; i++) {
                this.addContent(options.content[i]);
            }
            options.content[i - 1].select();
        }
    }

    /**Creates an instance of the content
     * @param {ContextOptions} options
     * @returns {Context}*/
    static create(options) {}

    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-context'; }

    /**This selects the content in its parent, if the content is already selected, it will
     * @param {boolean} passive if true, selection does not focus*/
    select() {
        if (this.__focused instanceof Content) {
            if (this.__focused != selectedContent) {
                this.__focused.select();
            }
        } else {
            this.dispatchE(ContentEventTypes.FOCUSED);
        }
    }

    /**Content Handling
     * @param {Content} content the content to add
     * @param {number} index the tab index to insert the content at
     * @returns {Content} input content*/
    addContent(content, index) {
        if (content instanceof Content) {
            if (content.isClosed) {
                console.warn('Content is closed');
                return;
            }
            index = (typeof index != 'undefined' ? Math.min(Math.max(index, 0), this.__contents.length) : this.__contents.length);
            //Prevents content from moving to the same position
            if (content.container === this) {
                let oldIndex = this.__contents.indexOf(content);
                let tab = this.__tabsList[oldIndex];
                this.__tabs.insertBefore(tab, this.__tabsList[index]);
                this.__contents.splice(oldIndex, 1);
                this.__contents.splice(index, 0, content);
                this.__tabsList.splice(oldIndex, 1);
                this.__tabsList.splice(index, 0, tab);
            } else {
                content.remove();
                content.container = this;
                this.__contents.splice(index, 0, content);
                let tab = Tab.create({ context: this, content: content });
                this.__tabs.insertBefore(tab, this.__tabsList[index]);
                this.__tabsList.splice(index, 0, tab);
                if (this.__tabMode == 1 && this.__contents.length == 2) {
                    this.__toggleTabs = true;
                }
                tab.__focusListener = content.addEListener(ContentEventTypes.FOCUSED, (e) => {
                    this.__focusContent(e.target);
                });
                tab.__removedListener = content.addEListener(ContentEventTypes.REMOVED, (e) => {
                    this.__removeContent(e.target);
                });
                if (this.__focused === null) {
                    this.__focusContent(content);
                }
            }
            return content;
        } else { console.warn('None content added to context'); }
        return content;
    }

    /**Removes content from context and selects last selected content in context
     * @param {Content} content content to remove
     * @private */
    __removeContent(content) {
        let index = this.__contents.indexOf(content);
        if (index != -1) {
            this.__contents.splice(index, 1);
            let tab = this.__tabsList.splice(index, 1)[0];
            tab.__remove();
            content.removeEListener(ContentEventTypes.FOCUSED, tab.__focusListener);
            content.removeEListener(ContentEventTypes.REMOVED, tab.__removedListener);
            this.__tabs.removeChild(tab);
            if (this.__focused == content) {
                this.__unFocusContent(this.__focused);
                this.__focused = null;
                if (this.__contents.length > 0) {
                    if (this.__lastSelected) {
                        var selectee = this.__lastSelected;
                    } else {
                        if ((this.__contents.length / 2) < index) {
                            var selectee = this.__contents[index - 1];
                        } else {
                            var selectee = this.__contents[index];
                        }
                    }
                    this.__focusContent(selectee);
                    this.__lastSelected = null;
                }
            }
            if (this.__lastSelected == content) { this.__lastSelected = null; }
            if (this.__tabMode == 1 && this.__contents.length == 1) { this.__toggleTabs = false; }
            if (this.__contents.length === 0 && this.__autoClose) { this.remove(); }
            return content;
        } else { console.warn('Content not in context'); }
    }

    /**This focuses the content in the context if there are multiple
     * @param {Content} content
     * @private*/
    __focusContent(content) {
        if (content != this.__focused) {
            let index = this.__contents.indexOf(content)
            if (index != -1) {
                if (this.__focused instanceof Content) {
                    this.__unFocusContent(this.__focused);
                    this.__lastSelected = this.__focused;
                    this.replaceChild(content, this.__focused);
                } else {
                    this.appendChild(content);
                }
                this.__focused = content;
                /**Stores listener for content name change
                 * @type {()}
                 * @private */
                this.__nameListener = content.addEListener(ContentEventTypes.NAME, (e) => {
                    this.dispatchE(ContentEventTypes.NAME, e);
                });
                /**Stores listener for content symbol change
                 * @type {()}
                 * @private */
                this.__symbolListener = content.addEListener(ContentEventTypes.SYMBOL, (e) => {
                    this.dispatchE(ContentEventTypes.SYMBOL, e);
                });
                /**Stores listener for content symbol change
                 * @type {()}
                 * @private */
                this.__sizeListener = content.addEListener(ContentEventTypes.MINSIZE, (e) => {
                    this.dispatchE(ContentEventTypes.MINSIZE, new E({ width: e.data.width, height: e.data.height + tabsHeight }));
                });
                this.dispatchE(ContentEventTypes.MINSIZE, new E(this.__focused.minSize));
                if (this.__focusedTab) { this.__focusedTab.selected = false; }
                this.__focusedTab = this.__tabsList[index];
                this.__focusedTab.selected = true;
                this.__focusedTab.scrollIntoView()
            }
        }
        this.dispatchE(ContentEventTypes.FOCUSED);
    }

    /**This focuses the content in the context if there are multiple
     * @param {Content} content
     * @private*/
    __unFocusContent(content) {
        this.__focused.removeEListener(ContentEventTypes.NAME, this.__nameListener);
        this.__focused.removeEListener(ContentEventTypes.SYMBOL, this.__symbolListener);
        this.__focused.removeEListener(ContentEventTypes.MINSIZE, this.__sizeListener);
    }

    /**Disabled for context
     * @param {ContentMinSize} min*/
    set minSize(min) {}

    /**Returns the minimum size of the content
     * @returns {ContentMinSize}*/
    get minSize() {
        if (this.__focused instanceof Content) {
            let minSize = this.__focused.minSize;
            return { width: minSize.width, height: minSize.height + tabsHeight };
        } else {
            return { width: remToPx(12), height: remToPx(12) };
        }
    }

    /**Returns the short name of the content
     * @returns {string}*/
    get name() {
        if (this.__focused instanceof Content) {
            return this.__focused.name;
        }
    }

    /**Returns the symbol for the content
     * @returns {SVGElement} */
    get symbol() {
        if (this.__focused instanceof Content) {
            return this.__focused.symbol;
        }
    }

    /**This returns a copy of all contents in the context
     * @returns {[Content]}*/
    get content() {
        return [...this.__contents];
    }

    /**On close event for handling when the content should be closed, overwrite if content should do anything on closing
     * @returns {string} if closing content is not accepted, return anything truthy*/
    async onClose() {
        let content = this.content;
        let failed = [];
        for (let i = 0, n = content.length; i < n; i++) {
            try {
                let res = await content[i].close();
                if (res) { failed.push(res); }
            } catch (e) { console.warn('Failed while closing contents'); }
        }
        if (failed) { return failed; }
    }

    /**This turns on and off the tabs of the context
     * @param {boolean|string} tabs*/
    set tabs(tabs) {
        if (tabs == 'auto') {
            this.__tabMode = 1;
            this.__toggleTabs = this.__contents.length > 1;
        } else {
            this.__tabMode = 0;
            this.__toggleTabs = Boolean(tabs);
        }
    }
    /**Returns wether the tabs are shown or not
     * @returns {boolean} tabs*/
    get tabs() { return this.__tabsShown }

    /**Internal property for toggeling tabs
     * @param {boolean} tabs
     * @private*/
    set __toggleTabs(tabs) {
        if (tabs && !this.__tabsShown) {
            this.__tabs.parentElement.classList.remove('h');
            this.__tabsShown = true;
        } else if (!tabs && this.__tabsShown) {
            this.__tabs.parentElement.classList.add('h');
            this.__tabsShown = false;
        }
    }

    /**Toggles whether content can be dropped in this context
     * @param {boolean} drop*/
    set dropTarget(drop) {
        this.__dropTarget = Boolean(drop);
    }

    /**Toggles whether the context closes itself when becoming empty
     * @param {boolean} ac*/
    set autoClose(ac) {
        this.__autoClose = Boolean(ac);
    }

    /**Returns the amount of contents in the context
     * @returns {number}*/
    get amountContent() { return this.__contents.length; }

    /**Returns the content in focus
     * @returns {Content} */
    get focused() { return this.__focused; }

    /**Pops content into new window
     * @param {Content} content
     * @private */
    __popContent(content) {
        let index = this.__contents.indexOf(content)
        if (index != -1) {
            let box = this.getBoundingClientRect();
            content.remove();
            let wind = require('./windows').uiWindow({ width: box.width, height: box.height, content: contextContainer({ contents: [content], autoClose: true }) });
            this.ownerDocument.windowManager.appendWindow(wind);
        }
    }
}
initWebComponentWithOptions(Context);
export let context = Context.create;


//#####################################################################################################################################################################################
//#     _____            _            _      _____            _        _                    ###########################################################################################
//#    / ____|          | |          | |    / ____|          | |      (_)                   ###########################################################################################
//#   | |     ___  _ __ | |_ _____  _| |_  | |     ___  _ __ | |_ __ _ _ _ __   ___ _ __    ###########################################################################################
//#   | |    / _ \| '_ \| __/ _ \ \/ / __| | |    / _ \| '_ \| __/ _` | | '_ \ / _ \ '__|   ###########################################################################################
//#   | |___| (_) | | | | ||  __/>  <| |_  | |___| (_) | | | | || (_| | | | | |  __/ |      ###########################################################################################
//#    \_____\___/|_| |_|\__\___/_/\_\\__|  \_____\___/|_| |_|\__\__,_|_|_| |_|\___|_|      ###########################################################################################
//#####################################################################################################################################################################################
/**Defines options for button component
 * @typedef {Object} ContextContainerInternalOptions
 * @property {Context} context default context to use as primary context
 * @property {boolean} dontFill set true to not create default context
 * @property {boolean} autoClose whether the contextcontainer should auto close
 * @property {[Content]} contents contents to add to the container
 *
 * Defines options for button component
 * @typedef {ContentBaseOptions & ContextContainerInternalOptions} ContextContainerOptions*/

/**
 * @enum {number}*/
export let ContextContainerSplitWay = { UP: 0, DOWN: 1, RIGHT: 2, LEFT: 3 }

/**
 * @enum {number}*/
export let ContextContainerContentWay = { HORZ: 0, VERT: 1 }

export class ContextContainer extends Content {
    constructor() {
        super();
        /**The context or container in focus
         * @type {Context|ContextContainer}
         * @private */
        this.__focusedContext = null;
        /**Whether the container is horizontal or vertical
         * @type {ContextContainerContentWay}
         * @private */
        this.__way = null;
        /**List of all contexts in the container
         * @type {[Content]} 
         * @private*/
        this.__contexts = [];
        /**List of listeners for removal
         * @type {[()]} 
         * @private*/
        this.__removedListeners = [];
        /**List of listeners for focus
         * @type {[()]} 
         * @private*/
        this.__focusListeners = [];
        /**List of listeners for minimum sizes
         * @type {[()]} 
         * @private*/
        this.__sizeListeners = [];
        /**List of buffers for minimum sizes
         * @type {[number]} 
         * @private*/
        this.__minSizeBuffer = { width: 0, height: 0 };
        /**List of all contexts in the container
         * @type {[HTMLElement]} 
         * @private*/
        this.__deviders = [];
        /**Whether context is closed when all content are removed
         * @type {boolean}
         * @private*/
        this.__autoClose = false;
    }

    /** Builds context
     * @param {ContextContainerOptions} options*/
    options(options) {
        super.options(options);
        if (typeof options.autoClose !== 'undefined') { this.autoClose = options.autoClose; }
        if (!options.dontFill) {
            let contaxt = this.appendChild(options.context || context({ dropTarget: true, autoClose: true }))
            this.__addContext(0, contaxt);
        }
        if (options.contents instanceof Array) {
            for (let i = 0, n = options.contents.length - 1; i <= n; i++) {
                this.addContent(options.contents[i])
            }
        }
    }

    /**Creates an instance of the content
     * @param {ContextContainerOptions} options
     * @returns {ContextContainer}*/
    static create(options) {}

    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-contextcontainer'; }

    /**Sets the orientation of the context container
     * @param {boolean} way */
    set way(way) {
        this.classList.remove('vert', 'horz')
        this.classList.add((way ? 'vert' : 'horz'))
        this.__way = way;
    }

    /**Returns the short name of the content
     * @returns {string}*/
    get name() {
        if (this.__focusedContext instanceof Context || this.__focusedContext instanceof ContextContainer) {
            return this.__focusedContext.name;
        }
    }

    /**Returns the symbol for the content
     * @returns {SVGElement} */
    get symbol() {
        if (this.__focusedContext instanceof Context || this.__focusedContext instanceof ContextContainer) {
            return this.__focusedContext.symbol;
        }
    }

    /**Toggles whether the context closes itself when becoming empty
     * @param {boolean} ac*/
    set autoClose(ac) {
        this.__autoClose = Boolean(ac);
    }

    /**This selects the content in its parent, if the content is already selected, it will
     * @param {boolean} passive if true, selection does not focus*/
    select() {
        if (this.__focusedContext instanceof Context || this.__focusedContext instanceof ContextContainer) {
            if (this.__focusedContext != selectedContent) {
                this.__focusedContext.select();
            }
        } else {
            this.dispatchE(ContentEventTypes.FOCUSED);
        }
    }

    /**Creates a devider element
     * @returns {HTMLElement}
     * @private */
    __createDevider() {
        let devider = document.createElement('ui-contextcontainerdevider');
        let deviderChild = devider.appendChild(document.createElement('div'));
        //Sizer function
        deviderChild.onpointerdown = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            let indax = this.__deviders.indexOf(devider);
            let contaxts = this.__contexts[indax];
            let contaxts2 = this.__contexts[indax + 1];
            let contextMin = contaxts.minSize;
            let context2Min = contaxts2.minSize;
            let box1 = contaxts.getBoundingClientRect();
            let box2 = contaxts2.getBoundingClientRect();
            let minPos = (this.__way ? box1.top + contextMin.height + 0.5 : box1.left + contextMin.width + 0.5)
            let maxPos = (this.__way ? box2.bottom - context2Min.height - 0.5 : box2.right - context2Min.width - 0.5)
            let basis = (this.__way ? box2.bottom - box1.top : box2.right - box1.left);
            let perc = (this.__way ? parseFloat(contaxts.style.height) + parseFloat(contaxts2.style.height) : parseFloat(contaxts.style.width) + parseFloat(contaxts2.style.width));
            deviderChild.setPointerCapture(ev.pointerId);
            deviderChild.onpointermove = (this.__way ? (eve) => {
                let y = eve.clientY;
                if (y < minPos) {
                    y = minPos;
                } else if (y > maxPos) {
                    y = maxPos;
                }
                let newPerc = perc * (y - box1.top) / basis;
                contaxts.style.height = newPerc + '%';
                contaxts2.style.height = (perc - newPerc) + '%';
            } : (eve) => {
                let x = eve.clientX;
                if (x < minPos) {
                    x = minPos;
                } else if (x > maxPos) {
                    x = maxPos;
                }
                let newPerc = perc * (x - box1.left) / basis;
                contaxts.style.width = newPerc + '%';
                contaxts2.style.width = (perc - newPerc) + '%';
            })
            deviderChild.onpointerup = () => {
                deviderChild.releasePointerCapture(ev.pointerId);
                deviderChild.onpointermove = null;
            }
        }
        return devider;
    }

    /**Disabled for context container
     * @param {ContentMinSize} min*/
    set minSize(min) {}

    /**Returns the minimum size of the context container
     * @returns {ContentMinSize}*/
    get minSize() {
        return this.__minSizeBuffer || { width: remToPx(12), height: remToPx(12) };
    }

    /**Calculates the minimum size of the context container
     * @private*/
    __minSize() {
        if (this.__way) {
            this.__minSizeBuffer = { width: 0, height: -1 }
        } else {
            this.__minSizeBuffer = { width: -1, height: 0 }
        }
        for (let i = 0; i < this.__contexts.length; i++) {
            let minSize = this.__contexts[i].minSize;
            if (this.__way) {
                if (minSize.width > this.__minSizeBuffer.width) {
                    this.__minSizeBuffer.width = minSize.width;
                }
                this.__minSizeBuffer.height += minSize.height + 1;
            } else {
                if (minSize.height > this.__minSizeBuffer.height) {
                    this.__minSizeBuffer.height = minSize.height;
                }
                this.__minSizeBuffer.width += minSize.width + 1;
            }
        }
    }

    /**Adds the given context to the internal context list at a given position
     * @param {number} index
     * @param {Context|ContextContainer} contaxt
     * @private */
    __addContextToList(index, contaxt) {
        contaxt.container = this;
        this.__contexts.splice(index, 0, contaxt);
        this.__removedListeners.splice(index, 0, contaxt.addEListener(ContentEventTypes.REMOVED, () => {
            this.__removeContext(this.__contexts.indexOf(contaxt));
        }));
        this.__focusListeners.splice(index, 0, contaxt.addEListener(ContentEventTypes.FOCUSED, (ev) => {
            this.__focusContext(ev.target);
        }));
        this.__sizeListeners.splice(index, 0, contaxt.addEListener(ContentEventTypes.MINSIZE, (ev) => {
            this.__minSize();
            this.dispatchE(ContentEventTypes.MINSIZE, new E(this.__minSizeBuffer));
        }));
        this.__minSize();
    }

    /**Adds the given context to the container at a given position
     * @param {number} index
     * @param {Context|ContextContainer} contaxt
     * @returns {Context|ContextContainer}
     * @private */
    __addContext(index, overwrite = context({ dropTarget: true, autoClose: true })) {
        if (this.__contexts.length > 0) {
            let devider = this.__createDevider();
            if (index == this.__contexts.length) {
                this.appendChild(devider);
            } else {
                this.insertBefore(devider, this.__contexts[index]);
            }
            this.__deviders.splice(index, 0, devider);
        } else {
            this.__focusContext(overwrite);
        }
        if (index == this.__contexts.length) {
            this.appendChild(overwrite);
        } else {
            this.insertBefore(overwrite, this.__deviders[index]);
        }
        this.__addContextToList(index, overwrite);
        return overwrite;
    }

    /**This focuses the context in the container
     * @param {Context|ContextContainer} contaxt
     * @private*/
    __focusContext(contaxt) {
        if (contaxt !== this.__focusedContext) {
            if (this.__focusedContext instanceof Context || this.__focusedContext instanceof ContextContainer) {
                this.__unFocusContext(this.__focusedContext);
            }
            this.__focusedContext = contaxt;
            /**Stores listener for content name change
             * @type {()}
             * @private */
            this.__nameListener = contaxt.addEListener(ContentEventTypes.NAME, (e) => {
                this.dispatchE(ContentEventTypes.NAME, e);
            });
            /**Stores listener for content symbol change
             * @type {()}
             * @private */
            this.__symbolListener = contaxt.addEListener(ContentEventTypes.SYMBOL, (e) => {
                this.dispatchE(ContentEventTypes.SYMBOL, e);
            });
        }
        this.dispatchE(ContentEventTypes.FOCUSED);
    }

    /**This focuses the context in the container
     * @param {Context|ContextContainer} contaxt
     * @private*/
    __unFocusContext(contaxt) {
        contaxt.removeEListener(ContentEventTypes.NAME, this.__nameListener);
        contaxt.removeEListener(ContentEventTypes.SYMBOL, this.__symbolListener);
    }

    /**Removes the given context from the internal context list
     * @param {number} index
     * @private */
    __removeContextFromList(index) {
        let child = this.__contexts[index];
        child.container = undefined;
        child.removeEListener(ContentEventTypes.REMOVED, this.__removedListeners[index]);
        this.__removedListeners.splice(index, 1);
        child.removeEListener(ContentEventTypes.FOCUSED, this.__focusListeners[index]);
        this.__focusListeners.splice(index, 1);
        child.removeEListener(ContentEventTypes.MINSIZE, this.__sizeListeners[index]);
        this.__sizeListeners.splice(index, 1);
        this.__contexts.splice(index, 1);
        this.__minSize();
        child.style.width = '';
        child.style.height = '';
    }

    /**Removes the given context from the container
     * @param {number} index
     * @param {Context|ContextContainer} contaxt
     * @returns {Context|ContextContainer}
     * @private */
    __removeContext(index, dontCollapse) {
        let child = this.__contexts[index];
        if (this.contains(child)) { this.removeChild(child); }
        if (this.__contexts.length > 1) {
            if (index == this.__contexts.length - 1) {
                this.removeChild(this.__deviders[index - 1]);
                this.__deviders.splice(index - 1, 1);
            } else {
                this.removeChild(this.__deviders[index]);
                this.__deviders.splice(index, 1);
            }
        }
        this.__removeContextFromList(index);
        if (this.__contexts.length === 1 && !dontCollapse) { this.__collapse(this.__contexts[0]); }
        if (this.__focusedContext === child) {
            this.__unFocusContext(this.__focusedContext);
            this.__focusedContext = null;
            if (this.__contexts.length > 0) {
                if ((this.__contexts.length / 2) < index) {
                    var selectee = this.__contexts[index - 1];
                } else {
                    var selectee = this.__contexts[index];
                }
                this.__focusContext(selectee);
            }
        }
        if (this.__contexts.length === 0 && this.__autoClose) {
            this.remove();
        }
        return child;
    }

    /**Replaces a context in the container
     * @param {number} index
     * @param {Context|ContextContainer} contaxt
     * @private */
    __replaceContext(index, contaxt) {
        this.replaceChild(contaxt, this.__contexts[index]);
        this.__removeContextFromList(index);
        this.__addContextToList(index, contaxt);
    }

    /**Splits the context, if the split is the same way, the new context is added to the container
     * otherwhise a new container is created and nested
     * @param {Context} contaxt
     * @param {boolean} way
     * @param {Content} cont
     * @private */
    __split(contaxt, way, cont) {
        if (contaxt instanceof Context) {
            let index = this.__contexts.indexOf(contaxt);
            if (index != -1) {
                let contway = [1, 1, 0, 0][way];
                if (this.__contexts.length === 1) { this.way = contway; }
                if (contway === this.__way) {
                    if (way == ContextContainerSplitWay.UP || way == ContextContainerSplitWay.LEFT) {
                        var newGroup = this.__addContext(index);
                    } else {
                        var newGroup = this.__addContext(index + 1);
                    }
                } else {
                    let containerGroup = contextContainer({ container: this, dontFill: true });
                    this.__replaceContext(index, containerGroup);
                    containerGroup.__addContext(0, contaxt);
                    var newGroup = containerGroup.__split(containerGroup.__contexts[0], way);
                }
                if (cont instanceof Content && newGroup) {
                    newGroup.addContent(cont);
                }
                this.__calculateSizes();
                return newGroup;
            } else { console.warn('Context not in container'); }
        } else { console.warn('None context passed'); }
    }

    /**This collapses the container into it's parent container
     * @param {Context} contaxt
     * @private*/
    __collapse(contaxt) {
        let container = this.container;
        let index = this.__contexts.indexOf(contaxt);
        if (index != -1) {
            if (container instanceof ContextContainer) {
                this.__removeContextFromList(index);
                if (contaxt instanceof Context) {
                    container.__replaceContext(container.__indexOfContext(this), contaxt);
                    contaxt.dispatchE(ContentEventTypes.FOCUSED);
                } else if (contaxt instanceof ContextContainer) {
                    let indax = container.__indexOfContext(this);
                    if (contaxt.__way === container.__way) {
                        for (var i = 0, n = contaxt.__children.length; i < n; i++) {
                            container.__addContext(indax + i, contaxt.__removeContext(0, true));
                        }
                        container.__removeContext(indax + i, true)
                    } else {
                        container.__replaceContext(indax, contaxt);
                    }
                } else { console.warn('None context passed'); }
                container.__calculateSizes();
            } else if (container instanceof require('./windows').UIWindow || container instanceof ContentContainer) {
                this.__removeContextFromList(index);
                this.__unFocusContext(contaxt);
                container.content = contaxt;
                contaxt.dispatchE(ContentEventTypes.FOCUSED);
            }
        } else { console.warn('Context not in container'); }
    }

    /**Returns the index of a context
     * @param {Context} contaxt
     * @returns {number}
     * @private*/
    __indexOfContext(context) {
        return this.__contexts.indexOf(context);
    }

    /**This calculates the sizes of all the contexts in the container
     * @private*/
    __calculateSizes() {
        let sizes = [];
        let totalMinSize = 0;
        for (let i = 0; i < this.__contexts.length; i++) {
            let minSize = this.__contexts[i].minSize;
            if (this.__way) {
                totalMinSize += minSize.height;
                sizes[i] = minSize.height;
            } else {
                totalMinSize += minSize.width;
                sizes[i] = minSize.width;
            }
        }
        for (let i = 0; i < this.__contexts.length; i++) {
            if (this.__way) {
                this.__contexts[i].style.height = sizes[i] / totalMinSize * 100 + '%';
                this.__contexts[i].style.width = '';
            } else {
                this.__contexts[i].style.width = sizes[i] / totalMinSize * 100 + '%';
                this.__contexts[i].style.height = '';
            }
        }
    }

    /**Content Handling
     * @param {Content} content the content to add
     * @param {number} index the tab index to insert the content at
     * @returns {Content} input content*/
    addContent(content, index) {
        return this.__focusedContext.addContent(content, index);
    }
}
initWebComponentWithOptions(ContextContainer);
export let contextContainer = ContextContainer.create;



//#####################################################################################################################################################################################
//#    _______    _            ########################################################################################################################################################
//#   |__   __|  | |           ########################################################################################################################################################
//#      | | __ _| |__  ___    ########################################################################################################################################################
//#      | |/ _` | '_ \/ __|   ########################################################################################################################################################
//#      | | (_| | |_) \__ \   ########################################################################################################################################################
//#      |_|\__,_|_.__/|___/   ########################################################################################################################################################
//#####################################################################################################################################################################################

let tabDropper = document.createElement('ui-tabdropper'); {
    tabDropper.right = tabDropper.appendChild(document.createElement('div'));
    tabDropper.left = tabDropper.appendChild(document.createElement('div'));
}

let draggingTab = null;

/**Tab class for context
 * @private */
class Tab extends WebComponent {
    constructor(options) {
        super();
        /**The context the tab is a part of
         * @type {Context}
         * @private*/
        this.__context = null;
        /**The content the tab refers to
         * @type {Content}
         * @private*/
        this.__content = null;

        /** @param {PointerEvent} ev*/
        this.onpointerdown = (ev) => {
            ev.stopPropagation();
            if (ev.pointerType === 'touch') {
                this.draggable = false;
            } else {
                this.draggable = true;
            }
            this.__content.select();
        }

        let flip = 0;
        this.ondragover = (ev) => {
            ev.stopPropagation();
            if (draggingTab) {
                if (this.__context.__dropTarget) {
                    ev.preventDefault();
                    if (flip !== 1 && ev.clientX >= half) {
                        tabDropper.left.classList.add('hover');
                        tabDropper.right.classList.remove('hover');
                        flip = 1;
                    }
                    if (flip !== 2 && ev.clientX < half) {
                        tabDropper.right.classList.add('hover');
                        tabDropper.left.classList.remove('hover');
                        flip = 2;
                    }
                }
            }
        }

        this.ondragstart = () => { draggingTab = this; }

        this.ondragend = () => {
            draggingTab = null;
            tabDropper.remove();
            contextDropper.remove();
        }
        let count = 0;
        let half = null;

        this.ondragenter = (ev) => {
            ev.stopPropagation();
            if (draggingTab && draggingTab !== this) {
                if (count === 0) {
                    this.appendChild(tabDropper);
                    tabDropper.right.classList.remove('hover');
                    tabDropper.left.classList.remove('hover');
                    flip = 0;
                    let box = this.getBoundingClientRect();
                    half = box.left + box.width / 2;
                }
                count++;
            }
        }

        this.ondragleave = (ev) => {
            ev.stopPropagation();
            if (draggingTab && draggingTab !== this) {
                count--;
                if (count === 0) {
                    try { this.removeChild(tabDropper); } catch (e) {}
                }
            }
        }

        this.ondrop = (ev) => {
            ev.stopPropagation();
            count = 0;
            if (draggingTab && draggingTab !== this) {
                let index = this.__context.__tabsList.indexOf(this);
                if (ev.clientX >= half) {
                    this.__context.addContent(draggingTab.__content, index + 1);
                } else {
                    this.__context.addContent(draggingTab.__content, index);
                }
            }
        }

        attachContextMenu(this, () => {
            let res = [
                { text: 'Popout', func: () => { this.__context.__popContent(this.__content); } },
                { text: 'Close', func: () => { this.__content.close() } },
            ];
            if (this.__context.___container instanceof ContextContainer && this.__context.amountContent > 1) {
                res.push(0, { text: 'Split Up', func: () => { this.__context.parentElement.__split(this.__context, ContextContainerSplitWay.UP, this.__content) } }, { text: 'Split Left', func: () => { this.__context.parentElement.__split(this.__context, ContextContainerSplitWay.LEFT, this.__content) } }, { text: 'Split Down', func: () => { this.__context.parentElement.__split(this.__context, ContextContainerSplitWay.DOWN, this.__content) } }, { text: 'Split Right', func: () => { this.__context.parentElement.__split(this.__context, ContextContainerSplitWay.RIGHT, this.__content) } }, )
            }
            return res;
        });

        /**Container for content symbol
         * @type {HTMLDivElement}
         * @private */
        this.__symbol = this.appendChild(document.createElement('div'));

        /**Container for content name
         * @type {HTMLDivElement}
         * @private */
        this.__name = this.appendChild(document.createElement('div'));
        this.__name.classList.add('name');

        /**Stores closing button
         * @type {SVGElement}
         * @private */
        this.__close = close()
        this.appendChild(this.__close);
        this.__close.classList.add('close')
        this.__close.onpointerdown = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        this.__close.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.__content.close();
        };

        this.addEventListener('focusin', (e) => { e.stopPropagation(); });
        this.ondblclick = () => { this.__context.__popContent(this.__content); };
        this.onkeydown = this.__keyDown;

        this.__content = options.content;
        this.__context = options.context;

        /**Stores listener for content closing
         * @type {()}
         * @private */
        this.__closingListener = this.__content.addEListener(ContentEventTypes.CLOSING,
            (e) => {
                if (e.data.closing) {
                    this.__close.classList.remove('waiting');
                    this.draggable = true;
                } else {
                    this.__close.classList.add('waiting');
                    this.draggable = false;
                }
            });

        /**Stores listener for content name change
         * @type {()}
         * @private */
        this.__nameListener = this.__content.addEListener(ContentEventTypes.NAME,
            (e) => {
                this.__name.innerHTML = e.data.name;
            });
        this.__nameListener(new E({ name: this.__content.name }));

        /**Stores listener for content symbol change
         * @type {()}
         * @private */
        this.__symbolListener = this.__content.addEListener(ContentEventTypes.SYMBOL,
            (e) => {
                if (typeof e.data.symFunc != 'function') { return; }
                let sym = e.data.symFunc();
                if (sym instanceof SVGElement) {
                    this.replaceChild(sym, this.__symbol);
                    this.__symbol = sym;
                } else {
                    sym = document.createElement('div');
                    this.replaceChild(sym, this.__symbol);
                    this.__symbol = sym;
                }
            });
        this.__symbolListener(new E({ symFunc: this.__content.symbol }));

        /**Stores listener for content closeable
         * @type {()}
         * @private */
        this.__closeableListener = this.__content.addEListener(ContentEventTypes.CLOSEABLE,
            (e) => {
                if (e.data.closeable) {
                    this.__close.classList.remove('h')
                } else {
                    this.__close.classList.add('h')
                }
            });
        this.__closeableListener(new E({ closeable: this.__content.closeable }));
    }

    /**Creates an instance of the content
     * @param {Object} options
     * @param {Content} options.content
     * @param {Context} options.context
     * @returns {Tab}*/
    static create(options) {}

    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-tab'; }

    /**Tells the tab to clean up its listeners
     * @private*/
    __remove() {
        this.__content.removeEListener(ContentEventTypes.CLOSING, this.__closingListener);
        this.__content.removeEListener(ContentEventTypes.NAME, this.__nameListener);
        this.__content.removeEListener(ContentEventTypes.SYMBOL, this.__symbolListener);
        this.__content.removeEListener(ContentEventTypes.CLOSEABLE, this.__closeableListener);
    }

    /**This changes the symbol of the tab
     * @param {boolean} selected */
    set selected(selected) { if (selected) { this.setAttribute('selected', true); } else { this.removeAttribute('selected'); } }
    /**Handler for keyboard events
     * @param {KeyboardEvent} e
     * @private */
    __keyDown(e) {
        switch (e.key) {
            case 'Enter': { this.__content.select(); break; }
            case 'ArrowLeft': { if (this.previousSibling) { this.previousSibling.focus(); } break; }
            case 'ArrowRight': { if (this.nextSibling) { this.nextSibling.focus(); } break; }
        }
    }
}
initWebComponent(Tab);