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

var error_handler = require('./error-handler'),
	Point2D = require('./geometry/primitives').Point2D,
	GeometryProvider = require('./geometry/geometry-provider'),
	Triangulator = require('./geometry/triangulator');

function GeometryManager(tile) {
	//this.MAX_POINTS = 144;
	this.MAX_POINTS = Infinity;
	this.providers = [];
	this.tile = tile;
	this.triangulator = new Triangulator(tile.geo_bounds.tile(tile.zoom));
	this.dupe_map = new Map();
}

GeometryManager.prototype.add_geometry = function (provider) {
	if (!(provider instanceof GeometryProvider)) {
		throw 'Illegal Argument: provider';
	}

	this.providers.push(provider.get_coords());
};

GeometryManager.prototype.add_dupe = function (point) {
	var mah_exes = this.dupe_map.get(point.x),
		has_y;

	if (!mah_exes) {
		mah_exes = [];
		this.dupe_map.set(point.x, mah_exes);
	}

	has_y = mah_exes.indexOf(point.y) >= 0;

	if (!has_y) {
		mah_exes.push(point.y);
	}

	return !has_y;
};

GeometryManager.prototype.get_triangles = function () {
	var manager = this;

	return Promise.all(this.providers)
		.then(function (values) {

			values.forEach(function (geometry) {
				geometry.forEach(function (point) {

					if (manager.triangulator.points.length < manager.MAX_POINTS) {
						var projected = point.tile(manager.tile.zoom);
						//console.log('adding', point);
						
						if (manager.add_dupe(projected)) {
							manager.triangulator.add(projected);
						} else {
							console.log('Skipping point because it is a duplicate.');
						}
					}
				});
			});

			return manager.triangulator;
		}, error_handler('getting data from geometry providers'))
		.catch(error_handler('adding points to triangulator'));
};

module.exports = GeometryManager;