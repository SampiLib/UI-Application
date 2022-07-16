export let icons = new class Icons {
    constructor() {
        this.categories = { $icons$: {}, $name$: 'icons' }
    }

    /**
     * @param {[string]} category 
     * @param {string} name 
     * @param {string} icon 
     * @param {number} width 
     * @param {number} height 
     * @return {()=>SVGElement} */
    registerIcon(category, name, icon, width = 24, height = 24) {
        if (name.includes('/')) {
            console.warn('Icon name must not contain /');
            return;
        }
        let path = [this.categories];
        for (let i = 0; i < category.length; i++) {
            if (!(category[i] in path[i])) {
                path[i][category[i]] = { $icons$: {}, $name$: category[i] }
            }
            path.push(path[i][category[i]]);
        }
        let div = document.createElement('div');
        div.innerHTML = '<svg class="icon" type="' + name + '" viewbox="0 0 ' + width + ' ' + height + '" width=' + width + ' height=' + height + '>' + icon + '</svg>';
        let svg = path[path.length - 1].$icons$[name] = div.firstChild;
        svg.$name$ = name;
        svg.path = path;

        return function() {
            let out = svg.cloneNode(true);
            out.$origin$ = svg;
            return out;
        };
    }

    /**
     * @param {SVGElement} icon 
     * @return {string} */
    getPathFromIcon(icon) {
        if (icon instanceof SVGElement) {
            if ('$origin$' in icon) {
                return icon.$origin$.path.reduce((p, e) => { return p + e.$name$ + '/' }, '') + icon.$origin$.$name$;
            } else {
                console.warn('Svg not part of icon system');
            }
        } else {
            console.warn('None svg passed');
        }
    }

    /**
     * @param {string} path 
     * @return {SVGElement} */
    getIconFromPath(path) {
        if (typeof path === 'string') {
            path = path.split('/');
            if (path[0] === 'icons') {
                let cat = this.categories;
                for (let i = 1; i < path.length; i++) {
                    console.log(cat);
                    if (i == path.length - 1) {
                        if (path[i] in cat.$icons$) {
                            cat = cat.$icons$[path[i]];
                        }
                    } else {
                        if (path[i] in cat) {
                            cat = cat[path[i]];
                        }
                    }
                }
                let out = cat.cloneNode(true);
                out.$origin$ = cat;
                return out;
            } else {
                console.warn('None icon path passed to icon');
            }
        } else {
            console.warn('None string passed');
        }
    }
}