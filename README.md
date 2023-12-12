![Version](https://img.shields.io/badge/version-v0.1.0-informational) ![License](https://img.shields.io/github/license/cloudofoz/js-exif-printer)

<h3 align="center">
  <img src="icons/app_icon.svg" width="512"/>
</h3>

<br/>

<h3 align="center">
A small web tool to automatically read and draw on photos their technical information (EXIF data), such as the camera model or focal length used. It is aimed at amateur and enthusiast photographers who want to share this data alongside their images.
</h3>

<h2 align="center">
  For the online version: <a href="https://www.cloudofoz.com/exif-printer/">click here</a>
</h2>


### Main features
* Responsive web design (desktop and mobile)
* Full resolution-indipendent vector graphics
* Theme editor for changing colors, styles (with color pickers and sliders) and metrics (line-spacing, icons and text size)
* Easily extendable (EXIF/IPTC tags are managed through a JSON)
* Tag Icons: Support for any <a href="https://fonts.google.com/icons">Google Material Symbol</a>
* Tag Icons: Basic support for custom SVG icons (with a parser to convert from SVG to a Path2D compatible with the renderer)
* Support for custom tags

<br/>

### Getting started
Instructions on how to use it are provided automatically when you open the page.

<br/>

### Dependencies
* [Materialize CSS](https://materializecss.com/)
* [exif-js](https://github.com/exif-js/exif-js) - A library for reading EXIF meta data from image files.
* [tinycolor](https://github.com/bgrins/TinyColor) - A small, fast library for color manipulation and conversion.
* [pickr](https://github.com/simonwep/pickr) - Flat, Simple, Hackable Color-Picker.

<br/>

### License
[MIT License](/LICENSE.md)
