## Simple Dark Mode Toggle

Easily add a sun/moon toggle button to any page, which:
* Adds/removes a 'dark-mode' class on the page's `body` element
  (class name and element both configurable).
* Stores the setting in `localStorage` (or `sessionStorage`, or not
  at all -- configurable).

### Usage

**mypage.html:**

```html
<head>
    <link rel="stylesheet" href="mystyles.css">
</head>
<body>
    <div id="darkModeToggle"></div>
    <script src="myscript.js"></script>
</body>
```

**myscript.js:**

```js
import { setupDarkMode } from "simple-dark-mode-toggle";

const toggle = document.querySelector('#darkModeToggle');
setupDarkMode(toggle);
```

**mystyles.css:**

```css
body.dark-mode {
    filter: invert(0.8) hue-rotate(180deg);
}
```

### Options

You can pass an `options` object,

```js
setupDarkMode(toggle, options);
```

to make any of the following settings:

* `classElement`: This DOM element will have a class name added to / removed from
it, in order to activate / deactivate dark mode, respectively.
Default: `document.body`.

* `darkClassName`: This is the class name that will be added to / removed from
the `classElement`. You can use this in your CSS when designing the colors
for your dark mode. The file `dark-mode.css` is provided as one very simple
example of a dark mode, but you don't have to use it if you prefer to design
your own.
Default: "dark-mode".

* `title`: Title text (i.e. pop-up or tool tip text) for the toggle element.
Default: "Light/Dark Mode".

* `storage`: How to store the user's most recent dark-mode setting. Legal values are:
"local": use `window.localStorage`
"session": use `window.sessionStorage`
"none": Do not store the user's most recent dark-mode setting.
Default: "local".

* `storageName`: If storing the user's most recent dark-mode setting (see `storage`),
this is the name under which it will be stored.
Default: "dark-mode".

* `darkByDefault`: Boolean, saying whether you want dark mode to be the default
setting, before the first time the user makes a choice.
Default: true.
