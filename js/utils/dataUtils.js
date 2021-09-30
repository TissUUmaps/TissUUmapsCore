/**
* @file dataUtils.js Handling data for TissUUmaps
* @author Leslie Solorzano
* @see {@link dataUtils}
*/

/**
 * @namespace dataUtils
 * @property {Object} dataUtils.data["gene"]._expectedCSV - Expected csv structure
 * @property {Object} dataUtils.data["gene"]._subsampledBarcodes - Containing the subsamples barcode trees to display
 * @property {Number} dataUtils.data["gene"]._maximumAmountInLowerRes - Maximum amount of points to display in low res
 * @property {Object} dataUtils.data["gene"]._nameAndLetters - Contains two bools drawGeneName and drawGeneLetters to know if and which to display between barcode or gene name
 * @property {Object} dataUtils.data["gene"]._drawOptions - Options for markerUtils.printBarcodeUIs
 */
dataUtils = {
    data:{
        "gene":{
            _type: "GENE_DATA",
            /** _CSVStructure - Expected csv structure */
            _CSVStructure: { headers: ["barcode", "gene_name", "global_X_pos", "global_Y_pos", "seq_quality_min"] },
            _expectedCSV: { "group": "macro_cluster", "name": "", "X_col": "global_X_pos", "Y_col": "global_Y_pos", "key": "" },
            _subsampledBarcodes: {},
            _maximumAmountInLowerRes: 5000,
            _nameAndLetters: { drawGeneName: false, drawGeneLetters: false },
            _drawOptions: { randomColorForMarker: false },
            _autoLoadCSV: false
            //_minimumAmountToDisplay: 500,
            //_subsamplingRate: 100
        },
        "morphology":{
            _type: "MORPHOLOGY_DATA",
            _CSVStructure: { headers: ["letters", "gene_name", "global_X_pos", "global_Y_pos", "seq_quality_min"] },
            _expectedCSV: { "key_header": "Global_Exp_ID", "X_header": "Global_X", "Y_header": "Global_Y", "colorscale": "interpolateRainbow" },
            _d3LUTs:["ownColorFromColumn","interpolateCubehelixDefault", "interpolateRainbow", "interpolateWarm", "interpolateCool", "interpolateViridis", "interpolateMagma", "interpolateInferno", "interpolatePlasma", "interpolateRdYlGn", "interpolateBuGn", "interpolateBuPu", "interpolateGnBu", "interpolateOrRd", "interpolatePuBuGn", "interpolatePuBu", "interpolatePuRd", "interpolateRdPu", "interpolateYlGnBu", "interpolateYlGn", "interpolateYlOrBr", "interpolateYlOrRd", "interpolateBlues", "interpolateGreens", "interpolateGreys", "interpolatePurples", "interpolateReds", "interpolateOranges"],
            _subsampledItems: {},
            _ownColorLut:{"class":"hexcolor"},
            _subsamplingRate: 100,
            _minimumAmountToDisplay: 500,
            _markersize:0.0008,
            _subsamplingfactor:0.15,
            _drawCPdata: false
        }
        /*
        data_id:{kv pairs}
        ... and inifinitely more data "types" like piecharts or whatever
        */
    }
}

/**
 * @deprecated Not required anymore, but kept for backwards-compatibility
 */
CPDataUtils={};

/** ----------------------------------------------------------------------
* Common interface for data
* ---------------------------------------------------------------------- */

dataUtils.setExpectedCSV = function(data_id, expectedCSV) {

    // TODO: Do validation of inputs
    let data_obj = dataUtils.data[data_id];
    dataUtils._setExpectedCSV[data_obj._type](data_id);
}

dataUtils._setExpectedCSV = {}

/**
 * From the interface, get the key that will be used for nesting the raw data
 * and making my lovely quadtrees
 */
dataUtils.processRawData = function(data_id) {

    // TODO: Do validation of inputs
    let data_obj = dataUtils.data[data_id];
    dataUtils._processRawData[data_obj._type](data_id);
}

dataUtils._processRawData = {}

/** 
 * Show the menu do select the CSV headers that contain the information to display
 */
dataUtils.createMenuFromCSV = function(data_id) {

    // TODO: Do validation of inputs
    let data_obj = dataUtils.data[data_id];
    dataUtils._createMenuFromCSV[data_obj._type](data_id);
}

dataUtils._createMenuFromCSV = {}

/**
 * @param {File} thecsv
 * @return {Array} The csv headers.
 * This reads the CSV and stores the raw data and sets the headers
 * in the interface and at [op + "_csv_header"]
 * Later on it should be nested according to the main criteria
 */
dataUtils.readCSV = function(data_id, thecsv) {

    // TODO: Do validation of inputs
    let data_obj = dataUtils.data[data_id];
    dataUtils._readCSV[data_obj._type](data_id, thecsv);
}

dataUtils._readCSV = {}

/** ----------------------------------------------------------------------
* Gene expression data
* ---------------------------------------------------------------------- */

dataUtils._setExpectedCSV["GENE_DATA"] = function(data_id, expectedCSV) {

    let data_obj = dataUtils.data[data_id];
    data_obj._expectedCSV = expectedCSV;
}

dataUtils._processRawData["GENE_DATA"] = function(data_id) {

    let data_obj = dataUtils.data[data_id];
    
    var imageWidth = OSDViewerUtils.getImageWidth();
    var op = tmapp["object_prefix"];

    var progressParent=interfaceUtils.getElementById("ISS_csv_progress_parent");
    if(progressParent == null){
        console.log("No progress bar present.")
    }else{
        progressParent.style.visibility="hidden";
        progressParent.style.display="none";
    }
    
    var ISSBarcodeInputNode = document.getElementById("ISS_barcode_header");
    var barcodeSelector = ISSBarcodeInputNode.options[ISSBarcodeInputNode.selectedIndex].value;
    var ISSNanmeInputNode = document.getElementById("ISS_name_header");
    var nameSelector = ISSNanmeInputNode.options[ISSNanmeInputNode.selectedIndex].value;
    var ISSXNode = document.getElementById("ISS_X_header");
    var xSelector = ISSXNode.options[ISSXNode.selectedIndex].value;
    var ISSYNode = document.getElementById("ISS_Y_header");
    var ySelector = ISSYNode.options[ISSYNode.selectedIndex].value;
    var ISSColor = document.getElementById("ISS_color_header");
    var ISSScale = document.getElementById("ISS_scale_header");
    var ISSPiechart = document.getElementById("ISS_piechart_header");
    if (ISSColor)
        var colorSelector = ISSColor.options[ISSColor.selectedIndex].value;
    else
        var colorSelector = "null";
    if (ISSScale)
        var scaleSelector = ISSPiechart.options[ISSScale.selectedIndex].value;
    else
        var scaleSelector = "null";
    if (ISSPiechart)
        var piechartSelector = ISSPiechart.options[ISSPiechart.selectedIndex].value;
    else
        var piechartSelector = "null";
    
    if (colorSelector && colorSelector != "null"){
        markerUtils._uniqueColor = true;
        markerUtils._uniqueColorSelector = colorSelector;
    }
    else {
        markerUtils._uniqueColor = false;
        markerUtils._uniqueColorSelector = "";
    }
    if (piechartSelector && piechartSelector != "null"){
        markerUtils._uniquePiechart = true;
        markerUtils._uniquePiechartSelector = piechartSelector;
    }
    else {
        markerUtils._uniquePiechart = false;
        markerUtils._uniquePiechartSelector = "";
    }
    if (scaleSelector && scaleSelector != "null"){
        markerUtils._uniqueScale = true;
        markerUtils._uniqueScaleSelector = scaleSelector;
    }
    else {
        markerUtils._uniqueScale = false;
        markerUtils._uniqueScaleSelector = "";
    }
    
    //check that the key is available
    var knode = document.getElementById(op + "_key_header");
    var key = knode.options[knode.selectedIndex].value;
    
    if (key.includes("letters")) {
        //make sure that the barcode column is selected
        if ((barcodeSelector == "null")) {
            //console.log("entered here");
            console.log("Key is selected to be Barcode but no column was selected in csv");
            if (!(nameSelector == "null")) {
                knode.options[1].selected = true;//option for gene name
                console.log("changing key to gene name");
            }
        }
    }
    
    if (key.includes("gene_name")) {
        //make sure that the barcode column is selected
        if ((nameSelector == "null")) {
            //console.log("entered here");
            console.log("Key is selected to be Gene Name but no column was selected in csv")
            if (!(barcodeSelector == "null")) {
                knode.options[0].selected = true; //option for barcode
                console.log("changing key to barcode");
            }
        }
    }
    
    //console.log("barcodeSelector nameSelector",barcodeSelector,nameSelector);
    
    if (!(nameSelector == "null")) {
        //console.log("entered here");
        data_obj._nameAndLetters.drawGeneName = true;
    }
    else {
        data_obj._nameAndLetters.drawGeneName = false;
    }
    if (!(barcodeSelector == "null")) {
        //console.log("entered here");
        data_obj._nameAndLetters.drawGeneLetters = true;
    }
    else {
        //console.log("entered here");
        data_obj._nameAndLetters.drawGeneLetters = false;
    }
    
    var toRemove = [barcodeSelector, nameSelector, xSelector, ySelector];
    var extraSelectors = []
    data_obj._CSVStructure[op + "_csv_header"].forEach(function (item) { extraSelectors.push(item) });
    extraSelectors = extraSelectors.filter((el) => !toRemove.includes(el));
    data_obj[op + "_processeddata"] = [];
    data_obj[op + "_rawdata"].forEach(function (rawdatum) {
        var obj = {};
        obj["letters"] = rawdatum[barcodeSelector];
        obj["gene_name"] = rawdatum[nameSelector];
        obj["global_X_pos"] = Number(rawdatum[xSelector]);
        obj["global_Y_pos"] = Number(rawdatum[ySelector]);
        obj["viewer_X_pos"] = (obj["global_X_pos"] + 0.5) / imageWidth;
        obj["viewer_Y_pos"] = (obj["global_Y_pos"] + 0.5) / imageWidth;
        extraSelectors.forEach(function (extraSelector) {
            obj[extraSelector] = rawdatum[extraSelector];
        });
        data_obj[op + "_processeddata"].push(obj);
    });
    
    dataUtils.makeQuadTrees();
    
    delete data_obj[op + "_rawdata"];
    if (document.getElementById("ISS_globalmarkersize")) {
        document.getElementById("ISS_globalmarkersize").style.display = "block";
    }
    if (document.getElementById("ISS_searchmarkers_row")) {
        document.getElementById("ISS_searchmarkers_row").style.display = "block";
    }
    if (window.hasOwnProperty("glUtils")) {
        glUtils.loadMarkers();  // Update vertex buffers, etc. for WebGL drawing
    }
    if (markerUtils._uniquePiechartSelector != ""){
        markerUtils.addPiechartLegend();
    }
    else {
        if(interfaceUtils.getElementById("piechartLegend"))
            interfaceUtils.getElementById("piechartLegend").style.display="none";
    }
}

dataUtils._createMenuFromCSV["GENE_DATA"] = function(data_id) {

    let data_obj = dataUtils.data[data_id];

    var op = tmapp["object_prefix"];
    var csvheaders = Object.keys(data_obj[op + "_rawdata"][0]);
    data_obj._CSVStructure[op + "_csv_header"] = csvheaders;
    var ISSBarcodeInput = document.getElementById(op + "_barcode_header");
    var ISSNanmeInput = document.getElementById(op + "_name_header");
    var ISSX = document.getElementById(op + "_X_header");
    var ISSY = document.getElementById(op + "_Y_header");
    var ISSColor = document.getElementById(op + "_color_header");
    var ISSScale = document.getElementById(op + "_scale_header");
    var ISSPiechart = document.getElementById(op + "_piechart_header");
    var ISSKey = document.getElementById(op + "_key_header");
    //console.log(data_obj._CSVStructure["ISS_csv_header"]);
    [ISSBarcodeInput, ISSNanmeInput, ISSX, ISSY, ISSColor, ISSScale, ISSPiechart].forEach(function (node) {
        if (!node) return;
        node.innerHTML = "";
        var option = document.createElement("option");
        option.value = "null";
        option.text = "-----";
        node.appendChild(option);
        csvheaders.forEach(function (head) {
            var option = document.createElement("option");
            option.value = head;
            option.text = head.split(";")[0];
            node.appendChild(option);
        });
    });
    var panel = document.getElementById(op + "_csv_headers");
    if (!data_obj._autoLoadCSV) {
        panel.style = "";
    }
    //search for defaults if any, "barcode" used to be called "letters"
    //it is still "letters in the obejct" but the BarcodeInputValue can be anything chosen by the user
    //and found in the csv column
    if (csvheaders.includes(data_obj._expectedCSV["group"])) ISSBarcodeInput.value = data_obj._expectedCSV["group"];
    if (csvheaders.includes(data_obj._expectedCSV["name"])) ISSNanmeInput.value = data_obj._expectedCSV["name"];
    if (csvheaders.includes(data_obj._expectedCSV["X_col"])) ISSX.value = data_obj._expectedCSV["X_col"];
    if (csvheaders.includes(data_obj._expectedCSV["Y_col"])) ISSY.value = data_obj._expectedCSV["Y_col"];
    if (csvheaders.includes(data_obj._expectedCSV["color"])) ISSColor.value = data_obj._expectedCSV["color"];
    if (csvheaders.includes(data_obj._expectedCSV["piechart"])) ISSPiechart.value = data_obj._expectedCSV["piechart"];
    if (csvheaders.includes(data_obj._expectedCSV["scale"])) ISSScale.value = data_obj._expectedCSV["scale"];
    if (data_obj._expectedCSV["key"]) ISSKey.value = data_obj._expectedCSV["key"];
    if (data_obj._autoLoadCSV) {
        setTimeout(function () {
            document.getElementById(op + "_bringmarkers_btn").click();
        },500);
    }


}

dataUtils._readCSV["GENE_DATA"] = function(data_id, thecsv) {

    let data_obj = dataUtils.data[data_id];

    var op = tmapp["object_prefix"];
    var panel = interfaceUtils.getElementById(op + "_csv_headers");
    panel.style.visibility="hidden"; 
    panel.style.display="none"
    data_obj[op + "_rawdata"] = {};
    data_obj._CSVStructure[op + "_csv_header"] = null;
    var request = d3.csv(
        thecsv,
        function (d) { return d; },
        function (rows) {
            data_obj[op + "_rawdata"] = rows;
            dataUtils.createMenuFromCSV("gene");
        }
    );
}

dataUtils.XHRCSV = function(thecsv) {

    let data_obj = dataUtils.data["gene"];  // TODO

    var op = tmapp["object_prefix"];

    var panel = interfaceUtils.getElementById(op + "_csv_headers");
    panel.style.visibility="hidden"; 
    panel.style.display="none"

    var xhr = new XMLHttpRequest();

    var progressParent=interfaceUtils.getElementById("ISS_csv_progress_parent");
    progressParent.style.visibility="visible";
    progressParent.style.display="block";
    //console.log(progressParent)

    var progressBar=interfaceUtils.getElementById("ISS_csv_progress");
    var fakeProgress = 0;
    
    // Setup our listener to process compeleted requests
    xhr.onreadystatechange = function () {        
        // Only run if the request is complete
        if (xhr.readyState !== 4) return;        
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // What do when the request is successful
            progressBar.style.width = "100%";
            data_obj[op + "_rawdata"] = d3.csvParse(xhr.responseText);
            dataUtils.createMenuFromCSV("gene");
            
        }else{
            console.log("dataUtils.XHRCSV responded with "+xhr.status);
            progressParent.style.display = "none";
            alert ("Impossible to load data, please contact an administrator.")
        }     
    };
    
    xhr.onprogress = function (pe) {
        if (pe.lengthComputable) {
            var maxsize = pe.total;
            var prog=pe.loaded;
            var perc=prog/maxsize*100;
            perc=perc.toString()+"%"
            progressBar.style.width = perc;
            //console.log(perc);
        }
        else {
            fakeProgress += 1;
            console.log(fakeProgress, Math.min(100, 100*(1-Math.exp(-fakeProgress/50.))))
            var perc=Math.min(100, 100*(1-Math.exp(-fakeProgress/50.)));
            perc=perc.toString()+"%"
            progressBar.style.width = perc;
        }
    }

    xhr.open('GET', thecsv);
    xhr.send();
    
}

/**
 * Creeate the data_obj[op + "_barcodeGarden"] ("Garden" as opposed to "forest")
 * To save all the trees per barcode or per key. It is an object so that it is easy to just call
 * the right tree given the key instead of looping through an array.
 */
dataUtils.makeQuadTrees = function() {

    let data_obj = dataUtils.data["gene"];  // TODO

    var op = tmapp["object_prefix"];
    var x = function (d) {
        return d["global_X_pos"];
    };
    var y = function (d) {
        return d["global_Y_pos"];
    };

    var op = tmapp["object_prefix"];
    var knode = document.getElementById(op + "_key_header");
    var key = knode.options[knode.selectedIndex].value;
    var allbarcodes = d3.nest().key(function (d) { return d[key]; }).entries(data_obj[op + "_processeddata"]);
    console.log(allbarcodes);
    data_obj[op + "_barcodeGarden"] = {};
    for (var i = 0; i < allbarcodes.length; i++) {
        var gardenKey = allbarcodes[i].key;
        var gene_name = allbarcodes[i].values[0].gene_name || "";
        var letters = allbarcodes[i].values[0].letters || "";
        //console.log(letters);
        data_obj[op + "_barcodeGarden"][gardenKey] = d3.quadtree().x(x).y(y).addAll(allbarcodes[i].values);
        data_obj[op + "_barcodeGarden"][gardenKey].treeName = letters;
        data_obj[op + "_barcodeGarden"][gardenKey].treeGeneName = gene_name;
        //create the subsampled for all those that need it
    }
    data_obj[op + "_data"] = [];
    allbarcodes.forEach(function (n) {
        data_obj[op + "_data"].push(n);
    });
    markerUtils.printBarcodeUIs(data_obj._drawOptions);
    var panel = document.getElementById(op+"_csv_headers");
    panel.style = "visibility: hidden; display:none;";
}

/**
 * subsamples the full amount of barcodes so that in the lower resolutions only a significant portion
 * is drawn and we don't wait and kill our browser.
 * Sumsampling is done homogenously for all the space and density.
 * @param {Number} amount needed amount of barcodes
 * @param {String} barcode Barcode or gene_name (key) to search for in op+_data
 */
dataUtils.randomMarkersFromBarcode = function(amount, barcode) {

    let data_obj = dataUtils.data["gene"];  // TODO

    var request = d3.csv(
        thecsv,
        function (d) { return d; },
        function (rows) {
            progressBar.style.width = "100%";
            dataUtils.data["morphology"][cpop + "_rawdata"] = rows;
            dataUtils.createMenuFromCSV("morphology");
        }
    ).on("progress", function(pe){
        //update progress bar
        if (pe.lengthComputable) {
            var maxsize = pe.total;
            var prog=pe.loaded;
            var perc=prog/maxsize*100;
            perc=perc.toString()+"%"
            progressBar.style.width = perc;
            //console.log(perc);
        }
        else {
            fakeProgress += 1;
            //console.log(fakeProgress, Math.min(100, 100*(1-Math.exp(-fakeProgress/50.))));
            var perc=Math.min(100, 100*(1-Math.exp(-fakeProgress/50.)));
            perc=perc.toString()+"%"
            progressBar.style.width = perc;
        }
    });;
}
    
/** 
* subsamples the full amount of barcodes so that in the lower resolutions only a significant portion
* is drawn and we don't wait and kill our browser.
* Sumsampling is done homogenously for all the space and density. 
* @param {Number} amount needed amount of barcodes
* @param {String} barcode Barcode or gene_name (key) to search for in op+_data*/
dataUtils.randomMarkersFromBarcode = function (amount, barcode) {
    var op = tmapp["object_prefix"];
    data_obj[op + "_data"].forEach(function (bar) {
        if (bar.key == barcode) {
            var barcodes = bar.values;
            var maxindex = barcodes.length - 1;
            
            for (var i = 0; i <= maxindex; i++) {
                var index = Math.floor(Math.random() * (maxindex - i + 0)) + i;
                var temp = barcodes[i];
                barcodes[i] = barcodes[index];
                barcodes[index] = temp;
            }
            data_obj._subsampledBarcodes[barcode] = barcodes.slice(0, amount);
        }
    });
}

/**
 * Find all the markers for a specific key (name or barcode)
 * @param {string} keystring to search in op+_data usually letters like "AGGC" but can be the gene_name
 */
dataUtils.findBarcodesInRawData = function(keystring) {

    let data_obj = dataUtils.data["gene"];  // TODO

    var op = tmapp["object_prefix"];
    var values = null;
    data_obj[op + "_data"].forEach(function (input) {
        if (input.key == keystring) {
            values = input.values;
        }
    });
    return values;
}

/** 
 * Take dataUtils.data["gene"][op + "_data"] and sort it (permanently).
 * Calculate and save the right amount of downsampling for each barcode.
 * And save the subsample arrays, subsampling is homogeneous
 */
dataUtils.sortDataAndDownsample = function () {

    let data_obj = dataUtils.data["gene"];  // TODO

    var op = tmapp["object_prefix"];
    var compareKeys = function (a, b) {
        if (a.values.length > b.values.length) { return -1; }
        if (a.values.length < b.values.length) { return 1; }
        return 0;
    };
    
    data_obj[op + "_data"].sort(compareKeys);
    
    //take the last element of the list which has the minimum amount
    var minamount = data_obj[op + "_data"][data_obj[op + "_data"].length - 1].values.length;
    //take the first element of the list which has the maximum amount
    var maxamount = data_obj[op + "_data"][0].values.length;
    //total amount of barcodes
    var amountofbarcodes = data_obj[op + "_data"].length;
    
}

/** ----------------------------------------------------------------------
* Morphology data
* ---------------------------------------------------------------------- */

dataUtils._setExpectedCSV["MORPHOLOGY_DATA"] = function(data_id, expectedCSV) {

    let data_obj = dataUtils.data[data_id];
    data_obj._expectedCSV = expectedCSV;
}

dataUtils._processRawData["MORPHOLOGY_DATA"] = function(data_id) {

    let data_obj = dataUtils.data[data_id];

    var cpop="CP";
    var progressParent=interfaceUtils.getElementById("ISS_CP_csv_progress_parent");
    if(progressParent == null){
        console.log("No progress bar present.")
    }else{
        progressParent.style.visibility="hidden";
        progressParent.style.display="none";
    }
    var CPProperty = document.getElementById(cpop+"_property_header");
    var propertyselector=CPProperty.value;
    var CPX = document.getElementById(cpop+"_X_header");
    var xselector=CPX.value;
    var CPY = document.getElementById(cpop+"_Y_header");
    var yselector=CPY.value;
    var CPLut = document.getElementById(cpop+"_colorscale");
    var interpFunction=CPLut.value;

    var x = function (d) {
        return d[xselector];
    };
    var y = function (d) {
        return d[yselector];
    };
    if(!data_obj[cpop + "_tree"])
        data_obj[cpop + "_tree"] = d3.quadtree().x(x).y(y).addAll(data_obj[cpop + "_rawdata"]);

    if (document.getElementById("ISS_globalmarkersize")) {
        document.getElementById("ISS_globalmarkersize").style.display = "block";
    }
    if (window.hasOwnProperty("glUtils")) {
        glUtils.loadCPMarkers();  // Update vertex buffers, etc. for WebGL drawing
    }
}

dataUtils._createMenuFromCSV["MORPHOLOGY_DATA"] = function(data_id) {

    let data_obj = dataUtils.data[data_id];

    var cpop = "CP";//tmapp["object_prefix"];
    //data_obj[ cpop + "_rawdata_stats"]={};
    var csvheaders = Object.keys(data_obj[ cpop + "_rawdata"][0]);
    data_obj._CSVStructure=csvheaders;

    var CPKey = document.getElementById(cpop+"_key_header");
    var CPProperty = document.getElementById(cpop+"_property_header");
    var CPX = document.getElementById(cpop+"_X_header");
    var CPY = document.getElementById(cpop+"_Y_header");
    var CPLut = document.getElementById(cpop+"_colorscale");

    data_obj._d3LUTs.forEach(function(lut){
        var option = document.createElement("option");
        option.value = lut;
        option.text = lut.replace("interpolate","");
        CPLut.appendChild(option);
    });

    [CPKey, CPProperty, CPX, CPY].forEach(function (node) {
        node.innerHTML = "";
        var option = document.createElement("option");
        option.value = "null";
        option.text = "-----";
        node.appendChild(option);
        csvheaders.forEach(function (head) {
            var option = document.createElement("option");
            option.value = head;
            option.text = head;
            node.appendChild(option);
        });
    });
    var panel = document.getElementById(cpop+"_csv_headers");
    panel.style = "";

    //create tree, full and subsampled array
    var length=data_obj[ cpop + "_rawdata"].length;
    var amount=Math.floor(length*data_obj._subsamplingfactor);
    data_obj[ cpop + "_subsampled_data"]=dataUtils.randomSamplesFromList(amount,data_obj[ cpop + "_rawdata"]);

    //create listener for change of property
    var changeProperty=function(){
        //find all CP nodes and remove them
        for(d3nodename in overlayUtils._d3nodes){
            if(d3nodename.includes(cpop+"_prop_")){
                overlayUtils._d3nodes[d3nodename].selectAll("*").remove();
            }
        }
    }
    CPProperty.addEventListener("change", changeProperty);

    if (csvheaders.includes(data_obj._expectedCSV["key_header"])) CPKey.value = data_obj._expectedCSV["key_header"];
    if (csvheaders.includes(data_obj._expectedCSV["property_header"])) CPProperty.value = data_obj._expectedCSV["property_header"];
    if (csvheaders.includes(data_obj._expectedCSV["X_header"])) CPX.value = data_obj._expectedCSV["X_header"];
    if (csvheaders.includes(data_obj._expectedCSV["Y_header"])) CPY.value = data_obj._expectedCSV["Y_header"];
    
    CPLut.value = "interpolateRainbow";
}

dataUtils._readCSV["MORPHOLOGY_DATA"] = function(data_id, thecsv) {

    let data_obj = dataUtils.data[data_id];

    var cpop = "CP";//tmapp["object_prefix"];
    data_obj[ cpop + "_rawdata"] = {};
    data_obj[ cpop + "_rawdata_stats"]={};
    data_obj._CSVStructure[cpop + "_csv_header"] = null;

    var progressParent=interfaceUtils.getElementById("ISS_CP_csv_progress_parent");
    progressParent.style.visibility="visible";
    progressParent.style.display="block";
    //console.log(progressParent)
    var progressBar=interfaceUtils.getElementById("ISS_CP_csv_progress");
    var fakeProgress = 0;

    var request = d3.csv(
        thecsv,
        function (d) { return d; },
        function (rows) {
            progressBar.style.width = "100%";
            data_obj[cpop + "_rawdata"] = rows;
            dataUtils.createMenuFromCSV("morphology");
        }
    ).on("progress", function(pe){
        //update progress bar
        if (pe.lengthComputable) {
            var maxsize = pe.total;
            var prog=pe.loaded;
            var perc=prog/maxsize*100;
            perc=perc.toString()+"%"
            progressBar.style.width = perc;
            //console.log(perc);
        }
        else {
            fakeProgress += 1;
            console.log(fakeProgress, Math.min(100, 100*(1-Math.exp(-fakeProgress/50.))))
            var perc=Math.min(100, 100*(1-Math.exp(-fakeProgress/50.)));
            perc=perc.toString()+"%"
            progressBar.style.width = perc;
        }
    });;
}

/** 
 * Remove the cp data from the view
 */
dataUtils.removeMorphologydata=function(){
    var cpop = "CP";//tmapp["object_prefix"];
    for(d3nodename in overlayUtils._d3nodes){
        if(d3nodename.includes(cpop+"_prop_")){
            overlayUtils._d3nodes[d3nodename].selectAll("*").remove();
        }
    }
}

/** 
 * Find all CP elements in a box
 */
dataUtils.arrayOfElementsInBox = function(x0, y0, x3, y3, options) {

    let data_obj = dataUtils.data["morphology"];

    var cpop = "CP";

    var xselector = options.xselector;
    var yselector = options.yselector;
    
    var pointsInside = [];
    
    data_obj[cpop + "_tree"].visit(function (node, x1, y1, x2, y2) {
        if (!node.length) {
            do {
                var d = node.data;
                d.scanned = true;
                var selected = (d[xselector] >= x0) && (d[xselector] < x3) && (d[yselector] >= y0) && (d[yselector] < y3);
                if (selected) {
                    pointsInside.push(d);
                }
            } while (node = node.next);
        }
        return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
    });
    return pointsInside;
}

/** 
 * Take the HTML input and read the file when it is changed, take the data type and the html dom id
*/
dataUtils.processEventForCSV = function(data_id,dom_id){
    //the dom id has to be of an input type 
    if(!dom_id.includes("#"))
        dom_id="#"+dom_id
    d3.select(dom_id)
        .on("change", function () {
            var file = d3.event.target.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onloadend = function (evt) {
                    var dataUrl = evt.target.result;
                    dataUtils.readCSV(data_id,dataUrl);
                };
                reader.readAsDataURL(file);
            }
        });

}        
/** ----------------------------------------------------------------------
* Misc. helper functions
* ---------------------------------------------------------------------- */

/**
 * subsamples the full list from a barcode so that in the lower resolutions only a significant portion
 * is drawn and we don't wait and kill our browser
 * @param {Number} amount needed amount of barcodes
 * @param {barcodes[]} list A list
 */
dataUtils.randomSamplesFromList = function (amount, list) {
    //var op=tmapp["object_prefix"];
    if (amount >= list.length) return list;

    for (var i = 0; i < amount; i++) {
        var index = Math.floor(Math.random() * (list.length - i + 0 - 1)) + i;
        var temp = list[i];
        list[i] = list[index];
        list[index] = temp;
    }

    return list.slice(0, amount);

}
