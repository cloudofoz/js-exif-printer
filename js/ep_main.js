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

//Possible ideas for future updates:
//TODO: (v0.*) Add more tags
//TODO: (v0.*) Add more settings
//TODO: (v0.2) A button to animate a switch between 3 layouts (big image, balanced(default), big options)
//TODO: (v0.2) Implement image blur in the tag background
//TODO: (v0.3) Custom logo overlay print
//TODO: (v1.0) Image bulk processing

//--------------------------------------------------------------------------------------------------------
// Document's  objects
//--------------------------------------------------------------------------------------------------------

const sourceImage = document.getElementById("sourceImage");
const canvas = document.getElementById("canvas");
const context = canvas.getContext('2d');

const themeChooser = document.getElementById("themeChooser");

const uploadImageElement = document.getElementById('uploadImageElement');
const downloadImageElement = document.getElementById('downloadImageElement');

//--------------------------------------------------------------------------------------------------------
// Helpers
//--------------------------------------------------------------------------------------------------------

// Clamp number between two values
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);


// Function to generate random number between an inclusive range
function randomRange(min, max) {

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Remove an extension from a filename
function removeExtension(filename) {
    const noPath = filename.substring(filename.indexOf('/') + 1) || filename;
    return (noPath.substring(0, noPath.lastIndexOf('.')) || noPath);
}

//--------------------------------------------------------------------------------------------------------
// Document initialization
//--------------------------------------------------------------------------------------------------------

// Initialization as the page DOM has been loaded, without waiting for resources to finish loading.
document.addEventListener("DOMContentLoaded", (event) => {

    // Initialize Material components (with default parameters)
    M.AutoInit(document.body);

    // Disable canvas rendering until initialization is finished
    canvas.canRender = false;
});

// Initialization when the whole page has loaded, including all dependent resources
function onPageLoaded(event) {

    // Create an instance of exif tag manager
    document.epTagManager = new TagManager();

    // 1) Load configuration JSON
    loadConfig()
        .then(() => {

            // 2) Load and initialize the supported exif/metadata tags from a JSON data file
            document.epTagManager.initialize()
                .then(() => {

                    // Updated with the size of the overlay (considering all the printed tags and their content)
                    /*sourceImage.epOverlayCurSize = {w: 0, h:0};*/

                    // Called when 'sourceImage' is loaded or when a new image is set
                    sourceImage.addEventListener("load", onImageLoaded);

                    // 3) Initialize the exif/metadata image tag reader
                    sourceImage.epTagReader = new TagReader(sourceImage, () => {

                        canvasUpdate();
                    });

                    // 4) Create and initialize an input handler for the canvas
                    canvas.epInputHandler = new TouchHandler(canvas, canvasUpdate, canvasUpdate);

                    // 5) Initialize the overlay renderer
                    canvas.epTagRenderer = new ImageTagRenderer(context);

                    canvas.epTagRenderer.initialize()
                        .then(() => {

                            // Fill the color currentTheme list with the available styles
                            for (const themeName in canvas.epTagRenderer.themes) {
                                const opt = document.createElement('option');
                                opt.value = themeName;
                                opt.innerHTML = themeName;
                                themeChooser.appendChild(opt);
                            }

                            // 6) Initialize the theme editor
                            document.epThemeEditor = new ThemeEditor(canvas.epTagRenderer, canvasUpdate);

                            // 8) Enable rendering at the end of the initialization
                            canvas.canRender = true;

                            // 9) Show an example from a list of default images
                            showExample();

                            // 10) Initialize the modal helper
                            const modalHelper = new ModalHelper();
                            modalHelper.initialize('json/ep_help_tips.json').then(() => {

                                document.getElementById('modalHelpTrigger').click();
                            });

                        })
                });
        });

    // Enables uploading an image from hard-disk
    uploadImageElement.addEventListener('input', onUploadImage);
}

//--------------------------------------------------------------------------------------------------------
// Events
//--------------------------------------------------------------------------------------------------------

// Called when the user change the theme style from the UI
function onThemeChanged() {

    canvas.epTagRenderer.currentTheme = themeChooser.value;
    document.epThemeEditor.refresh();
    canvasUpdate();
}

// Called when a menu button is clicked
// e: is the menu button that has been clicked
function onMenuButtonClick(e) {

    // Get all the menu buttons
    const buttons = document.getElementsByClassName("menu-button");

    // Hide all the containers linked with any menu button
    for (const b of buttons) {
        document.getElementById(b.target).style.display = 'none';
        b.classList.remove('selected-button');
    }

    // Show only the container linked with menu button that was clicked (e)
    e.classList.add('selected-button');
    document.getElementById(e.target).style.display = 'flex';
}

// Called when 'sourceImage' has loaded a new image
function onImageLoaded() {

    // Set the canvas the same width and height of the image
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    canvas.crossOrigin = "anonymous";

    // Reset the scale / offset values for the new image
    canvas.epInputHandler.reset();

    // Adjust the zoom of the overlay
    canvas.epInputHandler.zoomFactor = canvas.height * 0.001;
    canvas.epInputHandler.offset = {x: 20.0, y: 40.0};
}

// Called when the button to upload an image has been clicked
function onUploadImage(e) {

    uploadImageElement.fileNameNoExt = removeExtension(e.target.files[0].name);

    // Set the source of the image from the uploaded file
    sourceImage.src = URL.createObjectURL(e.target.files[0]);
}

//--------------------------------------------------------------------------------------------------------
// Helper functions
//--------------------------------------------------------------------------------------------------------

// Load the configuration json
async function loadConfig(configPath = 'json/ep_config.json') {

    const res = await fetch(configPath);
    if (!res.ok) {
        console.log(`Can't fetch JSON ${configPath} file`);
        return;
    }

    document.epConfig = await res.json();
}

// Draws the source image on the canvas
function canvasDrawImage() {

    context.resetTransform();
    context.drawImage(sourceImage, 0, 0);
}

// Draws the overlay on the canvas
function canvasDrawOverlay() {

    // Overlay upper-left corner position (x,y)
    const offset = canvas.epInputHandler.offset;
    // Scale factor
    const scale = canvas.epInputHandler.zoomFactor;
    // Overlay center (x,y)
    const center = {
        x: offset.x /*+ sourceImage.epOverlayCurSize.w / 2*/,
        y: offset.y /*+ sourceImage.epOverlayCurSize.h / 2*/
    };

    context.save();

    // Scaling with the overlay center as the pivot
    context.translate(center.x, center.y);
    context.scale(scale, scale);
    context.translate(-center.x, -center.y);

    // Rendering the overlay (exif and metadata tags)
    // 'epOverlayCurSize' contains the size of the overlay rect
    const tags = sourceImage.epTagReader.tags;
    /*sourceImage.epOverlayCurSize = */
    canvas.epTagRenderer.renderTags(tags, offset.x, offset.y);

    context.restore();
}

// Update the canvas (image + overlay)
function canvasUpdate() {

    if (!canvas.canRender) return;

    canvasDrawImage();
    canvasDrawOverlay();
}

// Show a random example image from those specified in the config file
function showExample() {

    const examples = document.epConfig['examples'];
    if (!examples) return;

    const imagePaths = Object.keys(examples);

    if (imagePaths.length === 0) return;

    const index = randomRange(0, imagePaths.length - 1);

    const path = imagePaths[index];

    const exampleInfo = examples[path];

    // Called when the example image has been loaded
    const onExampleLoaded = () => {

        canvas.epInputHandler.offset = exampleInfo['offset'];
        canvas.epInputHandler.zoomFactor = exampleInfo['scale'];

        uploadImageElement.fileNameNoExt = removeExtension(path);

        sourceImage.removeEventListener('load', onExampleLoaded);
    }

    sourceImage.addEventListener('load', onExampleLoaded);

    // Select the chosen theme for that example
    canvas.epTagRenderer.currentTheme = exampleInfo['theme'];
    themeChooser.value = exampleInfo['theme'];

    // Select the specified tags for that example
    document.epTagManager.selectedTags = exampleInfo['tags'];

    // If there are also some metrics change,,,
    if (exampleInfo.hasOwnProperty('metrics')) {

        const imageMetrics = exampleInfo['metrics'];

        //... update the current metrics with the specified values
        for (const key in imageMetrics) {

            if (Metrics.hasOwnProperty(key)) {

                Metrics[key] = imageMetrics[key];
            }
        }
    }

    // Load the example image
    sourceImage.src = path;
}

// Save the canvas into a file
function saveImage() {

    if (!uploadImageElement.fileNameNoExt) return;

    // Select the temporary element we have created for
    // helping to save the image
    downloadImageElement.setAttribute('download', uploadImageElement.fileNameNoExt + '_exif_printer.jpg');

    // Convert the canvas data to a image data URL
    const canvasData = canvas.toDataURL("image/jpeg", 0.92)

    // Replace it with a stream so that
    // it starts downloading
    canvasData.replace("image/jpeg", "image/octet-stream")

    // Set the location href to the canvas data
    downloadImageElement.setAttribute('href', canvasData);

    // Click on the link to start the download
    downloadImageElement.click();
}

// Convenience function to save the current settings in a JSON
// Not used in the release mode
function devSaveSettings() {

    const settings = {
        offset: canvas.epInputHandler.offset,
        scale: canvas.epInputHandler.zoomFactor,
        theme: canvas.epTagRenderer.currentTheme,
        selectedTags: document.epTagManager.selectedTags,
        metrics: Metrics
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
    downloadImageElement.setAttribute("href", dataStr);
    downloadImageElement.setAttribute("download", "ep_cur_settings.json");
    downloadImageElement.click();
}