import './contextMenu.scss'
import '../styling/common';
import { hourglass_empty } from '@sampilib/icons';
import { Content, contentContainer, ContentBaseOptions } from "./content";
import { initWebComponent, initWebComponentWithOptions, WebComponent } from '../common/webComponent';
import { nameSpace } from '../common/svg';
import { attachClickListener } from '../common/elementListeners';
import { isPromise, R } from '../common/common';
import { accessNamesItterable, AccessTypes } from '../values/access';
import { addThemeVariable } from '@sampilib/theme';
import { blue, grey } from '@sampilib/colors';

addThemeVariable('contextMenuBackgroundColor', ['UI', 'Context Menu'], grey['50'], grey['900']);
addThemeVariable('contextMenuTextColor', ['UI', 'Context Menu'], grey['900'], grey['50']);
addThemeVariable('contextMenuHoverColor', ['UI', 'Context Menu'], blue['300'], blue['600']);
addThemeVariable('contextMenuHoverTextColor', ['UI', 'Context Menu'], grey['900'], grey['50']);
addThemeVariable('contextMenuDeviderColor', ['UI', 'Context Menu'], grey['600'], grey['500']);
addThemeVariable('contextMenuIconColor', ['UI', 'Context Menu'], grey['900'], grey['50']);

/**Defines options for a context menu line
 * @typedef {Object} ContextMenuLineSetup
 * @property {string} text text for the line
 * @property {SVGElement} [symbol] icon of the line
 * @property {()} func function to run for the line
 * @property {string} [shortcut] shortcut extra text to describe a shortcut
 * @property {AccessTypes} [access] access of line
 * @property {[ContextMenuLineTypes]|()=>} [subMenu] sub menu with more options, can be function returning array or just array with same rules as this array */

/**Defines the context menu line types
 * @typedef {ContextMenuLineSetup|number|Promise<ContextMenuLineSetup|number>} ContextMenuLineTypes
 * Option can be either a number or and ContextMenuLine
 * the following numbers mean
 * 0 = devider line
 */

/**Defines the context menu content type
 * @typedef {[ContextMenuLineTypes]|Promise<[ContextMenuLineTypes]>} ContextMenuLines */

/**Defines options for context menu component
 * @typedef {Object} ContextMenuInternalOptions
 * @property {ContextMenu} top default context to use as primary context
 * @property {ContextMenuLines} lines lines to put in context menu
 *
 * @typedef {ContentBaseOptions & ContextMenuInternalOptions} ContextMenuOptions*/

export class ContextMenu extends Content {
    /**Options toggeler
     * @param {ContextMenuOptions} options*/
    constructor(options) {
        super();
        super.options(options);
        this.__top = options.top || this;
        this.__sizeContainer = this.appendChild(document.createElement('div'));
        if (typeof options.lines === 'object') {
            if (isPromise(options.lines)) {
                let waiter = this.__sizeContainer.appendChild(ContextMenuWaiter.create({}));
                options.lines.then((lines) => {
                    waiter.remove();
                    this.generateContent(lines)
                });
            } else {
                this.generateContent(options.lines);
            }
        } else {
            console.warn('Context Lines must be array or promise of array');
        }
    }

    /**Creates an instance of the content
     * @param {ContextMenuOptions} options
     * @returns {ContextMenu}*/
    static create(options) {}

    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-contextmenu'; }

    /**This adds a line to the context menu
     * @param {SVGElement} symbol
     * @param {string} text
     * @param {()} func
     * @param {string} shortcut 
     * @param {AccessTypes} access */
    addLine(symbol, text, func, shortcut, access) {
        this.__sizeContainer.appendChild(ContextMenuLine.create({ symbol, text, shortText: shortcut, func, top: this.__top, par: this, access }));
    }

    /**This adds a line to the context menu
     * @param {SVGElement} symbol
     * @param {string} text
     * @param {()} func
     * @param {string} shortcut  
     * @param {AccessTypes} access */
    addSubMenu(symbol, text, sub, access) {
        this.__sizeContainer.appendChild(ContextMenuSubMenu.create({ symbol, text, sub, top: this.__top, par: this, access }));
    }

    /**This adds a devider to the context menu */
    addDevider() {
        this.__sizeContainer.appendChild(ContextMenuDevider.create({}));
    }

    /**Generates a context menu from the line types
     * @param {[ContextMenuLineTypes]} content */
    generateContent(content) {
        for (let i = 0, m = content.length; i < m; i++) {
            switch (typeof content[i]) {
                case 'function':
                    content[i] = content[i]();
                    if (isPromise(content[i])) {
                        let waiter = this.__sizeContainer.appendChild(ContextMenuWaiter.create({}));
                        content[i].then((line) => {
                            if (line.subMenu) {
                                waiter.replaceWith(ContextMenuSubMenu.create({ symbol: line.symbol, text: line.text, sub: line.subMenu, top: this.__top, par: this, access: line.access }));
                            } else {
                                waiter.replaceWith(ContextMenuLine.create({ symbol: line.symbol, text: line.text, shortText: line.shortcut, func: line.func, top: this.__top, par: this, access: line.access }));
                            }
                        });
                        break;
                    }
                    case 'object':
                        if (content[i].subMenu) {
                            this.addSubMenu(content[i].symbol, content[i].text, content[i].subMenu, content[i].access);
                        } else {
                            this.addLine(content[i].symbol, content[i].text, content[i].func, content[i].shortcut, content[i].access);
                        }
                        break;
                    case 'number':
                        if (i != m - 1) {
                            this.addDevider();
                        }
                        break;
            }
        }
        if (content.length > 0) {
            this.__sizeContainer.firstChild.focus(false, this.__sizeContainer.firstChild);
        }
    }

    /**Handler for keyboard event
     * @param {KeyboardEvent} e */
    __keyboard(e) {
        e.stopPropagation();
        let line = e.target;
        switch (e.key) {
            case 'Escape':
                this.__top.close();
                break;
            case 'Enter':
                if ('openSub' in line) {
                    if (line.open) {
                        line.open = false;
                        line.closeSub();
                    } else {
                        line.openSub();
                        line.sub.firstChild.firstChild.focus();
                        line.open = true;
                    }
                } else {
                    line.click();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (e.target instanceof ContextMenu) {
                    this.__sizeContainer.lastChild.focus(true, this.__sizeContainer.lastChild);
                } else if (e.target == e.target.parentElement.firstChild) {
                    e.target.parentElement.lastChild.focus(true, e.target.parentElement.lastChild);
                } else {
                    e.target.previousSibling.focus(true, e.target);
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (e.target instanceof ContextMenu) {
                    this.__sizeContainer.firstChild.focus(false, this.__sizeContainer.firstChild);
                } else if (e.target == e.target.parentElement.lastChild) {
                    e.target.parentElement.firstChild.focus(false, e.target.parentElement.firstChild);
                } else {
                    e.target.nextSibling.focus(false, e.target);
                }
                break;
            case 'ArrowLeft':
                if (this.parent instanceof ContextMenu) {
                    this.__par.open = false;
                    this.__par.closeSub();
                }
                break;
            case 'ArrowRight':
                if ('openSub' in line) {
                    if (line.open) {
                        line.open = false;
                        line.closeSub();
                    } else {
                        line.openSub();
                        line.sub.firstChild.firstChild.focus();
                        line.open = true;
                    }
                }
                break;
            case 'Tab':
                e.preventDefault();
                if (e.shiftKey) {
                    if (e.target instanceof ContextMenu) {
                        this.__sizeContainer.lastChild.focus(true, this.__sizeContainer.lastChild);
                    } else if (e.target == e.target.parentElement.firstChild) {
                        e.target.parentElement.lastChild.focus(true, e.target.parentElement.lastChild);
                    } else {
                        e.target.previousSibling.focus(true, e.target);
                    }
                } else {
                    if (e.target instanceof ContextMenu) {
                        this.__sizeContainer.firstChild.focus(false, this.__sizeContainer.firstChild);
                    } else if (e.target == e.target.parentElement.lastChild) {
                        e.target.parentElement.firstChild.focus(false, e.target.parentElement.firstChild);
                    } else {
                        e.target.nextSibling.focus(false, e.target);
                    }
                }
        }
    }
}
initWebComponentWithOptions(ContextMenu);

class ContextMenuWaiter extends WebComponent {
    constructor() {
        super();
        this.appendChild(hourglass_empty()).classList.add('waiting');
    }

    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-contextmenuwaiter'; }
}
initWebComponent(ContextMenuWaiter);

class ContextMenuLine extends WebComponent {
    constructor(options) {
        super();
        /**@type {ContextMenu} */
        this.setAttribute('tabindex', 0);
        this.appendChild(document.createElementNS(nameSpace, 'svg'));
        this.textNode = this.appendChild(document.createElement('div'));
        this.shortText = this.appendChild(document.createElement('div'));

        attachClickListener(this, () => {
            this.click();
        });

        this.onpointerup = (e) => {
            e.stopPropagation();
        };

        this.__top = options.top;
        this.__par = options.par;
        this.__func = options.func;
        if (options.symbol instanceof SVGElement) {
            this.replaceChild(options.symbol, this.firstChild);
        }
        if (options.text) {
            this.textNode.innerHTML = options.text;
        }
        if (options.shortText) {
            this.shortText.innerHTML = options.shortcut;
        }
        if (typeof options.access !== 'undefined') {
            this.__noSelect = options.access != AccessTypes.WRITE;
            this.classList.add(accessNamesItterable[options.access]);
        }
    }

    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-contextmenuline'; }

    /**Creates an instance of the content
     * @param {Object} options
     * @property {ContextMenu} top
     * @property {string} [text]
     * @returns {ContextMenuLine}*/
    static create(options) {}

    /**Runs the stored function for the line and closes menu */
    click() {
        try {
            this.__func();
        } catch (error) {
            console.warn('Error while running line function', error);
        }
        this.__top.close();
    }

    /**This sends the focus on to the next
     * @param {boolean} way false is next true is previous */
    focus(way, starter) {
        if (this.__noSelect) {
            if (this == starter) { return; }
            if (way) {
                if (this == this.parentElement.firstChild) {
                    this.parentElement.lastChild.focus(way);
                } else {
                    this.previousSibling.focus(way);
                }
            } else {
                if (this == this.parentElement.lastChild) {
                    this.parentElement.firstChild.focus(way);
                } else {
                    this.nextSibling.focus(way);
                }
            }
        } else {
            super.focus()
        }
    }
}
initWebComponent(ContextMenuLine);

class ContextMenuSubMenu extends ContextMenuLine {
    constructor(options) {
        super(options);
        this.shortText.innerHTML = '>';
        this.onpointerenter = (e) => {
            if (e.pointerType != 'touch') {
                this.openSub();
            }
        };
        this.onpointerleave = (e) => {
            if (e.pointerType != 'touch') { this.closeSub(); }
        };
        this.onpointerup = (e) => {
            if (e.pointerType == 'touch') {
                if (this.open) {
                    this.open = false;
                    this.closeSub();
                    this.open = true;
                } else {
                    this.openSub();
                }
            }
        };

        this.__sub = options.sub;
        if (options.symbol instanceof SVGElement) {
            this.replaceChild(options.symbol, this.firstChild);
        }
        if (options.text) {
            this.textNode.innerHTML = options.text;
        }
    }

    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-contextmenusubmenu'; }

    /**Creates an instance of the content
     * @param {Object} options
     * @returns {ContextMenuSubMenu}*/
    static create(options) {}

    /**Runs the stored function for the line and closes menu */
    click() {
        this.open = !this.open;
    }

    closeSub() {
        if (!this.open) { this.removeChild(this.___sub); }
        this.focus();
    };
    openSub() {
        if (!this.open) {
            let box = this.getBoundingClientRect();
            let win = this.ownerDocument.defaultView;
            let lines;
            if (typeof this.__sub == 'function') {
                lines = this.__sub();
            } else {
                lines = this.__sub
            }
            this.sub = ContextMenu.create({ lines, top: this.__top, parent: this.__par });
            this.___sub = this.insertBefore(contentContainer({ content: this.sub }), this.firstChild);
            this.sub.__top = this.__top;
            this.sub.__par = this;
            if (box.left + (box.width / 2) >= win.innerWidth / 2) {
                this.___sub.style['right'] = win.innerWidth - box.right + box.width + 'px';
            } else {
                this.___sub.style['left'] = box.left + box.width + 'px';
            }
            if (box.top >= win.innerHeight / 2) {
                this.___sub.style['bottom'] = win.innerHeight - box.bottom + 'px';
            } else {
                this.___sub.style['top'] = box.top + 'px';
            }
        }
    }
}
initWebComponent(ContextMenuSubMenu);

class ContextMenuDevider extends HTMLElement {
    /**Name for creation of
     * @returns {string}*/
    static get elementName() { return 'ui-contextmenudevider'; }

    /**This sends the focus on to the next
     * @param {boolean} way false is next true is previous */
    focus(way, starter) {
        if (this == starter) { return; }
        if (way) {
            if (this == this.parentElement.firstChild) {
                this.parentElement.lastChild.focus(way);
            } else {
                this.previousSibling.focus(way);
            }
        } else {
            if (this == this.parentElement.lastChild) {
                this.parentElement.firstChild.focus(way);
            } else {
                this.nextSibling.focus(way);
            }
        }
    }

    /**Creates an instance of the content
     * @param {Object} options
     * @returns {ContextMenuDevider}*/
    static create(options) {}
}
initWebComponent(ContextMenuDevider);

/**Defines the context menu content type
 * @typedef {[ContextMenuLineTypes]|Content|Promise<[ContextMenuLineTypes]|(elem:WebComponent,x:number,y:number)=>Content|[ContextMenuLineTypes]|Promise<[ContextMenuLineTypes]>} ContextSummonerContent */

/**Opens the context menu at a given position
 * @param {WebComponent} elem 
 * @param {ContextMenuLines} content 
 * @param {number} x 
 * @param {number} y */
export let summonContextMenu = (elem, content, x, y) => {
    switch (typeof content) {
        case 'function':
            content = content(elem, x, y);
            break;
        case 'object':
            break;
        default: { return new R(false, 'Invalid content value passed', true); }
    }

    if (!(content instanceof Content)) {
        if (content instanceof Array && content.length == 0) {
            return;
        }
        var cont = ContextMenu.create({ lines: content });
        if (!(cont instanceof Content)) {
            return new R(false, 'ContextMenu creation failed', true);
        }
    }

    let pos = {};
    let doc = elem.ownerDocument;
    let win = doc.defaultView;
    if (x >= win.innerWidth / 2) {
        pos.windowRight = win.innerWidth - x;
    } else {
        pos.windowLeft = x;
    }
    if (y >= win.innerHeight / 2) {
        pos.windowBottom = win.innerHeight - y;
    } else {
        pos.windowTop = y;
    }
    let wind = require('./windows').uiWindow({ sizeable: false, layer: 9999, title: false, tabs: false, autoClose: true, height: 'content', width: 'content', content: cont, ...pos });
    doc.windowManager.appendWindow(wind);
}

/**Attaches a context menu to the element, which works with right click for mouse and holding for touch
 * @param {HTMLElement} elem
 * @param {ContextMenuLines} content*/
export let attachContextMenu = (elem, content) => {
    let con = elem.__contextMenu__ = {};
    elem.addEventListener('pointerdown', (con.pointDown = (e) => {
        if (e.pointerType == 'touch') {
            elem.addEventListener('pointermove', (ev) => {
                if (ev.clientX > e.clientX + 15 || ev.clientX < e.clientX - 15 || ev.clientY > e.clientY + 15 || ev.clientY < e.clientY - 15) {
                    clearTimeout(con.timeOut);
                }
            });
            con.timeOut = setTimeout(() => {
                summonContextMenu(elem, content, e.clientX, e.clientY);
            }, 700);
        }
    }), { passive: true });
    con.pointUp = () => {
        if (con.timeOut != 0) {
            clearTimeout(con.timeOut);
        }
    }
    elem.addEventListener('pointerup', con.pointUp, { passive: true });
    elem.addEventListener('pointerleave', con.pointUp, { passive: true });
    elem.addEventListener('contextmenu', (con.standard = (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearTimeout(con.timeOut);
        summonContextMenu(elem, content, e.clientX, e.clientY);
    }));
}

/**Removes the context menu attachment to the element
 * @param {HTMLElement} elem */
export let dettachContextMenu = (elem) => {
    if ('__contextMenu__' in elem) {
        elem.removeEventListener('pointerdown', elem.__contextMenu__.pointDown);
        elem.removeEventListener('pointerup', elem.__contextMenu__.pointUp);
        elem.removeEventListener('pointerleave', elem.__contextMenu__.pointUp);
        elem.removeEventListener('contextmenu', elem.__contextMenu__.standard);
        delete elem.__contextMenu__;
    }
}