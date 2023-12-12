// EXIF Printer
// Copyright (C) 2023 Claudio Z. (cloudofoz)
// Online version: https://www.cloudofoz.com/exif-printer
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

"use strict";

//-------------------------------------------------------

// Fixed configuration for the color picker
const ColorPickerConfig = {
    theme: 'nano', comparison: false, components: {
        preview: true, opacity: true, hue: true, interaction: {
            hex: false, rgba: false, hsla: false, hsva: false, cmyk: false, input: true, clear: false, save: false
        }
    }, defaultRepresentation: 'HEX'
};

//-------------------------------------------------------

// This class allows to create custom themes for the overlay and to tweak overlay metrics
class ThemeEditor {

    //-------------------------------------------------------
    // PRIVATE VARIABLES

    // Reference to the renderer
    #tagRenderer;

    // Called when a value is changed by the user to update the theme value
    #onChange;

    // List of all the theme color values and their associated color pickers
    #stylePickers;

    // List of all theme value sliders
    #styleSliders;

    //-------------------------------------------------------
    // PUBLIC METHODS

    constructor(tagRenderer, onChange) {

        if (!tagRenderer || !(tagRenderer instanceof ImageTagRenderer)) {

            console.log("Invalid tag renderer");
            return;
        }

        this.#tagRenderer = tagRenderer;

        this.#stylePickers = [];
        this.#styleSliders = [];

        if (onChange && typeof onChange !== 'function') console.log("Invalid 'onChange' callback"); else this.#onChange = onChange;

        // Add a color picker for each tweak-able color of the theme
        this.#addColorPicker('theme-editor-background');
        this.#addColorPicker('theme-editor-text');
        this.#addColorPicker('theme-editor-icons');
        this.#addColorPicker('theme-editor-decorations');
        this.#addColorPicker('theme-editor-shadow');

        // Register the value sliders associated with the theme settings
        this.#registerSlider("themeEditorBorderWidth");
        this.#registerSlider("themeEditorBlur");
        this.#registerSlider("themeEditorShadowBlur");

        // Register the value sliders associated with the metrics settings
        this.#registerMetricSlider('themeEditorIconSize');
        this.#registerMetricSlider('themeEditorTextSize');
        this.#registerMetricSlider('themeEditorLineSpacing');
    }

    // Refresh the document elements with the associated theme colors and values
    refresh() {

        if (!this.#tagRenderer) return;

        const t = this.#tagRenderer.currentTheme;

        // Update the color elements and their associated color pickers
        for (const it of this.#stylePickers) {

            const colorPicker = it.colorPicker;

            colorPicker.setColor(t[it.getAttribute('target')].toString());
        }

        // Update the style value sliders
        for (const it of this.#styleSliders) {

            it.value = t[it.getAttribute('target')];
        }

        // Metrics value sliders currently don't need to be updated here since they are not currently
        // linked with a theme change
        // ... do nothing ...

    }

    //-------------------------------------------------------
    // PRIVATE METHODS

    // Add a color picker to the associated element with the class 'className'
    // This is how the chosen Color Picker works (Actually 'Pickr'). For this reason a class to define a Color Picker
    // has to be treated as a unique ID.
    // In other words only one element can have 'className' as class.
    #addColorPicker(className) {

        // Grab the element with the class 'className'
        const el = document.querySelector(`.${className}`);

        if (!el) {

            console.log("Can't find an element of class '" + className + "'");
            return;
        }

        // Get the target value name associated with the element
        const targetValueName = el.getAttribute('target');

        // Get the color value associated with the target value name
        const color = this.#tagRenderer.currentTheme[targetValueName];

        // Create an instance of the color picker, storing the instance inside the element
        el.colorPicker = Pickr.create({el: `.${className}`, default: color.toString(), ...ColorPickerConfig});

        // Called when the user change the color of a Color Picker
        el.colorPicker.on('change', (color, source, instance) => {

            // Update the theme color with the new value
            this.#tagRenderer.currentTheme[el.getAttribute('target')] = tinycolor(color.toHEXA().toString());

            // Notify the color has been changed
            if (this.#onChange) this.#onChange();
        });

        // Add the color picker to the 'stylePickers' list.
        this.#stylePickers.push(el);
    }

    // Register document value slider linking it with a theme value
    #registerSlider(sliderID) {

        const el = document.getElementById(sliderID);

        if (!el || el.tagName.toLowerCase() !== 'input') return;

        // Update the slider value with the linked theme value
        el.value = this.#tagRenderer.currentTheme[el.getAttribute('target')];

        // Called when the user change the value of the slider
        const eventHandler = (e) => {

            // Update the theme value with slider value
            this.#tagRenderer.currentTheme[el.getAttribute('target')] = Number(el.value);

            // Notify the theme value has been changed
            if (this.#onChange) this.#onChange();
        };

        el.addEventListener('change', eventHandler);
        el.addEventListener('input', eventHandler);

        // Add the slider to the 'styleSliders' list
        this.#styleSliders.push(el);
    }

    // Used to register a slider to tweak the overlay metrics values
    #registerMetricSlider(sliderID) {

        const el = document.getElementById(sliderID);

        if (!el || el.tagName.toLowerCase() !== 'input') return;

        // Update the slider value with the metrics value
        el.value = Metrics[el.getAttribute('target')];

        // Called when the user change the value of the slider
        const eventHandler = (e) => {

            // Called when the user change the value of the slider
            Metrics[el.getAttribute('target')] = Number(el.value);

            // Notify the metric value has been changed
            if (this.#onChange) this.#onChange();
        };

        el.addEventListener('change', eventHandler)
        el.addEventListener('input', eventHandler);
    }

}