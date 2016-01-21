osm-topo
========

This is an application that will generate a 3D mesh of the earth given standard
OSM tile coordinates (zoom, x, y).

To use:

```sh
$ bin/tile <zoom> <x> <y>
```

You may also use the demo application to generate the tiles for certain
interesting places. The files will be generated into the `demos/` folder.

```sh
$ bin/demo
```

The data used by this application is retrieved using the Overpass API and
is Copyright (C) [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).

Notes:
------

Until [this bug](https://github.com/nodejs/node/issues/3439) is fixed, osm-topo
will only run in Node v3.3.
