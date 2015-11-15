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

var Point3D = require('./primitives').Point3D;

function Shape() {

}

// Shape::tree_split_center
// ------------------------
// 
// Should return the center of this shape for purposes of storing in a
// quad tree.

Shape.prototype.tree_split_center = function (split_point) {
	throw 'Not Implemented';
};

// Shape::tree_can_fit
// -------------------
// 
// Should return true if the shape can fit inside of the give dimensions.

Shape.prototype.tree_can_fit = function (width, height) {
	throw 'Not Implemented';
};

// Shape::longest_side
// -------------------
// 
// Should return the longest side of the bounding box of this shape.

Shape.prototype.longest_side = function () {
	throw 'Not Implemented';
}


// Shape::contains_point
// ----------------------
// 
// Should return true if this shape contains the given point.

Shape.prototype.contains_point = function (point) {
	throw 'Not Implemented';
};

// Circle
// ======
// 
// An infinity sided regular polygon.

function Circle() {
	this.center = new Point3D();
	this.radius = 0;
}

Circle.prototype = Object.create(Shape.prototype);

Circle.prototype.tree_split_center = function () {
	return this.center;
};

Circle.prototype.tree_can_fit = function (width, height) {
	return ((this.radius * 2) <= width) && ((this.radius * 2) <= height);
};

Circle.prototype.longest_side = function () {
	return this.radius * 2;
}

Circle.prototype.contains_point = function (point) {
	return this.center.distance_2d(point) < this.radius;
};



// Polygon
// =======
// 
// An n-sided geometric shape.

function Polygon(sides, catalog) {
	this.sides = new Uint32Array(sides);
	this.catalog = catalog;
}

Polygon.prototype = Object.create(Shape.prototype);

Polygon.prototype.lookup = function (side) {
	return this.catalog[this.sides[side]];
};

// Polygon::edges
// --------------
// 
// Returns a list of edges.

Polygon.prototype.edges = function () {
	var edges = [],
		p1 = this.sides.length,
		p2 = 0, // initialize this to zero to handle the wrap around.
		edge;

	// inchworm backwards across the sides of the polygon.
	while (p1) {
		p1--;
		edge = new Uint32Array(2);
		edge[0] = this.sides[p1];
		edge[1] = this.sides[p2];
		edges.push(edge);

		p2 = p1;
	}

	return edges;
};

Polygon.prototype.has_edge = function (p1, p2) {
	var index = this.sides.indexOf(p1);

	if (index >= 0) {
		return (this.sides[index + 1] === p2) || (this.sides[index - 1] === p2);
	}

	return false;
};

// Triangle
// ========
// 
// A three sided polygon.

function Triangle(catalog) {
	Polygon.call(this, 3, catalog);
}

Triangle.prototype = Object.create(Polygon.prototype);

// Triangle::has_edge
// ------------------

Triangle.prototype.has_edge = function (p1, p2) {
	var index_of = Array.prototype.indexOf;

	return (index_of.call(this.sides, p1) >= 0) && (index_of.call(this.sides, p2) >= 0);
};

// Triangle::circumcircle
// ----------------------
// 
// Construct a circle that passes through all of the verticies of this triangle.

Triangle.prototype.circumcircle = function () {
	var circle,
		a = this.lookup(0),
		b = this.lookup(1),
		c = this.lookup(2),
		aa = a.x * a.x + a.y * a.y,
		bb = b.x * b.x + b.y * b.y,
		cc = c.x * c.x + c.y * c.y,
		divisor = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));

	if (divisor) {
		circle = new Circle();
		circle.center.x = (aa * (b.y - c.y) + bb * (c.y - a.y) + cc * (a.y - b.y)) / divisor;
		circle.center.y = (aa * (c.x - b.x) + bb * (a.x - c.x) + cc * (b.x - a.x)) / divisor;
		circle.center.z = 0;

		circle.radius = a.distance_2d(circle.center);
		circle.parent = this;
	} else {
		console.log('The divisor is ', divisor);
		console.log('The sides are ', this.sides);
	}

	return circle;
};

Triangle.prototype.contains_point = function (point) {
	var v1 = this.lookup(0),
		v2 = this.lookup(1),
		v3 = this.lookup(2),
		b1 = point.perp_dot(v1, v2) < 0,
		b2 = point.perp_dot(v2, v3) < 0,
		b3 = point.perp_dot(v3, v1) < 0;

	return (b1 === b2) && (b2 === b3);
};

module.exports = {
	'Shape': Shape,
	'Triangle': Triangle,
	'Circle': Circle
};
