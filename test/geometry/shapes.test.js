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
	primitives = require('../../lib/geometry/primitives');

exports['Triangle'] = {
	'Circumcircle calculation': function (test) {

		var tri = new shapes.Triangle([
				new primitives.Point3D(1, 1, 0),
				new primitives.Point3D(1, 2, 0),
				new primitives.Point3D(0, 2, 0),
			]),
			circ;

		tri.sides[0] = 0;
		tri.sides[1] = 1;
		tri.sides[2] = 2;

		circ = tri.circumcircle();

		test.strictEqual(circ.center.x, 0.5);
		test.strictEqual(circ.center.y, 1.5);

		test.done();
	}
};
