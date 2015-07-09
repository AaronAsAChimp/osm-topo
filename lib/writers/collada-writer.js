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

var TriangleWriter = require('./triangle-writer'),
	fs = require('fs'),
	_ = require('lodash');

function ColladaWriter(filename) {
	TriangleWriter.call(this, filename);

	this._last_id = 0;
	this.visual_scene_id = this.get_id();
	this.template_source = fs.readFileSync(__dirname + '/../../template/writers/collada.templ');
	this.template = _.template(this.template_source);
}

ColladaWriter.prototype = Object.create(TriangleWriter.prototype);

ColladaWriter.prototype.get_id = function () {
	return 'ID' + this._last_id++;
};

ColladaWriter.prototype.flatten_points = function (points) {
	var flat = '',
		writer = this;

	points.forEach(function (point) {
		flat += writer.join(point.position);
	});

	return flat;
};

ColladaWriter.prototype.flatten_triangles = function (triangles) {
	var flat = '',
		writer = this;

	triangles.forEach(function (triangle) {
		flat += writer.join(triangle.sides);
	});

	return flat;
};

ColladaWriter.prototype.join = function (typed_array) {
	var flat = '',
		sx;

	for (sx in typed_array) {
		if (typed_array.hasOwnProperty(sx)) {
			flat += typed_array[sx] + ' ';
		}
	}

	return flat;
};

ColladaWriter.prototype.map_triangles = function (triangulator) {
	return {
		'geometry_id': this.get_id(),
		'vertex_id': this.get_id(),
		'verticies': triangulator.points,
		'triangles': triangulator.get_triangles()
	};
};

ColladaWriter.prototype.write_header = function () {
};

ColladaWriter.prototype.write_content = function () {
	this.stream.write(this.template(this));
};

ColladaWriter.prototype.write_footer = function () {
};

module.exports = ColladaWriter;