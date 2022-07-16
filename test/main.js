import "./main.scss";
import { context } from "../index.js";
import { mainWindowManager, uiWindow } from "../src/ui/windows";

import { contextMenuTest } from "./uiTests/contextMenu.test";
import { uiTest } from "./uiTests/ui.test";

(async () => {
    await {};


    let rootContext = window.rootContext = document.body.appendChild(context({ tabs: true }));
})()