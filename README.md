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

<h3 align="center">
  <img src="https://www.cloudofoz.com/exif-printer/screenshots/screen_01.jpg" align="right" style="margin-bottom:20px;"/>
</h3>


### Main features
* Responsive web design (desktop and mobile)
* Full resolution-indipendent vector graphics
* Theme editor for changing colors, styles (with color pickers and sliders) and metrics (line-spacing, icons and text size)
* Easily extendable (EXIF/IPTC tags are managed through a JSON)
* Tag Icons: Support for any <a href="https://fonts.google.com/icons">Google Material Symbol</a>
* Tag Icons: Basic support for custom SVG icons (with a parser to convert from SVG to a Path2D compatible with the renderer)
* Support for custom tags
* 100% front-end: data is never uploaded to the server

<br/>

### How to
#### Use the tool
Instructions on how to use it are provided automatically when you open the page.
#### Add a new tag
Adding a new tag is very simple. In this example I'll show you how to enable the display of the photo `copyright` tag.
Simply add this entry to `ep_tags_data.json`:
```
"copyright": {
    "iconID": "copyright",
    "iconType": "material_symbol",
    "name": "Copyright",
    "desc": "Who owns the copyright of this image.",
    "tagID": "Copyright",
    "tagType": "exif"
}
```
* `iconID`: It can be the code of a **Google Material Symbol**, like in this case, or a path to a **SVG**.
* `iconType`: It can be `material_symbol` if `iconID` is the code of a **Material Symbol** or `local_svg` if `iconID` is the path of an **SVG**. An SVG icon has to be centered in a box of `(0, 0, 24, 24)` pixels and can have only a combination of ***two*** styles named `fillStyle` and `strokeStyle`. **EXIF Printer** will fill any path called `fillStyle` and draw the outline of any path called `strokeStyle`. Real colouring and styling are completely managed by **EXIF Printer**.
* `name`: It's the name displayed when you click on the icon
* `desc`: It'a brief description of the tag, it will displayed alongsie `name`.
* `tagID`: It's the **key** used by `exif-js` to store the EXIF/IPTC tag. It can be a **custom unique id** for custom tags.
* `tagType`: It can be `exif` if `tagID` is an **EXIF** tag id. Other possible values are: `iptc` or `custom`. Custom tags have to be manually implemented inside the code.
### Test the project locally
**Python** can be used to start a server in the project path:
* Navigate to the **EXIF Printer** directory.
* Execute the command to start the server:
  
**Python 2** — `python -m SimpleHTTPServer 8000`

**Python 3** — `python -m http.server 8000`
* Open a web browser at `http://localhost:8000/`.

<br/>

### Dependencies
* [Materialize CSS](https://materializecss.com/)
* [exif-js](https://github.com/exif-js/exif-js) - A library for reading EXIF meta data from image files.
* [tinycolor](https://github.com/bgrins/TinyColor) - A small, fast library for color manipulation and conversion.
* [pickr](https://github.com/simonwep/pickr) - Flat, Simple, Hackable Color-Picker.

<br/>

### License
[MIT License](/LICENSE.md)
