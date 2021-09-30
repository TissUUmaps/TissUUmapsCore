/**
 * @namespace markerUtils
 * @classdesc Work with anything that has to do with markers, take options from the interface
  about markers, and create markers  
   * @property {Bool}   markerUtils._drawPaths -draw D3 symbols (true)  or a D3 rect (false)
   * @property {Number} markerUtils._globalMarkerSize - 
   * @property {Number} markerUtils._uniqueColor - Keep then number of drawn regions and also let them be the id, 
   * @property {String} markerUtils._uniqueColorSelector - 
   * @property {Bool}   markerUtils._uniqueScale -
   * @property {String} markerUtils._uniqueScaleSelector -
   * @property {Bool}   markerUtils._uniquePiechart -
   * @property {String} markerUtils._uniquePiechartSelector -
   * @property {Number} markerUtils._startCullingAt - 
   * @property {Obj}    markerUtils._checkBoxes - 
   * @property {Array(String)}   markerUtils._d3Symbols -  
   * @property {Array(String)}   markerUtils._d3SymbolStrings - 
   * * @property {Object}  markerUtils._colorsperkey - load colors per key if known previously 
   * 
*/

markerUtils = {
    //type must be like d3.symbolVoss
    _drawPaths: true,
    _globalMarkerSize: 1,
    _showSizeColumn: false,
    _uniqueColor:false, //if this and selector are true, it will try to find a color unique to each spot
    _uniqueColorSelector:null, //is a string of the type "[float,float,float]" that gets converted to a string "rgb(uint8,uint8,uint8)"
    _uniqueScale:false, //if this and selector are true, it will try to find a color unique to each spot
    _uniqueScaleSelector:null, //is a string of the type "[float,float,float]" that gets converted to a string "rgb(uint8,uint8,uint8)"
    _uniquePiechart:false, //if this and selector are true, it will try to show a unique piechart for each spot
    _uniquePiechartSelector:null, //a string with the name of the piechart data field in the CSV
    _startCullingAt: 9000,
    _checkBoxes: {},
    _d3Symbols: [d3.symbolCross, d3.symbolDiamond, d3.symbolSquare, d3.symbolTriangle, d3.symbolStar, d3.symbolWye, d3.symbolCircle],
    _d3SymbolStrings: ["Cross", "Diamond", "Square", "Triangle", "Star", "Wye", "Circle"],
    _colorsperkey:null,
    _startMarkersOn:false,
    _randomShape:true,
    _selectedShape:0,
    _headerNames:{"Barcode":"Barcode","Gene":"Gene"}
}


/** 
 * Invokes all the HTML necessary to create the interface for a barcode and add the listener so that
 * clicking the box invokes the drawing of the marker or erase. 
 * Selects a color based on the barcode letters so that the color are different versions of 
 * the four corners of Ycbcr. Chooses a random shape
 * @param {Object} barObject coming from dataUtils.data["gene"][op+_data] which looks like this {key: "AGGGC", values: Array(1234)} 
 * @param {Object} options containing inforamtion on what to omit if necessary. for instance if
 * options.drawGeneName is there and it is true it will draw the column "name" and omit it otherwise
 * @returns {htmlnode} The nicely formated row for our markerUi table
 * */
markerUtils.markerUI = function (barObject,options) {
    var op = tmapp["object_prefix"];
    var row = HTMLElementUtils.createElement({ type: "tr", id: barObject.key + "-tr" });

    //var tdkey = HTMLElementUtils.createElement({ type: "td", innerText: barObject.key });
    //row.appendChild(tdkey);

    var check = HTMLElementUtils.createElement({ type: "td" });
    var checkinput = HTMLElementUtils.inputTypeCheckbox({
        id: barObject.key.replace(/\W/g, '') + "-checkbox-" + op,
        extraAttributes: { barcode: barObject.key },
        eventListeners: { click: function () {
            document.getElementById("AllMarkers-checkbox-" + op).checked = false;
        }}
    });
    markerUtils._checkBoxes[barObject.key] = checkinput;

    check.appendChild(checkinput);
    row.appendChild(check);

    if(options.drawGeneLetters){
        var barcodeLetters=barObject.values[0].letters;
        var lettersrow = HTMLElementUtils.createElement({ type: "td", innerHTML: "<label style='cursor:pointer' for='" + barObject.key.replace(/\W/g, '') + "-checkbox-" + op + "'>"+barcodeLetters+" </label>",
            extraAttributes: { "title": barcodeLetters, "data-title":barcodeLetters } });
        row.appendChild(lettersrow);
    }

    if(options.drawGeneName){
        var gn=barObject.values[0].gene_name;
        var name = HTMLElementUtils.createElement({ type: "td", innerHTML:  "<label style='cursor:pointer' for='" + barObject.key.replace(/\W/g, '') + "-checkbox-" + op + "'>"+gn+" </label>",
            extraAttributes: { "title": gn, "data-title":gn } });
        row.appendChild(name);
    }

    var amount = HTMLElementUtils.createElement({ type: "td", innerText: barObject.values.length });
    row.appendChild(amount);

    if (!markerUtils._uniqueColor && !markerUtils._uniquePiechart) {
        var thecolor="#5fb5f6"
        if(options.randomColorForMarker){
            thecolor=overlayUtils.randomColor("hex");
        }
        else if(markerUtils._colorsperkey){
            thecolor=markerUtils._colorsperkey[barObject.key];
            //if it ends up undefined give a random color anyways
            if(!thecolor) thecolor=HTMLElementUtils.barcodeHTMLColor(barObject.key);
        }else{
            thecolor=HTMLElementUtils.barcodeHTMLColor(barObject.key);
        }
        thecolor = thecolor.toLowerCase();  // Should be lowercase for color inputs
        var color = HTMLElementUtils.createElement({ type: "td" });
        var colorinput = HTMLElementUtils.inputTypeColor({ id: barObject.key + "-color-" + op, extraAttributes: { value: thecolor } })
        color.appendChild(colorinput);
        row.appendChild(color);

        // Workaround for black color inputs in Safari (WebKit)
        colorinput.value = "#ffffff";
        colorinput.value = thecolor;
    }

    if (!markerUtils._uniquePiechart) {
        var shape = HTMLElementUtils.createElement({ type: "td" });
        var shapeParams = { random: markerUtils._randomShape, id: barObject.key + "-shape-" + op, "options": markerUtils._d3SymbolStrings };
        var shapeinput = HTMLElementUtils.selectTypeDropDown(shapeParams);
        if (shapeParams.random) { var rnd = Math.floor(Math.random() * (markerUtils._d3SymbolStrings.length-1)) + 0; shapeinput.selectedIndex = rnd; }
        else {shapeinput.selectedIndex = markerUtils._selectedShape}
        shape.appendChild(shapeinput);
        row.appendChild(shape);
    }

    if (markerUtils._showSizeColumn) {
        var size = HTMLElementUtils.createElement({ type: "td" });
        var sizeinput = HTMLElementUtils.inputTypeText({ id: barObject.key + "-size-" + op, "class": "form-control" });
        size.appendChild(sizeinput);
        row.appendChild(size);
    }

    return row;
}

/** 
 * Invokes all the HTML necessary to create the interface for a barcode and add the listener so that
 * clicking the box invokes the drawing of the marker or erase. 
 * Selects a color based on the barcode letters so that the color are different versions of 
 * the four corners of Ycbcr. Chooses a random shape
 * @param {Object} barObject coming from dataUtils.data["gene"][op+_data] which looks like this {key: "AGGGC", values: Array(1234)} 
 * @param {Object} options containing inforamtion on what to omit if necessary. for instance if
 * options.drawGeneName is there and it is true it will draw the column "name" and omit it otherwise
 * @returns {htmlnode} The nicely formated row for our markerUi table
 * */
markerUtils.markerUIAll = function (options) {
    var op = tmapp["object_prefix"];
    var row = HTMLElementUtils.createElement({ type: "tr", id: "allbarcodes-tr" });

    //var tdkey = HTMLElementUtils.createElement({ type: "td", innerText: barObject.key });
    //row.appendChild(tdkey);

    var check = HTMLElementUtils.createElement({ type: "td" });
    var checkinput = HTMLElementUtils.inputTypeCheckbox({
        id: "AllMarkers-checkbox-" + op,
        eventListeners: { click: function () { 
            // TODO: Remove JQuery dependency here?
            $("#ISS_table input[type=checkbox]").prop("checked",$("#AllMarkers-checkbox-ISS").prop("checked"));
         } }
    });
    
    check.appendChild(checkinput);
    row.appendChild(check);
    if(options.drawGeneLetters){
        var lettersrow = HTMLElementUtils.createElement({ type: "td", innerHTML:  "<label style='cursor:pointer' for='AllMarkers-checkbox-" + op + "'>All</label>",
            extraAttributes: { "title": "All", "data-title":"All" } });
        row.appendChild(lettersrow);
    }

    if(options.drawGeneName){
        var name = HTMLElementUtils.createElement({ type: "td", innerHTML:  "<label style='cursor:pointer' for='AllMarkers-checkbox-" + op + "'>All</label>",
            extraAttributes: { "title": "All", "data-title":"All" } });
        row.appendChild(name);
    }
    var length = 0;
    dataUtils.data["gene"][op + "_data"].forEach(function (barcode) {
        length += barcode.values.length;
    });
    var amount = HTMLElementUtils.createElement({ type: "td", innerText: length });
    row.appendChild(amount);

    if (!markerUtils._uniqueColor && !markerUtils._uniquePiechart) {
        var color = HTMLElementUtils.createElement({ type: "td" });
        row.appendChild(color);
    }
    if (!markerUtils._uniquePiechart) {
        var shape = HTMLElementUtils.createElement({ type: "td" });
        row.appendChild(shape);
    }

    if (markerUtils._showSizeColumn) {
        var size = HTMLElementUtils.createElement({ type: "td" });
        row.appendChild(size);
    }
    if (markerUtils._startMarkersOn) {
        setTimeout(function() {
            checkinput.click();
        },100);
    }
    return row;
}

/** Print the table filled with all the interactions to turn on and off the barcodes 
 * choose color, shape and size
 */
markerUtils.printBarcodeUIs = function (options) {
    //get object prefix to refer to it by code
    var op = tmapp["object_prefix"];
    //overlayUtils._d3nodes[op]=d3.select( tmapp[op+"_svgov"].node());
    //chekc if gene_name exists    
    var headers = ["Count", "Color", "Shape"];
    if (markerUtils._showSizeColumn) {
        headers = ["Count", "Color", "Shape", "Size"];
    }
    if (markerUtils._uniqueColor) {
        headers = ["Count", "Shape"];
    }
    if (markerUtils._uniquePiechart) {
        headers = ["Count"];
    }
    dataUtils.sortDataAndDownsample();
    //this is causing weird behaviour sometims it creates the name column sometimes no
    var example = dataUtils.data["gene"][op + "_data"][0].values[0];
    //so instead of using an example check for the keys and find if a gene_name exists
    //or maybe if it is selected in the interface adn a name is expected

    var options=dataUtils.data["gene"]._nameAndLetters;

    if(dataUtils.data["gene"]._nameAndLetters.drawGeneName){
        options.drawGeneName=true;
        headers.unshift("Gene");
    }
    if(dataUtils.data["gene"]._nameAndLetters.drawGeneLetters){
        options.drawGeneLetters=true;
        headers.unshift("Barcode");
    }
    headers.unshift("");

    var container = document.getElementById(op + "_markers"); container.innerHTML = "";
    var tbl = document.createElement("table");
    tbl.setAttribute("class", "table table-striped");
    tbl.setAttribute("id", op + "_table");
    tbl.setAttribute("style","word-break: break-all;");

    var colg=document.createElement ("colgroup");
    if(headers.length == 4 ){
        colg.innerHTML='<col width="2%"><col width="23%"><col width="16%"><col width="17%">';
        tbl.appendChild(colg);
    }
    else if(headers.length == 5 ){
        colg.innerHTML='<col width="2%"><col width="23%"><col width="20%"><col width="16%"><col width="17%">';
        tbl.appendChild(colg);
    }
    else if(headers.length == 6 ){
        colg.innerHTML='<col width="2%"><col width="23%"><col width="20%"><col width="16%"><col width="12%"><col width="17%">';
        tbl.appendChild(colg);
    }
    else if(headers.length == 7 ){
        colg.innerHTML='<col width="2%"><col width="16%"><col width="16%"><col width="15%"><col width="11%"><col width="15%"><col width="16%">';
        tbl.appendChild(colg);
    } else if(headers.length>1 && headers.length<6){
        var quotient = Math.floor(100/headers.length);
        var str='<col width="'+quotient+'%">'.repeat(headers.length);
        colg.innerHTML=str;
        tbl.appendChild(colg);
    }

    var tblHead = document.createElement("thead");
    var tblHeadTr = document.createElement("tr");
    tblHead.appendChild(tblHeadTr);

    var tblBody = document.createElement("tbody");
    headers.forEach(function (header) {
        var th = document.createElement("th");
        if (markerUtils._headerNames[header]) {
            headerText = markerUtils._headerNames[header];
        }
        else {
            headerText = header;
        }
        th.appendChild(document.createTextNode(headerText));
        tblHeadTr.appendChild(th);
    });
    tbl.appendChild(tblHead);
    
    var row = markerUtils.markerUIAll(options);
    tblBody.appendChild(row);

    dataUtils.data["gene"][op + "_data"].forEach(function (barcode) {
        var row = markerUtils.markerUI(barcode,options);
        tblBody.appendChild(row);
    });
    
    tbl.appendChild(tblBody);
    container.appendChild(tbl);

}
/** In the markers interface, hide all the rows that do not contain the search string 
 *  specified in the interface in the textarea
*/
markerUtils.hideRowsThatDontContain = function () {
    var op = tmapp["object_prefix"];
    var contains = function (row, searchFor) {
        var v = row.textContent.toLowerCase();
        var v2 = searchFor;
        if (v2) {
            v2 = v2.toLowerCase();
        }
        return v.indexOf(v2) > -1;
    };

    var aneedle = document.getElementById(op + "_search").value;
    var rows = document.getElementById(op + "_table").rows;

    //make it so that the needle can be a list separated by comma, no spaces

    console.log(aneedle);

    var needles=[];

    if (aneedle.indexOf(',') > -1) { 
        needles=aneedle.split(',');
    }else{
        needles.push(aneedle)
    }

    
    for (var i = 2; i < rows.length; i++) {
        var show=false;
        needles.forEach(function(needle){
            if (contains(rows[i], needle)) {
                show=true;
            }
        });
        if (!show) {
            rows[i].setAttribute("style", "display:none;");
        } else { rows[i].setAttribute("style", ""); }
    }
}

/** Show all rows from the markers UI again */
markerUtils.showAllRows = function () {
    var op = tmapp["object_prefix"];
    var rows = document.getElementById(op + "_table").rows;

    for (var i = 0; i < rows.length; i++) {
        rows[i].setAttribute("style", "");
    }
}

/** Adding piechart legend in the upper left corner */
markerUtils.addPiechartLegend = function () {
    var op = tmapp["object_prefix"];
    if (!markerUtils._uniquePiechartSelector || markerUtils._uniquePiechartSelector == "null")
        return;
    if (document.getElementById("piechartLegend") == undefined) {
        var elt = document.createElement('div');
        elt.className = "piechartLegend"
        elt.id = "piechartLegend"
        elt.style.zIndex = "100";
        elt.style.paddingLeft = "5px";
        elt.style.paddingBottom = "2px";
        elt.style.overflowY = "auto";
        elt.style.maxHeight = "Calc(100vh - 245px)";
        tmapp['ISS_viewer'].addControl(elt,{anchor: OpenSeadragon.ControlAnchor.TOP_LEFT});
    }
    elt = document.getElementById("piechartLegend");
    elt.style.display="block";
    elt.innerHTML = "";
    var table = HTMLElementUtils.createElement({ type: "table"});
    table.style.borderSpacing = "3px";
    table.style.borderCollapse = "separate";
    table.style.fontSize = "10px";
    var title = HTMLElementUtils.createElement({ type: "div", innerHTML: "<b>Piechart legend</b>"});
    elt.appendChild(title);
    elt.appendChild(table);
    var sectors = [];
    if (markerUtils._uniquePiechartSelector.split(";").length > 1) {
        sectors = markerUtils._uniquePiechartSelector.split(";");
    }
    else {
        numSectors = dataUtils.data["gene"][op + "_data"][0].values[0][markerUtils._uniquePiechartSelector].split(";").length;
        for(var i = 0; i < numSectors; i++) {
            sectors.push("Sector " + (i+1));
        }
    }
    sectors.forEach(function (sector, index) {
        var row = HTMLElementUtils.createElement({ type: "tr"});
        row.style.paddingBottom = "4px";
        var colortd = HTMLElementUtils.createElement({ type: "td", innerHTML: "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"});
        colortd.style.backgroundColor = glUtils._piechartPalette[index % glUtils._piechartPalette.length];
        colortd.style.maxWidth = "70px";
        colortd.style.borderWidth= "1px";
        colortd.style.borderColor= "black";
        colortd.style.borderStyle= "solid";
        var labeltd = HTMLElementUtils.createElement({ type: "td", innerHTML: "&nbsp;" + sector});
        row.appendChild(colortd);
        row.appendChild(labeltd);
        table.appendChild(row);
    })
    console.log(sectors);
}

/** Adding piechart table on pickup */
markerUtils.makePiechartTable = function (barcode) {
    var op = tmapp["object_prefix"];
    var sectors = [];
    if (markerUtils._uniquePiechartSelector.split(";").length > 1) {
        sectors = markerUtils._uniquePiechartSelector.split(";");
    }
    else {
        numSectors = dataUtils.data["gene"][op + "_data"][0].values[0][markerUtils._uniquePiechartSelector].split(";").length;
        for(var i = 0; i < numSectors; i++) {
            sectors.push("Sector " + (i+1));
        }
    }
    outText = "";
    sectorValues = barcode[markerUtils._uniquePiechartSelector].split(";")
    sortedSectors = [];
    sectors.forEach(function (sector, index) {
        sortedSectors.push([parseFloat(sectorValues[index]), sector, index])
    });
    console.dir(sortedSectors);
    sortedSectors.sort(
        function cmp(a, b) {

            return b[0]-a[0];
        }
    );
    console.dir(sortedSectors);
    sortedSectors.forEach(function (sector) {
        outText += "<span style='border:2px solid " + glUtils._piechartPalette[sector[2] % glUtils._piechartPalette.length] + ";padding:3px;margin:2px;display: inline-block;'>" + sector[1] + ": " + (sector[0] * 100).toFixed(1) + " %</span> ";
    })
    return outText;
}
