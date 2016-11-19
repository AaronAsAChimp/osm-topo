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
import Tile from '../tile';

const TILE_OFFSETS = [
	[0 , 0],
	[1, 0],
	[0, 1],
	[1, 1]
];

const Canvas = require('canvas');

export default
class StitchedImagery extends Imagery {
	constructor(delegated) {
		super();
		this.delegated = delegated;

		// precompute properties
		this.tileSize = this.delegated.get_size() << 1;
		this.maxZoom = this.delegated.get_max_zoom() - 1;
		this.minZoom = this.delegated.get_min_zoom();

		// validate properties
		if (this.maxZoom < this.minZoom) {
			throw 'Can\'t create stitched tiles that are zoomed further than the delegated imagery provides';
		}
	}

	*zoom_tiles (tile) {
		let new_z = tile.z + 1,
			new_x = tile.x << 1,
			new_y = tile.y << 1;

		for (let offset of TILE_OFFSETS) {
			yield new Tile(new_z, new_x + offset[0], new_y + offset[1]);
		}
	}

	get_size() {
		return this.tileSize;
	}

	get_max_zoom() {
		return this.maxZoom;
	}

	get_min_zoom() {
		return this.minZoom;
	}

	_read_to_buffer(tile, root_dir) {
		let buffers = [];

		return new Promise((resolve, reject) => {
			this.delegated.get(tile, root_dir)
				.then((stream) => {
					stream.on('data', (data) => buffers.push(data));
					stream.on('error', reject);
					stream.on('end', () => resolve(Buffer.concat(buffers)));
				}, reject);
		});
	}

	get(tile) {
		if (tile.z >= this.get_max_zoom()) {
			throw 'This tile exceeds the maximum zoom';
		}

		let imagery = this,
			subtiles = Array.from(this.zoom_tiles(tile)),
			promises = [];

		for (let info of subtiles) {
			promises.push(this._read_to_buffer(info));
		}

		return new Promise((resolve, reject) => {

			Promise.all(promises)
				.then((images) => {

					var size = imagery.get_size(),
						canvas = new Canvas(size, size),
						ctx = canvas.getContext('2d');

					console.log('Loading ' + images.length + ' images');

					for (let i = 0; i < images.length; i++) {
						console.log('Loading image');

						let x = (TILE_OFFSETS[i][0] * size) >> 1,
							y = (TILE_OFFSETS[i][1] * size) >> 1,
							image = new Canvas.Image();

						image.src = images[i];

						console.log('Drawing image', image);
						console.log('-- at: ', x, y);

						ctx.drawImage(image, x, y);
					}

					console.log('Finishing, generating stream');
					resolve(canvas.pngStream());
				}, reject);
		});
	}
}