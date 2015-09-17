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

import Element from '../elements';
import * as request from 'request';
import Provider from './provider.js';
import { GeoBoundingBox2D } from '../../geometry/primitives';

export default
class OverpassProvider extends Provider {

	// OverpassProvider::get_max_processes
	// -----------------------------------
	// 
	// The overpass service only allows a maximum of 2 connections.

	static get_max_processes() {
		return 2;
	}

	get (bbox, limit) {
		if (!(bbox instanceof GeoBoundingBox2D)) {
			throw new Error('Illegal Argument: bbox must be an instance of GeoBoundingBox2D');
		}

		if (limit === Infinity) {
			limit = '';
		}

		var provider = this,
			overpass_bbox = bbox.to_overpass(),
			query = '[out:json][timeout:25][bbox:' + bbox.to_overpass() + '];(' + 
				'node["ele"];' +
				'way["ele"];' +
				'way["natural"="coastline"];' +
				/*'relation["ele"]' + this.bbox.to_overpass() + ';' +*/ 
			'); out ' + limit + ' body; >; out skel qt;';

		console.log(query);

		function *map(results) {
			for (let element of results.elements) {
				yield Element.from_json(element);
			}
		}

		return new Promise(function (resolve, reject) {
			var result = '',
				req;

			req = request.post('http://overpass-api.de/api/interpreter', {
				'gzip': true,
				'form': {
					'data': query
				}
			});

			req.on('response', function (res) {
				if (res.statusCode >= 400) {
					console.log(res.statusCode + ' Error retrieveing data');
					reject();
				}
			});

			req.on('data', function (data) {
				result += data;
			});

			req.on('end', function () {
				var json;

				//console.log(result);

				try {
					json = JSON.parse(result);
				} catch (e) {
					reject(e);
					return;
				}

				resolve(map(json));
			});

			req.on('error', function (err) {
				reject(err);
			});
		});
	}
}
