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
	Triangulator = require('../../lib/geometry/triangulator').default,
	ColladaWriter = require('../../lib/writers/collada-writer');

const BBOX_SIZE = 512,
	HALF_SIZE = BBOX_SIZE / 2;

exports['Triangulator'] = {
	'setUp': function (funk) {
		this.bbox = new primitives.BoundingBox2D();

		this.bbox.minimum.x = 0;
		this.bbox.minimum.y = 0;
		this.bbox.maximum.x = BBOX_SIZE;
		this.bbox.maximum.y = BBOX_SIZE;

		funk();
	},

	'Add a point': function (test) {
		let triangulator = new Triangulator(this.bbox),
			point = new primitives.Point3D(HALF_SIZE, HALF_SIZE, 0);

		triangulator.add(point);

		let triangles = triangulator.get_triangles();

		test.strictEqual(triangles.length, 0, 'There should not be any triangles.');

		test.strictEqual(triangulator.points[triangulator.points.length - 1], point, 'Point added to the end of the catalog');

		test.done();
	},

	'Add three points to create a triangle': function (test) {
		let triangulator = new Triangulator(this.bbox),
			point = new primitives.Point3D(HALF_SIZE, HALF_SIZE, 0),
			point_up = new primitives.Point3D(HALF_SIZE, HALF_SIZE + 10, 0),
			point_right = new primitives.Point3D(HALF_SIZE + 10, HALF_SIZE, 0);

		triangulator.add(point);
		triangulator.add(point_up);
		triangulator.add(point_right);

		let triangles = triangulator.get_triangles();

		test.strictEqual(triangles.length, 1, 'There should be one triangle');

		test.strictEqual(triangles[0].lookup(0), point, 'Points should match');
		test.strictEqual(triangles[0].lookup(1), point_up, 'Points should match');
		test.strictEqual(triangles[0].lookup(2), point_right, 'Points should match');

		test.done();
	},

	'Add five points in a pentagon': function (test) {
		let triangulator = new Triangulator(this.bbox),
			points = [
				new primitives.Point3D(88, 236, 0),
				new primitives.Point3D(233, 260, 0),
				new primitives.Point3D(254, 404, 0),
				new primitives.Point3D(124, 496, 0),
				new primitives.Point3D(21, 366, 0)
			];

		for (let point of points) {
			triangulator.add(point);
		}

		let triangles = triangulator.get_triangles();

		test.strictEqual(triangles.length, 3, 'There should be three triangles');

		test.done();
	},

	'Add 6 points in a pentagon and one in the center': function (test) {
		let triangulator = new Triangulator(this.bbox),
			points = [
				new primitives.Point3D(88, 236, 0),
				new primitives.Point3D(233, 260, 0),
				new primitives.Point3D(254, 404, 0),
				new primitives.Point3D(124, 496, 0),
				new primitives.Point3D(21, 366, 0),
				new primitives.Point3D(140, 348, 0),				
			];

		for (let point of points) {
			triangulator.add(point);
		}

		let triangles = triangulator.get_triangles();

		test.strictEqual(triangles.length, 5, 'There should be five triangles');

		test.done();
	},

	'Overlap test': function (test) {
		let bbox = new primitives.BoundingBox2D();

		bbox.minimum.x = 4;
		bbox.minimum.y = 28;
		bbox.maximum.x = 5;
		bbox.maximum.y = 29;

		let triangulator = new Triangulator(bbox),
			points = [
				new primitives.Point3D(4.221674364444445,28.235310285480896, 0.004878878423563032),
				new primitives.Point3D(4.202962968888889,28.235592160698502, 0.0012871934564293959),
				new primitives.Point3D(4.460335253333334,28.46330031968155, 0.00020441781938332836),
				new primitives.Point3D(4.288152035555554,28.48017304281368, 0.0004503580083288953),
				new primitives.Point3D(4.118286133333332,28.168774788148003, 0.00011019398076132545),
				new primitives.Point3D(4.20100798222222,28.198693378276865, 0.00013734322239817375),
				new primitives.Point3D(4.340304284444442,28.546757420505365, 0.0003593281981347569),
				new primitives.Point3D(4.208740746666667,28.19586384825151, 0.00022837303259231215),
				new primitives.Point3D(4.20681480888889,28.21124396365208, 0.0007426116094784975),
				new primitives.Point3D(4.148804195555557,28.17959477131118, 0.000023955213208983793),
				new primitives.Point3D(4.195766382222221,28.24696732981107, 0.0008799548318766713)
			];

		for (let point of points) {
			triangulator.add(point);
		}

		let triangles = triangulator.get_triangles();

		test.strictEqual(triangles.length, 14, 'There should be fourteen triangles');

		test.done();
	}
};
