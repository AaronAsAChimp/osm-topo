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

var Point = require('./primitives').Point,
	Point2D = require('./primitives').Point2D,
	Shape = require('./shapes').Shape;

import { ShapeStorage } from './shape-storage';

const TREE_DEPTH = 9;
const SPLIT_THREASHOLD = 2000;

class QuadTreeNode {

	constructor (center, half_width, half_height, limit, parent) {
		this.center = center;
		this.half_height = half_height;
		this.half_width = half_width;
		this.children = null;
		this.shapes = [];
		this._neighbors = null;
		this.parent = parent || null;

		//console.log('widths', this.half_width, this.half_height);

		this.split(limit);
	}

	split (limit) {
		//console.log('Building subtree at teir ' + limit);
		if (limit) {
			var child_width = this.half_width / 2,
				child_height = this.half_height / 2,
				child_limit = limit - 1;

			this.children = [
				// Top Left
				new QuadTreeNode(new Point2D(this.center.x - child_width, this.center.y + child_height), child_width, child_height, child_limit, this),
				// Bottom Left
				new QuadTreeNode(new Point2D(this.center.x - child_width, this.center.y - child_height), child_width, child_height, child_limit, this),

				// Top Roght
				new QuadTreeNode(new Point2D(this.center.x + child_width, this.center.y + child_height), child_width, child_height, child_limit, this),
				// Bottom Right
				new QuadTreeNode(new Point2D(this.center.x + child_width, this.center.y - child_height), child_width, child_height, child_limit, this)
			];

			if (this.shapes.length) {
				let shapes = this.shapes;

				this.shapes = [];

				console.log('Optimizing: rebalancing ' + shapes.length + ' shapes');

				for (let shape of shapes) {
					this.add(shape);
				}
			}
		}
	}

	// QuadTreeNode::choose_child
	// --------------------------
	// 
	// Choose a child branch that contains the given point.

	choose_child (point) {
		var h_split = this.center.x > point.x,
			v_split = this.center.y > point.y;

		return this.children[((!h_split) << 1) | v_split];
	}

	// Iterate over the QuadTreeNodes in depth first order.
	*depth_first (funk) {
		var current,
			stack = [
				this
			];

		while (current = stack.shift()) {

			//console.log('iterating');

			yield current;

			if (current.children) {
				stack.unshift.apply(stack, current.children.reverse());
			}
		}
	}

	// Iterate over the shapes in depth first order.
	*each () {
		for (let child of this.depth_first()) {
			for (let shape of child.shapes) {
				yield shape;
			}
		}
	}

	add (shape) {
		// If we have children and the shape can fit inside them, add it.
		if (this.children && shape.tree_can_fit(this.half_width, this.half_height)) {
			//console.log('Fits, adding to child');
			this.choose_child(shape.tree_split_center()).add(shape);
		} else {
			//console.log('Does not fit, adding here');
			this.shapes.push(shape);

			//console.log('Number of shapes', this.shapes.length);

			//if (!this.children && this.shapes.length > SPLIT_THREASHOLD) {
				//console.log('Optimizing: Splitting sutree');

				//this.split(1);
			//}
		}
	}

	// Find all children that intersect with point.

	/*QuadTreeNode.prototype.find = function* (point) {
		//console.log('finding intersections with ', point);
		//console.log('count: ', this.shapes.length);

		for (let shp of this.shapes) {
			//console.log('testing intersection with', this.shapes[shp]);

			if (shp.contains_point(point)) {
				//console.log('intersection found');

				yield shp;
			}
		}

		if (this.children) {
			let child = this.choose_child(point);

			while (child) {
				//console.log('count: ', child.shapes.length);

				// console.log('recursing');

				for (let shp of child.shapes) {
					if (shp.contains_point(point)) {
						yield shp;
					}
				}

				if (child.children) {
					child = child.choose_child(point);
				} else {
					child = null;
				}
			}
		}
	};*/

	neighbors () {
		// memoize the neighbors look up.
		if (!this._neighbors) {
			this._neighbors = {
				'n': null,
				'ne': null,
				'e': null,
				'se': null,
				's': null,
				'sw': null,
				'w': null,
				'nw': null
			};

			if (this.parent) {
				let parents_neighbors = this.parent.neighbors();	
			}
		}
		
		return this._neighbors;
	}

	*find (point) {
		for (let shp of this.shapes) {
			//console.log('testing intersection with', this.shapes[shp]);

			if (shp.contains_point(point)) {
				//console.log('intersection found');

				yield shp;
			}
		}

		if (this.children) {
			let child = this.choose_child(point);

			for (let shp of child.find(point)) {
				yield shp;
			}

		}
	}

	// QuadTreeNode::find_and_remove
	// -----------------------------
	// Find and remove an element from the tree.
	// 
	// This does not iterate the whole tree. It uses the center point from the given
	// shape to traverse down the branches that may contain the shape.

	find_and_remove (shape) {
		var not_found = true,
			shp;

		let spot = this.shapes.indexOf(shape);

		if (spot >= 0) {
			this.shapes.splice(spot, 1);

			not_found = false;
		}

		if (this.children && not_found) {
			this.choose_child(shape.tree_split_center()).find_and_remove(shape);
		}
	}
}

class QuadTree extends ShapeStorage {
	constructor (bbox) {
		super();

		this.root = new QuadTreeNode(bbox.center(), Math.abs(bbox.width() / 2), Math.abs(bbox.height() / 2), TREE_DEPTH);
	}

	add (shape) {
		if (!(shape instanceof Shape)) {
			throw new Error('Invalid Argument: shape is not an instance of Shape');
		}

		this.root.add(shape);
	}

	remove (shape) {
		if (!(shape instanceof Shape)) {
			throw new Error('Invalid Argument: shape is not an instance of Shape');
		}

		//console.log('----- r ------');

		this.root.find_and_remove(shape);
	}

	find (point) {
		if (!(point instanceof Point)) {
			throw new Error('Invalid Argument: point is not an instance of Point2D');
		}

		//console.log('------ s ------');

		return this.root.find(point);
	}

	// QuadTree::list
	// --------------
	// 
	// Return a list of all the shapes that are in the quad tree.

	each (funk) {
		return this.root.each();
	}
}

QuadTree.QuadTreeNode = QuadTreeNode;

module.exports = QuadTree;
