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

//------------------------------------------------------------------------------------------------------
// Elements used to show a description of the tag
//------------------------------------------------------------------------------------------------------
// It can be represented by a local SVG icon
let focusedTagIcon = document.getElementById("focusedTagIcon");
// ... OR a font symbol
let focusedTagSymbol = document.getElementById('focusedTagSymbol');
// Holds the name of the tag
let focusedTagName = document.getElementById("focusedTagName");
// Holds a textual description of the tag
let focusedTagDesc = document.getElementById("focusedTagDesc");

// Container that holds the selectable tags
let selectableTagContainer = document.getElementById("selectableTagContainer");
//------------------------------------------------------------------------------------------------------
// Template elements for a selectable tag
//------------------------------------------------------------------------------------------------------
// It can be a local SVG icon
let selectableTagIcon = document.getElementById("tSelectableTagIcon");
// ... OR a font symbol
let selectableTagSymbol = document.getElementById("tSelectableTagSymbol");

//@TODO: Move to ep_main.js
function onTagSelection(e) {

    // Find the tag linked with this element
    const tagKey = e.getAttribute('tkey');
    // Display contextual infos on this tag
    document.epTagManager.tagShowInfo(tagKey);
    // Enable / disable the display of this tag
    document.epTagManager.tagSelect(tagKey, !e.classList.contains('selected-tag'));
    // Force a refresh of the canvas
    canvasUpdate();
}

//-------------------------------------------------------

// Manages displayed tags, their configuration, and interact with the document accordingly.
class TagManager {

    //-------------------------------------------------------
    // PRIVATE VARIABLES

    // Holds the relevant information about the supported tags to read and use
    #tagsData;

    // Array of tag (keys) that will be displayed along with the image
    #selectedTags = [];

    //-------------------------------------------------------
    // PUBLIC METHODS

    constructor() {

        // Check if there's an active instance of TagManager in the main document.
        // Otherwise, add this instance to the document
        if (!document.epTagManager) {
            document.epTagManager = this;
        }
    }

    // Returns the relevant information about all the supported tags
    get tagsData() {
        return this.#tagsData;
    }

    //-------------------------------------------------------

    // Returns an array of the currently selected tags that will be displayed as an overlay
    get selectedTags() {
        return this.#selectedTags;
    }

    set selectedTags(tags) {

        for (const t of [...this.#selectedTags]) {

            this.tagSelect(t, false);
        }

        for (const t of tags) {

            this.tagSelect(t, true, false);
        }
    }

    // Initialize the class instance
    async initialize(tagsDataPath = 'json/ep_tags_data.json', configPath = 'json/ep_config.json') {

        // Fetch the relevant information about the supported tags
        let res = await fetch(tagsDataPath);

        if (!res.ok) {

            console.log(`Can't fetch JSON ${tagsDataPath} file`);
            return;
        }

        this.#tagsData = await res.json();

        //-------------------------------------------------------

        // If there's a container to hold the selectable tags elements,
        // add an element to represent each tag.
        if (selectableTagContainer) {

            // Iterate through all the supported tags
            for (const key in this.#tagsData) {

                // '_': used to disable some parameters
                if (key.startsWith('_')) continue;

                // Get info for this tag
                const tagInfo = this.#tagsData[key];

                let child;

                // ...add an UI element to the document linked to this tag according to its icon type
                switch (tagInfo.iconType) {

                    // This tag is displayed on the document with a font symbol
                    case 'material_symbol':

                        if (!selectableTagSymbol) {

                            console.log(`Can't find a template element for a tag '${key}' to be represented with a font symbol.`);
                            continue;
                        }

                        // Create an instance of the template element used to represent the tag
                        selectableTagContainer.appendChild(selectableTagSymbol.content.cloneNode(true));
                        child = selectableTagContainer.lastElementChild;
                        child.setAttribute('tkey', key);
                        child.firstElementChild.textContent = tagInfo.iconID;
                        break;

                    // This tag is displayed on the document with a local SVG icon
                    // Check 'ep_overlay_renderer.js' for the default metrics of the SVG
                    case 'local_svg':

                        if (!selectableTagIcon) {

                            console.log(`Can't find a template element for a tag '${key}' to be represented with a SVG icon.`);
                            continue;
                        }

                        // Create an instance of the template element used to represent the tag
                        selectableTagContainer.appendChild(selectableTagIcon.content.cloneNode(true));
                        child = selectableTagContainer.lastElementChild;
                        child.setAttribute('tkey', key);
                        child.firstElementChild.src = tagInfo.iconID;
                        break;

                    default:

                        console.log("Icons of type '" + tagInfo.iconType + "' are not currently supported.");
                }
            }
        }


        //-------------------------------------------------------

        if (!document.epConfig) {

            console.log("Warning: configuration object wasn't found inside the object.");
            return;
        }

        // Enable the display of all the default tags specified in the config
        for (const tag of document.epConfig['defaultTags']) {
            this.tagSelect(tag, true, false);
        }
    }

    // Enable / disable a selectable tag element

    // It's used to disable supported tags that are not found inside the image
    tagSetEnabled(tagKey, enable) {

        const el = selectableTagContainer.querySelector(`[tkey="${tagKey}"]`);
        if (!el) return;

        if (enable) el.classList.remove('unavailable-tag'); else el.classList.add('unavailable-tag');
    }

    // Add / remove a tag in the selected tag list that are displayed in the overlay
    // Mark the linked UI tag icon element as selected / unselected
    tagSelect(tagKey, enableTag, addOnTop = true) {

        // Check if the tag is supported
        if (!this.#tagsData.hasOwnProperty(tagKey)) {

            console.log(`'${tagKey}' is not a currently supported tag.`);
            return;
        }

        // Try to get the selectable element linked with this tag if it's not already given
        const el = selectableTagContainer ? selectableTagContainer.querySelector(`[tkey="${tagKey}"]`) : null;

        // Check there's a selectable element associated with the tag
        if (el && el.classList.contains('unavailable-tag')) {

            return;
        }

        // Check if the tag was already selected
        const isTagEnabled = this.#selectedTags.includes(tagKey);

        if (!enableTag && isTagEnabled) {

            const index = this.#selectedTags.indexOf(tagKey);

            // Remove this tag from the selected tag list
            this.#selectedTags.splice(index, 1);

            // Remove the "selected" decoration class from the element
            if (el) el.classList.remove('selected-tag');

        } else if (enableTag && !isTagEnabled) {

            // Add the select tag to the selected tag list
            if (addOnTop) this.#selectedTags.unshift(tagKey); else this.#selectedTags.push(tagKey);

            // Add the "selected" decoration class to the element
            if (el) el.classList.add('selected-tag');

        }

    }

    // Show a description of the tag on the document
    // The linked icon, its name and a brief description
    tagShowInfo(tagID) {

        if (!this.#tagsData.hasOwnProperty(tagID)) return;

        const tag = this.#tagsData[tagID];

        // Display the linked tag symbol or icon
        if (focusedTagIcon && focusedTagSymbol) {

            switch (tag.iconType) {

                case 'material_symbol':

                    focusedTagIcon.hidden = true;
                    focusedTagSymbol.textContent = tag.iconID;
                    focusedTagSymbol.hidden = false;
                    break;

                case 'local_svg':

                    focusedTagSymbol.hidden = true;
                    focusedTagIcon.src = tag.iconID;
                    focusedTagIcon.hidden = false;
                    break;

            }
        }

        // Display tag name
        if (focusedTagName) focusedTagName.textContent = tag.name;

        // Display a brief tag description
        if (focusedTagDesc) focusedTagDesc.textContent = tag.desc;

    }

}
