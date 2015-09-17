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

var fs = require('fs'),
	Matrix3D = require('../geometry/primitives').Matrix3D;

function TriangleWriter (filename) {
	var writer = this;

	this.triangulators = [];
	this.matrix = Matrix3D.identity();

	this.stream = fs.createWriteStream(filename, {
		'flags': 'w'
	});

	this.promise = new Promise(function (resolve, reject) {
		writer.stream.on('err', function (err) {
			reject();
		});

		writer.stream.on('finish', function () {
			resolve();
		});
	});

	console.log('Writing header');
	this.write_header();
}

module.exports = TriangleWriter;

TriangleWriter.prototype.map_triangles = function () {
	throw 'Not Implemented';
};

TriangleWriter.prototype.write_header = function () {
	throw 'Not Implemented';
};

TriangleWriter.prototype.write_content = function () {
	throw 'Not Implemented';
};

TriangleWriter.prototype.write_footer = function () {
	throw 'Not Implemented';
};

TriangleWriter.prototype.add = function (triangulator) {
	if (triangulator) {
		this.triangulators.push(this.map_triangles(triangulator));
	} else {
		throw new Error('Triangulator was not defined');
	}
};

TriangleWriter.prototype.finish = function () {
	console.log('Writing content');
	this.write_content();

	console.log('Writing footer');
	this.write_footer();

	this.stream.end();

	return this.promise;
};

module.exports = TriangleWriter;