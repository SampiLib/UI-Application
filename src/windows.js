import './windows.scss'
import '../styling/common';
import { animations, applyAnimation, applyScale, applyTouch, remToPx, scale, touch } from "./common"
import { attachContextMenu } from './contextMenu';
import { Content, selectedContent, ContentEventTypes } from './content';
import { attachSimpleEventHandler, E } from '../common/events';
import { close, drag_handle_horz, drag_handle_vert } from '@sampilib/icons';
import { initWebComponentWithOptions, WebComponent, WebComponentSide } from '../common/webComponent';
import { addThemeVariable } from '@sampilib/theme';
import { grey, orange } from '@sampilib/colors';

addThemeVariable('windowTitleColor', ['UI', 'Window'], grey['500'], grey['600']);
addThemeVariable('windowTitleTextColor', ['UI', 'Window'], grey['900'], grey['300']);
addThemeVariable('windowTitleIconColor', ['UI', 'Window'], grey['900'], grey['300']);
addThemeVariable('windowCornerRadius', ['UI', 'Window'], '0.4rem', '0.4rem');
addThemeVariable('windowShadowColor', ['UI', 'Window'], grey['900'], grey['800']);
addThemeVariable('windowFocusColor', ['UI', 'Window'], orange['900'], orange['600']);
addThemeVariable('windowSizerColor', ['UI', 'Window'], grey['300'], grey['700']);

//Limits for window position in rems (how much is left of the window when it cannot be moved further)
let topWindowLimit = 0;
let bottomWindowLimit = 0;
let leftWindowLimit = 0;
let rightWindowLimit = 0;

//Listener for ui scale to recalculate window min sizes
let titleHeight = remToPx(2);
touch.addListener((val) => {
    titleHeight = remToPx((val ? 2.5 : 2));
});
scale.addListener((val) => {
    titleHeight = remToPx((touch.get ? 2.5 : 2));
    topWindowLimit = remToPx(0);
    bottomWindowLimit = remToPx(3);
    leftWindowLimit = remToPx(4);
    rightWindowLimit = remToPx(3);
});


/**
 * 
 * @param {Element} elem
 * @param {WebComponentSide} elementSide
 * @param {WebComponentSide} windowSide
 * @param {WebComponentSide} alignment
 * @returns {{windowLeft:number,windowTop:number,windowRight:number,windowBottom:number}} 
 */
export let elementToWindowPosition = (elem, elementSide, windowSide, alignment) => {
    let box = elem.getBoundingClientRect();
    switch (elementSide) {
        case WebComponentSide.LEFT: {
            switch (windowSide) {
                case WebComponentSide.LEFT: {
                    switch (alignment) {
                        case WebComponentSide.TOP: { return { windowLeft: box.left, windowTop: box.top }; }
                        case WebComponentSide.BOTTOM: { return { windowLeft: box.left, windowBottom: window.innerHeight - box.bottom }; }
                    }
                }
                case WebComponentSide.RIGHT: {
                    switch (alignment) {
                        case WebComponentSide.TOP: { return { windowRight: window.innerWidth - box.left, windowTop: box.top }; }
                        case WebComponentSide.BOTTOM: { return { windowRight: window.innerWidth - box.left, windowBottom: window.innerHeight - box.bottom }; }
                    }
                }
            }
        }
        case WebComponentSide.TOP: {
            switch (windowSide) {
                case WebComponentSide.TOP: {
                    switch (alignment) {
                        case WebComponentSide.LEFT: { return { windowLeft: box.left, windowTop: box.top }; }
                        case WebComponentSide.RIGHT: { return { windowRight: window.innerWidth - box.right, windowTop: box.top }; }
                    }
                }
                case WebComponentSide.BOTTOM: {
                    switch (alignment) {
                        case WebComponentSide.LEFT: { return { windowLeft: box.left, windowBottom: window.innerHeight - box.top }; }
                        case WebComponentSide.RIGHT: { return { windowRight: window.innerWidth - box.right, windowBottom: window.innerHeight - box.top }; }
                    }
                }
            }
        }
        case WebComponentSide.RIGHT: {
            switch (windowSide) {
                case WebComponentSide.RIGHT: {
                    switch (alignment) {
                        case WebComponentSide.TOP: { return { windowRight: window.innerWidth - box.right, windowTop: box.top }; }
                        case WebComponentSide.BOTTOM: { return { windowRight: window.innerWidth - box.right, windowBottom: window.innerHeight - box.bottom }; }
                    }
                }
                case WebComponentSide.LEFT: {
                    switch (alignment) {
                        case WebComponentSide.TOP: { return { windowLeft: box.right, windowTop: box.top }; }
                        case WebComponentSide.BOTTOM: { return { windowLeft: box.right, windowBottom: window.innerHeight - box.bottom }; }
                    }
                }
            }
        }
        case WebComponentSide.BOTTOM: {
            switch (windowSide) {
                case WebComponentSide.BOTTOM: {
                    switch (alignment) {
                        case WebComponentSide.LEFT: { return { windowLeft: box.left, windowBottom: window.innerHeight - box.bottom }; }
                        case WebComponentSide.RIGHT: { return { windowRight: window.innerWidth - box.right, windowBottom: window.innerHeight - box.bottom }; }
                    }
                }
                case WebComponentSide.TOP: {
                    switch (alignment) {
                        case WebComponentSide.LEFT: { return { windowLeft: box.left, windowTop: box.bottom }; }
                        case WebComponentSide.RIGHT: { return { windowRight: window.innerWidth - box.right, windowTop: box.bottom }; }
                    }
                }
            }
        }
    }
}

/** Available snaps for windows
 * @enum {number}*/
export let Snaps = { BACK: 0, FULL: 1, TOP: 2, BOTTOM: 3, LEFT: 4, RIGHT: 5, TOPLEFT: 6, TOPRIGHT: 7, BOTTOMLEFT: 8, BOTTOMRIGHT: 9, };

/**All event types available for content
 * @enum {string} */
export let WindowEventTypes = {
    MOVED: 'moved',
    RESIZED: 'resized',
}
let WindowEventTypesItterable = Object.values(WindowEventTypes);

/**Defines size type
 * @typedef {number|('%')} WindowSizeType
 * @typedef {number|('center'|'%')} WindowPosType
 * 
 * Defines base options for creating window
 * @typedef {Object} WindowBaseOptions
 * @property {number} layer
 * @property {boolean} sizeable
 * @property {boolean} showContent
 * @property {boolean} title
 * @property {string} titleText
 * @property {boolean} closeable
 * @property {boolean} moveable
 * @property {('fixed'|'')} position
 * @property {Snaps} snap
 * @property {boolean} hide
 * @property {boolean} autoHide
 * @property {boolean} autoClose
 * @property {boolean} modal
 * @property {boolean} tabs
 * @property {boolean} dropTarget
 * @property {Content} content
 * @property {WindowSizeType} width
 * @property {WindowSizeType} height
 * @property {WindowSizeType} minWidth
 * @property {WindowSizeType} minHeight
 * @property {WindowSizeType} maxWidth
 * @property {WindowSizeType} maxHeight
 * @property {WindowPosType} left
 * @property {WindowPosType} top
 * @property {WindowSizeType} right
 * @property {WindowSizeType} bottom
 * @property {number} windowLeft
 * @property {number} windowTop
 * @property {number} windowRight
 * @property {number} windowBottom 
 * */

//##################################################
//#   __          ___           _                  #
//#   \ \        / (_)         | |                 #
//#    \ \  /\  / / _ _ __   __| | _____      __   #
//#     \ \/  \/ / | | '_ \ / _` |/ _ \ \ /\ / /   #
//#      \  /\  /  | | | | | (_| | (_) \ V  V /    #
//#       \/  \/   |_|_| |_|\__,_|\___/ \_/\_/     #
//##################################################
let windowMinWidth = 160;
let windowMinHeight = 160;

export class UIWindow extends WebComponent {
    constructor() {
        super();
        this.initEHandler(WindowEventTypesItterable);
        /**Wether the windows is closeable
         * @type {boolean}
         * @private*/
        this.__closeable = true;
        /**Wether the windows is moveable
         * @type {boolean}
         * @private*/
        this.__moveable = true;
        /**Wether the windows is hidden
         * @type {boolean}
         * @private*/
        this.__hidden = false;
        /**Wether the window will auto hide
         * @type {boolean}
         * @private*/
        this.__autoHide = false;
        /**Wether the window is modal
         * @type {boolean}
         * @private*/
        this.__modal = false;
        /**Wether the window will auto close
         * @type {boolean}
         * @private*/
        this.__autoClose = false;
        /**Wether the window has content shown
         * @type {boolean}
         * @private*/
        this.__contentShown = true;
        /**How manu featues are using the full screen background
         * @type {number}
         * @private*/
        this.__backgroundUsers = 0;
        /**The parent of the window, the window will send certain events to the parent
         * @type {WindowManager}
         * @private*/
        this.__parent = null;
        /**Which layer the window is part of
         * @type {number}
         * @private*/
        this.__layer = 0;
        /**Initializing position variables
         * @type {number}
         * @private*/
        this.__top = this.__bottom = this.__left = this.__right = false;
        /**Initializing center variables
         * @type {number}
         * @private*/
        this.__xCenter = this.__yCenter = true;
        /**Internal buffer of minimum size
         * @type {number}
         * @private*/
        this.__minWidthBuff = 200;
        /**Internal buffer of minimum height
         * @type {number}
         * @private*/
        this.__minHeightBuff = 200;
        /**Container for content, made for css reasons
         * @type {HTMLDivElement}
         * @private*/
        this.__contentContainer = document.createElement('div')
        this.appendChild(this.__contentContainer).classList.add('contentContainer');

        /** Makes windows selectable */
        this.tabIndex = -1;

        /**Temp content stand in
         * @type {HTMLDivElement}
         * @private*/
        this.__content = document.createElement('div')
        this.__contentContainer.appendChild(this.__content);

        this.onkeydown = (ev) => {
            ev.stopPropagation();
            if (this.__content instanceof Content) {
                this.__content.__keyboard(ev);
            }
        }

        /**Container for window title
         * @type {HTMLDivElement}
         * @private*/
        this.__title = document.createElement('div');
        this.__title.classList.add('title');
        this.onpointerdown = (e) => {
            e.stopPropagation()
            this.select();
        };
        this.__title.ondblclick = () => {
            if (this.__snapped) {
                this.snap(Snaps.BACK);
            } else {
                this.snap(Snaps.FULL);
            }
        };
        attachContextMenu(this.__title, [
            { text: 'Popout', func: () => this.popOut() }, { text: 'Close', func: () => this.close() },
            1,
            {
                text: 'Snap',
                subMenu: [
                    { text: 'Fullscreen', func: () => { this.snap(Snaps.FULL); } },
                    { text: 'Restore', func: () => { this.snap(Snaps.BACK); } },
                    { text: 'Left', func: () => { this.snap(Snaps.LEFT); } },
                    { text: 'Right', func: () => { this.snap(Snaps.RIGHT); } },
                    { text: 'Top', func: () => { this.snap(Snaps.TOP); } },
                    { text: 'Bottom', func: () => { this.snap(Snaps.BOTTOM); } },
                    { text: 'Top Left', func: () => { this.snap(Snaps.TOPLEFT); } },
                    { text: 'Top Right', func: () => { this.snap(Snaps.TOPRIGHT); } },
                    { text: 'Bottom Left', func: () => { this.snap(Snaps.BOTTOMLEFT); } },
                    { text: 'Bottom Right', func: () => { this.snap(Snaps.BOTTOMRIGHT); } },
                ]
            }
        ]);
        /**Container for content symbol
         * @type {HTMLDivElement}
         * @private*/
        this.__symbol = document.createElement('div')
        this.__title.appendChild(this.__symbol);
        /**Container for window title text
         * @type {HTMLDivElement}
         * @private*/
        this.__text = document.createElement('div')
        this.__title.appendChild(this.__text).classList.add('text');
        /**Closer button
         * @type {SVGElement}
         * @private*/
        this.__closer = close();
        this.__title.appendChild(this.__closer);
        this.__closer.classList.add('closer');
        this.__closer.onpointerdown = (e) => {
            e.stopPropagation();
        };
        this.__closer.ondblclick = (e) => {
            e.stopPropagation();
        };
        this.__closer.onclick = (e) => {
            e.stopPropagation();
            this.close();
        };
    }

    /**Options toggeler
     * @param {WindowBaseOptions} options*/
    options(options) {
        if (options.content instanceof Content) { this.content = options.content; }
        if (typeof options.layer === 'number') { this.__layer = parseInt(options.layer); }
        if (typeof options.sizeable !== 'undefined') { this.sizeable = options.sizeable; } else { this.sizeable = true; }
        if (typeof options.title === 'boolean') { this.title = options.title; } else { this.title = true; }
        if (typeof options.titleText === 'string') { this.titleText = options.titleText; }
        if (typeof options.closeable === 'boolean') { this.closeable = options.closeable; }
        if (typeof options.moveable === 'boolean') { this.moveable = options.moveable; } else { this.moveable = true; }
        if (typeof options.position === 'string') { this.position = options.position; }
        if (typeof options.snap === 'number') { this.snap(options.snap); }
        if (typeof options.hide === 'boolean') { this.hide = options.hide; }

        if (typeof options.autoHide === 'boolean') { this.autoHide = options.autoHide; }
        if (typeof options.autoClose === 'boolean') { this.autoClose = options.autoClose; }
        if (typeof options.modal === 'boolean') { this.modal = options.modal; }

        if (typeof options.showContent === 'boolean') {
            this.showContent = options.showContent;
        } else {
            if (typeof options.height !== 'undefined') { this.height = options.height; } else { this.height = 0; }
            if (typeof options.minHeight !== 'undefined') { this.minHeight = options.minHeight; }
            if (typeof options.maxHeight !== 'undefined') { this.maxHeight = options.maxHeight; }
        }
        if (typeof options.width !== 'undefined') { this.width = options.width; } else { this.width = 0; }
        if (typeof options.minWidth !== 'undefined') { this.minWidth = options.minWidth; }
        if (typeof options.maxWidth !== 'undefined') { this.maxWidth = options.maxWidth; }

        if (this.isConnected) {
            if (typeof options.windowLeft !== 'undefined') {
                /**
                 * @type {number}
                 * @private*/
                this.windowLeft = options.windowLeft
            } else if (typeof options.left !== 'undefined') {
                /**
                 * @type {WindowPosType}
                 * @private*/
                this.left = options.left;
            }
            if (typeof options.windowRight !== 'undefined') {
                /**
                 * @type {number}
                 * @private*/
                this.windowRight = options.windowRight
            } else if (typeof options.right !== 'undefined') {
                /**
                 * @type {WindowSizeType}
                 * @private*/
                this.right = options.right;
            }
            if (typeof options.windowTop !== 'undefined') {
                /**
                 * @type {number}
                 * @private*/
                this.windowTop = options.windowTop
            } else if (typeof options.top !== 'undefined') {
                /**
                 * @type {WindowPosType}
                 * @private*/
                this.top = options.top;
            }
            if (typeof options.windowBottom !== 'undefined') {
                /**
                 * @type {number}
                 * @private*/
                this.windowBottom = options.windowBottom
            } else if (typeof options.bottom !== 'undefined') {
                /**
                 * @type {WindowSizeType}
                 * @private*/
                this.bottom = options.bottom;
            }
        } else {
            if (typeof options.windowLeft !== 'undefined') {
                /**
                 * @type {number}
                 * @private*/
                this.____windowLeft = options.windowLeft
            } else if (typeof 'left' in options !== 'undefined') {
                /**
                 * @type {WindowPosType}
                 * @private*/
                this.____left = options.left;
            }
            if (typeof options.windowRight !== 'undefined') {
                /**
                 * @type {number}
                 * @private*/
                this.____windowRight = options.windowRight
            } else if (typeof options.right !== 'undefined') {
                /**
                 * @type {WindowSizeType}
                 * @private*/
                this.____right = options.right;
            }
            if (typeof options.windowTop !== 'undefined') {
                /**
                 * @type {number}
                 * @private*/
                this.____windowTop = options.windowTop
            } else if (typeof options.top !== 'undefined') {
                /**
                 * @type {WindowPosType}
                 * @private*/
                this.____top = options.top;
            }
            if (typeof options.windowBottom !== 'undefined') {
                /**
                 * @type {number}
                 * @private*/
                this.____windowBottom = options.windowBottom
            } else if (typeof options.bottom !== 'undefined') {
                /**
                 * @type {WindowSizeType}
                 * @private*/
                this.____bottom = options.bottom;
            }
        }
    }

    /**Creates an instance of the window
     * @param {WindowBaseOptions} options
     * @returns {UIWindow}*/
    static create(options) {}

    /**Returns name of web component
     * @returns {string}*/
    static get elementName() { return 'ui-window'; }

    connectedCallback() {
        if ('____windowLeft' in this) {
            this.windowLeft = this.____windowLeft
        } else if ('____left' in this) {
            this.left = this.____left;
        }
        if ('____windowRight' in this) {
            this.windowRight = this.____windowRight
        } else if ('____right' in this) {
            this.right = this.____right;
        }
        if ('____windowTop' in this) {
            this.windowTop = this.____windowTop
        } else if ('____top' in this) {
            this.top = this.____top;
        }
        if ('____windowBottom' in this) {
            this.windowBottom = this.____windowBottom
        } else if ('____bottom' in this) {
            this.bottom = this.____bottom;
        }
    }

    /**This sets the layer of the window
     * @param {number} layer*/
    set layer(layer) {
        this.__parent.changeLayer(this, layer);
    }
    /**This gets the layer of the window
     * @returns {number}*/
    get layer() {
        return this.__layer
    }

    //###################################################################
    //Title Bar
    /**This set wether the window has a title bar or not
     * @param {boolean} title */
    set title(title) {
        if (title) {
            this.insertBefore(this.__title, this.firstChild);
            this.classList.remove('titleLess');
        } else {
            if (this.__title.isConnected) { this.removeChild(this.__title); }
            this.classList.add('titleLess');
        }
    }

    /**This set the text of the title bar, use a number for special functionality
     * @param {string|number} text
     * modes are as follows, 1 = The selected content in the window*/
    set titleText(text) {
        if (typeof text == 'string') {
            delete this.__textMode;
            this.__text.innerHTML = text;
        } else if (typeof text == 'number') {
            /**Stores flag for window title text mode
             * @type {number}
             * @private*/
            this.__textMode = text;
        }
    }

    /**The symbol for the content
     * @param {SVGElement} sym */
    set symbol(sym) {
        if (sym instanceof SVGElement) {
            this.__title.replaceChild(sym, this.__symbol);
            this.__symbol = sym;
        } else {
            sym = document.createElement('div');
            this.__title.replaceChild(sym, this.__symbol);
            this.__symbol = sym;
        }
    }
    /**Returns the symbol for the content
     * @returns {SVGElement} */
    get symbol() {
        return this.__symbol;
    }

    /**This sets wether the window is closable
     * @param {boolean} close */
    set closeable(close) {
        if (close) {
            this.__closer.classList.remove('h');
        } else {
            this.__closer.classList.add('h');
        }
        this.__closeable = Boolean(close);
    }

    /**This gets wether the window is closable
     * @returns {boolean}*/
    get closeable() {
        return this.__closeable
    }

    /**This closes the window */
    async close() {
        if (this.__content instanceof Content) {
            this.__closer.classList.add('waiting');
            let res = await this.__content.close();
            if (res) {
                this.__closer.classList.remove('waiting');
                return { window: this, ...res };
            }
        } else {
            this.remove();
        }
    }

    /**This removes the window from the window manager*/
    remove() {
        return this.__parent.removeWindow(this)
    }

    /**Gets the container of the content
     * @returns {HTMLElement} */
    get topContainer() {
        return this;
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
                this.__content.removeEListener(ContentEventTypes.NAME, this.__nameListener);
                this.__content.removeEListener(ContentEventTypes.SYMBOL, this.__symbolListener);
                this.__content.removeEListener(ContentEventTypes.FOCUSED, this.__selectListener);
                this.__content.removeEListener(ContentEventTypes.MINSIZE, this.__sizeListener);
            }
            cont.container = this;
            this.__contentContainer.replaceChild(cont, this.__content);
            this.__content = cont;
            /**Stores listener for content removal
             * @type {()}
             * @private*/
            this.__removedListener = cont.addEListener(ContentEventTypes.REMOVED, (e) => {
                this.__removeContent(e.target);
            });
            /**Stores listener for content name change
             * @type {()}
             * @private*/
            this.__nameListener = cont.addEListener(ContentEventTypes.NAME, (e) => { this.titleText = e.data.name; });
            this.__nameListener(new E({ name: cont.name }));
            /**Stores listener for content symbol change
             * @type {()}
             * @private*/
            this.__symbolListener = cont.addEListener(ContentEventTypes.SYMBOL, (e) => {
                if (typeof e.data.symFunc !== 'function') { this.symbol = null; return; }
                this.symbol = e.data.symFunc();
            });
            this.__symbolListener(new E({ symFunc: cont.symbol }));
            /**Stores listener for content selection
             * @type {()}
             * @private*/
            this.__selectListener = cont.addEListener(ContentEventTypes.FOCUSED, () => {
                this.focus()
                this.__nameListener(new E({ name: cont.name }));
                this.__symbolListener(new E({ symFunc: cont.symbol }));
            });
            /**Stores listeners for minimum
             * @type {()}
             * @private*/
            this.__sizeListener = cont.addEListener(ContentEventTypes.MINSIZE, (e) => {
                this.__minWidthBuff = e.data.width;
                this.__minHeightBuff = e.data.height;
                this.__updateSize();
            });
            this.__sizeListener(new E(cont.minSize));
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
        content.removeEListener(ContentEventTypes.NAME, this.__nameListener);
        content.removeEListener(ContentEventTypes.SYMBOL, this.__symbolListener);
        content.removeEListener(ContentEventTypes.FOCUSED, this.__selectListener);
        this.remove();
    }

    /**Selects the window*/
    select() {
        if (activeWindow != this) {
            if (this.__content instanceof Content && this.__contentShown) {
                if (this.__content != selectedContent) {
                    this.__content.select();
                }
            } else {
                this.focus();
                super.focus();
            }
        }
    }

    /**Focuses the window*/
    focus() {
        if (activeWindow != this) {
            this.__parent.focusWindow(this);
        }
    }

    /**This sets how the content is displayed
     * @param {boolean} cont false = content not shown, true content shown*/
    set showContent(cont) {
        if (cont) {
            this.__content.classList.remove('h');
            this.classList.remove('contentLess');
        } else {
            this.__content.classList.add('h');
            this.classList.add('contentLess');
            this.style.height = 'min-content';
        }
        this.__contentShown = Boolean(cont);
    }
    /**This returns if the content is displayed
     * @returns {boolean} false = content not shown, true content shown*/
    get showContent() { return this.__contentShown; }

    /**Sets if the window is hidden
     * @param {boolean} hide*/
    set hide(hide) {
        if (hide) { this.classList.add('h'); } else {
            this.classList.remove('h');
            this.focus()
        }
        this.__hidden = Boolean(hide);
    }
    /**Gets if the window is hidden
     * @returns {boolean} */
    get hide() { return this.__hidden; }

    /**Sets if the window automatically hides when clicked outside
     * @param {boolean} hide*/
    set autoHide(hide) {
        if (hide && !this.__autoHide) {
            /**Pointer event for auto hiding when clicking background
             * @type {(e:PointerEvent)}
             * @private*/
            this.__autoHideListener = (e) => {
                if (!e.path.includes(this)) {
                    this.hide = true;
                }
            }
            document.documentElement.addEventListener('pointerdown', this.__autoHideListener, { capture: true });
            this.captureFocus = true;
        } else if (!hide && this.__autoHide) {
            document.documentElement.removeEventListener('pointerdown', this.__autoHideListener, { capture: true });
            if (!this.__modal && !this.__autoClose) {
                this.captureFocus = false;
            }
        }
        this.__autoHide = Boolean(hide);
    }
    /**Gets if the window automatically hides when clicked outside
     * @returns {boolean}*/
    get autoHide() { return this.__autoHide; }

    /**This sets if the window is modal
     * @param {boolean} modal */
    set modal(modal) {
        if (modal && !this.__modal) {
            /**Container for dimmed background
             * @type {HTMLDivElement}
             * @private*/
            this.__background = document.createElement('div');
            this.__background.classList.add('background');
            this.__background.onpointerdown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.__autoClose) {
                    this.close();
                } else if (this.__autoHide) {
                    this.hide = true;
                }
            };
            this.__background.ontouchstart = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };
            this.appendChild(this.__background);
            this.captureFocus = true;
        } else if (!modal && this.__modal) {
            this.__background.remove();
            if (!this.__autoClose && !this.__autoHide) {
                this.captureFocus = false;
            }
        }
        this.__modal = Boolean(modal);
    }
    /**This gets if the window is modal
     * @returns {boolean} */
    get modal() {
        return this.__modal
    }

    /**This sets up an autocloser for the window, when pressing outside the window
     * @param {boolean} ac */
    set autoClose(ac) {
        if (ac && !this.__autoClose) {
            /**Pointer event for auto closing when clicking background
             * @type {(e:PointerEvent)}
             * @private*/
            this.__autoCloseListener = (e) => {
                if (!e.path.includes(this)) {
                    this.close();
                }
            }
            document.documentElement.addEventListener('pointerdown', this.__autoCloseListener, { capture: true });
            this.captureFocus = true;
        } else if (!ac && this.__autoClose) {
            document.documentElement.removeEventListener('pointerdown', this.__autoCloseListener, { capture: true });
            if (!this.modal && !this.autoHide) {
                this.captureFocus = false;
            }
        }
        this.__autoClose = Boolean(ac);
    }
    /**Gets if an autocloser for the window, when pressing outside the window
     * @returns {boolean} */
    get autoClose() { return this.__autoClose }

    /**This toggles if the window captures focus*/
    set captureFocus(cf) {
        if (cf && !this.__focusCaptureIn) {
            /**Defines element to capture tabbing in window
             * @type {HTMLDivElement}
             * @private*/
            this.__focusCaptureIn = this.insertBefore(document.createElement('div'), this.firstChild);
            this.__focusCaptureIn.tabIndex = 0;
            /**Defines element to capture tabbing in window
             * @type {HTMLDivElement}
             * @private*/
            this.__focusCaptureOut = this.appendChild(document.createElement('div'));
            this.__focusCaptureOut.tabIndex = 0;
            this.__focusCaptureOut.onfocus = () => {
                let sel = this.querySelectorAll('[tabindex]');
                if (sel.length >= 2) { sel[1].focus(); }
            }
            this.__focusCaptureIn.onfocus = () => {
                let sel = this.querySelectorAll('[tabindex]');
                if (sel.length == 0) { this.focus(); } else { sel[sel.length - 2].focus(); }
            }
        } else if (!cf && this.__focusCaptureIn) {
            this.removeChild(this.__focusCaptureIn);
            this.removeChild(this.__focusCaptureOut);
        }
    }
    get captureFocus() { return Boolean(this.__focusCaptureIn) }

    /**This method snaps the window to a predefined position
     * @param {string} snap*/
    snap(snap) {
        if (this.__sizer && this.__moveable) {
            if (snap != Snaps.BACK && !this.__snapped) {
                /**Stores position and size of window before snapping
                 * @type {{top: number, left: number, width: number, height: number}}
                 * @private*/
                this.__snapped = { top: this.top, left: this.left, width: this.width, height: this.height };
            }
            switch (snap) {
                case Snaps.FULL:
                case Snaps.TOP:
                case Snaps.LEFT:
                case Snaps.RIGHT:
                case Snaps.TOPLEFT:
                case Snaps.TOPRIGHT: { this.top = 0; break; }
                case Snaps.BOTTOM:
                case Snaps.BOTTOMLEFT:
                case Snaps.BOTTOMRIGHT: { this.top = '50%'; break; }
                case Snaps.BACK: {
                    if (!this.__snapped) { return; }
                    this.top = this.__snapped.top;
                    break;
                }
            }
            switch (snap) {
                case Snaps.FULL:
                case Snaps.TOP:
                case Snaps.BOTTOM:
                case Snaps.LEFT:
                case Snaps.TOPLEFT:
                case Snaps.BOTTOMLEFT: { this.left = 0; break; }
                case Snaps.RIGHT:
                case Snaps.TOPRIGHT:
                case Snaps.BOTTOMRIGHT: { this.left = '50%'; break; }
                case Snaps.BACK: { this.left = this.__snapped.left; break; }
            }
            switch (snap) {
                case Snaps.FULL:
                case Snaps.TOP:
                case Snaps.BOTTOM: { this.width = '100%'; break; }
                case Snaps.LEFT:
                case Snaps.RIGHT:
                case Snaps.TOPLEFT:
                case Snaps.TOPRIGHT:
                case Snaps.BOTTOMLEFT:
                case Snaps.BOTTOMRIGHT: { this.width = '50%'; break; }
                case Snaps.BACK: { this.width = this.__snapped.width; break; }
            }
            switch (snap) {
                case Snaps.FULL:
                case Snaps.LEFT:
                case Snaps.RIGHT: { this.height = '100%'; break; }
                case Snaps.TOP:
                case Snaps.BOTTOM:
                case Snaps.TOPLEFT:
                case Snaps.TOPRIGHT:
                case Snaps.BOTTOMLEFT:
                case Snaps.BOTTOMRIGHT: { this.height = '50%'; break; }
                case Snaps.BACK: {
                    this.height = this.__snapped.height;
                    delete this.__snapped;
                    break;
                }
            }
        }
    }

    //###################################################################
    //Sizing
    /**This toggles if the window is sizeable pass a string of the sided which should be resizeable
     * @param {string} size t = top, b = bottom, r = right, l = left, eg 'br' = bottom right
     * if v is included, the resize bars will be visible*/
    set sizeable(size) {
        if (this.__sizer) {
            this.removeChild(this.__sizer);
            delete this.__sizer
        };
        this.classList.remove('top', 'bottom', 'left', 'right');
        if (size === true) { size = 'tbrl'; } else if (size === false) { return; }
        /**Container for window sizer
         * @type {HTMLDivElement}
         * @private*/
        this.__sizer = document.createElement('div')
        this.appendChild(this.__sizer).classList.add('sizer');
        this.__sizer.onpointerup = (e) => {
            e.target.releasePointerCapture(e.pointerId);
            e.target.onpointermove = undefined;
            if (this.__minWidth || this.__minHeight || this.__maxWidth || this.__maxHeight) {
                if (this.__minWidth || this.__maxWidth) {
                    /**Stores the width of the window internally
                     * @type {number|boolean}
                     * @private*/
                    this.__width = false;
                }
                if (this.__minHeight || this.__maxHeight) {
                    /**Stores the height of the window internally
                     * @type {number|boolean}
                     * @private*/
                    this.__height = false;
                }
            }
            this.dispatchE(WindowEventTypes.RESIZED, new E());
        };
        //Sides
        if (size.includes('t')) {
            this.__sizer.classList.add('top');
            this.classList.add('top');
            this.__sizer.appendChild(this.__sizer.top = document.createElement('div')).classList.add('top');
            this.__sizer.top.onpointerdown = (e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                let box = { height: this.height, width: this.width };
                if (!this.__xCenter) { this.bottom = this.bottom; }
                e.currentTarget.onpointermove = (ev) => { this.height = box.height + (this.__xCenter ? (e.clientY - ev.clientY) * 2 : e.clientY - ev.clientY); };
            }
            if (size.includes('l')) {
                this.__sizer.appendChild(this.__sizer.topLeft = document.createElement('div')).className = 'topLeft';
                this.__sizer.topLeft.onpointerdown = (e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    let box = { height: this.height, width: this.width };
                    if (!this.__xCenter) { this.bottom = this.bottom; }
                    if (!this.__yCenter) { this.right = this.right; }
                    e.currentTarget.onpointermove = (ev) => {
                        this.height = box.height + (this.__xCenter ? (e.clientY - ev.clientY) * 2 : e.clientY - ev.clientY);
                        this.width = box.width + (this.__xCenter ? (e.clientX - ev.clientX) * 2 : e.clientX - ev.clientX);
                    };

                }
            }
            if (size.includes('r')) {
                this.__sizer.appendChild(this.__sizer.topRight = document.createElement('div')).className = 'topRight';
                this.__sizer.topRight.onpointerdown = (e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    let box = { height: this.height, width: this.width };
                    if (!this.__xCenter) { this.bottom = this.bottom; }
                    if (!this.__yCenter) { this.left = this.left; }
                    e.currentTarget.onpointermove = (ev) => {
                        this.height = box.height + (this.__xCenter ? (e.clientY - ev.clientY) * 2 : e.clientY - ev.clientY);
                        this.width = box.width + (this.__xCenter ? (ev.clientX - e.clientX) * 2 : ev.clientX - e.clientX);
                    };
                }
            }
        }
        if (size.includes('b')) {
            this.__sizer.classList.add('bottom');
            this.classList.add('bottom');
            this.__sizer.appendChild(this.__sizer.bottom = document.createElement('div')).className = 'bottom';
            this.__sizer.bottom.onpointerdown = (e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                let box = { height: this.height, width: this.width };
                if (!this.__xCenter) { this.top = this.top; }
                e.currentTarget.onpointermove = (ev) => { this.height = box.height + (this.__xCenter ? (ev.clientY - e.clientY) * 2 : ev.clientY - e.clientY) - 2; };
            }
            if (size.includes('l')) {
                this.__sizer.appendChild(this.__sizer.bottomLeft = document.createElement('div')).className = 'bottomLeft';
                this.__sizer.bottomLeft.onpointerdown = (e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    let box = { height: this.height, width: this.width };
                    if (!this.__xCenter) { this.top = this.top; }
                    if (!this.__yCenter) { this.right = this.right; }
                    e.currentTarget.onpointermove = (ev) => {
                        this.height = box.height + (this.__xCenter ? (ev.clientY - e.clientY) * 2 : ev.clientY - e.clientY);
                        this.width = box.width + (this.__xCenter ? (e.clientX - ev.clientX) * 2 : e.clientX - ev.clientX);
                    };
                }
            }
            if (size.includes('r')) {
                this.__sizer.appendChild(this.__sizer.bottomRight = document.createElement('div')).className = 'bottomRight';
                this.__sizer.bottomRight.onpointerdown = (e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    let box = { height: this.height, width: this.width };
                    if (!this.__xCenter) { this.top = this.top; }
                    if (!this.__yCenter) { this.left = this.left; }
                    e.currentTarget.onpointermove = (ev) => {
                        this.height = box.height + (this.__xCenter ? (ev.clientY - e.clientY) * 2 : ev.clientY - e.clientY) - 2;
                        this.width = box.width + (this.__xCenter ? (ev.clientX - e.clientX) * 2 : ev.clientX - e.clientX) - 2;
                    };
                }
            }
        }
        if (size.includes('r')) {
            this.__sizer.classList.add('right');
            this.classList.add('right');
            this.__sizer.appendChild(this.__sizer.rigth = document.createElement('div')).className = 'right';
            this.__sizer.rigth.onpointerdown = (e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                let box = { height: this.height, width: this.width };
                if (!this.__yCenter) { this.left = this.left; }
                e.currentTarget.onpointermove = (ev) => { this.width = box.width + (this.__xCenter ? (ev.clientX - e.clientX) * 2 : ev.clientX - e.clientX) - 2; };
            }
        }
        if (size.includes('l')) {
            this.__sizer.classList.add('left');
            this.classList.add('left');
            this.__sizer.appendChild(this.__sizer.left = document.createElement('div')).className = 'left';
            this.__sizer.left.onpointerdown = (e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                let box = { height: this.height, width: this.width };
                if (!this.__yCenter) { this.right = this.right; }
                e.currentTarget.onpointermove = (ev) => { this.width = box.width + (this.__xCenter ? (e.clientX - ev.clientX) * 2 : e.clientX - ev.clientX); };
            }
        }

        if (size.includes('v')) {
            this.classList.add('visible');
            if (this.__sizer.top) { this.__sizer.top.appendChild(drag_handle_horz()); }
            if (this.__sizer.bottom) { this.__sizer.bottom.appendChild(drag_handle_horz()); }
            if (this.__sizer.left) { this.__sizer.left.appendChild(drag_handle_vert()); }
            if (this.__sizer.rigth) { this.__sizer.rigth.appendChild(drag_handle_vert()); }
        } else {
            this.classList.remove('visible');
        }
    }

    /**Updates the size to fit limits
     * @private */
    __updateSize() {
        if (this.__width) {
            this.width = this.width;
        }
        if (this.__height) {
            this.height = this.height;
        }
    }

    /**This sets the x coordinate of the window (left)
     * @param {number|string} width in rem*/
    set width(width) {
        switch (typeof width) {
            case 'number':
                if (this.__width === false) {
                    this.__contentContainer.style.width = '100%'
                }
                if (width < this.__minWidthBuff) {
                    width = this.__minWidthBuff;
                }
                this.__width = width;
                this.style.width = width + 'px';
                break;
            case 'string':
                this.__width = false;
                if (width == 'content') {
                    this.style.width = 'min-content';
                    this.__contentContainer.style.width = 'min-content';
                } else if (width.includes('%')) {
                    this.style.width = parseFloat(width) + '%';
                }
                break;
        }
    }

    /**@returns {number} */
    get width() {
        return (this.__width === false ? this.getBoundingClientRect().width : this.__width);
    }

    /**This sets the y coordinate of the window (top)
     * @param {number|string} height */
    set height(height) {
        switch (typeof height) {
            case 'number':
                if (this.__height === false) {
                    this.__contentContainer.style.height = '100%'
                }
                if (height < this.__minHeightBuff + titleHeight) {
                    height = this.__minHeightBuff + titleHeight;
                }
                this.__height = height;
                this.style.height = height + 'px';
                break;
            case 'string':
                this.__height = false;
                if (height == 'content') {
                    this.style.height = 'min-content';
                    this.__contentContainer.style.height = 'min-content'
                } else if (height.includes('%')) {
                    this.style.height = parseFloat(height) + '%';
                }
                break;
        }
    }

    /**@returns {number} */
    get height() {
        return (this.__height === false ? this.getBoundingClientRect().height : this.__height);
    }

    /**This sets the x coordinate of the window (left)
     * @param {number|string} width in rem*/
    set maxWidth(width) {
        this.style.maxWidth = '';
        /**Stores if max width is active
         * @type {boolean}
         * @private*/
        this.__maxWidth = true;
        switch (typeof width) {
            case 'number': { this.style.maxWidth = width + 'px'; break; }
            case 'string': { if (width.includes('%')) { this.style.maxWidth = parseFloat(width) + '%'; } break; }
            default: { delete this.__maxWidth; }
        }
    }

    /**This sets the y coordinate of the window (top)
     * @param {number|string} height */
    set maxHeight(height) {
        this.style.maxHeight = '';
        /**Stores if max height is active
         * @type {boolean}
         * @private*/
        this.__maxHeight = true;
        switch (typeof height) {
            case 'number': { this.style.maxHeight = height + 'px'; break; }
            case 'string': { if (height.includes('%')) { this.style.maxHeight = parseFloat(height) + '%'; } break; }
            default: { delete this.__maxHeight; }
        }
    }

    /**This sets the x coordinate of the window (left)
     * @param {number|string} width in rem*/
    set minWidth(width) {
        this.style.minWidth = '';
        /**Stores if min width is active
         * @type {boolean}
         * @private*/
        this.__minWidth = true;
        switch (typeof width) {
            case 'number': { this.style.minWidth = width + 'px'; break; }
            case 'string': { if (width.includes('%')) { this.style.minWidth = parseFloat(width) + '%'; } break; }
            default: { delete this.__minWidth; }
        }
    }

    /**This sets the y coordinate of the window (top)
     * @param {number|string} height */
    set minHeight(height) {
        this.style.minHeight = '';
        /**Stores if min height is active
         * @type {boolean}
         * @private*/
        this.__minHeight = true;
        switch (typeof height) {
            case 'number': { this.style.minHeight = height + 'px'; break; }
            case 'string': { if (height.includes('%')) { this.style.minHeight = parseFloat(height) + '%'; } break; }
            default: { delete this.__minHeight; }
        }
    }

    //###################################################################
    //Movement
    /**This sets what position type the window uses
     * @param {string} pos pass 'fixed' for fixed position, and anything else for absoloute*/
    set position(pos) {
        if (pos == 'fixed') {
            /**
             * @type {boolean}
             * @private */
            this.__positionFixed = true;
            this.style.position = 'fixed';
        } else {
            this.__positionFixed = false;
            this.style.position = 'absoloute';
        }
    }

    /**This toggles if the window is moveable
     * @param {boolean} move truthy is moveable, falsy is none moveable*/
    set moveable(move) {
        if (move) {
            this.__moveable = true;
            let title = this.__title;
            title.setAttribute('moveable', 1);
            title.onpointerdown = (e) => {
                title.setAttribute('moveable', 2);
                title.setPointerCapture(e.pointerId);
                let moveBuff = {
                    winLeft: this.left,
                    winTop: this.top,
                    winRight: this.right,
                    winBottom: this.bottom
                };
                let box = this.__parent.getBoundingClientRect();
                let halfX = box.left + (box.width / 2);
                let halfY = box.top + (box.height / 2);
                title.onpointermove = (ev) => {
                    if (ev.clientX > halfX) {
                        this.right = moveBuff.winRight + e.clientX - ev.clientX;
                    } else {
                        this.left = moveBuff.winLeft + ev.clientX - e.clientX;
                    }
                    if (ev.clientY > halfY) {
                        this.bottom = moveBuff.winBottom + e.clientY - ev.clientY;
                    } else {
                        this.top = moveBuff.winTop + ev.clientY - e.clientY;
                    }
                };
            }
            title.onpointerup = (e) => {
                title.releasePointerCapture(e.pointerId);
                title.setAttribute('moveable', 1);
                title.onpointermove = undefined;
                this.dispatchE(WindowEventTypes.MOVED, new E());
            };
        } else {
            delete this.__moveable;
            this.__title.removeAttribute('moveable');
            this.__title.onpointermove = undefined;
            this.__title.onpointerdown = undefined;
            this.__title.onpointerup = undefined;
        }
    }
    /**This returns wether the window is moveable by the user
     * @returns {boolean}*/
    get moveable() {
        return this.__moveable;
    }

    /**Checks if the window is within the browsers limits, and moves back within the limits
     * @private */
    __checkLimits() {
        if (this.__left) {
            this.left = this.left;
        }
        if (this.__top) {
            this.top = this.top;
        }
    }

    /**This sets the x coordinate of the window (left)
     * @param {number|string} left */
    set left(left) {
        switch (typeof left) {
            case 'number':
                this.__xCenter = false;
                //This is the limit for the left side of the window
                if (left < -(this.width - leftWindowLimit - this.__parent.__savedLeft)) {
                    left = -(this.width - leftWindowLimit - this.__parent.__savedLeft);
                }
                let innerW = this.__parent.__savedWidth - this.__parent.__savedRight - rightWindowLimit;
                //This is the limit for the right side of the window
                if (left > innerW) {
                    left = innerW;
                }
                this.__left = left;
                this.style.left = left + 'px';
                break;
            case 'string':
                if (left == 'center') {
                    this.__left = false;
                    this.__xCenter = true;
                    this.style.left = '';
                } else if (left.includes('%')) {
                    this.__left = false;
                    this.style.left = parseFloat(left) + '%';
                }
                break;
            default: { return; }
        }
        this.style.right = '';
        this.__right = false;
    }
    /**This gets the amount of px offset from the left of the container
     * @returns {number} */
    get left() { return (this.__left === false ? this.getBoundingClientRect().left - this.__parent.__savedLeft : this.__left); }
    /**Sets left of window from Window coordinates (accounts for window manager)
     * @param {number} left */
    set windowLeft(left) {
        this.left = left - (this.__parent.__savedLeft || 0);
    }

    /**This sets the top coordinate of the window (top)
     * @param {number|string} top */
    set top(top) {
        switch (typeof top) {
            case 'number':
                this.__yCenter = false;
                //This is the limit for the top of the window
                if (top < 0) {
                    top = 0;
                }
                let innerH = this.__parent.__savedHeight - this.__parent.__savedTop - topWindowLimit;
                //This is the limit for the right side of the window
                if (top > innerH) {
                    top = innerH;
                }
                this.__top = top;
                this.style.top = top + 'px';
                break;
            case 'string':
                if (top == 'center') {
                    this.__top = false;
                    this.__yCenter = true;
                    this.style.top = '';
                } else if (top.includes('%')) {
                    this.__top = false;
                    this.style.top = parseFloat(top) + '%';
                }
                break;
            default: { return; }
        }
        this.style.bottom = '';
        this.__bottom = false;
    }
    /**This gets the amount of px offset from the top of the container
     * @returns {number} */
    get top() {
        return (this.__top === false ? this.getBoundingClientRect().top - this.__parent.__savedTop : this.__top);
    }
    /**Sets top of window from Window coordinates (accounts for window manager)
     * @param {number} top */
    set windowTop(top) {
        this.top = top - (this.__parent.__savedTop || 0);
    }

    /**This sets the x coordinate of the window (right)
     * @param {number|string} right */
    set right(right) {
        if (typeof right == 'number') {
            this.__xCenter = false;
            this.__left = false
            if (right < -(this.width - rightWindowLimit - this.__parent.__savedRight)) {
                right = -(this.width - rightWindowLimit - this.__parent.__savedRight);
            }
            let innerW = this.__parent.__savedWidth - this.__parent.__savedLeft - leftWindowLimit;
            if (right > innerW) {
                right = innerW;
            }
            this.__right = right;
            this.style.right = right + 'px';
            this.style.left = '';
        }
    }
    /**This gets the amount of px offset from the right of the container
     * @returns {number} */
    get right() {
        if (this.__right === false) {
            let box = this.getBoundingClientRect();
            return this.__parent.__savedWidth + this.__parent.__savedRight - box.right;
        } else {
            return this.__right;
        }
    }
    /**Sets right of window from Window coordinates (accounts for window manager)
     * @param {number} right */
    set windowRight(right) {
        this.right = right - (this.__parent.__savedRight || 0);
    }

    /**This sets the top coordinate of the window (bottom)
     * @param {number|string} bottom */
    set bottom(bottom) {
        if (typeof bottom == 'number') {
            //This is the limit for the top of the window
            this.__yCenter = false;
            this.__top = false
            if (bottom < -(this.height - bottomWindowLimit - this.__parent.__savedBottom)) {
                bottom = -(this.height - bottomWindowLimit - this.__parent.__savedBottom);
            }
            let innerH = this.__parent.__savedHeight + this.__parent.__savedBottom - this.height;
            if (bottom > innerH) {
                bottom = innerH;
            }
            this.__bottom = bottom;
            this.style.bottom = bottom + 'px';
            this.style.top = '';
        }
    }
    /**This gets the amount of px offset from the bottom of the container
     * @returns {number} */
    get bottom() {
        if (this.__bottom === false) {
            let box = this.getBoundingClientRect();
            return this.__parent.__savedHeight + this.__parent.__savedTop - box.bottom;
        } else {
            return this.__bottom;
        }
    }
    /**Sets bottom of window from Window coordinates (accounts for window manager)
     * @param {number} bottom */
    set windowBottom(bottom) {
        this.bottom = bottom - (this.__parent.__savedBottom || 0);
    }

    //###################################################################
    //Popout
    popOut() {
        let window = this.ownerDocument.defaultView;
        new ExternalWindow({ width: this.__width, height: this.__height, top: window.screenY + window.outerHeight - window.innerHeight + this.__top, left: window.screenX + this.__left, root: this.content })
    }

    /**This add the listener to the event handler 
     * @param {WindowEventTypes} type which event to add
     * @param {(E)=>} listener the listener function to add
     * @returns {(E)=>} */
    addEListener(type, listener) {}

    /**This removes the listener from the event handler 
     * @param {WindowEventTypes} type which event to add
     * @param {(E)=>} listener the listener function to remove
     * @returns {(E)=>} */
    removeEListener(type, listener) {}

    /**This dispatches the event
     * @param {WindowEventTypes} type which event to add
     * @param {E} event event object*/
    dispatchE(type, event) {}
}
attachSimpleEventHandler(UIWindow.prototype);
initWebComponentWithOptions(UIWindow);
export let uiWindow = UIWindow.create;

//#############################################################################################
//#   __          ___           _                 __  __                                      #
//#   \ \        / (_)         | |               |  \/  |                                     #
//#    \ \  /\  / / _ _ __   __| | _____      __ | \  / | __ _ _ __   __ _  __ _  ___ _ __    #
//#     \ \/  \/ / | | '_ \ / _` |/ _ \ \ /\ / / | |\/| |/ _` | '_ \ / _` |/ _` |/ _ \ '__|   #
//#      \  /\  /  | | | | | (_| | (_) \ V  V /  | |  | | (_| | | | | (_| | (_| |  __/ |      #
//#       \/  \/   |_|_| |_|\__,_|\___/ \_/\_/   |_|  |_|\__,_|_| |_|\__,_|\__, |\___|_|      #
//#                                                                         __/ |             #
//#                                                                        |___/              #
//#############################################################################################

/**Resize observer for window manager*/
let sizeObserver = new ResizeObserver((e) => {
    for (let i = 0, m = e.length; i < m; i++) {
        let t = e[i].target;
        t.checkLimits();
        let box = t.getBoundingClientRect();
        let owner = t.ownerDocument.defaultView;
        t.__savedTop = box.top;
        t.__savedLeft = box.left;
        t.__savedBottom = box.bottom - owner.innerHeight;
        t.__savedRight = box.right - owner.innerWidth;
        t.__savedWidth = box.width;
        t.__savedHeight = box.height;
        t.__savedBottomLimit = t.__savedHeight - remToPx(bottomWindowLimit);
    }
});

/*Windows share the z-index 10000*/
//Context for windows is setup outside document to prevent interaction
export class WindowManager extends WebComponent {
    constructor() {
        super();
        sizeObserver.observe(this);
        /**This stores the windows in the window manager
         * @type {[UIWindow]}
         * @private*/
        this.__windows = [];
        /**This stores the window in focus for this manager
         * @type {UIWindow}
         * @private*/
        this.__focusedWindow = null;
        /**This stores the layer containers
         * @type {[{container:HTMLDivElement,windows:[UIWindow]}]}
         * @private*/
        this.__layers = [];
    }

    /**Creates an instance of the window
     * @param {Object} options
     * @returns {WindowManager}*/
    static create(options) {
        if (!options) { console.warn('Parameter must be passed'); return; }
        let elem = new WindowManager();
        return elem;
    }

    /**Returns name of web component
     * @returns {string}*/
    static get elementName() { return 'ui-windowmanager'; }

    connectedCallback() {
        /**Listener for ui scale changes
         * @type {()}
         * @private*/
        this.__scaleListener = scale.addListener(() => {
            this.updateLimits();
            this.updateSizes();
        });
        /**Listener for ui touch mode
         * @type {()}
         * @private*/
        this.__touchListener = touch.addListener(() => {
            this.updateSizes();
        });
    }
    disconnectedCallback() {
        scale.removeListener(this.__scaleListener);
        touch.removeListener(this.__touchListener);
    }

    /**Updates sizes of all windows in manager*/
    checkLimits() {
        for (let i = 0; i < this.__windows.length; i++) {
            this.__windows[i].__checkLimits();
        }
    }

    /**Updates sizes of all windows in manager*/
    updateSizes() {
        for (let i = 0; i < this.__windows.length; i++) {
            this.__windows[i].__updateSize();
        }
    }

    /**Updates the buffered limits of window manager */
    updateLimits() {
        /**Stores the size of the window manger
         * @type {number}
         * @private*/
        this.__savedBottomLimit = this.__savedTop + this.__savedHeight - remToPx(bottomWindowLimit);
        /**Stores the size of the window manger
         * @type {number}
         * @private*/
        this.__savedTopLimit = remToPx(topWindowLimit);
        /**Stores the size of the window manger
         * @type {number}
         * @private*/
        this.__savedLeftLimit = remToPx(leftWindowLimit);
        /**Stores the size of the window manger
         * @type {number}
         * @private*/
        this.__savedRightLimit = remToPx(rightWindowLimit);
    }

    /**This creates a window layer
     * @param {number} layer */
    createLayer(layer) {
        if (typeof layer == 'number') {
            if (!this.__layers[layer]) {
                this.appendChild((this.__layers[layer] = { container: document.createElement('div'), windows: [] }).container).style.zIndex = layer;
            }
        } else { console.warn('None number passed'); }
    }

    /**This appends the window to the windowmanager
     * @param {UIWindow} wind window to append
     * @param {boolean} dontSelect set true to prevent automatic window selection*/
    appendWindow(wind, dontSelect) {
        if (wind instanceof UIWindow) {
            if (wind.__parent instanceof WindowManager) { wind.__parent.removeWindow(); }
            let layerNum = wind.__layer;
            if (!this.__layers[layerNum]) {
                this.createLayer(layerNum)
            }
            let layer = this.__layers[layerNum];
            wind.__parent = this;
            layer.container.appendChild(wind).style.zIndex = layer.windows.length;
            layer.windows.push(wind);
            this.__windows.push(wind);
            if (!dontSelect) {
                wind.select();
            }
            return wind;
        } else {
            console.warn('None window passed');
        }
    }
    /** Removes window from manager
     * @param {UIWindow} wind*/
    removeWindow(wind, nonPermanent) {
        if (wind instanceof UIWindow) {
            let layer = this.__layers[wind.__layer];
            let index = layer.windows.indexOf(wind);
            if (index != -1) {
                layer.windows.splice(index, 1);
                layer.container.removeChild(wind);
                if (layer.windows.length == 0) {
                    this.removeChild(layer.container);
                    this.__layers[wind.__layer] = undefined;
                }
            }
            if (!nonPermanent) {
                index = this.__windows.indexOf(wind);
                if (index != -1) { this.__windows.splice(index, 1); }
            }
            return wind;
        } else {
            console.warn('None window passed');
        }
    }

    /** Changes the layer of a window
     * @param {UIWindow} wind
     * @param {number} layer*/
    changeLayer(wind, layer) {
        if (wind instanceof UIWindow) {
            let lay = parseInt(layer);
            if (lay != NaN) {
                this.removeWindow(wind, true);
                if (!this.__layers[layer]) { this.createLayer(layer) }
                let newLayer = this.__layers[layer];
                newLayer.container.appendChild(wind);
                newLayer.windows.push(wind);
                wind.__layer = layer;
            } else { console.warn('None integer passed'); }
        } else { console.warn('None window passed'); }
    }

    /**This returns a copy of the list of all windows
     * @returns {[UIWindow]}*/
    windows() {
        return [...this.__windows]
    }

    /**This closes all windows in the manager
     * @returns {Promise<{}>} returns nothing on success*/
    async closeAllWindows() {
        let results = [];
        let failed = false;
        while (this.__windows.length > 0) {
            let res = await this.__windows[0].close();
            if (res) {
                results.push(res);
                failed = true;
                break;
            }
        }
        if (failed) {
            return {
                manager: this,
                windows: results
            }
        }
    }

    /**This selects the window
     * @param {UIWindow} wind*/
    focusWindow(wind) {
        if (wind instanceof UIWindow) {
            if (wind == this.__focusedWindow) { return; }
            let layer = this.__layers[wind.__layer];
            let index = layer.windows.indexOf(wind);
            if (index != -1) {
                layer.windows.push(...layer.windows.splice(index, 1));
                for (let i = 0, m = layer.windows.length; i < m; i++) {
                    layer.windows[i].style.zIndex = i;
                }
                this.__focusedWindow = wind;
                activeWindow = wind;
                activeWindowManager = this;
            }
        } else { console.warn('None window passed'); }
    }

    importWindow(window) {
        if (window instanceof UIWindow) {
            if (window.__manager != this) {
                window.__manager.__closeWindow(window);
                this.__openWindow(window);
            }
        } else {
            console.warn('None window passed');
        }
    }
}
customElements.define(WindowManager.elementName, WindowManager);
export let windowManager = WindowManager.create;

/**Returns the window manager of the main document
 * @returns {WindowManager} */
export let mainWindowManager = windowManager({});

/**Contains the active window manager, meaning the window manager last interacted with
 * @returns {WindowManager} */
export let activeWindowManager = mainWindowManager;

/**Returns the active window, meaning the window last interacted with
 * @returns {UIWindow} */
export let activeWindow = null;

/**Finds the window manager of the owner document for the element
 * @param {HTMLElement} elem 
 * @returns {WindowManager} */
export let getWindowManager = (elem) => { return elem.ownerDocument.windowManager; }

//Appends the main window manager to the main document
document.documentElement.appendChild(mainWindowManager);
document.windowManager = mainWindowManager;
Object.defineProperty(HTMLElement.prototype, 'windowManager', { get() { return this.ownerDocument.windowManager; } })

//#######################################################################################
//    ______      _                        _  __          ___           _               #
//   |  ____|    | |                      | | \ \        / (_)         | |              #
//   | |__  __  _| |_ ___ _ __ _ __   __ _| |  \ \  /\  / / _ _ __   __| | _____      __#
//   |  __| \ \/ / __/ _ \ '__| '_ \ / _` | |   \ \/  \/ / | | '_ \ / _` |/ _ \ \ /\ / /#
//   | |____ >  <| ||  __/ |  | | | | (_| | |    \  /\  /  | | | | | (_| | (_) \ V  V / #
//   |______/_/\_\\__\___|_|  |_| |_|\__,_|_|     \/  \/   |_|_| |_|\__,_|\___/ \_/\_/  #
//#######################################################################################

/**Stores all external windows
 * @type {[ExternalWindow]}
 */
let externalWindows = [];

//This adds a listner to close all external windows when page is closed or refreshed
window.addEventListener('beforeunload', () => {
    for (let i = 0; i < externalWindows.length; i++) {
        externalWindows[i].close();
    }
});


/**Defines options for external window
 * @typedef {Object} ExternalWindowOptions
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [left]
 * @property {number} [top]
 * @property {import('./context').ContextContainer} [root] root to append to new external window, if nothing is passed, it creates it's own
 */

export class ExternalWindow {
    /**
     * @param {ExternalWindowOptions} options 
     */
    constructor(options) {
        if (typeof options.width === 'undefined') { options.width = 200; }
        if (typeof options.height === 'undefined') { options.height = 200; }
        if (typeof options.left === 'undefined') { options.left = 20; }
        if (typeof options.top === 'undefined') { options.top = 20; }

        /**
         * @type {Window}
         * @private */
        this.__window = window.open("", "", "status=no,width=" + options.width + ",height=" + options.height + ",left=" + options.left + ",top=" + options.top);

        /**Copies all head nodes to the new window */
        let headNodes = document.head.childNodes;
        for (let i = 0, m = headNodes.length; i < m; i++) {
            if (headNodes[i] instanceof HTMLLinkElement) {
                let link = headNodes[i].cloneNode(true);
                let href = link.href;
                link.href = href;
                this.__window.document.head.appendChild(link);
            }
            if (headNodes[i] instanceof HTMLMetaElement || headNodes[i] instanceof HTMLTitleElement || headNodes[i] instanceof HTMLStyleElement) {
                this.__window.document.head.appendChild(headNodes[i].cloneNode(true));
            }
        }

        //Copy styles on root node
        for (let i = 0, m = document.documentElement.style.length; i < m; i++) {
            let prop = document.documentElement.style[i];
            this.__window.document.documentElement.style.setProperty(prop, document.documentElement.style.getPropertyValue(prop));
        }

        //Creates listners for ui events
        /**
         * @type {()}
         * @private */
        this.__scaleListener = () => { applyScale(this.__window.document); };
        scale.addListener(this.__scaleListener)();
        /**
         * @type {()}
         * @private */
        this.__touchListener = () => { applyTouch(this.__window.document); }
        touch.addListener(this.__touchListener)();
        /**
         * @type {()}
         * @private */
        this.__animationListener = () => { applyAnimation(this.__window.document); }
        animations.addListener(this.__animationListener)();
        /**
         * @type {()}
         * @private */
        this.__themeListener = () => { applyTheme(this.__window.document); }
        theme.addListener(this.__themeListener)();

        //Listener for window closing
        this.__window.onbeforeunload = () => { this.close(true); }

        this.root = require('./content').contentContainer({})
        this.__window.document.body.appendChild(this.root);
        /**Context Container is added
         * @type {import('./context').ContextContainer}*/
        if (options.root instanceof require('./content').Content) {
            this.root.content = options.root;
        }

        /**Automatic closing when last conent is removed from root
         * @type {()}
         * @private */
        this.__removedListener = this.root.addEListener(ContentEventTypes.REMOVED, () => { wind.close(); });

        /**Window Manager is created
         * @type {WindowManager}
         * @private */
        this.__windowManager = this.__window.document.windowManager = windowManager({})
        this.__window.document.documentElement.appendChild(this.__windowManager);

        //Context menu preventer
        this.__window.document.documentElement.oncontextmenu = (e) => { e.preventDefault(); };

        this.__window.document.documentElement.classList.add('external');
        externalWindows.push(this);
    }

    /**Method for closing external window
     * @param {boolean} dontClose set true to prevent calling window.close*/
    close(dontClose) {
        /**Cleanup of listeners */
        this.root.removeEListener(ContentEventTypes.REMOVED, this.__removedListener);
        scale.removeListener(this.__scaleListener);
        touch.removeListener(this.__touchListener);
        animations.removeListener(this.__animationListener);
        theme.removeListener(this.__themeListener);

        let rootWindow = uiWindow({ width: this.__window.innerWidth, height: this.__window.innerHeight + titleHeight, content: this.root.content })
        mainWindowManager.appendWindow(rootWindow);
        let windows = this.__windowManager.windows();
        for (let i = 0; i < windows.length; i++) {
            mainWindowManager.appendWindow(windows[i]);
        }
        if (!dontClose) {
            this.__window.close();
        }
    }
}