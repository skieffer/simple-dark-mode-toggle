/* simple-dark-mode-toggle
 * Copyright (c) 2024 Steve Kieffer
 * SPDX-License-Identifier: MIT
 */

/* DarkModeOptions

classElement: This DOM element will have a class name added to / removed from
    it, in order to activate / deactivate dark mode, respectively.
    Default: `document.body`.
darkClassName: This is the class name that will be added to / removed from
    the `classElement`. You can use this in your CSS when designing the colors
    for your dark mode. The file `dark-mode.css` is provided as one very simple
    example of a dark mode, but you don't have to use it if you prefer to design
    your own.
    Default: "dark-mode".
title: Title text (i.e. pop-up or tool tip text) for the toggle element.
    Default: "Light/Dark Mode".
storage: How to store the user's most recent dark-mode setting. Legal values are:
    "local": use `window.localStorage`
    "session": use `window.sessionStorage`
    "none": Do not store the user's most recent dark-mode setting.
    Default: "local".
storageName: If storing the user's most recent dark-mode setting (see `storage`),
    this is the name under which it will be stored.
    Default: "dark-mode".
darkByDefault: Boolean, saying whether you want dark mode to be the default
    setting, before the first time the user makes a choice.
    Default: true.
 */
interface DarkModeOptions {
    classElement?: HTMLElement,
    darkClassName?: string,
    title? : string,
    storage? : string,
    storageName?: string,
    darkByDefault?: boolean
}

/* This is a convenience function to set up and activate dark mode.
 *
 * toggleElement: The DOM element you want to be the dark mode toggle button.
 *     Generally this should be some empty div or span. The manager will only
 *     write a sun or moon character into it, to show the current mode.
 *     You are encouraged to set up your own CSS to set the element's font size,
 *     padding, margins, etc. This is deliberately left open, for flexibility.
 * options: See above.
 */
export function setupDarkMode(toggleElement: HTMLElement, options?: DarkModeOptions): DarkModeManager {
    const mgr = new DarkModeManager(toggleElement, options);
    mgr.restore();
    mgr.activate();
    return mgr;
}

export class DarkModeManager {
    toggleElement: HTMLElement;
    classElement: HTMLElement;
    darkClassName: string;
    title: string;
    storage: Storage | null;
    storageName: string;
    darkByDefault: boolean;

    constructor(toggleElement: HTMLElement, options?: DarkModeOptions) {
        const {
            classElement = document.body,
            darkClassName = 'dark-mode',
            title = 'Light/Dark Mode',
            storage = 'local',
            storageName = 'dark-mode',
            darkByDefault = true,
        } = options || {};

        this.toggleElement = toggleElement;
        this.classElement = classElement;
        this.darkClassName = darkClassName;
        this.title = title;
        this.storage = storage === 'local' ? window.localStorage :
                        storage === 'session' ? window.sessionStorage : null;
        this.storageName = storageName;
        this.darkByDefault = darkByDefault;
    }

    activate() {
        this.toggleElement.style.cursor = 'pointer';
        this.toggleElement.style.userSelect = 'none';
        this.toggleElement.title = this.title;
        this.toggleElement.onclick = e => {
            this.toggle();
        };
    }

    /* Restore the previous setting from localStorage (or default).
     */
    restore() {
        let dark = this.darkByDefault;

        if (this.storage) {
            const storedValue = this.storage.getItem(this.storageName);
            if (storedValue) {
                dark = !!+storedValue;
            }
        }

        this.setDarkMode(dark);
    }

    /* Switch to the opposite setting currently expressed by the toggle element.
     */
    toggle() {
        let dark = this.darkByDefault;
        const currentValue = this.toggleElement.dataset.dark;
        if (currentValue) {
            dark = !+currentValue;
        }
        this.setDarkMode(dark);
    }

    setDarkMode(dark: boolean) {
        if (dark) {
            this.classElement.classList.add(this.darkClassName);
            this.toggleElement.dataset.dark = '1';
            this.toggleElement.innerHTML = '&#x263e;';  // moon
        } else {
            this.classElement.classList.remove(this.darkClassName);
            this.toggleElement.dataset.dark = '0';
            this.toggleElement.innerHTML = '&#x263c;';  // sun
        }

        if (this.storage) {
            this.storage.setItem(this.storageName, this.toggleElement.dataset.dark);
        }
    }

}
