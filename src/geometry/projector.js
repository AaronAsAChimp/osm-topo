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

import { LatLng3D } from './primitives';
import Catalog from '../osm/catalog';
import Element from '../osm/elements';
import { Node } from '../osm/elements';

var distance_regex = /((?:\+|\-)?[\d\.]+)\s*(\w*)/,
	CONVERSION_FACTORS = {
		'm': 1,
		'km': 1000,
		'ft': 0.3048
	};

export default
function *projector(geography) {
	console.log('Projecting geography.');

	let catalog = new Catalog(),
		elevated = [],
		geo;

	for (let geo of geography) {
		catalog.set(geo);

		if (geo.tags) {
			if (geo.tags.natural === 'coastline') {
				geo.tags.ele = '0';
			}

			if (geo.tags.ele) {
				elevated.push(geo);
			}
		}
	}

	while (geo = elevated.shift()) {

		for (let node of geo.nodes(catalog)) {
			// This will probably only work for ways. Relations will need better
			// extension logic.
			let ele_tag = node.tags.ele || geo.tags.ele;

			if (ele_tag) {
				// Parse the elevation
				let parsed_ele = distance_regex.exec(ele_tag),
					units = parsed_ele[2],
					elevation;

				if (!units || units in CONVERSION_FACTORS) {
					elevation = parseFloat(parsed_ele[1]);

					// if its not an empty string or undefined then we probably
					// have units.
					if (units) {
						elevation *= CONVERSION_FACTORS[units];
					}

					if (node.position) {
						let coord = new LatLng3D();
						coord.lat = node.position.lat;
						coord.lng = node.position.lng;
						coord.ele = elevation;

						yield coord;
					}
				} else {
					console.warn('Units not understood, skipping');
				}
			} else {
				console.warn('No tags skipping.');
			}
		}
	}
}
