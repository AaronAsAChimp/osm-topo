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

var BoundingBox2D = require('../geometry/primitives').BoundingBox2D,
	Matrix3D = require('../geometry/primitives').Matrix3D;

export default
class Tile {
	constructor(zoom, x, y) {
		this.zoom = 1 << zoom;

		this.tile_bounds = new BoundingBox2D();
		this.tile_bounds.minimum.x = x;
		this.tile_bounds.minimum.y = y;
		this.tile_bounds.minimum.z = 0;
		this.tile_bounds.maximum.x = x + 1;
		this.tile_bounds.maximum.y = y + 1;
		this.tile_bounds.maximum.z = 0;

		this.geo_bounds = this.tile_bounds.geo(this.zoom);
	}

	matrix () {
		var tile_mat = Matrix3D.translate(Math.floor(-this.tile_bounds.minimum.x), Math.floor(-this.tile_bounds.minimum.y), 0),
			flip_y = Matrix3D.mirror_y();

		flip_y.multiply(tile_mat);

		return flip_y;
	}

}
