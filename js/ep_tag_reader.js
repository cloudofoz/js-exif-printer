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

// Read image tags using exif-js library
//
// tags() returns the image tags (like iso, fvalue, camera model)
//
// The callback passed in the constructor is called every time a read operation is completed,
// allowing for a safe call of tags()
class TagReader {

    //-------------------------------------------------------
    // PRIVATE VARIABLES

    // Image element linked with this class
    #img;

    //-------------------------------------------------------
    // PUBLIC METHODS

    // 'imageElement' used to read the image tags
    // 'onTagsReadyCallback' is called every time a read operation is performed.
    // It's safe to call 'tags()' inside this callback
    constructor(imageElement, onTagsReadyCallback = null) {

        if (!(imageElement instanceof HTMLImageElement)) {
            console.log("'imageElement' has to be an image.");
            return;
        }

        this.#img = imageElement;

        // 'onTagsReadyCallback' is stored inside the image element
        if (onTagsReadyCallback && typeof onTagsReadyCallback === 'function') {

            this.#img.epOnTagsReady = onTagsReadyCallback;
        }

        // Called when 'imageElement' is loaded or when a new image is set
        imageElement.addEventListener("load", () => {

            this.#readTags();
        });
    }

    // Return all the relevant tags.
    // This getter should be called inside 'epOnTagsReady' callback.
    get tags() {
        return this.#img.epTags;
    }

    // This method is called inside the '#readTags' method.
    static #readTag(tagKey, image) {

        // Get the tag description
        const tagDesc = document.epTagManager.tagsData[tagKey];

        if (!tagDesc) {

            console.log("Can't find data for a tag named '" + tagKey + "'");
            return;
        }

        let resultValue = null;

        // Check the tag type
        switch (tagDesc.tagType) {

            // EXIF Tag
            case 'exif':

                resultValue = EXIF.getTag(image, tagDesc.tagID);
                break;

            // IPTC Tag
            case 'iptc':

                resultValue = EXIF.getIptcTag(image, tagDesc.tagID);
                break;

            // Custom tag handled by the TagReader
            case 'custom':

                resultValue = TagReader.#getCustomTagValue(tagKey, tagDesc, image);
                break;

            default:

                console.log("Tags of type '" + tagsData.tagType + "' aren't currently supported.");
                return;

        }

        // Check if the tag was read successfully
        const tagIsValid = resultValue && (typeof resultValue !== 'string' || resultValue.length > 0);

        // Notify the tag manager about the validity of the tag
        document.epTagManager.tagSetEnabled(tagKey, tagIsValid);

        if (tagIsValid) {

            // Apply a post-process formatting to the tag value
            // and store it inside 'epTags' object.
            image.epTags[tagKey] = TagReader.#formatTagValue(resultValue, tagDesc);
        }
    }

    //-------------------------------------------------------
    // PRIVATE METHODS

    // description inside 'ep_tags.data.json'
    static #formatTagValue(tagValue, tagDesc) {

        let output = ``;

        // Adds a prefix to the output
        if (tagDesc.prefix) {

            output = output.concat(tagDesc.prefix);

            // If the prefix ends with '1/' automatically
            // apply the calculation
            if (tagDesc.prefix.endsWith('1/')) {
                tagValue = Math.round(1 / Number(tagValue));
            }
        }

        // Appends the value to the output
        output = output.concat(tagValue);

        // Adds a suffix to the output
        if (tagDesc.suffix) {

            output = output.concat(tagDesc.suffix);
        }

        return output;
    }

    // This method is called once when a new image is loaded.
    // It reads all the supported (ep_tags_data.json) tags
    // and stores them.
    // After the read operation is finished the callback
    // 'onTagsReady' (passed in the constructor) is called.
    // Inside the callback and afterward it's safe to call

    // Handle custom tags
    static #getCustomTagValue(tagKey, tagData, image) {

        switch (tagKey) {

            case 'size':

                const width = EXIF.getTag(image, 'ImageWidth') || image.width;
                const height = EXIF.getTag(image, 'ImageHeight') || image.height;

                return `${width}x${height}`;

        }
    }

    //-------------------------------------------------------
    // PRIVATE STATIC METHODS

    // Read a single tag from an image

    // Check if there are no tags associated with the image
    isEmpty() {

        if (!this.#img) {
            console.log('No image is associated with this reader.');
            return;
        }
        return !this.#img.epTags || Object.keys(this.#img.epTags).length === 0;
    }

    // Format the tag value using according to the tag

    // Delete all the stored keys of the image
    #resetTags() {

        // Clear the stored tags
        if (this.#img.hasOwnProperty('epTags')) {
            delete this.#img.epTags;
        }
        // Prevents a bug(?) in exif-js where metadata is not refreshed if
        // the same object was used to load another image.
        // Deleting the key 'exifdata' force the library to read metadata
        // for the new image
        if (this.#img.hasOwnProperty('exifdata')) {
            delete this.#img.exifdata;
        }
        if (this.#img.hasOwnProperty('iptcdata')) {
            delete this.#img.iptcdata;
        }
    }

    // the method tags() to retrieve the data.
    #readTags() {

        if (!document.epTagManager) {

            console.log("Can't find an active instance of TagManager");
            return;
        }

        // Clear any previously written tag
        this.#resetTags();

        // Tags are stored in an object ('epTags') inside the image
        this.#img.epTags = {};

        // List of the supported tags and their description
        const supportedTags = document.epTagManager.tagsData;

        // Start the tag reading operation
        EXIF.getData(this.#img, function () {

            // Get the image data for all the supported tags
            for (const tagKey in supportedTags) {

                TagReader.#readTag(tagKey, this);
            }

            // Called after a read operation is performed
            if (this.hasOwnProperty("epOnTagsReady")) {

                this.epOnTagsReady();
            }
        });
    }

}
