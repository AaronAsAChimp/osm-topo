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

const EARTH_RADIUS = 6378100, // The equitorial radius in meters, source http://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
	EARTH_CIRCUMFERENCE = EARTH_RADIUS * 2 * Math.PI,
	DEGS_PER_RAD = 180 / Math.PI,
	RADS_PER_DEG = Math.PI / 180,
	PI_4 = Math.PI / 4;

class Point extends Float64Array {

	// Point::distance
	// -----------------
	// 
	// Calculate the distance between this and another point.

	distance (point) {
		var delta = this.subtract(point);

		// console.log('delta', this.z, point.z);

		return delta.length();
	}

}

// Point2D
// =======
// 
// A point in 2 dimensional space.

class Point2D extends Point {

	constructor (x, y) {
		super(2);

		this.x = x || 0;
		this.y = y || 0;
	}

	get x () {
		return this[0];
	}

	set x (val) {
		this[0] = val;
	}

	get y () {
		return this[1];
	}

	set y (val) {
		this[1] = val;
	}

	// Point2D::perp_dot
	// -----------------
	// 
	// Calculate the perpendicular dot product between this and two other points.
	// 
	// This can be useful to find which side of a line segment this point lies.

	perp_dot (p1, p2) {
		return (this.x - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (this.y - p2.y);
	}

	// Point2D::geo
	// ------------
	// 
	// Project tile coordinates into geographic coordinates

	geo (zoom) {
		var geo = new LatLng2D(),
			n = Math.PI - 2 * Math.PI * this.y / zoom;

		geo.lng = this.x / zoom * 360 - 180;
		geo.lat = DEGS_PER_RAD * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

		// console.log(this, geo);

		return geo;
	}

	// Point2D::subtract
	// -----------------
	// 
	// Subtract this vector from the specified one.

	subtract (point) {
		var result = new Point2D();

		// console.log('subtract 2D');

		result.x = this.x - point.x;
		result.y = this.y - point.y;

		return result;
	}

	// Point2D::length
	// ---------------
	// 
	// Calcualate the length of this vector.

	length () {
		return Math.sqrt((this.x * this.x) + (this.y * this.y));
	}
}

Point2D.prototype.subtract_2d = Point2D.prototype.subtract;
Point2D.prototype.length_2d = Point2D.prototype.length;


// Point3D
// =======
// 
// A point in 3 dimensional space.

class Point3D extends Point {
	constructor (x, y, z) {

		super(3);

		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
	}

	get x () {
		return this[0];
	}

	set x (val) {
		this[0] = val;
	}

	get y () {
		return this[1];
	}

	set y (val) {
		this[1] = val;
	}

	get z () {
		return this[2];
	}

	set z (val) {
		this[2] = val;
	}

	// Point3D::subtract
	// -----------------
	// 
	// Subtract this vector from the specified one.

	subtract (point) {
		var result = new Point3D();

		result.x = this.x - point.x;
		result.y = this.y - point.y;
		result.z = this.z - (point.z || 0);

		// console.log('subtract 3D', this.z, point.z);

		return result;
	}

	// Point3D::length
	// ---------------
	// 
	// Calcualate the length of this vector.

	length () {
		return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
	}

	transform (matrix) {
		var result = new Point3D(),
			mat = matrix,
			vx = this.x,
			vy = this.y,
			vz = this.z,
			cw = (mat[12] * vx) + (mat[13] * vy) + (mat[14] * vz) + mat[15];

		result.x = ((mat[0] * vx) + (mat[1] * vy) + (mat[2] * vz) + mat[3]) / cw;
		result.y = ((mat[4] * vx) + (mat[5] * vy) + (mat[6] * vz) + mat[7]) / cw;
		result.z = ((mat[8] * vx) + (mat[9] * vy) + (mat[10] * vz) + mat[11]) / cw;

		return result;
	}

	// Point3D::distance_2d
	// --------------------
	// 
	// Calculate the distanct between to points using only the x and
	// y components.

	distance_2d (point) {
		var delta = this.subtract_2d(point);

		return delta.length_2d();
	}
}

// Borrow some methods from Point2D.

Point3D.prototype.geo = Point2D.prototype.geo;
Point3D.prototype.subtract_2d = Point2D.prototype.subtract;
Point3D.prototype.length_2d = Point2D.prototype.length;


class Matrix extends Float64Array {

}

// Matrix3D
// ========
// 
// [ 00 01 02 03
//   04 05 06 07
//   08 09 10 11
//   12 13 14 15 ]

class Matrix3D extends Matrix {
	constructor () {
		super(16);
	}

	multiply (op2) {
		var op2e = op2;
		var op1e = this;

		var a11 = op2e[0], a12 = op2e[4], a13 = op2e[8], a14 = op2e[12];
		var a21 = op2e[1], a22 = op2e[5], a23 = op2e[9], a24 = op2e[13];
		var a31 = op2e[2], a32 = op2e[6], a33 = op2e[10], a34 = op2e[14];
		var a41 = op2e[3], a42 = op2e[7], a43 = op2e[11], a44 = op2e[15];

		var b11 = op1e[0], b12 = op1e[4], b13 = op1e[8], b14 = op1e[12];
		var b21 = op1e[1], b22 = op1e[5], b23 = op1e[9], b24 = op1e[13];
		var b31 = op1e[2], b32 = op1e[6], b33 = op1e[10], b34 = op1e[14];
		var b41 = op1e[3], b42 = op1e[7], b43 = op1e[11], b44 = op1e[15];

		this[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		this[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		this[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		this[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

		this[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		this[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		this[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		this[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

		this[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		this[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		this[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		this[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

		this[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		this[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		this[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		this[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
	}
}

// Factory methods

Matrix3D.scale = function (x, y, z) {
	var mat = new Matrix3D();

	mat[0] = x;
	mat[5] = y;
	mat[10] = z;
	mat[15] = 1;

	return mat;
};

Matrix3D.identity = function () {
	return Matrix3D.scale(1, 1, 1);
};

Matrix3D.translate = function (x, y, z) {
	var mat = Matrix3D.identity();

	mat[3] = x;
	mat[7] = y;
	mat[11] = z;

	return mat;
};

// Line
// ====

function Line() {
	this.p1 = new Point3D();
	this.p2 = new Point3D();
}

Line.prototype.intersect = function (line) {
	function determinant(m1, m2, m3, m4) {
		return (m1 * m4) - (m2 * m3);
	}

	var intersection = null,
		// pre calculate the determinants for the current line.
		this_det = determinant(this.p1.x, this.p1.y, this.p2.x, this.p2.y),
		this_det_x = determinant(this.p1.x, 1, this.p2.x, 1),
		this_det_y = determinant(this.p1.y, 1, this.p2.y, 1),

		// pre calculate the determinants for the line passed in.
		line_det = determinant(line.p1.x, line.p1.y, line.p2.x, line.p2.y),
		line_det_x = determinant(line.p1.x, 1, line.p2.x, 1),
		line_det_y = determinant(line.p1.y, 1, line.p2.y, 1),

		// pre calculate the determinant for the divisor
		divisor = determinant(this_det_x, this_det_y, line_det_x, line_det_y);

	if (divisor) {
		intersection = new Point3D();

		intersection.x = determinant(this_det, this_det_x, line_det, line_det_x) / divisor;
		intersection.y = determinant(this_det, this_det_y, line_det, line_det_y) / divisor;
		intersection.z = 0;
	}

	return intersection;
};

// LatLng2D
// ========
// 
// A 2 dimensional point on the surface of the earth.

class LatLng2D extends Point {
	constructor (lat, lng) {
		super(2);

		this.lat = lat;
		this.lng = lng;
	}

	get lat () {
		return this[0];
	}

	set lat (val) {
		this[0] = val;
	}

	get lng () {
		return this[1];
	}

	set lng (val) {
		this[1] = val;
	}

	// LatLng2D::tile()
	// ----------------
	// 
	// Accepts the zoom level of the tiles.
	// 
	// Returns a Point3D with the lat and long projected on to a tile.

	tile (zoom) {
		var tile = new Point3D(),
			lat_rads = this.lat * RADS_PER_DEG;

		tile.x = ((this.lng + 180) / 360) * zoom;
		tile.y = (1 - Math.log(Math.tan(lat_rads) + 1 / Math.cos(lat_rads)) / Math.PI) / 2 * zoom;

		return tile;
	}
}

// LatLng3D
// ========
// 
// A 3 dimensional point on the surface of the earth.

class LatLng3D extends Point {
	constructor (lat, lng, ele) {
		super(3);
	}

	get lat () {
		return this[0];
	}

	set lat (val) {
		this[0] = val;
	}

	get lng () {
		return this[1];
	}

	set lng (val) {
		this[1] = val;
	}

	get ele () {
		return this[2];
	}

	set ele (val) {
		this[2] = val;
	}

	// LatLng3D::tile()
	// ----------------
	// 
	// Accepts the zoom level of the tiles.
	// 
	// Returns a Point3D with the lat, long, and elevation projected on to a tile.

	tile (zoom) {
		var tile = LatLng2D.prototype.tile.call(this, zoom),
			meters_per_tile = EARTH_CIRCUMFERENCE / zoom;

		tile.z = this.ele / meters_per_tile;

		return tile;
	}
}

// BoundingBox2D
// =============
// 
// A bounding box for 2 dimensional data.

function BoundingBox2D() {
	this.minimum = new Point3D();
	this.maximum = new Point3D();
}

// BoundingBox2D::tile
// -------------------
// 
// Project tile coordinates into geographic coordinates.

BoundingBox2D.prototype.geo = function (zoom) {
	var geo = new GeoBoundingBox2D(),
		temp;

	geo.minimum = this.minimum.geo(zoom);
	geo.maximum = this.maximum.geo(zoom);

	// swap the latitudes
	temp = geo.minimum.lat;

	geo.minimum.lat = geo.maximum.lat;
	geo.maximum.lat = temp;

	return geo;
};

// BoudingBox2D::width
// -------------------
// 
// Calculate the width of the bounding box.

BoundingBox2D.prototype.width = function () {
	return this.maximum.x - this.minimum.x;
};

// BoudingBox2D::height
// -------------------
// 
// Calculate the height of the bounding box.

BoundingBox2D.prototype.height = function () {
	return this.maximum.y - this.minimum.y;
};

// BoundingBox2D::center
// ---------------------
// 
// Calculate the center of the bounding box.

BoundingBox2D.prototype.center = function () {
	var center = new Point2D();

	center.x = this.minimum.x + (this.width() / 2);
	center.y = this.minimum.y + (this.height() / 2);

	return center;
};

// BoundingBox2D::decompose
// ------------------------
// 
// Split the bounding box into an array of points.

BoundingBox2D.prototype.decompose = function () {
	var top_right = new Point3D(),
		bottom_left = new Point3D();

	bottom_left.x = this.minimum.x;
	bottom_left.y = this.maximum.y;

	top_right.x = this.maximum.x;
	top_right.y = this.minimum.y;


	return [
		this.minimum,
		top_right,
		this.maximum,
		bottom_left
	];
};

// GeoBoundingBox2D
// ================
// 
// A bounding box for 2 dimensional geographic data.

function GeoBoundingBox2D() {
	this.minimum = new LatLng2D();
	this.maximum = new LatLng2D();
}

// GeoBoundingBox2D::tile()
// ------------------------
// 
// Accepts the zoom level of the tiles.
// 
// Returns a Point3D with the lat and long projected on to a tile.

GeoBoundingBox2D.prototype.tile = function (zoom) {
	var tile = new BoundingBox2D();

	tile.minimum = this.minimum.tile(zoom);
	tile.maximum = this.maximum.tile(zoom);

	let temp = tile.minimum.y;

	tile.minimum.y = tile.maximum.y;
	tile.maximum.y = temp;

	return tile;
};

// GeoBoundingBox2D::to_overpass()
// ------------------------
// 
// Returns a string for this bounding box that can be passsed to an
// OSM overpass query.

GeoBoundingBox2D.prototype.to_overpass = function () {
	return this.minimum.lat + ',' + this.minimum.lng + ',' + this.maximum.lat + ',' + this.maximum.lng;
};

module.exports = {
	'Point': Point,
	'Point2D': Point2D,
	'Point3D': Point3D,
	'Matrix3D': Matrix3D,
	'Line': Line,
	'LatLng2D': LatLng2D,
	'LatLng3D': LatLng3D,
	'BoundingBox2D': BoundingBox2D,
	'GeoBoundingBox2D': GeoBoundingBox2D
};
