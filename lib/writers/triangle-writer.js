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
	this.triangulators.push(this.map_triangles(triangulator));
};

TriangleWriter.prototype.finish = function (filename) {

	this.write_content();

	this.write_footer();

	return this.promise;
};

module.exports = TriangleWriter;