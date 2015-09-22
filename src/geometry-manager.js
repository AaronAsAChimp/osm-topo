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

import error_handler from './error-handler';
import { Point2D } from './geometry/primitives';
import Provider from './osm/providers/provider';
import Triangulator from './geometry/triangulator';
import projector from './geometry/projector';

//const MAX_POINTS = Infinity;
const MAX_POINTS = 7000;
const LOG_AFTER = 100;

export default
class GeometryManager {
	constructor(tile) {
		this.providers = [];
		this.tile = tile;
		this.triangulator = new Triangulator(tile.tile_bounds);
		this.dupe_map = new Map();
	}

	add_geometry (provider) {
		if (!(provider instanceof Provider)) {
			throw new Error('Illegal Argument: provider must be an instance of Providers');
		}

		this.providers.push(provider.get(this.tile.geo_bounds, MAX_POINTS));
	}

	add_dupe (point) {
		let mah_exes = this.dupe_map.get(point.lat),
			has_y;

		if (!mah_exes) {
			mah_exes = new Map();
			this.dupe_map.set(point.lat, mah_exes);
		}

		has_y = mah_exes.has(point.lng);

		if (!has_y) {
			mah_exes.set(point.lng, true);
		}

		return !has_y;
	}

	get_triangles () {
		let manager = this,
			start = new Date();

		return Promise.all(this.providers)
			.then(function (values) {

				for (let geometry of values) {
					for (let point of projector(geometry)) {
						//console.log(point);

						// check if the point is in the bounding box.
						if (manager.tile.geo_bounds.contains_point(point)) {

							// check if the point is a duplicate.
							if (manager.add_dupe(point)) {

								// check if we;ve reached the max
								if (manager.triangulator.points.length < MAX_POINTS) {

									let projected = point.tile(manager.tile.zoom);
									//console.log('adding', point);

									manager.triangulator.add(projected);

									if ((manager.triangulator.points.length % LOG_AFTER) === 0) {
										let current = new Date(),
											points = manager.triangulator.points.length;

										console.log('Points: ' + points + ', per second: ' + (LOG_AFTER / (current - start)));

										start = current;
									}

								} else {
									// Early exit if we are maxed out.
									console.log('Skipping remaining points because the maximum of ' + MAX_POINTS + ' points were reached.')
									break;
								}
							} else {
								console.log('Skipping point because it is a duplicate.');
							}
						} else {
							console.log('Skipping point because its outside of the bounding box.');
						}
					}
				}

				return manager.triangulator;
			}, error_handler('getting data from geometry providers'))
			.catch(error_handler('adding points to triangulator'));
	}
}
