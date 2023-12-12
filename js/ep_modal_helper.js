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

//--------------------------------------------------------------------------------------------------------

const modalHelp = document.getElementById('modalHelp');

const modalHelpImage = document.getElementById('modalHelpImage');

const modalHelpTip = document.getElementById('modalHelpTip');

const modalHelpNextTip = document.getElementById('modalHelpNextTip');

const modalHelpPrevTip = document.getElementById('modalHelpPrevTip');

//--------------------------------------------------------------------------------------------------------

// This class manages a modal window with some basic instruction tips (aka Help Button)
class ModalHelper {

    //-------------------------------------------------------
    // PRIVATE VARIABLE

    // Stores the help tips from a json
    #helpTips;

    // Key of the current tip
    #curTipKey;

    //-------------------------------------------------------
    // PUBLIC METHODS

    constructor() {

        // If there are no helper instances active, register this instance as default
        if(!document.epModalHelper) {

            document.epModalHelper = this;

            modalHelpNextTip.addEventListener('click', ModalHelper.nextTip);
            modalHelpPrevTip.addEventListener('click', ModalHelper.prevTip);
        }

        this.#helpTips = null;
        this.#curTipKey = null;
    }

    // Initialize the modal helper
    // Help tips are loaded from a json, the starting tips has to be named 'start'
    async initialize(helpTipsPath = 'json/ep_help_tips.json') {

        // Fetch and read the tips json
        const res = await fetch(helpTipsPath);
        if(!res.ok) {
            console.log(`Can't fetch JSON ${helpTipsPath} file`);
            return;
        }

        // Stores the tips
        this.#helpTips = await res.json();

        this.#curTipKey = null;

        // Show the first tip (it has to be named 'start')
        this.showTip('start');
    }

    // Show a tip named 'tipKey'
    showTip(tipKey) {

        if(!this.#helpTips || !this.#helpTips.hasOwnProperty(tipKey)) {

            console.log(`Can't find help tip '${tipKey}'`);
            return;
        }

        const entry = this.#helpTips[tipKey];

        // Load the image associated with this help tip
        modalHelpImage.src = entry['image'];

        // Fill the content with the text associated with this tip
        modalHelpTip.innerHTML = entry['tip'];

        // First tip has no previous button
        if(entry['prev']) {
            modalHelpPrevTip.classList.add("scale-in");
        }
        else {
            modalHelpPrevTip.classList.remove("scale-in");
        }

        // Last tip close the modal helper
        if(!entry['next']) {
            modalHelpNextTip.classList.add('selected-button');
            modalHelpNextTip.firstElementChild.textContent = 'done';
        } else {
            modalHelpNextTip.classList.remove('selected-button');
            modalHelpNextTip.firstElementChild.textContent = 'arrow_forward_ios';
        }

        // Set this as the current tip
        this.#curTipKey = tipKey;
    }

    // Convenience static method to go to the next tip
    static nextTip() {

        document.epModalHelper.#moveToTip('next');
    }

    // Convenience static method to go to the previous tip
    static prevTip() {

        document.epModalHelper.#moveToTip('prev');
    }

    //-------------------------------------------------------
    // PRIVATE METHODS

    // Convenience method used to move to a previous or next tip
    // 'dir' can have two values: "next", to go to the next tip. "prev", to go the previous tip.
    #moveToTip(dir) {

        if(!this.#helpTips || !this.#curTipKey || !this.#helpTips.hasOwnProperty(this.#curTipKey)) {

            return;
        }

        // Get the current tip
        const entry = this.#helpTips[this.#curTipKey];

        // Check it has info on "next" or "prev" tip
        if(!entry.hasOwnProperty(dir)) {

            return;
        }

        // Get the target tip
        const target = entry[dir];

        if(target) {

            // Go to the target tip
            this.showTip(entry[dir]);
        }
        else {

            // The last tip simply close the modal dialog
            M.Modal.getInstance(modalHelp).close();
        }
    }

}