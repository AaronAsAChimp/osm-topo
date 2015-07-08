var TriangleWriter = require('./triangle-writer');

function StlWriter(filename) {
	TriangleWriter.call(this, filename);

	this.total_triangles = 0;
}

StlWriter.prototype = Object.create(TriangleWriter.prototype);

StlWriter.prototype.calculate_vertex_offset = function (vert, component) {
	var FLOAT_BYTES = 4,
		COMPONENTS = 3,
		NORMAL_OFFSET = FLOAT_BYTES * COMPONENTS;

	return NORMAL_OFFSET + (vert * FLOAT_BYTES  * COMPONENTS) + (component * FLOAT_BYTES);
};

StlWriter.prototype.map_triangles = function (triangulator) {
	var triangles = triangulator.get_triangles();

	this.total_triangles += triangles.length;

	return {
		'verticies': triangulator.points,
		'triangles': triangles
	};
};

StlWriter.prototype.write_header = function () {
	this.stream.write('434F4C4F523D0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', 'hex');
};

StlWriter.prototype.write_content = function () {
	var writer = this,
		length_buffer = new Buffer(4);

	length_buffer.writeUInt32LE(this.total_triangles, 0);

	this.stream.write(length_buffer);

	// write the triangles
	this.triangulators.forEach(function (triangulator) {
		var triangles = triangulator.triangles;

		triangles.forEach(function (triangle) {
			var vert, vertex, scratch = new Buffer(50);
			
			// Write normal, applications will ignore this anyway.
			scratch.writeFloatLE(0, 0);
			scratch.writeFloatLE(0, 4);
			scratch.writeFloatLE(0, 8);

			// Write the verticies
			for (vert = 0; vert < 3; vert++) {
				vertex = triangle.lookup(vert).transform(writer.matrix);

				//console.log(vertex);

				scratch.writeFloatLE(vertex.x, writer.calculate_vertex_offset(vert, 0));
				scratch.writeFloatLE(vertex.y, writer.calculate_vertex_offset(vert, 1));
				scratch.writeFloatLE(vertex.z, writer.calculate_vertex_offset(vert, 2));
			}

			scratch.writeUInt16LE(0, 48);

			writer.stream.write(scratch);
		});

	});
};

StlWriter.prototype.write_footer = function () {
};

module.exports = StlWriter;

