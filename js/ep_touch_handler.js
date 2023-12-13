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

// Credits for the pan/zoom example: https://codepen.io/chengarda/pen/wRxoyB

"use strict";


//-----------------------------------------------------------------------------------
// HELPER FUNCTIONS
//-----------------------------------------------------------------------------------

const lerp = (a, b, t) => a * (1.0 - t) + b * t;

//-----------------------------------------------------------------------------------

// This class handles pan/zoom events for an element
//
// Pan is performed with one finger or with a dragging mouse operation.
// 'onPan' is called during every "dragging" step,
// 'offset' holds the current position, considering (0,0) as the initial position
//
// Zoom is performed with two fingers' pinch or with mouse wheel.
// 'onZoom' is called ad every zoom operation,
// 'zoomFactor' is the current zoom value (default: 1.0)
class TouchHandler {
    //-------------------------------------------------------
    // CALLBACKS

    // Two fingers pinch zoom/mouse wheel callback
    #onZoom;
    // One finger/mouse button pan callback
    #onPan;

    //-------------------------------------------------------
    // PRIVATE VARIABLES

    // Element associated with TouchHandler
    #el;
    // Offset coords (x,y) used for pan
    #offset;
    // Position (x,y) of the initial drag operation
    #dragStart;
    // Zoom/Scale value
    #zoomFactor;
    // True when a dragging operation is performed, used for pan.
    #isDragging;
    // Initial distance between two fingers, used for zoom.
    #startPinchDistance;
    // Max value that zoomFactor can reach
    #maxZoom;
    // Min value that zoomFactor can reach
    #minZoom;
    // Adjusts the scroll sensitivity by a factor
    #scrollSensitivity;

    //-------------------------------------------------------
    // PUBLIC METHODS

    // el: element to handle
    // onZoomCallback: function called at every zoom operation
    // onPanCallback: function called at every pan operation
    constructor(el, onZoomCallback = null, onPanCallback = null) {
        this.reset();
        this.#maxZoom = 2.0;
        this.#minZoom = 0.2;
        this.#scrollSensitivity = 0.0005;

        this.#el = el;
        this.#onZoom = onZoomCallback;
        this.#onPan = onPanCallback;

        // Input event handlers
        el.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.this = this;
            TouchHandler.#onPointerDown(e)
        });
        el.addEventListener("touchstart", (e) => {
            e.preventDefault();
            e.this = this;
            TouchHandler.#handleTouch(e, TouchHandler.#onPointerDown)
        });
        document.addEventListener("mouseup", (e) => {
            e.preventDefault();
            e.this = this;
            TouchHandler.#onPointerUp(e);
        });
        el.addEventListener("touchend", (e) => {
            e.preventDefault();
            e.this = this;
            TouchHandler.#handleTouch(e, TouchHandler.#onPointerUp);
        });
        el.addEventListener("mousemove", (e) => {
            e.preventDefault();
            e.this = this;
            TouchHandler.#onPointerMove(e);
        });
        el.addEventListener("touchmove", (e) => {
            e.preventDefault();
            e.this = this;
            TouchHandler.#handleTouch(e, TouchHandler.#onPointerMove);
        });
        el.addEventListener("wheel", (e) => {
            e.preventDefault();
            e.this = this;
            TouchHandler.#adjustZoom(e, e.deltaY * this.#scrollSensitivity);
        }, {passive: false});
    }

    //-------------------------------------------------------

    // Gets the position offset (changed with a pan operation: mouse drag or one finger)
    get offset() {
        return this.#offset;
    }

    set offset(o) {
        this.#offset = {x: o.x, y: o.y};
    }

    // Gets the scale value (changed with a zoom operation: mouse wheel or two fingers' pinch)
    get zoomFactor() {
        return this.#zoomFactor;
    }

    // Manually set the scale value
    set zoomFactor(f) {
        this.#zoomFactor = Math.max(this.#minZoom, Math.min(this.#maxZoom, f));
    }

    get minZoom() {
        return this.#minZoom;
    }

    get maxZoom() {
        return this.#maxZoom;
    }

    get scrollSensitivity() {
        return this.#scrollSensitivity;
    }

    set scrollSensitivity(s) {
        this.#scrollSensitivity = Math.max(0.00001, Math.min(1, s));
    }

    setZoomRange(min, max) {
        console.assert(min < max, "min >= max");
        this.#minZoom = min;
        this.#maxZoom = max;
    }

    // Used to reset the internal params as they were in the beginning
    reset() {
        this.#offset = {x: 0, y: 0};
        this.#dragStart = {x: 0, y: 0};
        this.#zoomFactor = 1.0;
        this.#isDragging = false;
        this.#startPinchDistance = null;
    }

    //-------------------------------------------------------
    // PRIVATE METHODS

    // Gets the relevant location from a mouse or single touch event
    static #getEventLocation(e) {
        // Ratio between the resized element and the real dimensions
        // This allows to drag correctly at any resolution
        const ratio = {x: e.this.#el.width / e.this.#el.offsetWidth, y: e.this.#el.height / e.this.#el.offsetHeight};
        if (e.touches && e.touches.length === 1) {
            return {x: e.touches[0].clientX * ratio.x, y: e.touches[0].clientY * ratio.y};
        } else if (e.clientX && e.clientY) {
            return {x: e.clientX * ratio.x, y: e.clientY * ratio.y};
        }
    }

    static #onPointerDown(e) {
        e.this.#isDragging = true;
        e.this.#dragStart.x = TouchHandler.#getEventLocation(e).x - e.this.#offset.x;
        e.this.#dragStart.y = TouchHandler.#getEventLocation(e).y - e.this.#offset.y;
    }

    static #onPointerUp(e) {
        e.this.#isDragging = false;
        e.this.#startPinchDistance = null;
    }

    static #onPointerMove(e) {
        if (e.this.#isDragging) {
            e.this.#offset.x = (TouchHandler.#getEventLocation(e).x - e.this.#dragStart.x);
            e.this.#offset.y = (TouchHandler.#getEventLocation(e).y - e.this.#dragStart.y);
            if (e.this.#onPan) e.this.#onPan();
        }
    }

    static #handleTouch(e, singleTouchHandler) {
        if (e.touches.length <= 1) {
            singleTouchHandler(e);
        } else if (e.type === "touchmove" && e.touches.length === 2) {
            e.this.#isDragging = false;
            TouchHandler.#handlePinch(e);
        }
    }

    static #handlePinch(e) {

        e.preventDefault();

        const touch1 = {x: e.touches[0].clientX, y: e.touches[0].clientY};
        const touch2 = {x: e.touches[1].clientX, y: e.touches[1].clientY};

        // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
        const currentDistance = (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2;

        if (!e.this.#startPinchDistance) {
            e.this.#startPinchDistance = currentDistance;
        } else {
            const adjustedDistance = lerp(e.this.#startPinchDistance, currentDistance, 0.01);
            TouchHandler.#adjustZoom(e, null, adjustedDistance / e.this.#startPinchDistance);
        }
    }

    static #adjustZoom(e, zoomAmount, zoomFactor) {
        if (!e.this.#isDragging) {
            if (zoomAmount) {
                e.this.#zoomFactor += zoomAmount;
            } else if (zoomFactor) {
                e.this.#zoomFactor = e.this.#zoomFactor * zoomFactor;
            }
            e.this.#zoomFactor = Math.min(e.this.#zoomFactor, e.this.#maxZoom);
            e.this.#zoomFactor = Math.max(e.this.#zoomFactor, e.this.#minZoom);
            if (e.this.#onZoom) e.this.#onZoom();
        }
    }

}