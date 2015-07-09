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

var Point2D = require('./primitives').Point2D,
	Shape = require('./shapes').Shape;

function QuadTreeNode(center, half_width, half_height, limit) {
	this.center = center;
	this.half_height = half_height;
	this.half_width = half_width;
	this.children = null;
	this.shapes = [];

	if (limit) {
		var child_width = this.half_width / 2,
			child_height = this.half_height / 2,
			child_limit = limit - 1;

		this.children = [
			// Horizontal split
			// Left
			[

				// Vertical split
				// Top
				new QuadTreeNode(new Point2D(this.center.x - child_width, this.center.y + child_height), child_width, child_height, child_limit),
				// Bottom
				new QuadTreeNode(new Point2D(this.center.x - child_width, this.center.y - child_height), child_width, child_height, child_limit)
			],
			// Right
			[
				// Vertical split
				// Top
				new QuadTreeNode(new Point2D(this.center.x + child_width, this.center.y + child_height), child_width, child_height, child_limit),
				// Bottom
				new QuadTreeNode(new Point2D(this.center.x + child_width, this.center.y - child_height), child_width, child_height, child_limit)
			]
		];
	}
}

QuadTreeNode.prototype.choose_child = function (point) {
	var h_split = this.center.x > point.x,
		v_split = this.center.y > point.y;

	return this.children[+h_split][+v_split];
};

QuadTreeNode.prototype.depth_first = function (funk) {
	var h_split,
		v_split,
		stop_traversal = funk(this);

	if (!stop_traversal && this.children) {
		for (h_split in this.children) {
			for (v_split in this.children[h_split]) {
				this.children[h_split][v_split].depth_first(funk);
			}
		}
	}
};

QuadTreeNode.prototype.each = function (funk) {
	this.depth_first(function (node) {
		node.shapes.forEach(funk);
	});
};

QuadTreeNode.prototype.add = function (shape) {
	// If we have children and the shape can fit inside them, add it.
	if (this.children && shape.tree_can_fit(this.half_width, this.half_height)) {
		this.choose_child(shape.tree_split_center()).add(shape);
	} else {
		this.shapes.push(shape);
	}
};

// Find all children that intersect with point.

QuadTreeNode.prototype.find = function (point, funk) {
	//console.log('finding intersections with ', point);

	for (var shp in this.shapes) {
		// console.log('testing intersection with', this.shapes[shp]);

		if (this.shapes[shp].contains_point(point)) {
			//console.log('intersection found');

			funk(this.shapes[shp]);
		}
	}

	if (this.children) {
		// console.log('recursing');

		this.choose_child(point).find(point, funk);
	}
};

QuadTreeNode.prototype.find_and_remove = function (shape) {
	var not_found = true,
		shp;

	for (shp in this.shapes) {
		if (this.shapes[shp] === shape) {

			// console.log('Removing shape', this.shapes);
			this.shapes.splice(shp, 1);
			// console.log('Shape removed', this.shapes);
			not_found = false;
		}
	}

	if (this.children && not_found) {
		this.choose_child(shape.tree_split_center()).find_and_remove(shape);
	}
};

function QuadTree(bbox) {
	this.root = new QuadTreeNode(bbox.center(), bbox.width() / 2, bbox.height() /2, 8);
}

QuadTree.prototype.add = function (shape) {
	if (!(shape instanceof Shape)) {
		console.log(shape);
		throw new Error('Invalid Argument: shape is not an instance of Shape');
	}

	this.root.add(shape);
};

QuadTree.prototype.remove = function (shape) {
	if (!(shape instanceof Shape)) {
		throw new Error('Invalid Argument: shape is not an instance of Shape');
	}

	this.root.find_and_remove(shape);
};

QuadTree.prototype.find = function (point, funk) {
	if (!(point instanceof Point2D)) {
		throw new Error('Invalid Argument: point is not an instance of Point2D');
	}

	this.root.find(point, funk);
};

// QuadTree::list
// --------------
// 
// Return a list of all the shapes that are in the quad tree.

QuadTree.prototype.each = function (funk) {
	this.root.each(funk);
};

module.exports = QuadTree;
