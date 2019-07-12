// @flow

//global document


export function insertCSS(cssText: string) {
  let head = document.head;
  let styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode(cssText));
  head.insertBefore(styleElement, head.firstChild);
}


export const chooser_css = `

div.timeRangeChooser div div.hourminpopup {
    z-index: 9999;
    display: block;
    position: relative;
    color: #333;
    background-color: white;
    border: 1px solid #ccc;
    border-bottom-color: #bbb;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    box-shadow: 0 5px 15px -5px rgba(0,0,0,.5);
}



.hourminpopup.is-hidden {
    display: none;
}
.hourminpopup.is-bound {
    position: absolute;
    box-shadow: 0 5px 15px -5px rgba(0,0,0,.5);
    background-color: white;
}

div.hourminpopup div label {
  display: block;
  float: right;
}
div.hourminpopup div {
    display: block;
    float: right;
    clear: both;
}

div.hourminpopup input {
    width: 150px;
}

div.timeRangeChooser div {
  margin: 2px;
}

input.pikaday {
  width: 70px;
}
input.pikatime {
  width: 50px;
}

`;


export const pikaday_css = `
@charset "UTF-8";

/*!
 * Pikaday
 * Copyright © 2014 David Bushell | BSD & MIT license | http://dbushell.com/
 */

.pika-single {
    z-index: 9999;
    display: block;
    position: relative;
    color: #333;
    background: #fff;
    border: 1px solid #ccc;
    border-bottom-color: #bbb;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

/*
clear child float (pika-lendar), using the famous micro clearfix hack
http://nicolasgallagher.com/micro-clearfix-hack/
*/
.pika-single:before,
.pika-single:after {
    content: " ";
    display: table;
}
.pika-single:after { clear: both }
.pika-single { *zoom: 1 }

.pika-single.is-hidden {
    display: none;
}

.pika-single.is-bound {
    position: absolute;
    box-shadow: 0 5px 15px -5px rgba(0,0,0,.5);
}

.pika-lendar {
    float: left;
    width: 240px;
    margin: 8px;
}

.pika-title {
    position: relative;
    text-align: center;
}

.pika-label {
    display: inline-block;
    *display: inline;
    position: relative;
    z-index: 9999;
    overflow: hidden;
    margin: 0;
    padding: 5px 3px;
    font-size: 14px;
    line-height: 20px;
    font-weight: bold;
    background-color: #fff;
}
.pika-title select {
    cursor: pointer;
    position: absolute;
    z-index: 9998;
    margin: 0;
    left: 0;
    top: 5px;
    filter: alpha(opacity=0);
    opacity: 0;
}

.pika-prev,
.pika-next {
    display: block;
    cursor: pointer;
    position: relative;
    outline: none;
    border: 0;
    padding: 0;
    width: 20px;
    height: 30px;
    /* hide text using text-indent trick, using width value (it's enough) */
    text-indent: 20px;
    white-space: nowrap;
    overflow: hidden;
    background-color: transparent;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: 75% 75%;
    opacity: .5;
    *position: absolute;
    *top: 0;
}

.pika-prev:hover,
.pika-next:hover {
    opacity: 1;
}

.pika-prev,
.is-rtl .pika-next {
    float: left;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAeCAYAAAAsEj5rAAAAUklEQVR42u3VMQoAIBADQf8Pgj+OD9hG2CtONJB2ymQkKe0HbwAP0xucDiQWARITIDEBEnMgMQ8S8+AqBIl6kKgHiXqQqAeJepBo/z38J/U0uAHlaBkBl9I4GwAAAABJRU5ErkJggg==');
    *left: 0;
}

.pika-next,
.is-rtl .pika-prev {
    float: right;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAeCAYAAAAsEj5rAAAAU0lEQVR42u3VOwoAMAgE0dwfAnNjU26bYkBCFGwfiL9VVWoO+BJ4Gf3gtsEKKoFBNTCoCAYVwaAiGNQGMUHMkjGbgjk2mIONuXo0nC8XnCf1JXgArVIZAQh5TKYAAAAASUVORK5CYII=');
    *right: 0;
}

.pika-prev.is-disabled,
.pika-next.is-disabled {
    cursor: default;
    opacity: .2;
}

.pika-select {
    display: inline-block;
    *display: inline;
}

.pika-table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    border: 0;
}

.pika-table th,
.pika-table td {
    width: 14.285714285714286%;
    padding: 0;
}

.pika-table th {
    color: #999;
    font-size: 12px;
    line-height: 25px;
    font-weight: bold;
    text-align: center;
}

.pika-button {
    cursor: pointer;
    display: block;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    outline: none;
    border: 0;
    margin: 0;
    width: 100%;
    padding: 5px;
    color: #666;
    font-size: 12px;
    line-height: 15px;
    text-align: right;
    background: #f5f5f5;
}

.pika-week {
    font-size: 11px;
    color: #999;
}

.is-today .pika-button {
    color: #33aaff;
    font-weight: bold;
}

.is-selected .pika-button,
.has-event .pika-button {
    color: #fff;
    font-weight: bold;
    background: #33aaff;
    box-shadow: inset 0 1px 3px #178fe5;
    border-radius: 3px;
}

.has-event .pika-button {
    background: #005da9;
    box-shadow: inset 0 1px 3px #0076c9;
}

.is-disabled .pika-button,
.is-inrange .pika-button {
    background: #D5E9F7;
}

.is-startrange .pika-button {
    color: #fff;
    background: #6CB31D;
    box-shadow: none;
    border-radius: 3px;
}

.is-endrange .pika-button {
    color: #fff;
    background: #33aaff;
    box-shadow: none;
    border-radius: 3px;
}

.is-disabled .pika-button {
    pointer-events: none;
    cursor: default;
    color: #999;
    opacity: .3;
}

.is-outside-current-month .pika-button {
    color: #999;
    opacity: .3;
}

.is-selection-disabled {
    pointer-events: none;
    cursor: default;
}

.pika-button:hover,
.pika-row.pick-whole-week:hover .pika-button {
    color: #fff;
    background: #ff8000;
    box-shadow: none;
    border-radius: 3px;
}

/* styling for abbr */
.pika-table abbr {
    border-bottom: none;
    cursor: help;
}

`;


export const seismograph_css = `

.predicted polygon {
  fill: rgba(220,220,220,.4);
}

.pick polygon {
  fill: rgba(255,100,100,.4);
}

path.seispath {
  stroke: skyblue;
  fill: none;
  stroke-width: 1px;
}

path.orientZ {
  stroke: seagreen;
}

path.orientN {
  stroke: cornflowerblue;
}

path.orientE {
  stroke: orange;
}


path.seispath {
  stroke: skyblue;
  fill: none;
  stroke-width: 1px;
}

svg.seismograph {
  height: 100%;
  width: 100%;
}

canvas.seismograph {
  height: 100%;
  width: 100%;
}

div.container-wide {
  display: inline-block;
  position: relative;
  width: 100%;
  padding-bottom: 40%; /* aspect ratio */
  vertical-align: top;
  overflow: hidden;
}

svg.realtimePlot g.allsegments g path.seispath {
  stroke: skyblue;
}

svg.overlayPlot g.allsegments g:nth-child(9n+1) path.seispath {
  stroke: skyblue;
}

svg.overlayPlot g.allsegments g:nth-child(9n+2) path.seispath {
  stroke: olivedrab;
}

svg.overlayPlot g.allsegments g:nth-child(9n+3) path.seispath {
  stroke: goldenrod;
}

svg.overlayPlot g.allsegments g:nth-child(9n+4) path.seispath {
  stroke: firebrick;
}

svg.overlayPlot g.allsegments g:nth-child(9n+5) path.seispath {
  stroke: darkcyan;
}

svg.overlayPlot g.allsegments g:nth-child(9n+6) path.seispath {
  stroke: orange;
}

svg.overlayPlot g.allsegments g:nth-child(9n+7) path.seispath {
  stroke: darkmagenta;
}

svg.overlayPlot g.allsegments g:nth-child(9n+8) path.seispath {
  stroke: mediumvioletred;
}

svg.overlayPlot g.allsegments g:nth-child(9n+9) path.seispath {
  stroke: sienna;
}

/* same colors for titles */

svg.overlayPlot g.title tspan:nth-child(9n+1)  {
  fill: skyblue;
}

svg.overlayPlot g.title tspan:nth-child(9n+2)  {
  stroke: olivedrab;
}

svg.overlayPlot g.title tspan:nth-child(9n+3)  {
  stroke: goldenrod;
}

svg.overlayPlot g.title tspan:nth-child(9n+4)  {
  stroke: firebrick;
}

svg.overlayPlot g.title tspan:nth-child(9n+5)  {
  stroke: darkcyan;
}

svg.overlayPlot g.title tspan:nth-child(9n+6)  {
  stroke: orange;
}

svg.overlayPlot g.title tspan:nth-child(9n+7)  {
  stroke: darkmagenta;
}

svg.overlayPlot g.title tspan:nth-child(9n+8)  {
  stroke: mediumvioletred;
}

svg.overlayPlot g.title tspan:nth-child(9n+9)  {
  stroke: sienna;
}


/* links in svg */
svg text a {
  fill: #0000EE;
  text-decoration: underline;
}

`;


insertCSS(chooser_css);
insertCSS(seismograph_css);
insertCSS(pikaday_css);
