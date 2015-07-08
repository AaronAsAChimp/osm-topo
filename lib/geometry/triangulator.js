var Point3D = require('./primitives').Point3D,
	Triangle = require('./shapes').Triangle,
	QuadTree = require('./quad-tree'),
	BoundingBox2D = require('./primitives').BoundingBox2D;

// Triangulator
// ============
// 
// Use the Bowyer-Watson algorithm to triangulate the points.

function Triangulator(bbox) {
	if (!(bbox instanceof BoundingBox2D)) {
		throw 'Illegal Argument: bbox';
	}

	var point_down = new Point3D(),
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

Triangulator.prototype.add = function (point) {
	var	triangulator = this,
		bad_circles = [],
		point_index = this.points.length;

	// Add the point to the catalog.
	this.points.push(point);

	// The quad tree will execute this function for each bad triangle.
	this.quads.find(point, function (circ) {
		// console.log('Overlapping with ', circ.parent);

		// add it the bad triangle to the list for use later.
		bad_circles.push(circ);
	});

	// re-triangulate the hole
	bad_circles.forEach(function (bad_circ) {
		var sides = bad_circ.parent.edges();

		// console.log('bad triangle is', bad_circ.parent);
		// console.log('bad triangle has sides ', sides);

		// remove the bad triangles
		triangulator.quads.remove(bad_circ);

		// Find and remove shared edges, so that we only have the external edges
		// of the polygon.
		bad_circles.forEach(function (circ) {
			var tri = circ.parent;

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
		});

		// Triangulate the remaining sides of the polygon with the
		// current point.
		sides.forEach(function (side) {
			var tri = new Triangle(triangulator.points),
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
		});
	});
};

Triangulator.prototype.get_triangles = function () {
	var triangles = [];

	this.quads.each(function (circle) {
		var tri = circle.parent,
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
	});

	console.log('Triangles created ', triangles.length);

	return triangles;
};

module.exports = Triangulator;