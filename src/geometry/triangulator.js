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

var Point3D = require('./primitives').Point3D,
	Triangle = require('./shapes').Triangle,
	//QuadTree = require('./quad-tree'),
	BoundingBox2D = require('./primitives').BoundingBox2D;

import chalk from 'chalk';
import QuadTree from './linear-quad-tree';

// Triangulator
// ============
//
// Use the Bowyer-Watson algorithm to triangulate the points.

export default
class Triangulator {
	constructor (bbox) {
		if (!(bbox instanceof BoundingBox2D)) {
			throw 'Illegal Argument: bbox';
		}

		//console.log(bbox);

		let point_down = new Point3D(),
			point_right = new Point3D();

		this.bbox = bbox;

		this.points = [
			bbox.minimum,
			point_down,
			point_right
		];

		// Construct the initial triangle.

		point_down.x = bbox.minimum.x;
		point_down.y = bbox.maximum.y + bbox.height();
		point_down.z = 0;

		point_right.x = bbox.maximum.x + bbox.width();
		point_right.y = bbox.minimum.y;
		point_right.z = 0;

		this.super_triangle = new Triangle(this.points);
		this.super_triangle.sides[0] = 0;
		this.super_triangle.sides[1] = 1;
		this.super_triangle.sides[2] = 2;

		// console.log('Adding supertriangle');

		// Construct a quad tree of all the circumcircles
		this.quads = new QuadTree(bbox);
		this.quads.add(this.super_triangle.circumcircle());
	}

	add (point) {
		var	triangulator = this,
			bad_circles = [],
			point_index = this.points.length;

		// Add the point to the catalog.
		this.points.push(point);

		//console.log('Adding point', point.x + ',' + point.y + ', ' + point.z);

		// console.log('---- bad circles: begin ----');
		// console.log('Circles found for point: ', point);

		for (let circ of this.quads.find(point)) {

			// console.log(circ);

			// add it the bad triangle to the list for use later.
			bad_circles.push(circ);
		}

		// console.log('---- bad circles: end ----');

		// re-triangulate the hole
		for (let bad_circ of bad_circles) {
			let sides = bad_circ.parent.edges();

			// console.log('bad triangle is', bad_circ.parent);
			//console.log('bad triangle has sides ', sides);

			// remove the bad triangles
			triangulator.quads.remove(bad_circ);

			// Find and remove shared edges, so that we only have the external edges
			// of the polygon.
			for (let circ of bad_circles) {
				let tri = circ.parent;

				if (bad_circ !== circ) {
					if (tri.has_edge.apply(tri, sides[2])) {
						// console.log('Edge ' + 2 + ' matches');
						sides.splice(2, 1);
					}

					if (tri.has_edge.apply(tri, sides[1])) {
						// console.log('Edge ' + 1 + ' matches');
						sides.splice(1, 1);
					}

					if (tri.has_edge.apply(tri, sides[0])) {
						// console.log('Edge ' + 0 + ' matches');
						sides.splice(0, 1);
					}
				}
			}

			// Triangulate the remaining sides of the polygon with the
			// current point.
			for (let side of sides) {
				let tri = new Triangle(triangulator.points),
					circle;

				tri.sides[0] = side[0];
				tri.sides[1] = side[1];
				tri.sides[2] = point_index;

				// console.log('Adding triangle ', tri.sides);

				// Its possible to create an triangle with an area of 0.
				// In which case constructing the circumcircle will fail.
				circle = tri.circumcircle();

				if (circle) {
					triangulator.quads.add(circle);
				} else {
					console.warn('Found triangle with an area of 0, the surface may contain tears.');
				}
			}
		}
	}

	get_triangles () {
		var triangles = [];

		for (let circle of this.quads.each()) {
			// console.log('The circle is: ', circle);
			let tri = circle.parent,
				is_super = false,
				point;

			for (point in tri.sides) {
				if (tri.sides[point] < 3) {
					is_super = true;
				}
			}

			// if its not connected to the super triangle add it to the result set.
			if (!is_super) {
				triangles.push(circle.parent);
			}
		}

		console.log(' - ' + chalk.cyan(triangles.length) + ' Triangles created');

		//this.quads.render('quad-tree.png');

		return triangles;
	}

	get_layer () {
		return this.quads.map((circle) => circle.parent);
	}

	set_image_path (path) {
		this._image_path = path;
	}

	get_image_path () {
		return this._image_path;
	}
}
