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

import Imagery from './imagery';

var _ = require('lodash'),
	request = require('request');

const TEMPLATE_DELIMITER = /\{(.+?)\}/g;

export default
class RemoteImagery extends Imagery {
	constructor (url, config) {
		config = config || {};

		super();

		this.template = _.template(url, {
			interpolate: TEMPLATE_DELIMITER
		});

		this.subdomains = config.subdomains || 'abc';
		this.tileSize = config.tileSize || 256;
		this.maxZoom = config.maxZoom || 18;
		this.minZoom = config.minZoom || 0;
	}

	build_url(tile) {
		return this.template({
			s: _.sample(this.subdomains),
			z: tile.z,
			x: tile.x,
			y: tile.y
		});
	}

	get_size() {
		return this.tileSize;
	}

	get_max_zoom() {
		return this.maxZoom;
	}

	get_min_zoom () {
		return this.minZoom;
	}

	get(tile) {
		let imagery = this;

		return new Promise((resolve, reject) => {
			let url = imagery.build_url(tile);

			resolve(request(url));

		});
	}
}