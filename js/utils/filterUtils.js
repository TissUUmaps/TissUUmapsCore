/**
 * @file filterUtils.js Interface to ask information to OSD
 * @author Christophe Avenel
 * @see {@link filterUtils}
 */

/**
 * @namespace filterUtils
 * @property {Bool}   filterUtils._filtersUsed - 
 * @property {Object} filterUtils._filters - 
 * @property {Object} filterUtils._filterItems - 
 */
 filterUtils = {
    // Choose between ["Brightness", "Exposure", "Hue", "Contrast", "Vibrance", "Noise", 
    //                 "Saturation","Gamma","Invert","Greyscale","Threshold","Erosion","Dilation"]
    _filtersUsed: ["Saturation","Brightness","Contrast"],
    _filters: {
        "Color":{
            params:{
                type:"select",
                options:[
                    {text:"----", value:0},
                    {text:"Red", value:"100,0,0"},
                    {text:"Green", value:"0,100,0"},
                    {text:"Blue", value:"0,0,100"},
                    {text:"Yellow", value:"100,100,0"},
                    {text:"Cyan", value:"0,100,100"},
                    {text:"Magenta", value:"100,0,100"},
                    {text:"Gray", value:"100,100,100"}
                ]
            },
            filterFunction: function (value) {
                if (value == 0) {  return function (context, callback) {callback();}}
                return function(context, callback) {
                    Caman(context.canvas, function() {
                        var valueRGB = value.split(",")
                        this.channels(
                            {red: valueRGB[0]-100, green: valueRGB[1]-100, blue: valueRGB[2]-100}
                        )
                        this.render(callback);
                    });
                }
            }
        },
        "Brightness":{
            params:{
                type:"range",
                min:-50,
                max:50,
                step:0.1,
                value:0
            },
            filterFunction: function (value) {
                if (value == 0) {  return function (context, callback) {callback();}}
                return function(context, callback) {
                    Caman(context.canvas, function() {
                        this.brightness(value);
                        this.render(callback);
                    })
                }
            }
        },
        "Exposure":{
            params:{
                type:"range",
                min:-100,
                max:100,
                step:1,
                value:0
            },
            filterFunction: function (value) {
                if (value == 0) {  return function (context, callback) {callback();}}
                return function(context, callback) {
                    Caman(context.canvas, function() {
                        this.exposure(value);
                        this.render(callback);
                    })
                }
            }
        },
        "Hue":{
            params:{
                type:"range",
                min:0,
                max:100,
                step:1,
                value:0
            },
            filterFunction: function (value) {
                if (value == 0) {  return function (context, callback) {callback();}}
                return function(context, callback) {
                    Caman(context.canvas, function() {
                        this.hue(value);
                        this.render(callback);
                    })
                }
            }
        },
        "Contrast":{
            params:{
                type:"range",
                min:0,
                max:4,
                step:0.01,
                value:1
            },
            filterFunction: function (value) {
                if (value == 1) {  return function (context, callback) {callback();}}
                return OpenSeadragon.Filters.CONTRAST(value);
            }
        },
        "Vibrance":{
            params:{
                type:"range",
                min:-250,
                max:250,
                step:10,
                value:0
            },
            filterFunction: function (value) {
                if (value == 0) {  return function (context, callback) {callback();}}
                return function(context, callback) {
                    Caman(context.canvas, function() {
                        this.vibrance(value);
                        this.render(callback);
                    })
                }
            }
        },
        "Noise":{
            params:{
                type:"range",
                min:0,
                max:100,
                step:10,
                value:0
            },
            filterFunction: function (value) {
                if (value == 0) {  return function (context, callback) {callback();}}
                return function(context, callback) {
                    Caman(context.canvas, function() {
                        this.noise(value);
                        this.render(callback);
                    })
                }
            }
        },
        "Saturation":{
            params:{
                type:"range",
                min:-100,
                max:100,
                step:10,
                value:0
            },
            filterFunction: function (value) {
                if (value == 0) {  return function (context, callback) {callback();}}
                return function(context, callback) {
                    Caman(context.canvas, function() {
                        this.saturation(value);
                        this.render(callback);
                    })
                }
            }
        },
        "Gamma":{
            params:{
                type:"range",
                min:-0,
                max:2,
                step:0.1,
                value:1
            },
            filterFunction: function (value) {
                if (value == 1) {  return function (context, callback) {callback();}}
                return function(context, callback) {
                    Caman(context.canvas, function() {
                        this.gamma(value);
                        this.render(callback);
                    })
                }
            }
        },
        "Invert":{
            params:{
                type:"checkbox"
            },
            filterFunction: function () {
                return OpenSeadragon.Filters.INVERT();
            }
        },
        "Greyscale":{
            params:{
                type:"checkbox"
            },
            filterFunction: function () {
                return OpenSeadragon.Filters.GREYSCALE();
            }
        },
        "Threshold":{
            params:{
                type:"range",
                min:0,
                max:256,
                step:1,
                value:256
            },
            filterFunction: function (value) {
                if (value == 256) {  return function (context, callback) {callback();}}
                return OpenSeadragon.Filters.THRESHOLDING(value);
            }
        },
        "Erosion":{
            params:{
                type:"range",
                min:1,
                max:11,
                step:2,
                value:1
            },
            filterFunction: function (value) {
                if (value == 1) {  return function (context, callback) {callback();}}
                return OpenSeadragon.Filters.MORPHOLOGICAL_OPERATION(value, Math.min);
            }
        },
        "Dilation":{
            params:{
                type:"range",
                min:1,
                max:11,
                step:2,
                value:1
            },
            filterFunction: function (value) {
                if (value == 1) {  return function (context, callback) {callback();}}
                return OpenSeadragon.Filters.MORPHOLOGICAL_OPERATION(value, Math.max);
            }
        }
    },
    _filterItems:{},
    _compositeMode:"source-over"
}

/** 
 * 
 * Init list of filters */
 filterUtils.initFilters = function() {
    var settingsPanel = document.getElementById("filterSettings");
    if (!settingsPanel) return;
    for (var filter in filterUtils._filters) {
        selectParams = {
            eventListeners:{
                "change": function (e) {
                    filterName = e.srcElement.getAttribute("filter");
                    checked = e.srcElement.checked;
                    if (checked)
                        filterUtils._filtersUsed.push(filterName);
                    else 
                        filterUtils._filtersUsed = filterUtils._filtersUsed.filter(function(value, index, arr){ 
                            return value != filterName;
                        });
                    overlayUtils.addAllLayersSettings();
                    filterUtils.setRangesFromFilterItems();
                    filterUtils.getFilterItems();
                }
            },
            "class":"filterSelection",
            "checked":filterUtils._filtersUsed.filter(e => e === filter).length > 0,
            id:"filterCheck_" + filter,
            extraAttributes: {
                "filter": filter
            }
        }
        select = HTMLElementUtils.inputTypeCheckbox(selectParams);
        settingsPanel.appendChild(select);
        var label = document.createElement("label");
        label.setAttribute("for", "filterCheck_" + filter);
        label.innerHTML = "&nbsp;" + filter;
        settingsPanel.appendChild(label);
        settingsPanel.appendChild(document.createElement("br"));
    }
    modeParams = {
        eventListeners:{
            "change": function (e) {
                compositeMode = e.srcElement.value;
                filterUtils._compositeMode = compositeMode;
                filterUtils.setCompositeOperation();
            }
        },
        id: "filterCompositeMode",
        options:[
            {text:"Channels", value:"source-over"},
            {text:"Composite", value:"lighter"}
        ]
    }
    var label = document.createElement("label");
    label.innerHTML = "Merging mode:&nbsp;";
    settingsPanel.appendChild(label);
    select = HTMLElementUtils.selectTypeDropDown(modeParams);
    select.value = filterUtils._compositeMode;
    filterUtils.setCompositeOperation();
    settingsPanel.appendChild(select);
    filterUtils.getFilterItems();
}

/** 
 * @param {Number} filterName 
 * Get params for a given filter */
filterUtils.getFilterParams = function(filterName) {
    filterParams = filterUtils._filters[filterName].params;
    filterParams.eventListeners = {
        "input": filterUtils.getFilterItems
    };
    filterParams["class"] = "filterInput";
    filterParams.filter = filterName;
    return filterParams;
}

/** 
 * @param {Number} filterName Index of an OSD tile source
 * Get function for a given filter */
filterUtils.getFilterFunction = function(filterName) {
    return filterUtils._filters[filterName].filterFunction;
}

/** 
 * apply all filters to all layers
 *  */
 filterUtils.applyFilterItems = function(calledItems) {
    var caman = Caman;
	caman.Store.put = function() {};

    var op = tmapp["object_prefix"];
    if (!tmapp[op + "_viewer"].world || !tmapp[op + "_viewer"].world.getItemAt(Object.keys(filterUtils._filterItems).length-1)) {
        setTimeout(function() {
            if (calledItems == filterUtils._filterItems)
                filterUtils.applyFilterItems(calledItems);
        }, 100);
        return;
    }
    filters = [];
    for (const layer in filterUtils._filterItems) {
        processors = [];
        for(var filterIndex=0;filterIndex<filterUtils._filterItems[layer].length;filterIndex++) {
            processors.push(
                filterUtils._filterItems[layer][filterIndex].filterFunction(filterUtils._filterItems[layer][filterIndex].value)
            );
        }
        filters.push({
            items: tmapp[op + "_viewer"].world.getItemAt(layer),
            processors: processors
        });
    };
    tmapp[op + "_viewer"].setFilterOptions({
        filters: filters
    });
    for ( var i = 0; i < tmapp[op + "_viewer"].world._items.length; i++ ) {
        tmapp[op + "_viewer"].world._items[i].tilesMatrix={};
    }
}

/** 
 * Set html ranges and checkboxes from filter items
 *  */
 filterUtils.setRangesFromFilterItems = function() {

    var op = tmapp["object_prefix"];
    for (const layer in filterUtils._filterItems) {
        for(var filterIndex=0;filterIndex<filterUtils._filterItems[layer].length;filterIndex++) {
            item = filterUtils._filterItems[layer][filterIndex];
            filterRange = document.querySelector('[filter="'+item.name+'"][layer="'+layer+'"]');
            if (filterRange) {
                if (filterRange.type == "range" || filterRange.type == "select-one")
                    filterRange.value = item.value;
                else if (filterRange.type == "checkbox")
                    filterRange.checked = item.value;
                
            }
        }
    };
}

/** 
 * Get filter functions and values from html ranges and checkboxes
 *  */
filterUtils.getFilterItems = function() {
    var op = tmapp["object_prefix"];
    if (!tmapp[op + "_viewer"].world || !tmapp[op + "_viewer"].world.getItemAt(tmapp[op + "_viewer"].world.getItemCount()-1)) {
        setTimeout(function() {
            filterUtils.getFilterItems();
        }, 100);
        return;
    }
    console.log("getFilterItems");
    filterInputsRanges = document.getElementsByClassName("filterInput");
    items = {};
    for (i = 0; i < filterInputsRanges.length; i++) {
        var filterLayer = filterInputsRanges[i].getAttribute("layer");
        items[filterLayer] = []
    }
    for (i = 0; i < filterInputsRanges.length; i++) {
        var filterName = filterInputsRanges[i].getAttribute("filter");
        var filterLayer = filterInputsRanges[i].getAttribute("layer");
        var filterFunction = filterUtils.getFilterFunction(filterName);
        
        if (filterInputsRanges[i].type == "range" || filterInputsRanges[i].type == "select-one")
            inputValue = filterInputsRanges[i].value;
        else if (filterInputsRanges[i].type == "checkbox")
            inputValue = filterInputsRanges[i].checked;
        if (inputValue) {
            items[filterLayer].push(
                {
                    filterFunction: filterFunction,
                    value: inputValue,
                    name: filterName
                }
            );
        }
    }
    filterUtils._filterItems = items;
    filterUtils.applyFilterItems(items);
}

filterUtils.setCompositeOperation = function(restart) {


    var op = tmapp["object_prefix"];
    if (!tmapp[op + "_viewer"].world || !tmapp[op + "_viewer"].world.getItemAt(Object.keys(filterUtils._filterItems).length-1)) {
        setTimeout(function() {
            if (restart == undefined){
                restart = 10;
            }
            if (restart > 0)
                filterUtils.setCompositeOperation(restart-1);
        }, 100);
        return;
    }
    var filterCompositeMode = document.getElementById("filterCompositeMode");
    filterCompositeMode.value = filterUtils._compositeMode;
    tmapp[op + "_viewer"].compositeOperation = filterUtils._compositeMode;
    for (i = 0; i < tmapp[op + "_viewer"].world.getItemCount(); i++) {
        tmapp[op + "_viewer"].world.getItemAt(i).setCompositeOperation(filterUtils._compositeMode);
    }
}

/** Create an HTML filter */
filterUtils.createHTMLFilter = function (params) {
    if (!params) {
        return null;
    }
    var type = params.type || null;
    if (type == "range") {
        filterInput = HTMLElementUtils.inputTypeRange(params);
    }
    else if (type == "checkbox") {
        filterInput = HTMLElementUtils.inputTypeCheckbox(params);
    }
    else if (type == "select") {
        filterInput = HTMLElementUtils.selectTypeDropDown(params);
    }
    if (params.value != undefined) {
        filterInput.setAttribute("value", params.value);
    }
    filterInput.setAttribute("layer", params.layer);
    filterInput.setAttribute("filter", params.filter);
    filterInput.setAttribute("id", "filterInput-" + params.filter + "-" + params.layer);
    filterInput.setAttribute("list", "filterDatalist-" + params.filter + "-" + params.layer);

    datalist = document.createElement("datalist");
    datalist.setAttribute("id", "filterDatalist-" + params.filter + "-" + params.layer);
    option = document.createElement("option");
    option.text = params.value;
    datalist.appendChild(option);

    filterInput.appendChild(datalist);

    return filterInput;
}
