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
 * It is for use in page scripts. For content scripts, see `setupDarkModeForExt()`.
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

/* This is a convenience function to set up and activate dark mode.
 * It is for use in content scripts. For page scripts, see `setupDarkMode()`.
 *
 * toggleElement: The DOM element you want to be the dark mode toggle button.
 *     Generally this should be some empty div or span. The manager will only
 *     write a sun or moon character into it, to show the current mode.
 *     You are encouraged to set up your own CSS to set the element's font size,
 *     padding, margins, etc. This is deliberately left open, for flexibility.
 * options: See above.
 */
export async function setupDarkModeForExt(toggleElement: HTMLElement, options?: DarkModeOptions): Promise<DarkModeManager> {
    options = options || {};
    options.storage = 'ext-' + (options.storage || 'none');
    const mgr = new ExtensionDarkModeManager(toggleElement, options);
    await mgr.restore();
    mgr.activate();
    return mgr;
}

const storageTypes = {
    local: 'local',
    session: 'session',
    extLocal: 'ext-local',
    extSession: 'ext-session',
};

/* Wrapper class providing an abstraction layer over the various storage options provided
 * by the web browser.
 *
 * Specifically, an instance of this class can represent any of the following storages:
 *   - window.localStorage
 *   - window.sessionStorage
 *   - (browser|chrome).storage.local
 *   - (browser|chrome).storage.session
 *
 * When wrapping a page storage class, use the synchronous `getItem()` and `setItem()` methods.
 * When wrapping an extension storage class, use the asynchronous `getItemAsync()`, `setItemAsync()` methods.
 */
class AbstractStorage {
    storageType: string;
    inChrome: boolean;

    /* storageType must be one of: 'local', 'session', 'ext-local', 'ext-session'.
     *   The first two use the local and session storages of the window object; the last two
     *   use those of the extension (when working within a browser extension).
     */
    constructor(storageType: string) {
        this.storageType = storageType;
        this.inChrome = typeof chrome !== 'undefined';
    }

    getItem(key: string) {
        switch (this.storageType) {
            case storageTypes.local:
                return window.localStorage.getItem(key);
            case storageTypes.session:
                return window.sessionStorage.getItem(key);
            default:
                return null;
        }
    }

    async getItemAsync(key: string) {
        let results;
        switch (this.storageType) {
            case storageTypes.extLocal:
                results = await (this.inChrome ?
                    new Promise(resolve => chrome.storage.local.get(key, resolve)) :
                    browser.storage.local.get(key));
                return results[key];
            case storageTypes.extSession:
                results = await (this.inChrome ?
                    new Promise(resolve => chrome.storage.session.get(key, resolve)) :
                    browser.storage.session.get(key));
                return results[key];
            default:
                return null;
        }
    }

    setItem(key: string, value: any) {
        switch (this.storageType) {
            case storageTypes.local:
                return window.localStorage.setItem(key, value);
            case storageTypes.session:
                return window.sessionStorage.setItem(key, value);
            default:
                return null;
        }
    }

    async setItemAsync(key: string, value: any) {
        const keys = {[key]: value};
        switch (this.storageType) {
            case storageTypes.extLocal:
                return this.inChrome ?
                    new Promise(resolve => chrome.storage.local.set(keys, () => {
                        resolve(null);
                    })) :
                    browser.storage.local.set(keys);
            case storageTypes.extSession:
                return this.inChrome ?
                    new Promise(resolve => chrome.storage.session.set(keys, () => {
                        resolve(null);
                    })) :
                    browser.storage.session.set(keys);
            default:
                return null;
        }
    }
}

/* Abstract base class for the dark mode managers.
 */
class BaseDarkModeManager {
    toggleElement: HTMLElement;
    classElement: HTMLElement;
    darkClassName: string;
    title: string;
    storage: AbstractStorage;
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
        this.storage = new AbstractStorage(storage);
        this.storageName = storageName;
        this.darkByDefault = darkByDefault;
    }

    _activate() {
        this.toggleElement.style.cursor = 'pointer';
        this.toggleElement.style.userSelect = 'none';
        this.toggleElement.title = this.title;
    }

    _toggle() {
        let dark = this.darkByDefault;
        const currentValue = this.toggleElement.dataset.dark;
        if (currentValue) {
            dark = !+currentValue;
        }
        return dark;
    }

    _setDarkMode(dark: boolean) {
        if (dark) {
            this.classElement.classList.add(this.darkClassName);
            this.toggleElement.dataset.dark = '1';
            this.toggleElement.innerHTML = '&#x263e;';  // moon
        } else {
            this.classElement.classList.remove(this.darkClassName);
            this.toggleElement.dataset.dark = '0';
            this.toggleElement.innerHTML = '&#x263c;';  // sun
        }
    }
}

/* Dark mode manager for use in ordinary page scripts (*not* in browser extensions).
 *
 * Uses the synchronous storage classes available in the window.
 */
export class DarkModeManager extends BaseDarkModeManager {

    activate() {
        this._activate();
        this.toggleElement.onclick = e => {
            this.toggle();
        };
    }

    /* Restore the previous setting from localStorage (or default).
     */
    restore() {
        const storedValue = this.storage.getItem(this.storageName);
        let dark = this.darkByDefault;
        if (storedValue) {
            dark = !!+storedValue;
        }
        this.setDarkMode(dark);
    }

    /* Switch to the opposite setting currently expressed by the toggle element.
     */
    toggle() {
        const dark = this._toggle();
        this.setDarkMode(dark);
    }

    setDarkMode(dark: boolean) {
        this._setDarkMode(dark);
        this.storage.setItem(this.storageName, this.toggleElement.dataset.dark);
    }

}

/* Dark mode manager for use in browser extension content scripts.
 *
 * Uses the asynchronous storage classes available to browser extensions.
 */
export class ExtensionDarkModeManager extends BaseDarkModeManager {

    activate() {
        this._activate();
        this.toggleElement.onclick = async e => {
            await this.toggle();
        };
    }

    /* Restore the previous setting from localStorage (or default).
     */
    async restore() {
        const storedValue = await this.storage.getItemAsync(this.storageName);
        let dark = this.darkByDefault;
        if (storedValue) {
            dark = !!+storedValue;
        }
        await this.setDarkMode(dark);
    }

    /* Switch to the opposite setting currently expressed by the toggle element.
     */
    async toggle() {
        const dark = this._toggle();
        await this.setDarkMode(dark);
    }

    async setDarkMode(dark: boolean) {
        this._setDarkMode(dark);
        await this.storage.setItemAsync(this.storageName, this.toggleElement.dataset.dark);
    }

}
