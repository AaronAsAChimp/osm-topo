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

'use strict';

var shapes = require('../../lib/geometry/shapes'),
	primitives = require('../../lib/geometry/primitives'),
	LinearQuadTree = require('../../lib/geometry/linear-quad-tree').default,
	QuadTree = LinearQuadTree;

const BBOX_SIZE = 512;

var ShapeGenerators = {
	'reducing_sizes': function* (shape_size, center) {
		while (shape_size > 0) {
			let shape = new shapes.Circle();

			shape_size = shape_size >> 1;

			shape.radius = shape_size;
			shape.center = center;

			yield shape;
		}
	},
	'diagonal': function* (bbox_size, center, divisions) {
		let size = bbox_size / divisions,
			upper_right = new primitives.Point2D();

		upper_right.x = center.x - (bbox_size / 2);
		upper_right.y = center.y - (bbox_size / 2);

		for (let i = 0; i < divisions; i++) {
			let shape = new shapes.Circle();

			shape.radius = size / 2;
			shape.center.x = upper_right.x + (size * i);
			shape.center.y = upper_right.y + (size * i);

			yield shape;
		}
	}
};

/*exports['Quad Tree Node'] = {
	'Choosing a child': function (test) {
		let center = new primitives.Point3D(0, 0, 0),
			qtn = new QuadTree.QuadTreeNode(center, BBOX_SIZE / 2, BBOX_SIZE / 2, 1),
			child;

		// Choose a couple of children and check them

		child = qtn.choose_child(new primitives.Point3D(-1, 1, 0));
		test.strictEqual(child, qtn.children[0], 'Should translate to the first child');

		child = qtn.choose_child(new primitives.Point3D(-1, -1, 0));
		test.strictEqual(child, qtn.children[1], 'Should translate to the second child');

		child = qtn.choose_child(new primitives.Point3D(0, 0, 0));
		test.strictEqual(child, qtn.children[2], 'Should translate to the third child');

		child = qtn.choose_child(new primitives.Point3D(1, 1, 0));
		test.strictEqual(child, qtn.children[2], 'Should translate to the third child');

		child = qtn.choose_child(new primitives.Point3D(1, -1, 0));
		test.strictEqual(child, qtn.children[3], 'Should translate to the fourth child');

		test.done();
	},
	'Finding a shape that intersects with a different quadrant': function (test) {
		let center = new primitives.Point3D(0, 0, 0),
			query = new primitives.Point2D(-1, -1),
			qtn = new QuadTree.QuadTreeNode(center, 16, 16, 1),
			shape = new shapes.Circle(),
			count = 0;

		shape.center.x = 1;
		shape.center.y = 1;
		shape.radius = 8;

		qtn.add(shape);

		for (let found of qtn.find(query)) {
			count++;
		}

		test.strictEqual(count, 1, 'There should be only one shape returned');
		test.done();
	},
	'Diagonal insertion of shapes': function (test) {
		let center = new primitives.Point3D(0, 0, 0),
			query = new primitives.Point2D(120, 120),
			qtn = new QuadTree.QuadTreeNode(center, BBOX_SIZE / 2, BBOX_SIZE / 2, 3),
			count = 0;

		for (let child of ShapeGenerators.diagonal(BBOX_SIZE, center, 8)) {
			console.log('child added', child);
			qtn.add(child);
		}

		for (let found of qtn.find(query)) {
			count++;
		}

		test.strictEqual(count, 1, 'There should be only one shape returned');

		test.done();
	}
};*/

// The sheet should be calculated using the following table:
// 
// tier 0: 512 <= shape width < Infinity
// tier 1: 256 <= shape width < 512
// tier 2: 128 <= shaoe width < 256
// tier 3:  64 <= shape width < 128
// tier 4:  32 <= shape width < 64
// tier 5:  16 <= shape width < 32
// tier 6:   8 <= shape width < 16
// tier 7:   0 <= shape width < 8

function tier_tester(test, qt, bbox_width, tier, widths) {
	let index;

	for (let width of widths) {
		index = qt._sheet_index(bbox_width, width, 8);

		test.strictEqual(index, tier, 'When the width is ' + width + ' the tier should be ' + tier);
	}
}

exports['Linear Quad Tree: Tier tests'] = {
	'setUp': function (funk) {
		let bbox = new primitives.BoundingBox2D();

		bbox.minimum.x = 0;
		bbox.minimum.y = 0;
		bbox.maximum.x = BBOX_SIZE;
		bbox.maximum.y = BBOX_SIZE;

		this.qt = new QuadTree(bbox);

		funk();
	},
	'Can calculate the correct sheet for tier 0': function (test) {
		let testable_widths = [800, 512],
			index;

		tier_tester(test, this.qt, BBOX_SIZE, 0, testable_widths);
		
		test.done();
	},
	'Can calculate the correct sheet for tier 1': function (test) {
		let testable_widths = [256, 400, 511.9999],
			index;

		tier_tester(test, this.qt, BBOX_SIZE, 1, testable_widths);
		
		test.done();
	}
};

exports['Quad Tree'] = {
	'setUp': function (funk) {
		this.bbox = new primitives.BoundingBox2D();

		this.bbox.minimum.x = 0;
		this.bbox.minimum.y = 0;
		this.bbox.maximum.x = BBOX_SIZE;
		this.bbox.maximum.y = BBOX_SIZE;

		funk();
	},

	'Add and Remove a Circle': function (test) {
		let shape = new shapes.Circle(),
			qt = new QuadTree(this.bbox);

		shape.radius = BBOX_SIZE / 2;
		shape.center.x = 10;
		shape.center.y = 10;

		qt.add(shape);

		test.ok(qt.contains(shape), 'The tree should contain the circle.');

		qt.remove(shape);

		test.ok(!qt.contains(shape), 'The tree should no longer contain the shape.');

		test.done();
	},

	'Add and Remove a Circle in a grid with a size of 1': function (test) {

		let bbox = new primitives.BoundingBox2D();

		bbox.minimum.x = 111;
		bbox.minimum.y = 47;
		bbox.maximum.x = 112;
		bbox.maximum.y = 48;

		let shape = new shapes.Circle(),
			qt = new QuadTree(bbox);

		shape.radius = 0.125;
		shape.center.x = 111.6667;
		shape.center.y = 47.8887;

		qt.add(shape);

		test.ok(qt.contains(shape), 'The tree should contain the circle.');

		qt.remove(shape);

		test.ok(!qt.contains(shape), 'The tree should no longer contain the shape.');

		test.done();
	},

	'Add and Remove Circles at every level': function (test) {
		let qt = new QuadTree(this.bbox),
			center = new primitives.Point3D(10, 10, 0),
			shape_size = BBOX_SIZE,
			circles = [],
			index = 0;

		for (let shape of ShapeGenerators.reducing_sizes(BBOX_SIZE, center)) {
			circles.push(shape);

			qt.add(shape);
		}

		// Compare the shapes we added earlier to the ones retrieved by find.
		for (let shape of circles) {
			test.ok(qt.contains(shape), 'The quad tree should contain the shape at' + index);

			index++;
		}

		test.notStrictEqual(index, 0, 'There should be at least one iteration');

		// Remove all the shapes added before
		for (let shape of circles) {
			qt.remove(shape);
		}

		// Attempt to iterate them.
		index = 0;
		for (let shape of qt.find(center)) {
			index ++;
		}

		test.strictEqual(index, 0, 'There should have been no iterations');

		test.done();
	},
	'Find shape but exclude the other': function (test) {
		let qt = new QuadTree(this.bbox),
			shape_top_right = new shapes.Circle(),
			shape_bottom_left = new shapes.Circle(),
			test_point = new primitives.Point3D(500, 16);

		shape_top_right.radius = 32;
		shape_top_right.center.x = 510;
		shape_top_right.center.y = 2;

		shape_bottom_left.radius = 32;
		shape_bottom_left.center.x = 2;
		shape_bottom_left.center.y = 510;

		qt.add(shape_top_right);
		qt.add(shape_bottom_left);

		test.ok(qt.contains(shape_top_right), 'Does the quad tree contain the top right circle');
		test.ok(qt.contains(shape_bottom_left), 'Does the quad tree contain the bottom left circle');

		let count = 0;
		for (let shape of qt.find(test_point)) {
			test.strictEqual(shape, shape_top_right, 'Should be the top right circle');

			count++;
		}

		test.strictEqual(count, 1, 'Should only return one element');

		test.done();
	},
	'Iterate elements using each': function (test) {
		let qt = new QuadTree(this.bbox),
			test_point = new primitives.Point3D(500, 16),
			test_shapes = [
				new shapes.Circle(),
				new shapes.Circle(),
			];

		test_shapes[0].radius = 32;
		test_shapes[0].center.x = 510;
		test_shapes[0].center.y = 2;

		test_shapes[1].radius = 32;
		test_shapes[1].center.x = 2;
		test_shapes[1].center.y = 510;

		qt.add(test_shapes[0]);
		qt.add(test_shapes[1]);

		let count = 0;
		for (let shape of qt.each()) {
			test.ok(test_shapes.indexOf(shape) >= 0, 'Should match element ' + count);
			count++;
		}

		test.strictEqual(count, 2, 'Should return two elements');

		test.done();
	},
	'Finding a shape that intersects with a different quadrant': function (test) {
		console.log('**** test: start ****');

		let query = new primitives.Point2D(300, 300),
			qt = new QuadTree(this.bbox),
			shape = new shapes.Circle(),
			count = 0;

		shape.center.x = 255;
		shape.center.y = 255;
		shape.radius = 128;

		qt.add(shape);

		for (let found of qt.find(query)) {
			count++;
		}

		test.strictEqual(count, 1, 'There should be only one shape returned');
		test.done();

		console.log('**** test: end ****');
	},
	'Add three circles that are out of bounds and query for two': function (test) {
		let query = new primitives.Point3D(256, 266, 0),
			qt = new QuadTree(this.bbox),
			count = 0;

		let circle2 = new shapes.Circle(),
			circle3 = new shapes.Circle(),
			circle4 = new shapes.Circle();

		circle2.center.x = 512;
		circle2.center.y = -256;
		circle2.radius = 572.4334022399462;

		circle3.center.x = 896;
		circle3.center.y = 896;
		circle3.radius = 905.0966799187809;

		circle4.center.x = -256;
		circle4.center.y = 512;
		circle4.radius = 572.4334022399462;

		qt.add(circle2);
		qt.add(circle3);
		qt.add(circle4);

		for (let found of qt.find(query)) {
			console.log('Circle found: ', found);
			count++;
		}

		test.strictEqual(count, 2, 'There should be only one shape returned');
		test.done();
	},
	'Add three circles, but query for two': function (test) {
		let bbox = new primitives.BoundingBox2D();

		bbox.minimum.x = 4;
		bbox.minimum.y = 28;
		bbox.maximum.x = 5;
		bbox.maximum.y = 29;

		let query = new primitives.Point3D(4.221674364444445, 28.235310285480896, 0.004878878423563032),
			qt = new QuadTree(bbox),
			circle = new shapes.Circle(),
			count = 0;

		circle.center.x = 5;
		circle.center.y = 29;
		circle.radius = 1.4142135623730951;

		qt.add(circle);

		for (let found of qt.find(query)) {
			console.log('Circle found: ', found);
			count++;
		}

		test.strictEqual(count, 1, 'There should be only one shape returned');
		test.done();
	}
};
