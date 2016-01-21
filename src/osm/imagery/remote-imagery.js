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

var fs = require('fs'),
	_ = require('lodash'),
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
	}

	build_url(tile) {
		return this.template({
			s: _.sample(this.subdomains),
			z: tile.z,
			x: tile.x,
			y: tile.y
		});
	}

	get(tile, root_dir) {
		let imagery = this;

		return new Promise((resolve, reject) => {
			let url = imagery.build_url(tile),
				filename = imagery.build_filename(tile, root_dir);

			request(url)
				.on('request', (message) => {
					console.log('get request');

					message.on('close', () => resolve());
				})
				.on('error', (err) => reject(err))
				.pipe(fs.createWriteStream(filename));

		});
	}
}