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
	_ = require('lodash');

import TriangleWriter from './triangle-writer';

export default
class ColladaWriter extends TriangleWriter {

	constructor (filename) {
		super(filename);

		this._last_id = 0;
		this.visual_scene_id = this.get_id();
		this.template_source = fs.readFileSync(__dirname + '/../../template/writers/collada.templ');
		this.template = _.template(this.template_source);
	}

	static
	get_extension () {
		return '.dae';
	}

	get_id () {
		return 'ID' + this._last_id++;
	}

	flatten_texcoords (points) {
		var flat = '',
			writer = this;

		points.forEach(function (point) {
			let transformed = point.transform(writer.matrix);

			flat += transformed.x.toPrecision(8) + ' ';
			flat += transformed.y.toPrecision(8) + ' ';
		});

		return flat;
	}

	flatten_points (points) {
		var flat = '',
			writer = this;

		points.forEach(function (point) {
			flat += writer.join(point);
		});

		return flat;
	}

	flatten_triangles (triangles) {
		var flat = '',
			writer = this;

		triangles.forEach(function (triangle) {
			flat += writer.join(triangle.sides);
		});

		return flat;
	}

	join (typed_array) {
		var flat = '',
			sx;

		for (sx of typed_array) {
			flat += sx + ' ';
		}

		return flat;
	}

	map_triangles (triangulator) {
		return {
			'geometry_id': this.get_id(),
			'vertex_id': this.get_id(),
			'texcoord_id': this.get_id(),
			'effect_id': this.get_id(),
			'material_id': this.get_id(),
			'image_id': this.get_id(),
			'image_path': triangulator.get_image_path(),
			'verticies': triangulator.points,
			'triangles': triangulator.get_triangles()
		};
	}

	write_header () {}

	write_content () {
		this.stream.write(this.template(this));
	}

	write_footer () {}

}