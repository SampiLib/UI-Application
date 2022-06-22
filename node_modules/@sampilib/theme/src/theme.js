import { Value } from "@sampilib/value"

export let theme = new Value('');
theme.addListener((value) => { changeTheme(value) });
//Loading saved theme from local storage
(async () => {
    await new Promise((a) => a());
    if ('theme' in localStorage) {
        theme.set = localStorage.theme;
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { theme.set = 'night'; } else { theme.set = 'day'; }
    }
})();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { theme.set = (e.matches ? 'night' : 'day'); });

/**This changes the theme variables in the document root element
 * if a theme doesn't contain a value for a specific variable, it falls back on the day theme*/
function changeTheme(theme) {
    if (theme in themes) {
        themeCurIndex = themeList.indexOf(theme);
        localStorage.theme = theme;
        if (theme != themes.day) { curTheme = { ...themes.day, ...themes[theme] }; }
        applyTheme(document);
    } else {
        console.warn('Invalid theme selected');
    }
}

let curTheme = {};
/**This applies the current theme to a document */
export let applyTheme = (docu) => {
    let style = docu.documentElement.style;
    for (let key in curTheme) {
        style.setProperty('--' + key, curTheme[key]);
    }
}

//Text list of theme names
let themeList = ['day', 'night'];
//Buffer for array index of theme in use
let themeCurIndex = 0;
//Storage of themes
export let themes = {
    day: {},
    night: {},
};

if (!('customThemes' in localStorage)) {
    localStorage.customThemes = JSON.stringify({});
}

/**This toggles the theme of the ui
 * If the input is undefined it will simply rotate between the themes
 * If the input is an index it will change to that index in the theme array
 * If the input is a key value it will change the colors to the template specified
 * @param {string|null|undefined|number} themeTog name of theme*/
export let toggleTheme = (themeTog) => {
    if (themeTog === undefined || themeTog === null) {
        let themeIndex = themeCurIndex + 1;
        if (themeIndex >= themeList.length) { themeIndex = 0; }
        theme.set = themeList[themeIndex];
    } else if (typeof themeTog === 'number') {
        Math.min(Math.max(themeTog, 0), themeList.length);
        theme.set = themeList[themeTog];
    } else if (typeof themeTog === 'string') {
        if (themeTog in themes) { theme.set = themeTog; }
    }
}

/**This lets one add an variable to the theme engine
 * variable are added to the document root CSS ass --variables
 * @param {string} name name of variable
 * @param {[string]} group group of variable, used for editing
 * @param {string} defaultDay default value in day mode
 * @param {string} defaultNight defult value in night mode*/
export let addThemeVariable = (name, group, defaultDay, defaultNight) => {
    if (typeof name == 'string') {
        if (typeof defaultDay == 'string') {
            if (typeof defaultNight == 'string') {
                if (!(name in themes.day)) {
                    themes.day[name] = defaultDay;
                    themes.night[name] = defaultNight;
                }
            } else { console.warn('None string passed as night variable'); }
        } else { console.warn('None string passed as day variable'); }
    } else { console.warn('None string passed as name'); }
}

//Custom themes are retrieved from localstorage
let storThemes = JSON.parse(localStorage.customThemes);
let customKeys = Object.keys(storThemes);
for (let i = 0, m = customKeys.length; i < m; i++) {
    if (!(customKeys[i] in themes)) { themes[customKeys[i]] = {} };
    let cusTheKeys = Object.keys(storThemes[customKeys[i]]);
    for (let y = 0, m = cusTheKeys.length; y < m; y++) {
        if (cusTheKeys[y] in themes.day) {
            themes[customKeys[i]][cusTheKeys[y]] = storThemes[customKeys[i]][cusTheKeys[y]];
        }
    }
}