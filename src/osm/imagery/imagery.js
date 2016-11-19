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

const path = require('path');

export default
class Imagery {

	build_filename(tile, root_dir) {
		return path.join(root_dir, tile.z + '-' + tile.x + '-' + tile.y + '.png');
	}

	get_size() {
		throw 'Not Implemented';
	}

    get_max_zoom() {
        throw 'Not Implemented';
    }

    get_min_zoom() {
        throw 'Not Implemented';
    }

	get(tile) {
		throw 'Not Implemented';
	}

}