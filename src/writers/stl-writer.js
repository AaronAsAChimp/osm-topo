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

import TriangleWriter from './triangle-writer';

export default
class StlWriter extends TriangleWriter {
	constructor (filename) {
		super(filename);

		this.total_triangles = 0;
	}

	static
	get_extension () {
		return '.stl';
	}

	calculate_vertex_offset (vert, component) {
		const FLOAT_BYTES = 4,
			COMPONENTS = 3,
			NORMAL_OFFSET = FLOAT_BYTES * COMPONENTS;

		return NORMAL_OFFSET + (vert * FLOAT_BYTES  * COMPONENTS) + (component * FLOAT_BYTES);
	}

	map_triangles (triangulator) {
		var triangles = triangulator.get_triangles();

		this.total_triangles += triangles.length;

		return {
			'verticies': triangulator.points,
			'triangles': triangles
		};
	}

	write_header () {
		this.stream.write('434F4C4F523D0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', 'hex');
	}

	write_content () {
		var writer = this,
			length_buffer = new Buffer(4);

		length_buffer.writeUInt32LE(this.total_triangles, 0);

		this.stream.write(length_buffer);

		// write the triangles
		this.triangulators.forEach(function (triangulator) {
			var triangles = triangulator.triangles;

			triangles.forEach(function (triangle) {
				var scratch = new Buffer(50);
				
				// Write normal, applications will ignore this anyway.
				scratch.writeFloatLE(0, 0);
				scratch.writeFloatLE(0, 4);
				scratch.writeFloatLE(0, 8);

				// Write the verticies
				for (let vert = 0; vert < 3; vert++) {
					let vertex = triangle.lookup(vert).transform(writer.matrix);

					//console.log(vertex);

					scratch.writeFloatLE(vertex.x, writer.calculate_vertex_offset(vert, 0));
					scratch.writeFloatLE(vertex.y, writer.calculate_vertex_offset(vert, 1));
					scratch.writeFloatLE(vertex.z, writer.calculate_vertex_offset(vert, 2));
				}

				scratch.writeUInt16LE(0, 48);

				writer.stream.write(scratch);
			});

		});
	}

	write_footer () {}

}
