/*
    osm-topo - 3D map generator
    Copyright (C) 2015  Aaron Spaulding

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

var LatLng2D = require('./primitives').LatLng2D;

function GeometryProvider(bbox) {
	this.bbox = bbox;
}

// A generator for the coordinates provided by this object.
// yields primitives.LatLng2D
GeometryProvider.prototype.get_coords = function () {
	throw 'Not Implemented';
};

module.exports = GeometryProvider;
