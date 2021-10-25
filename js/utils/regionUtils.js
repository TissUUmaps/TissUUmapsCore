/**
 * @namespace regionUtils
 * @classdesc Region utilities, everything to do with 
 * regions or their calculations goes here  
 * @property {Bool}     regionUtils._isNewRegion - if _isNewRegion is true then a new region will start 
 * @property {Bool}     regionUtils._currentlyDrawing - Boolean to specify if a region is currently being drawn
 * @property {Number}   regionUtils._currentRegionId - Keep then number of drawn regions and also let them be the id, 
 * @property {Object[]} regionUtils._currentPoints - Array of points for the current region, 
 * @property {String}   regionUtils._colorInactiveHandle - String for a color "#cccccc", 
 * @property {String}   regionUtils._colorActiveHandle - Color of the point in the region, 
 * @property {Number}   regionUtils._scaleHandle - Scale of the point in regions, 
 * @property {Number}   regionUtils._polygonStrokeWidth - Width of the stroke of the polygon, 
 * @property {Number}   regionUtils._handleRadius - Radius of the point of the region, 
 * @property {Number}   regionUtils._epsilonDistance - Distance at which a click from the first point will consider to close the region, 
 * @property {Object}   regionUtils._regions - Object that contains the regions in the viewer, 
 * @property {String}   regionUtils._drawingclass - String that accompanies the classes of the polygons in the interface"drawPoly", 
*/
regionUtils = {
    _isNewRegion: true,
    _currentlyDrawing: false,
    _currentRegionId: 0,
    _currentPoints: null,
    _colorInactiveHandle: "#cccccc",
    _colorActiveHandle: "#ffff00",
    _scaleHandle: 0.0025,
    _polygonStrokeWidth: 0.0006,
    _handleRadius: 0.1,
    _epsilonDistance: 0.004,
    _regions: {},
    _drawingclass: "drawPoly"
}

/** 
 *  Reset the drawing of the regions */
regionUtils.resetManager = function () {
    var drawingclass = regionUtils._drawingclass;
    d3.select("." + drawingclass).remove();
    regionUtils._isNewRegion = true;
    regionUtils._currentPoints = null;
}
/** 
 *  When a region is being drawn, this function takes care of the creation of the region */
regionUtils.manager = function (event) {
    //console.log(event);
    var drawingclass = regionUtils._drawingclass;
    //if we come here is because overlayUtils.drawRegions mode is on
    // No matter what we have to get the normal coordinates so
    //I am going to have to do a hack to get the right OSD viewer
    //I will go two parents up to get the DOM id which will tell me the name
    //and then I will look for it in tmapp... this is horrible, but will work

    /*var eventSource=event.eventSource;//this is a mouse tracker not a viewer
    var OSDsvg=d3.select(eventSource.element).select("svg").select("g");
    var stringOSDVname=eventSource.element.parentElement.parentElement.id;
    var overlay=stringOSDVname.substr(0,stringOSDVname.indexOf('_'));*/
    //console.log(overlay);
    var OSDviewer = tmapp[tmapp["object_prefix"] + "_viewer"];
    var normCoords = OSDviewer.viewport.pointFromPixel(event.position);
    //var canvas=tmapp[tmapp["object_prefix"]+"_svgov"].node();
    var canvas = overlayUtils._d3nodes[tmapp["object_prefix"] + "_regions_svgnode"].node();
    //console.log(normCoords);
    var regionobj;
    //console.log(d3.select(event.originalEvent.target).attr("is-handle"));
    var strokeWstr = regionUtils._polygonStrokeWidth.toString();

    if (regionUtils._isNewRegion) {
        //if this region is new then there should be no points, create a new array of points
        regionUtils._currentPoints = [];
        //it is not a new region anymore
        regionUtils._isNewRegion = false;
        //give a new id
        regionUtils._currentRegionId += 1;
        var idregion = regionUtils._currentRegionId;
        //this is out first point for this region
        var startPoint = [normCoords.x, normCoords.y];
        regionUtils._currentPoints.push(startPoint);
        //create a group to store region
        regionobj = d3.select(canvas).append('g').attr('class', drawingclass);
        regionobj.append('circle').attr('r', regionUtils._handleRadius).attr('fill', regionUtils._colorActiveHandle).attr('stroke', '#aaaaaa')
            .attr('stroke-width', strokeWstr).attr('class', 'region' + idregion).attr('id', 'handle-0-region' + idregion)
            .attr('transform', 'translate(' + (startPoint[0].toString()) + ',' + (startPoint[1].toString()) + ') scale(' + regionUtils._scaleHandle + ')')
            .attr('is-handle', 'true').style({ cursor: 'pointer' });

    } else {
        var idregion = regionUtils._currentRegionId;
        var nextpoint = [normCoords.x, normCoords.y];
        var count = regionUtils._currentPoints.length - 1;

        //check if the distance is smaller than epsilonDistance if so, CLOSE POLYGON

        if (regionUtils.distance(nextpoint, regionUtils._currentPoints[0]) < regionUtils._epsilonDistance && count >= 2) {
            regionUtils.closePolygon();
            return;
        }

        regionUtils._currentPoints.push(nextpoint);
        regionobj = d3.select("." + drawingclass);

        regionobj.append('circle')
            .attr('r', regionUtils._handleRadius).attr('fill', regionUtils._colorActiveHandle).attr('stroke', '#aaaaaa')
            .attr('stroke-width', strokeWstr).attr('class', 'region' + idregion).attr('id', 'handle-' + count.toString() + '-region' + idregion)
            .attr('transform', 'translate(' + (nextpoint[0].toString()) + ',' + (nextpoint[1].toString()) + ') scale(' + regionUtils._scaleHandle + ')')
            .attr('is-handle', 'true').style({ cursor: 'pointer' });

        regionobj.select('polyline').remove();
        var polyline = regionobj.append('polyline').attr('points', regionUtils._currentPoints)
            .style('fill', 'none')
            .attr('stroke-width', strokeWstr)
            .attr('stroke', '#aaaaaa').attr('class', "region" + idregion);


    }

}
/** 
 *  Close a polygon, adding a region to the viewer and an interface to it in the side panel */
regionUtils.closePolygon = function () {
    var canvas = overlayUtils._d3nodes[tmapp["object_prefix"] + "_regions_svgnode"].node();
    var drawingclass = regionUtils._drawingclass;
    var regionid = 'region' + regionUtils._currentRegionId.toString();
    d3.select("." + drawingclass).remove();
    regionsobj = d3.select(canvas);

    var hexcolor = overlayUtils.randomColor("hex");    

    regionUtils._isNewRegion = true;
    regionUtils.addRegion([[regionUtils._currentPoints]], regionid, hexcolor);
    regionUtils._currentPoints = null;
    regionsobj.append('path').attr("d", regionUtils.pointsToPath(regionUtils._regions[regionid].points)).attr("id", regionid + "_poly")
        .attr("class", "regionpoly").attr("polycolor", hexcolor).style('stroke-width', regionUtils._polygonStrokeWidth.toString())
        .style("stroke", hexcolor).style("fill", "none");
    
}

/** 
 * @param {Object} JSON formatted region to convert to GeoJSON
 *  This is only for backward compatibility */
 regionUtils.oldRegions2GeoJSON = function (regionsObjects) {
    try {
        // Checking if json is in old format
        if (Object.values(regionsObjects)[0].globalPoints) {
            return regionUtils.regions2GeoJSON(regionsObjects)
        }
        else {
            return regionsObjects;
        }
    } catch (error) {
        return regionsObjects;
    }
 }

/** 
 * @param {Object} GeoJSON formatted region to import
 *  When regions are imported, create all objects for it from a region object */
 regionUtils.regions2GeoJSON = function (regionsObjects) {
    function HexToRGB(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return [ parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16) ];
    }
    function oldCoord2GeoJSONCoord(coordinates) {
        return coordinates.map (function(coordinateList, i) {
            return coordinateList.map (function(coordinateList_i, index) {
                return coordinateList_i.map(function(x) {
                    return [x.x, x.y];
                });
                
            });
        })
    }
    geoJSONObjects = {
        "type": "FeatureCollection",
        "features": Object.values(regionsObjects).map (function(Region, i) {
            return {
                "type": "Feature",
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": oldCoord2GeoJSONCoord(Region.globalPoints)
                },
                "properties": {
                    "name": Region.regionName,
                    "classification": {
                        "name": Region.regionClass
                    },
                    "color": HexToRGB(Region.polycolor),
                    "isLocked": false
                }
            }
        })
    }
    return geoJSONObjects;
 }

/** 
 * @param {Object} GeoJSON formatted region to import
 *  When regions are imported, create all objects for it from a region object */
regionUtils.geoJSON2regions = function (geoJSONObjects) {
    // Helper functions for converting colors to hexadecimal
    function rgbToHex(rgb) {
        return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    }
    function decimalToHex(number) {
        if (number < 0){ number = 0xFFFFFFFF + number + 1; }
        return "#" + number.toString(16).toUpperCase().substring(2, 8);
    }
    var viewer = tmapp[tmapp["object_prefix"] + "_viewer"]
    var canvas = overlayUtils._d3nodes[tmapp["object_prefix"] + "_regions_svgnode"].node();
    geoJSONObjects = regionUtils.oldRegions2GeoJSON(geoJSONObjects);
    if (!Array.isArray(geoJSONObjects)) {
        geoJSONObjects = [geoJSONObjects];
    }
    console.dir(geoJSONObjects);
    geoJSONObjects.forEach(function(geoJSONObj, geoJSONObjIndex) {
        if (geoJSONObj.type == "FeatureCollection") {
            return regionUtils.geoJSON2regions(geoJSONObj.features);
        }
        if (geoJSONObj.type != "Feature") {
            return;
        }
        var geometryType = geoJSONObj.geometry.type;
        var coordinates;
        if (geometryType=="Polygon") {
            coordinates = [geoJSONObj.geometry.coordinates];
        }
        else if (geometryType=="MultiPolygon") {
            coordinates = geoJSONObj.geometry.coordinates;
        }
        else {
            coordinates = [];
        }
        var geoJSONObjClass = "";
        var hexColor = "#ff0000";
        if (geoJSONObj.properties.color) {
            hexColor = rgbToHex(geoJSONObj.properties.color)
        }
        if (geoJSONObj.properties.name) {
            regionName = geoJSONObj.properties.name;
        }
        else {
            regionName = "Region_" + (geoJSONObjIndex - -1);
        }
        if (geoJSONObj.properties.object_type) {
            geoJSONObjClass = geoJSONObj.properties.object_type;
        }
        if (geoJSONObj.properties.classification) {
            geoJSONObjClass = geoJSONObj.properties.classification.name;
            if (geoJSONObj.properties.classification.colorRGB) {
                hexColor = decimalToHex(geoJSONObj.properties.classification.colorRGB);
            }
        }
        coordinates = coordinates.map (function(coordinateList, i) {
            return coordinateList.map (function(coordinateList_i, index) {
                coordinateList_i = coordinateList_i.map(function(x) {
                    xPoint = new OpenSeadragon.Point(x[0], x[1]);
                    xPixel = viewer.world.getItemAt(0).imageToViewportCoordinates(xPoint);
                    return [xPixel.x, xPixel.y];
                });
                return coordinateList_i.filter(function(value, index, Arr) {
                    return index % 1 == 0;
                });
            });
        })
        var regionId = "Region_geoJSON_" + geoJSONObjIndex;
        regionUtils.addRegion(coordinates, regionId, hexColor);

        document.getElementById(regionId + "_class_ta").value = geoJSONObjClass;
        document.getElementById(regionId + "_name_ta").value = regionName;

        regionobj = d3.select(canvas).append('g').attr('class', "mydrawingclass");
        regionobj.append('path').attr("d", regionUtils.pointsToPath(regionUtils._regions[regionId].points)).attr("id", regionId + "_poly")
            .attr("class", "regionpoly").attr("polycolor", hexColor).style('stroke-width', regionUtils._polygonStrokeWidth.toString())
            .style("stroke", hexColor).style("fill", "none");
        
        regionUtils.changeRegion(regionId);
    });
}

/** 
 * @param {Object} JSON formatted region to import
 *  When regions are imported, create all objects for it from a region object */
regionUtils.createImportedRegion = function (region) {
    var canvas = overlayUtils._d3nodes[tmapp["object_prefix"] + "_regions_svgnode"].node();
    regionsobj = d3.select(canvas);

    regionUtils._regions[region.id] = region;
    var hexcolor = region.polycolor;
    if(region.len==0){
        console.log(region.id+" has length 0, recalculating length");
        region.len=region.points.length;
    }
    regionsobj.append('path').attr("d", regionUtils.pointsToPath(region.points)).attr("id", region.id + "_poly")
        .attr("class", "regionpoly").attr("polycolor", hexcolor).style('stroke-width', regionUtils._polygonStrokeWidth.toString())
        .style("stroke", hexcolor).style("fill", "none");
    regionUtils.regionUI(region.id);
    if (region.filled) {
        region.filled = false;
        regionUtils.fillRegion(region.id)
    }
}

/** 
 * @param {List} points List of list of list of points representing a path
 * Given points' coordinates, returns a path string */
regionUtils.pointsToPath = function (points) {
    var path = "";
    points.forEach(function (subregions) {
        subregions.forEach(function (polygons) {
            var first = true
            polygons.forEach(function (point) {
                if (first) {path += " M ";first = false;}
                else {path += " L "}
                path += point.x + " " + point.y;
            });
            path += " Z"
        });
    });
    return path;
}

/** 
 * @param {Number[]} p1 Array with x and y coords
 * @param {Number[]} p2 Array with x and y coords
 *  Distance between two points represented as arrays [x1,y1] and [x2,y2] */
regionUtils.distance = function (p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]))
}
/** 
 *  @param {Number[]} points Array of 2D points in normalized coordinates
 *  Create a region object and store it in the regionUtils._regions container */
regionUtils.addRegion = function (points, regionid, color) {
    var op = tmapp["object_prefix"];
    var imageWidth = OSDViewerUtils.getImageWidth();
    var region = { "id": regionid, "points": [], "globalPoints": [], "regionName": regionid, "regionClass": null, "barcodeHistogram": [] };
    region.len = points.length;
    var _xmin = points[0][0][0][0], _xmax = points[0][0][0][0], _ymin = points[0][0][0][1], _ymax = points[0][0][0][1];
    var objectPointsArray = [];
    for (var i = 0; i < region.len; i++) {
        subregion = [];
        globalSubregion = [];
        for (var j = 0; j < points[i].length; j++) {
            polygon = [];
            globalPolygon = [];
            for (var k = 0; k < points[i][j].length; k++) {
                if (points[i][j][k][0] > _xmax) _xmax = points[i][j][k][0];
                if (points[i][j][k][0] < _xmin) _xmin = points[i][j][k][0];
                if (points[i][j][k][1] > _ymax) _ymax = points[i][j][k][1];
                if (points[i][j][k][1] < _ymin) _ymin = points[i][j][k][1];
                polygon.push({ "x": points[i][j][k][0], "y": points[i][j][k][1] });
                globalPolygon.push({ "x": points[i][j][k][0] * imageWidth, "y": points[i][j][k][1] * imageWidth });
            }
            subregion.push(polygon);
            globalSubregion.push(globalPolygon);
        }
        region.points.push(subregion);
        region.globalPoints.push(globalSubregion);
    }
    region._xmin = _xmin, region._xmax = _xmax, region._ymin = _ymin, region._ymax = _ymax;
    region._gxmin = _xmin * imageWidth, region._gxmax = _xmax * imageWidth, region._gymin = _ymin * imageWidth, region._gymax = _ymax * imageWidth;
    region.polycolor = color;

    regionUtils._regions[regionid] = region;
    regionUtils._regions[regionid].associatedPoints=[];
    regionUtils.regionUI(regionid);
}
/** 
 *  @param {String} regionid Region identifier to be searched in regionUtils._regions
 *  Create the whole UI for a region in the side panel */
regionUtils.regionUI = function (regionid) {

    var op = tmapp["object_prefix"];
    if (regionUtils._regions[regionid].regionClass) {
        regionUtils.addRegionClassUI (regionUtils._regions[regionid].regionClass)
        regionClassID = HTMLElementUtils.stringToId(regionUtils._regions[regionid].regionClass);
        var regionsPanel = document.getElementById("markers-regions-panel-" + regionClassID);
    }
    else {
        var regionsPanel = document.getElementById("markers-regions-panel");
    }
    var rPanel = HTMLElementUtils.createElement({
        type: "div",
        id: op + regionid + "_panel",
        headingInnerText: regionid,
        extraAttributes: {
            class: "card"
        }
    });
    regionsPanel.appendChild(rPanel);
    var rpanelbody = HTMLElementUtils.createElement({
        type: "div",
        extraAttributes: {
            class: "card-body"
        }
    });
    rPanel.appendChild(rpanelbody);

    var rpanelheading = HTMLElementUtils.createElement({
        type: "div",
        extraAttributes: {
            class: "card-title"
        }
    });
    rpanelbody.appendChild(rpanelheading);
    var rpanelsubheading = HTMLElementUtils.createElement({
        type: "div",
        extraAttributes: {
            class: "card-subtitle mb-2 text-muted"
        }
    });
    rpanelbody.appendChild(rpanelsubheading);
    var rpanelcontent = HTMLElementUtils.createElement({
        type: "div",
        extraAttributes: {
            class: "card-body py-0"
        }
    });
    rpanelbody.appendChild(rpanelcontent);

    // Content of the card
    var form = HTMLElementUtils.createForm({
        extraAttributes: {
            class:"form-inline",
            onsubmit:"return false;"
        }
    });
    rpanelcontent.appendChild(form);
    var row1 = HTMLElementUtils.createElement({
        type: "div",
        extraAttributes: {
            class: "row my-1"
        }
    });
    var row2 = HTMLElementUtils.createElement({
        type: "div",
        extraAttributes: {
            class: "row my-1"
        }
    });
    var row3 = HTMLElementUtils.createElement({
        type: "div",
        extraAttributes: {
            class: "row region-histogram my-1"
        }
    });
    form.appendChild(row1);
    form.appendChild(row2);
    form.appendChild(row3);

    var regioncolorinput = HTMLElementUtils.inputTypeColor({
        id: regionid + "_color_input",
        extraAttributes: {
            class: "col-2 mx-1 form-control form-control-color"
        }
    });

    if (document.getElementById(regionid + "_poly")) {
        var regionpoly = document.getElementById(regionid + "_poly");
        regioncolorinput.setAttribute("value", regionpoly.getAttribute("polycolor"));
    } else if (regionUtils._regions[regionid].polycolor) {
        regioncolorinput.setAttribute("value", regionUtils._regions[regionid].polycolor);
    }
    row1.appendChild(regioncolorinput);

    var regionnametext = HTMLElementUtils.inputTypeText({
        id: regionid + "_name_ta",
        extraAttributes: {
            size:9,
            placeholder: "name",
            class: "col mx-1 input-sm form-control"
        }
    });
    row1.appendChild(regionnametext);

    var regionclasstext = HTMLElementUtils.inputTypeText({
        id: regionid + "_class_ta",
        extraAttributes: {
            size: 9,
            placeholder: "class",
            class: "col mx-1 input-sm form-control"
        }
    });
    row1.appendChild(regionclasstext);

    //button to set new features of region
    var regionsetbutton = HTMLElementUtils.createButton({
        id: regionid + "_set_btn",
        innerText: "Set",
        extraAttributes: {
            parentRegion: regionid,
            class: "col btn btn-primary btn-sm form-control mx-1"
        }
    });
    regionsetbutton.addEventListener('click', function () {
        interfaceUtils.changeRegionUI($(this));
    });

    //button to fill polygon
    var regionsfillbutton = HTMLElementUtils.createButton({
        id: regionid + "_fill_btn",
        innerText: "Fill",
        extraAttributes: {
            parentRegion: regionid,
            class: "col btn btn-primary btn-sm form-control mx-1"
        }
    });
    regionsfillbutton.addEventListener('click', function () {
        interfaceUtils.fillRegionUI($(this));
    });

    var regionanalyzebutton = HTMLElementUtils.createButton({
        id: regionid + "_analyze_btn",
        innerText: "Analyze",
        extraAttributes: {
            parentRegion: regionid,
            class: "col btn btn-primary btn-sm form-control mx-1"
        }
    });
    regionanalyzebutton.addEventListener('click', function () {
        interfaceUtils.analyzeRegionUI($(this));
    });

    //button to remove region
    var regionsdeletebutton = HTMLElementUtils.createButton({
        id: regionid + "_delete_btn",
        innerText: "Delete",
        extraAttributes: {
            parentRegion: regionid,
            class: "col btn btn-primary btn-sm form-control mx-1"
        }
    });
    regionsdeletebutton.addEventListener('click', function () {
        interfaceUtils.deleteRegionUI($(this));
    });

    row2.appendChild(regionsetbutton);
    row2.appendChild(regionanalyzebutton);
    row2.appendChild(regionsfillbutton);
    row2.appendChild(regionsdeletebutton);

    var regionText = "";
    var rClass = null;
    var rName = null;

    if (regionUtils._regions[regionid].regionClass) {
        rClass = regionUtils._regions[regionid].regionClass;
        regionclasstext.value = rClass;
    }
    if (regionUtils._regions[regionid].regionName) {
        rName = regionUtils._regions[regionid].regionName;
        if (regionUtils._regions[regionid].regionName != regionid)
            regionnametext.value = rName;
    } else {
        rName = regionid;
    }
    regionText = rName;

    if (rClass) {
        regionText = regionText;
        rpanelsubheading.innerHTML = rClass;
    }

    rpanelheading.innerHTML = regionText;
}

/**
 * @param {*} x X coordinate of the point to check
 * @param {*} y Y coordinate of the point to check
 * @param {*} path SVG path
 * @param {*} tmpPoint Temporary point to check if in path. This is only for speed.
 */
 regionUtils.globalPointInPath=function(x,y,path,tmpPoint) {
    tmpPoint.x = x;
    tmpPoint.y = y;
    return path.isPointInFill(tmpPoint);
};

/** 
 *  @param {Object} quadtree d3.quadtree where the points are stored
 *  @param {Number} x0 X coordinate of one point in a bounding box
 *  @param {Number} y0 Y coordinate of one point in a bounding box
 *  @param {Number} x3 X coordinate of diagonal point in a bounding box
 *  @param {Number} y3 Y coordinate of diagonal point in a bounding box
 *  @param {Object} options Tell the function 
 *  Search for points inside a particular region */
regionUtils.searchTreeForPointsInRegion = function (quadtree, x0, y0, x3, y3, regionid, options) {    
    if (options.globalCoords) {
        var pointInPath = regionUtils.globalPointInPath;
        var xselector = "global_X_pos";
        var yselector = "global_Y_pos";
    }else{
        throw {name : "NotImplementedError", message : "ViewerPointInPath not yet implemented."}; 

    }
    var imageWidth = OSDViewerUtils.getImageWidth();
    var countsInsideRegion = 0;
    var pointsInside=[];
    regionPath=document.getElementById(regionid + "_poly");
    var svgovname = tmapp["object_prefix"] + "_svgov";
    var svg = tmapp[svgovname]._svg;
    tmpPoint = svg.createSVGPoint();
    quadtree.visit(function (node, x1, y1, x2, y2) {
        if (!node.length) {
            do {
                var d = node.data;
                d.scanned = true;
                var selected = (d[xselector] >= x0) && (d[xselector] < x3) && (d[yselector] >= y0) && (d[yselector] < y3);
                if (selected) {
                    if (pointInPath(d[xselector] / imageWidth, d[yselector] / imageWidth, regionPath, tmpPoint)) {
                        countsInsideRegion += 1;
                        pointsInside.push(d);
                    }
                }
            } while (node = node.next);
        }
        return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
    });

    if (countsInsideRegion) {
        regionUtils._regions[regionid].barcodeHistogram.push({ "barcode": quadtree.treeName, "gene_name": quadtree.treeGeneName, "count": countsInsideRegion });
    }
    return pointsInside;
}

/** Fill all regions  */
regionUtils.fillAllRegions=function(){
    for(var region in regionUtils._regions){
        if (regionUtils._regions.hasOwnProperty(region)) {
            regionUtils.fillRegion(region);
        }
    }
}

/** 
 * @param {String} regionid String id of region to fill
 * Given a region id, fill this region in the interface */
regionUtils.fillRegion = function (regionid) {
    if(regionUtils._regions[regionid].filled === 'undefined'){
        regionUtils._regions[regionid].filled=true;
    }else{
        regionUtils._regions[regionid].filled=!regionUtils._regions[regionid].filled;
    }
    var newregioncolor = document.getElementById(regionid + "_color_input").value;
    var d3color = d3.rgb(newregioncolor);
    var newStyle="";
    if(regionUtils._regions[regionid].filled){
        newStyle = "stroke-width: " + regionUtils._polygonStrokeWidth.toString()+ "; stroke: " + d3color.rgb().toString()+";";
        d3color.opacity=0.5;
        newStyle +="fill: "+d3color.rgb().toString()+";";
    }else{
        newStyle = "stroke-width: " + regionUtils._polygonStrokeWidth.toString() + "; stroke: " + d3color.rgb().toString() + "; fill: none;";
    }
    document.getElementById(regionid + "_poly").setAttribute("style", newStyle);

}
/** 
 * @param {String} regionid String id of region to delete
 * Given a region id, deletes this region in the interface */
regionUtils.deleteRegion = function (regionid) {
    var regionPoly = document.getElementById(regionid + "_poly")
    regionPoly.parentElement.removeChild(regionPoly);
    delete regionUtils._regions[regionid];
    var op = tmapp["object_prefix"];
    var rPanel = document.getElementById(op + regionid + "_panel");
    rPanel.parentElement.removeChild(rPanel);
    regionUtils.updateAllRegionClassUI();
}
/** 
 * @param {String} regionid String id of region to delete
 * Given a region id, deletes this region in the interface */
regionUtils.deleteAllRegions = function () {
    var canvas = overlayUtils._d3nodes[tmapp["object_prefix"] + "_regions_svgnode"].node();
    regionsobj = d3.select(canvas);
    regionsobj.selectAll("*").remove();

    var regionsPanel = document.getElementById("markers-regions-panel");
    regionsPanel.innerText = "";
    var regionsPanel = document.getElementById("regionAccordions");
    regionsPanel.innerText = "";
    regionUtils._regions = {};
}
regionUtils.updateAllRegionClassUI = function (regionClass) {
    // get all region classes
    var allRegionClasses = Object.values(regionUtils._regions).map(function(e) { return e.regionClass; })
    // get only unique values
    var singleRegionClasses = allRegionClasses.filter((v, i, a) => a.indexOf(v) === i);
    singleRegionClasses.forEach(function (regionClass) {
        regionClassID = HTMLElementUtils.stringToId(regionClass);
        numRegions = allRegionClasses.filter(x => x==regionClass).length
        spanEl = document.getElementById("numRegions-" + regionClassID)
        spanEl.innerText = numRegions;
    })
    Array.from(document.getElementsByClassName("accordion-item")).forEach(function(accordionItem) {
        if (Array.from(accordionItem.getElementsByClassName("card")).length == 0) {
            accordionItem.remove();
        }
    });
}
/** 
 *     @param {String} regionClass Region class
 *  Add accordion for a new region class */
regionUtils.addRegionClassUI = function (regionClass) {
    var op = tmapp["object_prefix"];
    var regionClassID = HTMLElementUtils.stringToId(regionClass);
    var accordion_item = document.getElementById("regionClassItem-" + regionClassID);
    if (!accordion_item) {
        var regionAccordions = document.getElementById("regionAccordions");
        var accordion_item = HTMLElementUtils.createElement({
            type: "div",
            extraAttributes: {
                class: "accordion-item",
                id: "regionClassItem-" + regionClassID
            }
        });
        regionAccordions.appendChild(accordion_item);
        var accordion_header = HTMLElementUtils.createElement({
            type: "h2",
            extraAttributes: {
                class: "accordion-header",
                id: "regionClassHeading-" + regionClassID
            }
        });
        accordion_item.appendChild(accordion_header);
        var accordion_header_button = HTMLElementUtils.createElement({
            type: "button",
            innerHTML: regionClass + " (<span id='numRegions-" + regionClassID + "'>1</span>&nbsp;region)",
            extraAttributes: {
                "type": "button",
                "class": "accordion-button collapsed",
                "id": "regionClassHeading-" + regionClassID,
                "data-bs-toggle": "collapse",
                "data-bs-target": "#" + "regionClass-" + regionClassID,
                "aria-expanded": "true",
                "aria-controls": "collapseOne"
            }
        });
        accordion_header.appendChild(accordion_header_button);
        var buttonRow = HTMLElementUtils.createElement({
            type: "div",
            extraAttributes: {
                class: "row my-1 mx-2"
            }
        });
        accordion_header.appendChild(buttonRow);
            
        
        var accordion_content = HTMLElementUtils.createElement({
            type: "div",
            extraAttributes: {
                class: "accordion-collapse collapse px-2",
                id: "regionClass-" + regionClassID,
                "aria-labelledby":"headingOne",
                "data-bs-parent":"#regionAccordions"
            }
        });
        accordion_item.appendChild(accordion_content);
        var regionPanel = HTMLElementUtils.createElement({
            type: "div",
            extraAttributes: {
                class: "my-1",
                id: "markers-regions-panel-" + regionClassID
            }
        });
        accordion_content.appendChild(regionPanel);
            
        //button to fill polygon
        var regionsfillbutton = HTMLElementUtils.createButton({
            id: regionClassID + "_fill_btn",
            innerText: "Fill group",
            extraAttributes: {
                parentRegion: regionClassID,
                class: "col btn btn-primary btn-sm form-control mx-1"
            }
        });
        regionsfillbutton.addEventListener('click', function () {
            Object.values(regionUtils._regions).filter(
                x => x.regionClass==regionClass
            ).forEach(function(region){
                regionUtils.fillRegion(region.id);
            });
        });

        var regionanalyzebutton = HTMLElementUtils.createButton({
            id: regionClassID + "_analyze_btn",
            innerText: "Analyze group",
            extraAttributes: {
                parentRegion: regionClassID,
                class: "col btn btn-primary btn-sm form-control mx-1"
            }
        });
        
        regionanalyzebutton.addEventListener('click', function () {
            if (!dataUtils.data["gene"][op + "_barcodeGarden"]) {
                alert("Load markers first");
                return;
            }
            Object.values(regionUtils._regions).filter(
                x => x.regionClass==regionClass
            ).forEach(function(region){
                regionUtils.analyzeRegion(region.id);
            });
        });

        //button to remove region
        var regionsdeletebutton = HTMLElementUtils.createButton({
            id: regionClassID + "_delete_btn",
            innerText: "Delete group",
            extraAttributes: {
                parentRegion: regionClassID,
                class: "col btn btn-primary btn-sm form-control mx-1"
            }
        });
        regionsdeletebutton.addEventListener('click', function () {
            Object.values(regionUtils._regions).filter(
                x => x.regionClass==regionClass
            ).forEach(function(region){
                regionUtils.deleteRegion(region.id);
            });
        });
        emptyCol = HTMLElementUtils.createElement({
            type: "div",
            extraAttributes: {
                class: "col-2"
            }
        });
        buttonRow.appendChild(emptyCol);
        buttonRow.appendChild(regionanalyzebutton);
        buttonRow.appendChild(regionsfillbutton);
        buttonRow.appendChild(regionsdeletebutton);

    }
}

/** 
 *     @param {String} regionid Region identifier
 *  Change the region properties like color, class name or region name */
regionUtils.changeRegion = function (regionid) {
    var op = tmapp["object_prefix"];
    var newregioncolor = document.getElementById(regionid + "_color_input").value;
    var d3color = d3.rgb(newregioncolor);
    var rPanel = document.getElementById(op + regionid + "_panel");
    if (regionUtils._regions[regionid].regionClass != document.getElementById(regionid + "_class_ta").value) {
        if (document.getElementById(regionid + "_class_ta").value) {
            regionUtils._regions[regionid].regionClass = document.getElementById(regionid + "_class_ta").value;
            classID = HTMLElementUtils.stringToId(regionUtils._regions[regionid].regionClass);
            regionUtils.addRegionClassUI (regionUtils._regions[regionid].regionClass)
            $(rPanel).detach().appendTo('#markers-regions-panel-' + classID)
        } else {
            regionUtils._regions[regionid].regionClass = null;
            $(rPanel).detach().appendTo('#markers-regions-panel')
        }
        regionUtils.updateAllRegionClassUI();
    }
    if (document.getElementById(regionid + "_name_ta").value) {
        regionUtils._regions[regionid].regionName = document.getElementById(regionid + "_name_ta").value;
    } else {
        regionUtils._regions[regionid].regionName = regionid;
    }
    var regionClass = "";
    if (regionUtils._regions[regionid].regionClass) regionClass = " (" + regionUtils._regions[regionid].regionClass + ")";
    document.querySelector("#" + op + regionid + "_panel .card-title").innerHTML = regionUtils._regions[regionid].regionName + regionClass;

    var newStyle = "stroke-width: " + regionUtils._polygonStrokeWidth.toString() + "; stroke: " + d3color.rgb().toString() + "; fill: none;";
    regionUtils._regions[regionid].polycolor = newregioncolor;
    //console.log(newStyle);

    document.getElementById(regionid + "_poly").setAttribute("style", newStyle);

}

/** 
 *     @param {String} regionid Region identifier
 *  Change the panel to match the region properties */
regionUtils.loadTextRegionUI = function (regionid) {
    var op = tmapp["object_prefix"];
    var rPanel = document.getElementById(op + regionid + "_panel");
    var regionText = "";
    var rClass = null;
    var rName = null;

    if (regionUtils._regions[regionid].regionClass) {
        rClass = regionUtils._regions[regionid].regionClass;
    }
    if (regionUtils._regions[regionid].regionName) {
        rName = regionUtils._regions[regionid].regionName;
    } else {
        rName = regionid;
    }
    regionText = rName;

    if (rClass) {
        regionText = regionText;
        HTMLElementUtils.getFirstChildByClass(rPanel, "card-subtitle").innerHTML = rClass;
    }

    console.log(rName + rClass + regionText);

    HTMLElementUtils.getFirstChildByClass(rPanel, "card-title").innerHTML = regionText;
}
/** 
 *  regionUtils */
regionUtils.analyzeRegion = function (regionid) {
    var op = tmapp["object_prefix"];

    function compare(a, b) {
        if (a.count > b.count)
            return -1;
        if (a.count < b.count)
            return 1;
        return 0;
    }

    function clone(obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    }

    regionUtils._regions[regionid].associatedPoints=[];
    regionUtils._regions[regionid].barcodeHistogram=[];

    console.log("analyzing "+regionid);
    var allkeys=Object.keys(dataUtils.data["gene"][op + "_barcodeGarden"]);
    for (var codeIndex in allkeys) {
        var code = allkeys[codeIndex];
        var pointsInside=regionUtils.searchTreeForPointsInRegion(dataUtils.data["gene"][op + "_barcodeGarden"][code],
        regionUtils._regions[regionid]._gxmin,regionUtils._regions[regionid]._gymin,
        regionUtils._regions[regionid]._gxmax,regionUtils._regions[regionid]._gymax,
            regionid, {"globalCoords":true});
        if(pointsInside.length>0){
            pointsInside.forEach(function(p){
                var pin=clone(p);
                pin.regionid=regionid;
                regionUtils._regions[regionid].associatedPoints.push(pin)
            });
        }
    }
    regionUtils._regions[regionid].barcodeHistogram.sort(compare);

    var rPanel = document.getElementById(op + regionid + "_panel");
    var rpanelbody = rPanel.getElementsByClassName("region-histogram")[0];
    histodiv = document.getElementById(regionid + "_histogram");
    if (histodiv) {
        histodiv.parentNode.removeChild(histodiv);
    }

    var div = HTMLElementUtils.createElement({ type: "div", id: regionid + "_histogram" });
    var histogram = regionUtils._regions[regionid].barcodeHistogram;
    var table = div.appendChild(HTMLElementUtils.createElement({
        type: "table",
        extraAttributes: {
            class: "table table-striped",
            style: "overflow-y: auto;"
        }
    }));
    thead = HTMLElementUtils.createElement({type: "thead"});
    thead.innerHTML = `<tr>
      <th scope="col">Name</th>
      <th scope="col">Barcode</th>
      <th scope="col">Count</th>
    </tr>`;
    tbody = HTMLElementUtils.createElement({type: "tbody"});
    table.appendChild(thead);
    table.appendChild(tbody);

    for (var i in histogram) {
        var innerHTML = "";
        innerHTML += "<td>" + histogram[i].gene_name + "</td>";
        innerHTML += "<td>" + histogram[i].barcode + "</td>";
        innerHTML += "<td>" + histogram[i].count + "</td>";
        tbody.appendChild(HTMLElementUtils.createElement({
            type: "tr",
            "innerHTML": innerHTML
        }));
    }
    rpanelbody.appendChild(div);

}
/** 
 *  regionUtils */
regionUtils.regionsOnOff = function () {
    overlayUtils._drawRegions = !overlayUtils._drawRegions;
    var op = tmapp["object_prefix"];
    let regionIcon = document.getElementById(op + '_drawregions_icon');
    if (overlayUtils._drawRegions) {
        regionIcon.classList.remove("bi-circle");
        regionIcon.classList.add("bi-check-circle");
    } else {
        regionUtils.resetManager();
        regionIcon.classList.remove("bi-check-circle");
        regionIcon.classList.add("bi-circle");
    }
}
/** 
 *  regionUtils */
regionUtils.exportRegionsToJSON = function () {
    regionUtils.regionsToJSON();
}
/** 
 *  regionUtils */
regionUtils.importRegionsFromJSON = function () {
    regionUtils.deleteAllRegions();
    regionUtils.JSONToRegions();
}

regionUtils.pointsInRegionsToCSV=function(){
    var alldata=[]
    for (r in regionUtils._regions){
        var regionPoints=regionUtils._regions[r].associatedPoints;
        regionUtils._regions[r].associatedPoints.forEach(function(p){
            p.regionName=regionUtils._regions[r].regionName
            p.regionClass=regionUtils._regions[r].regionClass
            alldata.push(p);
        });
        //console.log(alldata);    
    }
    var csvRows=[];
    var possibleheaders=Object.keys(alldata[0]);
    var headers=[];

    var datum=alldata[0];
    possibleheaders.forEach(function(ph){
        if(datum[ph]){
            //this is not undefined or null so add header

            headers.push(ph);
        }
    });

    csvRows.push(headers.join(','));
    

    for(var row of alldata){
        var values=[];
        headers.forEach(function(header){
            values.push(row[header]);
        });
        csvRows.push(values.join(","));
    }
    var theblobdata=csvRows.join('\n');
    regionUtils.downloadPointsInRegionsCSV(theblobdata);

}

regionUtils.downloadPointsInRegionsCSV=function(data){
    var blob = new Blob([data],{type:"text/csv"});
    var url=window.URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.setAttribute("hidden","");
    a.setAttribute("href",url);
    a.setAttribute("download","pointsinregions.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


regionUtils.regionsToJSON= function(){
    if (window.Blob) {
        var op=tmapp["object_prefix"];
        var jsonse = JSON.stringify(regionUtils.regions2GeoJSON(regionUtils._regions));
        var blob = new Blob([jsonse], {type: "application/json"});
        var url  = URL.createObjectURL(blob);
        var a=document.createElement("a");// document.getElementById("invisibleRegionJSON");
        if(document.getElementById(op+"_region_file_name")){
            var name=document.getElementById(op+"_region_file_name").value;
        }else{
            var name="regions.json";
        }
        a.href        = url;
        a.download    = name;
        a.textContent = "Download backup.json";
        a.click();
          // Great success! The Blob API is supported.
    } else {
      alert('The File APIs are not fully supported in this browser.');
    }        
}

regionUtils.JSONToRegions= function(filepath){
    regions={};
    if(filepath!==undefined){
        fetch(filepath)
        .then((response) => {
            return response.json();
        })
        .then((regionsobj) => {
            var maxregionid=0;
            for(i in regionsobj){
                //console.log(regions[i]);
                regionUtils.createImportedRegion(regionsobj[i]);
                var numbers = regionsobj[i].id.match(/\d+/g).map(Number);
                if(numbers[0]>maxregionid) maxregionid=numbers[0];
            }
            regionUtils._currentRegionId=maxregionid;        
        });
    }
    else if(window.File && window.FileReader && window.FileList && window.Blob) {
        var op=tmapp["object_prefix"];
        var text=document.getElementById(op+"_region_files_import");
        var file=text.files[0];
        var reader = new FileReader();
        reader.onload=function(event) {
            // The file's text will be printed here
            regionUtils.JSONValToRegions(JSON.parse(event.target.result));
        };
        reader.readAsText(file);
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}

regionUtils.JSONValToRegions= function(jsonVal){
    // The file's text will be printed here
    var regions=jsonVal;
    regionUtils.geoJSON2regions(regions);
}
