/**
 * @file projectUtils.js
 * @author Christophe Avenel
 * @see {@link projectUtils}
 */

/**
 * @namespace projectUtils
 * @version projectUtils 2.0
 * @classdesc The root namespace for projectUtils.
 */
 projectUtils = {
     _activeState:{},
     _hideCSVImport: false,
     _settings:[
        {
            "module":"dataUtils",
            "function":"_autoLoadCSV",
            "value":"boolean",
            "desc":"Automatically load csv with default headers"
        },
        {
            "module":"markerUtils",
            "function":"_startMarkersOn",
            "value":"boolean",
            "desc":"Load with all markers visible"
        },
        {
            "function": "_linkMarkersToChannels",
            "module": "overlayUtils",
            "value": "boolean",
            "desc": "Link markers to channels in slider"
        },
        {
            "function": "_hideCSVImport",
            "module": "projectUtils",
            "value": "boolean",
            "desc": "Hide CSV file input on project load"
        }
     ]
}

/** 
 * Get all the buttons from the interface and assign all the functions associated to them */
 projectUtils.registerActions = function () {
    interfaceUtils.listen('save_project_menu', 'click', function() { projectUtils.saveProjectWindow() }, false);
    interfaceUtils.listen('load_project_menu', 'click', function() { projectUtils.loadProjectFile() }, false);
}

/**
 * This method is used to save the TissUUmaps state (gene expression, cell morphology, regions) */
 projectUtils.saveProject = function(urlProject) {
    $('#loadingModal').modal('show');
    var op = tmapp["object_prefix"];
    var cpop = "CP";
    var relativeLayers = [];
    var relativePaths = [];
    if (urlProject == undefined) {
        tmapp.layers.forEach(function(layer) {
            relativePaths.push(layer.tileSource)
        });
        commonPath = projectUtils.commonPath(tmapp.layers);
    }
    else {
        commonPath = urlProject.substring(0, urlProject.lastIndexOf('/')+2);
    }
    tmapp.layers.forEach(function(layer) {
        //var filename = layer.tileSource.substring(commonPath.length, layer.tileSource.length);
        relativeLayers.push(
            {name: layer.name, tileSource: layer.tileSource}
        )
        //relativePaths.push(layer.tileSource)
    });
    filename = prompt("Save project under the name:","NewProject");
    
    /*if (urlProject == undefined) {
        filename = prompt("Save project under the name:","NewProject");
        subfolder = window.location.pathname.substring(0, window.location.pathname.indexOf('/'));
        subfolder = subfolder + commonPath
        //subfolder = subfolder.replace(commonPath,"");
        urlProject = subfolder + "/" + filename
        console.log("urlProject.split('.').pop()", urlProject.split('.').pop());
        if (urlProject.split('.').pop() != "tmap") {
            urlProject = urlProject + ".tmap"
        }
        if (urlProject[0] == "/" && urlProject[1] == "/") urlProject = urlProject.substring(1, urlProject.length);
        console.log(subfolder, filename, urlProject)
    }
    else {
        urlProject = "/" + urlProject
        if (! urlProject.split('.').pop() == "tmap") {
            urlProject = urlProject + ".tmap"
        }
        filename = urlProject.substring( urlProject.lastIndexOf('/'),urlProject.length);
    }*/

    state = projectUtils._activeState;
    state.regions = regionUtils._regions;
    state.layers = relativeLayers;
    state.filename = filename;
    state.filters = filterUtils._filtersUsed;
    state.layerFilters = filterUtils._filterItems;
    state.compositeMode = filterUtils._compositeMode;
    state.layerOpacities = {}
    state.layerVisibilities = {}
    tmapp.layers.forEach(function(layer, i) {
        state.layerOpacities[i] = $("#opacity-layer-"+i).val();
        state.layerVisibilities[i] = $("#visible-layer-"+i).is(":checked");
    });

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 4));
    var dlAnchorElem=document.createElement("a");
    dlAnchorElem.setAttribute("hidden","");
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", filename + ".tmap");
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    document.body.removeChild(dlAnchorElem);
    return true;
}


projectUtils.makeButtonFromTab = function (dataset) {
    buttonsDict = {};

    csvFile = document.getElementById(dataset + "_csv").value.replace(/^.*[\\\/]/, '');
    csvFile = prompt("Relative path to the csv file:",csvFile);
    if (!csvFile)
        return;
    title = prompt("Button inner text:","Download data");
    comment = prompt("Button comment:","");
    markerFile = {
        "path": csvFile,
        "comment":comment,
        "title":title,
        "hideSettings":true,
        "autoLoad":false,
        "uid":dataset
    };
    tabName = document.getElementById(dataset + "_tab-name").value;
    markerFile.name = tabName;
    headers = interfaceUtils._mGenUIFuncs.getTabDropDowns(dataset);
    markerFile.expectedHeader = Object.assign({}, ...Object.keys(headers).map((k) => ({[k]: headers[k].value})));
    radios = interfaceUtils._mGenUIFuncs.getTabRadiosAndChecks(dataset);
    markerFile.expectedRadios = Object.assign({}, ...Object.keys(radios).map((k) => ({[k]: radios[k].checked})));
    if (!projectUtils._activeState.markerFiles) {
        projectUtils._activeState.markerFiles = [];
    }
    projectUtils._activeState.markerFiles.push(markerFile);
    interfaceUtils.createDownloadButtonMarkers(markerFile);
}

projectUtils.loadProjectFile = function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        // getting a hold of the file reference
        var file = e.target.files[0]; 

        // setting up the reader
        var reader = new FileReader();
        reader.readAsText(file,'UTF-8');

        // here we tell the reader what to do when it's done reading...
        reader.onload = readerEvent => {
            var content = readerEvent.target.result; // this is the content!
            console.log( content );
            projectUtils.loadProject(JSON.parse(content));
        }
    }
    input.click();

}

projectUtils.loadProjectFileFromServer = function(path) {
    $.getJSON(path, function(json) {
        projectUtils.loadProject(json);
    })
    .fail(function(jqXHR, textStatus, errorThrown) { alert("error: " + textStatus); })
}

/**
 * This method is used to load the TissUUmaps state (gene expression, cell morphology, regions) */
 projectUtils.saveProjectWindow = function() {
    return projectUtils.saveProject();
    
    //TODO

    settingsModal = document.getElementById("settingsModal");
    if (! settingsModal) {
        var div = document.createElement('div');
        div.innerHTML = `<div class="modal in" id="settingsModal" tabindex="-1" role="dialog" aria-labelledby="modalLabelSmall" aria-hidden="true" style="display:None;">
            <div class="modal-dialog">
                <div class="modal-content">
                    
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalLabelSmall">Save TMAP project</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onclick="$('#settingsModal').hide();"></button>
                    </div>
                    
                    <div class="modal-body" id="settingsModalContent">
                    </div>

                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                      <button type="button" class="btn btn-primary" onclick="projectUtils.saveProject();">Save project</button>
                    </div>
                
                </div>
            </div>
        </div>`;
        console.log(div)
        document.body.appendChild(div);
    }
    
    settingsModal = document.getElementById("settingsModal");
    settingsModalContent = document.getElementById("settingsModalContent");
    settingsModalContent.innerHTML = "";
    projectUtils._settings.forEach(function(setting, index) {
        row = HTMLElementUtils.createRow();
        checkbox = HTMLElementUtils.inputTypeCheckbox({
            id: "settings-" + index,
            class: "setting-value",
            checked: window[setting.module][setting.function],
            extraAttributes: {
                module: setting.module,
                function: setting.function
            },
            eventListeners: { click: function () { 
                // TODO: Remove JQuery dependency here?
                window[setting.module][setting.function] = this.checked;
                if (!projectUtils._activeState.settings)
                    projectUtils._activeState.settings = [];
                projectUtils._activeState.settings.forEach(function(settingSaved, index, object) {
                    if (settingSaved.function == setting.function && settingSaved.function == setting.function) {
                        object.splice(index, 1);
                    }
                });
                projectUtils._activeState.settings.push(
                    {
                        "module":setting.module,
                        "function":setting.function,
                        "value":window[setting.module][setting.function]
                    }
                );
                console.dir(projectUtils._activeState.settings);
             } }
        });
        row.appendChild(checkbox);
        desc = HTMLElementUtils.createElement({ kind: "span", innerHTML:  "<label style='cursor:pointer' for='settings-" + index + "'>&nbsp;&nbsp;"+setting.desc+"</label>"});
        row.appendChild(desc);
        settingsModalContent.appendChild(row);
    })
    settingsModal.style.display="block";
 }

/**
 * This method is used to load the TissUUmaps state (gene expression, cell morphology, regions) */
 projectUtils.loadProject = function(state) {
    /*
    {
        markerFiles: [
            {
                path: "my/server/path.csv",
                title: "",
                comment: ""
            }
        ],
        CPFiles: [],
        regionFiles: [],
        layers: [
            {
                name:"",
                path:""
            }
        ],
        filters: [
            {
                name:"",
                default:"",
            }
        ],
        compositeMode: ""
    }
    */
    if (state.tabs) {
        state.tabs.forEach(function(tab, i) {
            if (tab.title) {document.getElementById("title-tab-" + tab.name).innerHTML = tab.title}
            if (tab.visible === false) {document.getElementById("title-tab-" + tab.name).style.display="none"}
        });
    }
    if (state.regions) {
        regionUtils.JSONValToRegions(state.regions);
    }
    if (state.regionFile) {
        regionUtils.JSONToRegions(state.regionFile);
    }
    projectUtils._activeState = state;
    tmapp.fixed_file = "";
    if (state.compositeMode) {
        filterUtils._compositeMode = state.compositeMode;
    }
    if (state.markerFiles) {
        state.markerFiles.forEach(function(markerFile) {
            if (markerFile.expectedCSV) {
                projectUtils.convertOldMarkerFile(markerFile);
                state.hideTabs = true;
            }
            if( Object.prototype.toString.call( markerFile.path ) === '[object Array]' ) {
                interfaceUtils.createDownloadDropdownMarkers(markerFile);
            }
            else {
                interfaceUtils.createDownloadButtonMarkers(markerFile);
            }
        });
    }
    if (state.regionFiles) {
        state.regionFiles.forEach(function(regionFile) {
            interfaceUtils.createDownloadButtonRegions(
                regionFile.title,
                regionFile.path,
                regionFile.comment,
                regionFile.autoLoad
            );
        });
    }
    if (state.filename) {
        tmapp.slideFilename = state.filename;
        document.getElementById("project_title").innerHTML = state.filename;
    }
    if (state.link) {
        document.getElementById("project_title").href = state.link;
        document.getElementById("project_title").target = "_blank";
    }
    tmapp.layers = [];
    subfolder = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    state.layers.forEach(function(layer) {
        pathname = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        tmapp.layers.push(
            {name: layer.name, tileSource: layer.tileSource}
        )
    });
    if (state.filters) {
        filterUtils._filtersUsed = state.filters;
        $(".filterSelection").prop("checked",false);
        state.filters.forEach(function(filterused, i) {
            console.log("#filterCheck_" + filterused, $("#filterCheck_" + filterused));
            $("#filterCheck_" + filterused).prop("checked",true);
        });
    }
    if (state.layerFilters) {
        filterUtils._filterItems = state.layerFilters;
    }
    tmapp[tmapp["object_prefix"] + "_viewer"].world.removeAll();
    overlayUtils.addAllLayers();
    if (state.layerOpacities && state.layerVisibilities) {
        $(".visible-layers").prop("checked",true);$(".visible-layers").click();
    }
    if (state.compositeMode) {
        filterUtils._compositeMode = state.compositeMode;
        filterUtils.setCompositeOperation();
    }
    if (state.settings) {
        state.settings.forEach(function(setting, i) {
            window[setting.module][setting.function] = setting.value;
        });
    }
    if (state.hideTabs) {
        document.getElementById("level-1-tabs").classList.add("d-none");
    }
    /*if (projectUtils._hideCSVImport) {
        document.getElementById("ISS_data_panel").style.display="none";
    }*/
    setTimeout(function(){
        if (state.rotate) {
            var op = tmapp["object_prefix"];
            var vname = op + "_viewer";
            tmapp[vname].viewport.setRotation(state.rotate);
        }
        if (state.boundingBox) {
            setTimeout(function() {
                tmapp[tmapp["object_prefix"] + "_viewer"].viewport.fitBounds(new OpenSeadragon.Rect(state.boundingBox.x, state.boundingBox.y, state.boundingBox.width, state.boundingBox.height), false);
                console.log("Changing BBox")
            },1000);
        }
        if (state.compositeMode) {
            filterUtils._compositeMode = state.compositeMode;
            filterUtils.setCompositeOperation();
        }
        if (state.layerOpacities && state.layerVisibilities) {
            tmapp.layers.forEach(function(layer, i) {
                console.log("state.layerOpacities[i]",i,state.layerOpacities[i])
                $("#opacity-layer-"+i).val(state.layerOpacities[i]);
                if (state.layerVisibilities[i] != 0) {
                    $("#visible-layer-"+i).click();
                }
            });
        }
    },300);
    
    //tmapp[tmapp["object_prefix"] + "_viewer"].world.resetItems()
}

projectUtils.convertOldMarkerFile = function(markerFile) {
    if (!markerFile.expectedHeader)
        markerFile.expectedHeader = {}
    markerFile.expectedHeader.X = markerFile.expectedCSV.X_col;
    markerFile.expectedHeader.Y = markerFile.expectedCSV.Y_col;
    if (markerFile.expectedCSV.key == "letters") {
        markerFile.expectedHeader.gb_col = markerFile.expectedCSV.group;
        markerFile.expectedHeader.gb_name = markerFile.expectedCSV.name;
    }
    else {
        markerFile.expectedHeader.gb_col = markerFile.expectedCSV.name;
        markerFile.expectedHeader.gb_name = markerFile.expectedCSV.group;
    }

    if (!markerFile.expectedRadios)
        markerFile.expectedRadios = {}
    if (markerFile.expectedCSV.piechart) {
        markerFile.expectedRadios.pie_check = true;
        markerFile.expectedHeader.pie_col = markerFile.expectedCSV.piechart
    } else {markerFile.expectedRadios.pie_check = false;}
    if (markerFile.expectedCSV.color) {
        markerFile.expectedRadios.cb_gr = false;
        markerFile.expectedRadios.cb_col = true;
        markerFile.expectedHeader.cb_col = markerFile.expectedCSV.color
    } else {markerFile.expectedRadios.cb_col = false;}
    if (markerFile.expectedCSV.scale) {
        markerFile.expectedRadios.scale_check = true;
        markerFile.expectedHeader.scale_col = markerFile.expectedCSV.scale
    } else {markerFile.expectedRadios.scale_check = false;}
    if (!markerFile.uid)
        markerFile.uid = "uniquetab";
    markerFile.name = markerFile.title.replace("Download","");
    if (markerFile.settings) {
        markerFile.expectedRadios.cb_gr = true;
        markerFile.expectedRadios.cb_gr_dict = false;
        markerFile.expectedRadios.cb_gr_rand = true;
        for (setting of markerFile.settings) {
            if (setting.module == "glUtils" && setting.function == "_globalMarkerScale")
                markerFile.expectedHeader.scale_factor = setting.value;
            if (setting.module == "markerUtils" && setting.function == "_selectedShape"){
                dictSymbol = {6:6}
                if (dictSymbol[setting.value]) setting.value = dictSymbol[setting.value];
                markerFile.expectedHeader.shape_fixed = markerUtils._symbolStrings[setting.value];
            }
            if (setting.module == "markerUtils" && setting.function == "_randomShape") {
                markerFile.expectedRadios.shape_fixed = !setting.value;
                if (!markerFile.expectedHeader.shape_fixed) {
                    markerFile.expectedHeader.shape_fixed = markerUtils._symbolStrings[2];
                }
            }
            if (setting.module == "markerUtils" && setting.function == "_colorsperkey") {
                markerFile.expectedRadios.cb_gr = true;
                markerFile.expectedRadios.cb_gr_rand = false;
                markerFile.expectedRadios.cb_gr_dict = true;
                markerFile.expectedHeader.cb_gr_dict = JSON.stringify(setting.value);
            }
            if (setting.module == "glUtils" && setting.function == "_markerOpacity")
                markerFile.expectedHeader.opacity = setting.value;
            if (setting.module == "HTMLElementUtils" && setting.function == "_colorsperbarcode") {
                markerFile.expectedRadios.cb_gr = true;
                markerFile.expectedRadios.cb_gr_rand = false;
                markerFile.expectedRadios.cb_gr_dict = true;
                markerFile.expectedHeader.cb_gr_dict = JSON.stringify(setting.value);
            }
        }
    }
    delete markerFile.expectedCSV;
    markerFile["hideSettings"] = true;
    console.log(markerFile);
}

/**
 * Given an array of layers, return the longest common path
 * @param {!Array<!layers>} strs
 * @returns {string}
 */
projectUtils.commonPath = function(strs) {
    let prefix = ""
    if(strs === null || strs.length === 0) return prefix

    for (let i=0; i < strs[0].tileSource.length; i++){ 
        const char = strs[0].tileSource[i] // loop through all characters of the very first string. 

        for (let j = 1; j < strs.length; j++){ 
            // loop through all other strings in the array
            if(strs[j].tileSource[i] !== char) {
                prefix = prefix.substring(0, prefix.lastIndexOf('/')+1);
                return prefix
            }
        }
        prefix = prefix + char
    }
    prefix = prefix.substring(0, prefix.lastIndexOf('/')+1);
    return prefix
}