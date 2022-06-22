import "./main.scss";
import { context } from "../src/ui/context";
import { mainWindowManager, uiWindow } from "../src/ui/windows";

import { contextMenuTest } from "./uiTests/contextMenu.test";
import { uiTest } from "./uiTests/ui.test";

(async () => {
    await {};

    let sideMenuInst = sideMenu({ width: remToPx(20), minWidth: remToPx(16), maxWidth: remToPx(32) });
    mainWindowManager.appendWindow(sideMenuInst.window);

    let uiMenuInst = uiMenu({});
    let uiMenuInstWindow = uiWindow({ sizeable: false, dropTarget: false, left: remToPx(3), top: 0, layer: 99, height: 'content', width: remToPx(14), title: false, tabs: false, hide: true, autoHide: true, content: uiMenuInst });
    mainWindowManager.appendWindow(uiMenuInstWindow);
    let uiMenTest = new Value(50);
    uiMenuInst.addOption(slider({ text: 'Dallarbiils yal', value: uiMenTest }), UIMenuParts.BASIC);
    uiMenuInst.addOption(slider({ text: 'Dallarbiils yal', value: uiMenTest }), UIMenuParts.ADVANCED);

    sideMenuInst.topBar.addItem(TopBarSides.LEFT, topBarButton({ symbol: menu_open(), click: () => { sideMenuInst.toggle = null; } }));
    sideMenuInst.topBar.addItem(TopBarSides.LEFT, topBarButton({ symbol: brightness_4(), click: () => { uiMenuInstWindow.hide = !uiMenuInstWindow.hide; } }));

    window.topBarInst = document.body.appendChild(topBar({}));
    let rootContext = window.rootContext = document.body.appendChild(context({ tabs: true }));

    topBarInst.addItem(TopBarSides.LEFT, topBarButton({ text: 'Open Sidemenu, testing a longer text', click: () => { sideMenuInst.toggle = null; } }));
    topBarInst.addItem(TopBarSides.LEFT, topBarButton({ symbol: menu(), click: () => { sideMenuInst.toggle = null; } }));
    topBarInst.addItem(TopBarSides.LEFT, topBarButton({ symbol: brightness_4(), click: () => { uiMenuInstWindow.hide = !uiMenuInstWindow.hide; } }));
    let clock = topBarInst.addItem(TopBarSides.MID, topBarButton({}));
    setInterval(() => {
        clock.text = new Date().toLocaleString();
    }, 1000);
    topBarInst.addItem(TopBarSides.RIGHT, topBarButton({ symbol: svgLogo() }));


    sideMenuInst.addItem(SideBarSides.BOTTOM, button({ text: 'UI Tests', click: () => { rootContext.addContent(uiTest()) } }));
    //rootContext.addContent(uiTest());
    sideMenuInst.addItem(SideBarSides.BOTTOM, button({ text: 'UI Modal Tests', click: () => { rootContext.addContent(uiModalTest()) } }));
    //rootContext.addContent(uiModalTest());
    sideMenuInst.addItem(SideBarSides.BOTTOM, button({ text: 'Language Sysetm Tests', click: () => { rootContext.addContent(languageTest()) } }));
    //rootContext.addContent(languageTest());
    sideMenuInst.addItem(SideBarSides.BOTTOM, button({ text: 'Context Menu Tests', click: () => { rootContext.addContent(contextMenuTest()) } }));
    //rootContext.addContent(contextMenuTest());

    let sidelogo = sideMenuInst.addItem(SideBarSides.BOTTOM, svgLogo());

})()