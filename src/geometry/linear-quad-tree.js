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

import { ShapeStorage } from './shape-storage';
import { Point } from './primitives';
import { Shape } from './shapes';

const TREE_DEPTH = 8;

var Canvas = require('canvas'),
	fs = require('fs');

class QuadTreeSheet extends Array {
	constructor (size) {
		super(size);
		this.size = size;

		let columns_left = size;

		while (columns_left--) {
			this[columns_left] = new Array(size);
		}
	}

	get_quad (x, y) {
		if (x < 0 || x >= this.length)  {
			return undefined;
		}

		let quad = this[x][y];

		if (!quad) {
			quad = [];
			this[x][y] = quad;
		}

		return quad;
	}

	*each_quad() {
		for (let column of this) {
			for (let quad of column) {
				yield quad;
			}
		}
	}

	render (ctx, dimension) {
		let columns = this.size,
			pixel_width = dimension / this.size;

		while (columns) {
			columns--;

			let rows = this.size;

			while (rows) {
				rows--;

				let quad = this.get_quad(columns, rows);

				if (quad.length > 0) {
					ctx.fillRect(columns * pixel_width, rows * pixel_width, pixel_width, pixel_width);
				}
			}
		}
	}
}

export default
class QuadTree extends ShapeStorage {
	constructor (bbox) {
		super();
		this.bbox = bbox;
		this.sheets = new Array(TREE_DEPTH);
		this.size = bbox.width();

		if (this.size !== bbox.height()) {
			throw new Error('Bounding box must be square.');
		}

		let current_depth = TREE_DEPTH;

		while (current_depth) {
			current_depth--;

			let columns = this._columns(current_depth);
			//console.log(columns);

			this.sheets[current_depth] = new QuadTreeSheet(columns);
		}

		//console.log('\nbuilt tree with ' + this.sheets.length + ' tiers');
	}

	_columns (depth) {
		return 1 << depth;
	}

	_coordinate (center, minimum, size) {
		let coord = Math.floor((center - minimum) / (this.size / size));

		// console.log('coord', coord, center, minimum, size);

		if (coord >= size) {
			coord = size - 1;
		} else if (coord < 0) {
			coord = 0;
		}

		return coord
	}

	_sheet_index(quad_size, shape_size, sheets) {
		let shape_size_normailized = quad_size / shape_size,
			index = Math.ceil(Math.log2(shape_size_normailized));

		//console.log('Shape size: ', shape_size_normailized);
		//console.log('Log2: ', Math.ceil(Math.log2(shape_size_normailized)));
		//console.log('index: ', index);

		if (index >= sheets) {
			index = sheets- 1;
		} else if (index < 0) {
			index = 0;
		}

		//console.log('Grid size: ', quad_size / this._columns(index));
		//console.log('Tier located: ', index);

		return index;
	}

	_get_sheet (shape) {
		return this.sheets[this._sheet_index(this.size, shape.longest_side(), this.sheets.length)];
	}

	add (shape) {
		if (!(shape instanceof Shape)) {
			throw new Error('Invalid Argument: shape is not an instance of Shape');
		}

		//console.log('---- add: start ----');
		//console.log(shape);

		let center = shape.tree_split_center(),
			sheet = this._get_sheet(shape),
			x = this._coordinate(center.x, this.bbox.minimum.x, sheet.size),
			y = this._coordinate(center.y, this.bbox.minimum.y, sheet.size),
			quad = sheet.get_quad(x, y);

		quad.push(shape);

		//console.log('Quad-tile coordinates: ', x, y);
		//console.log('Quad-tile size: ', sheet.size);
		
		// console.log(quad.length);

		//console.log('---- add: end ----');
	}

	remove (shape) {
		if (!(shape instanceof Shape)) {
			throw new Error('Invalid Argument: shape is not an instance of Shape');
		}

		// console.log('---- remove: start ----');

		let center = shape.tree_split_center(),
			sheet = this._get_sheet(shape),
			x = this._coordinate(center.x, this.bbox.minimum.x, sheet.size),
			y = this._coordinate(center.y, this.bbox.minimum.y, sheet.size),
			quad = sheet.get_quad(x, y),
			index = quad.indexOf(shape);

		// console.log('Contains: ', index);

		if (index >= 0) {
			quad.splice(index, 1);
		}

		// console.log('---- remove: end ----');
	}


	/*
		-1 -1,  0 -1, +1 -1
		-1  0,  0  0, +1  0
		-1 +1,  0 +1, +1 +1 
	 */

	*_neighboring (sheet, x, y) {
		yield sheet.get_quad(x, y);

		yield sheet.get_quad(x, y - 1);
		yield sheet.get_quad(x + 1, y - 1);
		yield sheet.get_quad(x + 1, y);
		yield sheet.get_quad(x + 1, y + 1);
		yield sheet.get_quad(x, y + 1);
		yield sheet.get_quad(x - 1, y + 1);
		yield sheet.get_quad(x - 1, y);
		yield sheet.get_quad(x - 1, y - 1);
	}

	*find (point) {
		if (!(point instanceof Point)) {
			throw new Error('Invalid Argument: point is not an instance of Point2D');
		}

		// console.log('---- find: start ----');

		let current_depth = TREE_DEPTH;

		while (current_depth) {
			current_depth--;

			let sheet = this.sheets[current_depth],
				x = this._coordinate(point.x, this.bbox.minimum.x, sheet.size),
				y = this._coordinate(point.y, this.bbox.minimum.y, sheet.size);

			// console.log('Quad-tile coordinates: ', x, y);
			// console.log('Quad-tile columns: ', sheet.size);
			// console.log('Quad-tile size: ', this.size / sheet.size);

			for (let quad of this._neighboring(sheet, x, y)) {
				if (quad) {
					for (let shape of quad) {
						if (shape.contains_point(point)) {
							yield shape;
						}
					}
				}
			}
		}

		// console.log('---- find: end ----');
	}

	contains (shape) {
		// console.log('---- contains: start ----');

		let center = shape.tree_split_center(),
			sheet = this._get_sheet(shape),
			x = this._coordinate(center.x, this.bbox.minimum.x, sheet.size),
			y = this._coordinate(center.y, this.bbox.minimum.y, sheet.size),
			quad = sheet.get_quad(x, y);

		// console.log('Quad-tile coordinates: ', x, y);
		// console.log('Quad-tile length: ', quad.length);

		// console.log('---- contains: end ----');

		return quad.indexOf(shape) >= 0;
	}

	// QuadTree::list
	// --------------
	// 
	// Return a list of all the shapes that are in the quad tree.

	*each () {
		let current_depth = this.sheets.length;

		while (current_depth) {
			current_depth--;

			for (let quad of this.sheets[current_depth].each_quad()) {

				if (quad) {
					for (let shape of quad) {
						yield shape;
					}
				}
			}
		}
	}

	render (filename) {
		let current_depth = this.sheets.length,
			dimension = this._columns(this.sheets.length - 1),
			canvas = new Canvas(dimension * this.sheets.length, dimension),
			ctx = canvas.getContext('2d'),
			out = fs.createWriteStream(filename),
			stream;

		ctx.fillStyle = 'red';
		//ctx.globalAlpha = 1 / this.sheets.length;
		ctx.strokeStyle = 'black';

		while (current_depth) {
			current_depth--;

			ctx.save();
			ctx.translate(current_depth * dimension, 0);

			this.sheets[current_depth].render(ctx, dimension);

			if (current_depth > 0) {
				ctx.fillStyle = 'black';
				ctx.fillRect(0, 0, 1, dimension);
			}
			ctx.restore();
		}

		stream = canvas.pngStream();

		stream.on('data', function(chunk){
			out.write(chunk);
		});

		stream.on('end', function(){
			console.log('saved png');
		});

	}
}
