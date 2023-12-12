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

const SQRT_2 = 1.4142;

//-------------------------------------------------------

// Fixed metrics
const Metrics = {
    // Tag icon pixel size with a scale = 1.0
    iconSize: 46.0, // 64.0,
    // Adds iconBackgroundMargin to the radius of the icon background
    iconBackgroundMargin: 0.0,
    // All the svg local icons have to be centered on (0, 0, svgIconSize, svgIconSize)
    svgIconSize: 24.0,
    // Captions font size in pixels
    textSize: 32.0,
    // Caption text margins
    textMargin: 10.0,
    // Space between two tags
    lineSpacing: 5,
    // Text shadow offset
    textShadowOffset: {x: 3, y: 3}
}

//-------------------------------------------------------

// Default theme (used if there are no available themes from the theme editor)
const DefaultTheme = {

    // Background color of the tag
    background: 'rgba(0,0,0,0.45)',
    // Text color
    text: 'white',
    // Icon color
    icon: 'white',
    // Font used
    textFont: '"M PLUS 1 Code"',
    // Color of the decorations (icon background and borders)
    decorations: 'rgba(0,0,0, 0.45)',
    // Enable/disable icon background
    drawIconBackground: true,
    // Border width in pixels
    borderWidth: 6.0,
    // Amount of blur for shadows
    shadowBlur: 10.0,
    // Shadow color
    shadowColor: 'rgba(0,0,0, 0.5)',
    // Amount of blur for the background
    blur: 0.0

};


//----------------------------------------------------

// This class is used to render metadata tags on the canvas (with customizable styles and icons)
class ImageTagRenderer {

    //-------------------------------------------------------
    // PRIVATE VARIABLES

    // Available color currentTheme themes
    #themes;

    // Current currentTheme
    #currentTheme;

    // Canvas context
    #ctx;

    //-------------------------------------------------------
    // PUBLIC METHODS

    // context: Canvas context
    constructor(context) {

        this.#themes = {};

        this.#ctx = context;
    }

    // Initialize the local resources
    async initialize() {

        await this.#loadThemes("json/ep_themes.json");
        await this.#loadLocalResources();
    }

    // Set the current theme from those available
    set currentTheme(themeName) {

        if (!this.#themes.hasOwnProperty(themeName)) {
            console.log(`No theme named '${themeName}'`);
        } else {
            this.#currentTheme = this.#themes[themeName];

            // convert color string to a 'tinycolor' object
            for(const key in this.#currentTheme) {

                const tc = tinycolor(this.#currentTheme[key]);
                if(tc.isValid()) this.#currentTheme[key] = tc;
            }
        }
    }

    // Get the current theme settings
    get currentTheme() {

        return this.#currentTheme;
    }

    // Get all the available themes
    get themes() {
        return this.#themes;
    }

    // Render all the supported 'tags' on the image canvas
    // Return the size(w,h) of the rendered tags
    renderTags(tagContent, x, y) {

        const selectedTags = document.epTagManager.selectedTags;

        let lineOffset = 0;

        for(const tagName of selectedTags) {

            const value = tagContent[tagName];

            if(!value) continue;

            const textRect = this.#renderTag(tagName, value, x, y + lineOffset);

            lineOffset += textRect.h + Metrics.lineSpacing;
        }
    }

    //-------------------------------------------------------
    // PRIVATE METHODS

    async #loadThemes(themesFilePath) {

        // Fetch the config json
        // This code could be moved outside this class in a future
        const res = await fetch(themesFilePath);
        if(!res.ok) {
            console.log(`Can't fetch JSON ${themesFilePath} file`);
            return;
        }
        this.#themes = await res.json();

        // Check there's at least one theme in the list
        const themeNames = this.#themes ? Object.keys(this.#themes) : [ ];
        if(themeNames.length === 0) {

            this.#themes = {...DefaultTheme};
        }

        // Set the first theme as default
        this.currentTheme = Object.keys(this.#themes)[0];
    }

    // SVG to Path2D basic recursive translator
    // 'fill' class style: elements to be filled
    // 'stroke' class style: elements to be outlined
    // Current support for: path, line, ellipse, g
    static #processSVGElement(root, strokePath, fillPath, curPath) {

        let elements = root.children;

        // For each element of the SVG node
        for(let k = 0; k < elements.length; ++k) {

            // Grab the element
            const it = elements.item(k);

            // Check the element currentTheme class
            switch (it.getAttribute("class")) {

                case 'fill':
                    if(fillPath) curPath = fillPath;
                    break;

                case 'stroke':
                    if(strokePath) curPath = strokePath;
                    break;
            }

            // Use strokePath by default if the element has no class
            if(!curPath) curPath = strokePath;

            // Sub path to add recursively a path to a path
            let subPath = null;

            switch (it.nodeName) {
                case 'style':
                    // Skip it:
                    // currentTheme class name has to be 'fill' or 'stroke'. All the other details are managed by Themes.
                    break;

                case 'path':
                    curPath.addPath(new Path2D(it.getAttribute('d')));
                    break;

                case 'g':
                    // curPath was already chosen between strokePath and fillPath
                    this.#processSVGElement(it, strokePath, fillPath, curPath);
                    break;

                case 'line':
                    subPath = new Path2D();
                    subPath.moveTo(Number(it.getAttribute('x1')), Number(it.getAttribute('y1')));
                    subPath.lineTo(Number(it.getAttribute('x2')), Number(it.getAttribute('y2')));
                    curPath.addPath(subPath);
                    break;

                case 'ellipse':
                    subPath = new Path2D();
                    subPath.ellipse(Number(it.getAttribute('cx')), Number(it.getAttribute('cy')),
                        Number(it.getAttribute('rx')), Number(it.getAttribute('ry')),
                        0, 0, Math.PI*2);
                    curPath.addPath(subPath);
                    break;

                default:
                    console.log(`Sorry, SVG renderer for '${it.nodeName}' not yet implemented.`);
            }
        }
    }

    // Load local SVG icons that are not available as symbols in Google libraries
    async #loadLocalResources() {
        
        // Get the supported tags
        const tagsData = document.epTagManager.tagsData;

        // Search for each tag icon
        for(const key in tagsData) {
            
            const item = tagsData[key];

            // If it's not a local svg we are done
            if (item.iconType !== 'local_svg') continue;

            // otherwise fetch the svg
            const res = await fetch(item.iconID);
            if(!res.ok) {
                console.log(`Can't fetch '${item.iconID}'`);
                continue;
            }
            const doc = new DOMParser().parseFromString(await res.text(), "application/xml");

            // Check for the <svg> root node
            let list =  doc.getElementsByTagName('svg');
            if(!list) continue;

            // Create a stroke path (used for elements with currentTheme 'stroke' and by default)
            let strokePath = new Path2D();
            // Create a fill path (used for elements with currentTheme 'fill'
            let fillPath = new Path2D();

            // Process recursively the svg root node
            ImageTagRenderer.#processSVGElement(list[0], strokePath, fillPath);

            // Stores the two paths in the item
            item.svg = [strokePath, fillPath];
        }

        //-----------------------------------------------------

        // Load fonts
        await document.fonts.load(Metrics.iconSize + 'px Material Symbols Outlined');
        await document.fonts.load(Metrics.textSize + 'px ' + this.#currentTheme.textFont);

    }

    // Render a tag icon (it could be a material symbol or a locally stored svg path)
    #renderIcon(key, x, y) {

        const ctx = this.#ctx;

        // Get the supported tags
        const tagsData = document.epTagManager.tagsData;

        // Check if there's an icon associated with this key
        if(!tagsData.hasOwnProperty(key)) return false;

        // Get the data associated with this icon
        const iconRef = tagsData[key];

        //-----------------------------------------------------

        // Set up the default icon currentTheme
        ctx.fillStyle = this.#currentTheme.icon;
        ctx.strokeStyle = this.#currentTheme.icon;
        ctx.lineWidth = 2.0;
        ctx.lineCap = "round";
        ctx.miterLimit = 10.0;

        //-----------------------------------------------------

        // Check the type of the icon
        switch (iconRef.iconType) {

            //-----------------------------------------------------

            // It's a Google Material Symbol.
            case 'material_symbol':

                ctx.font = Metrics.iconSize + 'px Material Symbols Outlined';
                ctx.weight = 400;
                ctx.fillText(iconRef.iconID,x,y + Metrics.iconSize)

                break;

            //-----------------------------------------------------

            // It's a local SVG file
            case 'local_svg':

                ctx.save();

                // Compute the metrics to center the image
                // SVG has to be (0, 0, Metrics.svgIconSize, Metrics.svgIconSize) centered
                const iconCenter = Metrics.iconSize / 2.0;
                const svgIconCenter = Metrics.svgIconSize / 2.0;
                const center = {x: x + iconCenter - svgIconCenter , y: y + iconCenter - svgIconCenter};
                const scaleRatio = Metrics.iconSize / Metrics.svgIconSize;

                // Translate and scale the icon to the center
                ctx.translate(svgIconCenter, svgIconCenter);
                ctx.scale(scaleRatio, scaleRatio);
                ctx.translate(center.x/scaleRatio -svgIconCenter, center.y/scaleRatio -svgIconCenter);

                if(!iconRef.svg || iconRef.svg.length < 2) return false;

                // Render the fill path
                ctx.fill(iconRef.svg[1]);
                // Render the stroke path
                ctx.stroke(iconRef.svg[0]);

                ctx.restore();

                break;

            //-----------------------------------------------------
        }

        return true;
    }

    // Render background elements under the tag element (icon + tag content)
    #renderTagBackground(x, y, textWidth, textHeight) {

        // Compute the radius and the center of a circle around the icon
        const diameter = Math.max(Metrics.iconSize * SQRT_2 + Metrics.iconBackgroundMargin, textHeight);
        const radius = diameter / 2.0;
        const center = {x: x + radius, y: y + radius};

        // Compute the text caption box metrics
        const textX = center.x + radius + Metrics.textMargin;
        const textY = center.y - radius;
        const textH = diameter;

        // Compute the background box that will contain the tag text
        const boxW = textWidth + Metrics.textMargin + Metrics.textSize / 2;

        const ctx = this.#ctx;

        ctx.save();

        // Compute the background path: (====)
        ctx.beginPath();
        ctx.moveTo(center.x, center.y - radius);
        ctx.lineTo(center.x + boxW, center.y - radius);
        ctx.arc(center.x + boxW, center.y, radius,-Math.PI / 2, Math.PI / 2);
        ctx.lineTo(center.x, center.y + radius);
        ctx.arc(center.x, center.y, radius,Math.PI / 2, Math.PI *  3 / 2);
        ctx.closePath();

        const curTheme = this.#currentTheme;

        // Render a shadow behind the background
        if(curTheme.borderWidth >= 0.5 && curTheme.shadowColor.getAlpha() > 0.01) {
            if(curTheme.shadowBlur > 0.01)
                ctx.filter = 'blur(' + curTheme.shadowBlur + 'px)';
            ctx.lineWidth = curTheme.borderWidth * 2;
            ctx.strokeStyle = curTheme.shadowColor;
            ctx.stroke();
            ctx.filter = 'none';
        }

        // Fill the background path
        if(curTheme.blur > 0.01)
            ctx.filter = 'blur(' + curTheme.blur + 'px)';
        ctx.fillStyle = curTheme.background;
        ctx.fill();

        // Render background outline
        if(curTheme.borderWidth >= 0.5 && curTheme.decorations.getAlpha() > 0.01) {

            ctx.save();
            ctx.clip();
            ctx.lineWidth = curTheme.borderWidth * 2;
            ctx.strokeStyle = curTheme.decorations;
            ctx.stroke();
            ctx.restore();
        }

        // Render a background for the tag icon
        if(curTheme.drawIconBackground && curTheme.decorations.getAlpha() > 0.01) {

            //this.#ctx.circle(center.x, center.y, radius);
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius,Math.PI / 2, Math.PI * 3 / 2);
            ctx.lineTo(center.x + radius, center.y - radius);
            ctx.lineTo(center.x + radius, center.y + radius);
            ctx.lineTo(center.x, center.y + radius);

            ctx.fillStyle = curTheme.decorations;
            ctx.fill();
        }

        ctx.restore();

        // Returns the rect that should contain the tag text
        return {x: textX, y: textY, w: textWidth, h: textH};
    }

    // @TODO: Multiline support for longer captions?
    // @TODO: Using max text width ( took from the captions ) (minWidth param)
    // @TODO: Could tag icons reduce their text size (TagIcons.fontScale ?)
    // Render a single tag (tagID, tagContent) on the image canvas at the position (x,y)
    // Return the width of the computed text box
    #renderTag(tagID, tagContent, x, y) {
        
        const ctx = this.#ctx;

        // Set the font
        ctx.font = Metrics.textSize + 'px ' + this.#currentTheme.textFont;

        // Calculate the text metrics
        const textMetrics = ctx.measureText(tagContent);

        //-----------------------------------------------------

        // Render the background and compute the text caption rect {x, y, w, h}
        const textRect = this.#renderTagBackground(x, y, textMetrics.width, textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent);

        //-----------------------------------------------------
        // Render the caption text

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textPos = {x: textRect.x + (textRect.w / 2.0), y: textRect.y + (textRect.h / 2.0)};

        // 1) Text shadow
        ctx.fillStyle = this.#currentTheme.shadowColor;
        ctx.fillText(tagContent, textPos.x + Metrics.textShadowOffset.x, textPos.y + Metrics.textShadowOffset.y);

        // 2) The real text
        ctx.fillStyle = this.#currentTheme.text;
        ctx.fillText(tagContent, textPos.x, textPos.y);

        ctx.restore();

        //-----------------------------------------------------
        // Render the icon associated with this tag

        // Calculate the exact center if the textRect is bigger than the icon surrounding circle
        const iconOffset = (textRect.h - Metrics.iconSize) / 2.0;

        this.#renderIcon(tagID, x + iconOffset, y + iconOffset);

        //-----------------------------------------------------

        // Return the width of the text box
        return {w: textRect.w, h: textRect.h};
    }

}