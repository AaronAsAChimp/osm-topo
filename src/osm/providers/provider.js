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

export default
class Provider {

	get (bbox, limit) {
		throw new Error('method not implemented');
	}

	// Provider::get_max_processes
	// ---------------------------
	// 
	// Get the maximum number of processes that is allowed by this provider.
	// 
	// Some providers like Overpass only allow certain number of connections. By
	// default, however, the geometry provider will allow an unlimited amount
	// of connections.

	static get_max_processes() {
		return Infinity;
	}
}
