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

var LatLng3D = require('../geometry/primitives').LatLng3D;

export default
class Element {
	constructor () {
		this.tags = {};
		this.id = 0;
	}

	// Iterate over all the nodes in this elements
	nodes (catalog) {
		throw new Error('Method not implemented');
	}
}

// Reconstitute a osm element from json. This is the standard json response
// returned from something like the Overpass API.

Element.from_json = function (json) {
	var ElementType = Element.TYPES[json.type],
		element = ElementType.from_json(json);

	if (json.tags) {
		element.tags = json.tags;
	}

	element.id = json.id;

	return element;
};


class Reference {
	constructor(id) {
		this.id = id;
	}

	get (catalog) {
		return catalog.get(this.id);
	}
}


export
class Node extends Element {
	constructor () {
		super();

		this.position = new LatLng3D();
	}

	*nodes () {
		yield this;
	}
}

Node.from_json = function (json) {
	var node = new Node();

	node.position.lat = json.lat;
	node.position.lng = json.lon;

	return node;
};

export
class Way extends Element {
	constructor () {
		super();

		this._nodes = [];
	}

	*nodes (catalog) {
		for (let node of this._nodes) {
			yield node.get(catalog);
		}
	}
}

Way.from_json = function (json) {
	var way = new Way();

	way._nodes = json.nodes.map(function (id) {
		return new Reference(id);
	});

	return way;
};


class RelationMember {
	constructor (ref) {
		this.type = ref.type;
		this.element = new Reference(ref.id);
		this.role = ref.role;
	}
}

export
class Relation extends Element {
	constructor () {
		super();
		this.members = [];
	}

	*nodes (catalog) {
		for (let member of this.members) {
			for (let element of member.element.get(catalog).nodes()) {
				yield element;
			}
		}
	}
}

Relation.from_json = function (json) {
	var relation = new Relation();

	this.members = json.members.map(function (ref) {
		return new RelationMember(ref);
	});

	return relation;
};


Element.TYPES = {
	'node': Node,
	'way': Way,
	'relation': Relation
};
