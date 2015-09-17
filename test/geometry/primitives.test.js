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

var primitives = require('../../lib/geometry/primitives');

const TEST_ZOOM = 6;

exports['BoundingBox2D'] = {
	'Coordinate conversion round trip': function (test) {

		var bbox = new primitives.BoundingBox2D(),
			result_bbox;

		bbox.minimum.x = 1;
		bbox.minimum.y = 2;
		bbox.maximum.x = 3;
		bbox.maximum.y = 4;

		result_bbox = bbox.geo(TEST_ZOOM).tile(TEST_ZOOM);

		test.strictEqual(bbox.minimum.x, result_bbox.minimum.x, 'The minimum X should be the same');
		test.strictEqual(bbox.minimum.y, result_bbox.minimum.y, 'The minimum Y should be the same');

		test.strictEqual(bbox.maximum.x, result_bbox.maximum.x, 'The maximum X should be the same');
		test.strictEqual(bbox.maximum.y, result_bbox.maximum.y, 'The maximum Y should be the same');

		test.done();
	}
};
