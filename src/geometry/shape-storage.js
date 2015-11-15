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

import { Shape } from './shapes';
import { Point } from './primitives';

export
class ShapeStorage {
	add (shape) {
		throw new Error('Not Implemented.');
	}

	remove (shape) {
		throw new Error('Not Implemented.');
	}

	find (point) {
		throw new Error('Not Implemented.');
	}

	contains (shape) {
		throw new Error('Not Implemented.');
	}

	each (funk) {
		throw new Error('Not Implemented.');
	}
}

export
class SimpleShapeStorage extends ShapeStorage {
	constructor (bbox) {
		super();

		this.shapes = [];
	}

	add (shape) {
		this.shapes.push(shape);
	}

	remove (shape) {
		let spot = this.shapes.indexOf(shape);

		if (spot >= 0) {
			this.shapes.splice(spot, 1);
		}
	}

	*find (point) {

		for (let shp of this.shapes) {
			//console.log('testing intersection with', this.shapes[shp]);

			if (shp.contains_point(point)) {
				//console.log('intersection found');

				yield shp;
			}
		}

	}

	contains (shape) {
		return this.shapes.indexOf(shape) >= 0;
	}

	// QuadTree::list
	// --------------
	// 
	// Return a list of all the shapes that are in the quad tree.

	each (funk) {
		return this.shapes;
	}
}