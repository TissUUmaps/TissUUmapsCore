/**
* @file interfaceUtils.js adding and managing elements in the interface
* @author Leslie Solorzano
* @see {@link interfaceUtils}
*/
/**
* @namespace interfaceUtils
*/
interfaceUtils={}


/** 
* @param {String} domid The id of the element to listen to
* @param {String} event The event to listen for
* @param {String} handler Function to answer with
* @param {Bool} debug If true will print to console
* Listen to an event of an element, if the element doesnçt exist get a warning. */
interfaceUtils.listen= function(domid,event,handler,debug){
    var dbg=debug || false;
    //console.log(dbg)
    var elem= document.getElementById(domid);
    if(elem){
        elem.addEventListener(event, handler);
        if(dbg){
            console.log(domid,event,String(handler));
        }
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}


/** Get the region to be analyzed  */
interfaceUtils.analyzeRegionUI = function (callingbutton) {
    var op = tmapp["object_prefix"];

	if (!dataUtils.data["gene"][op + "_barcodeGarden"]) {
		alert("Load markers first");
		return;
    }

    var regionid = callingbutton[0].getAttribute("parentRegion");
    regionUtils.analyzeRegion(regionid);
}


/** Get the region to be filled  */
interfaceUtils.fillRegionUI = function (callingbutton) {
    var regionid = callingbutton[0].getAttribute("parentRegion");
    regionUtils.fillRegion(regionid);
}

/** Delete a RegionUI  */
interfaceUtils.deleteRegionUI = function(callingbutton) {
    var regionid = callingbutton[0].getAttribute("parentRegion");
    regionUtils.deleteRegion(regionid);
}

/**
 * @param {HTMLelement} callingbutton Button element containing parent region information
 *  Get the info of the region that has to be changed */
interfaceUtils.changeRegionUI = function (callingbutton) {
    var regionid = callingbutton[0].getAttribute("parentRegion");
    regionUtils.changeRegion(regionid);
}

/** 
* @param {String} domid The id of the select element
* @param {String[]} Array of strings containing elements to add to the select
* Add options to a select element */
interfaceUtils.addElementsToSelect=function(domid,elemlist){
    var select= document.getElementById(domid);
    if(select){
        elemlist.forEach(element => {
            var opt = document.createElement("option");
            opt.value= element;
            opt.innerHTML = element;
            select.appendChild(opt);
        });
    }else{
        console.log("Select with id "+domid+" doesn't exist");
        return null;
    }
}

/** 
* @param {String} domid The id of the select element
* @param {Object[]} Array of objects containing elements to add to the select
* Add options to a select element using Objects with the keys: "value* and "innerHTML" */
interfaceUtils.addObjectsToSelect=function(domid,objlist){
    var select= document.getElementById(domid);
    if(select){
        objlist.forEach(element => {
            var opt = document.createElement("option");
            opt.value= element.value;
            opt.innerHTML = element.innerHTML;
            select.appendChild(opt);
        });
    }else{
        console.log("Select with id "+domid+" doesn't exist");
        return null;
    }
}

interfaceUtils.addSingleElementToSelect=function(domid,element,options){
    if(!options) options={};
    var select= document.getElementById(domid);
    if(select){       
        var opt = document.createElement("option");
        if(options.id) opt.id="region_opt_"+element;
        opt.value= element;
        opt.innerHTML = element;
        select.appendChild(opt);        
    }else{
        console.log("Select with id "+domid+" doesn't exist");
        return null;
    }
}


/** 
* @param {String} domid The id of the select element
* Erase all options in a select element */
interfaceUtils.cleanSelect=function(domid){
    var select= document.getElementById(domid);
    if(select){       
        select.innerHTML = "";
    }else{
        console.log("Select with id "+domid+" doesn't exist");
        return null;
    }
}

/** 
* @param {String} domid The id of the element
* Make an element invisible */
interfaceUtils.makeInvisible=function(domid){
    var elem= document.getElementById(domid);
    if(elem){
        elem.style.visibility="hidden";
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}

/** 
* @param {String} domid The id of the element
* Make an element visible */
interfaceUtils.makeVisible=function(domid){
    var elem= document.getElementById(domid);
    if(elem){
        elem.style.visibility="visible";
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}

/** 
* @param {String} domid The id of the element
* Disable an element */
interfaceUtils.disableElement=function(domid){
    var elem= document.getElementById(domid);
    if(elem){
        elem.disabled="true";
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}


/** 
* @param {String} domid The id of the element
* Enable an element */
interfaceUtils.enableElement=function(domid){
    var elem= document.getElementById(domid);
    if(elem){
        elem.removeAttribute("disabled");
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}

/** 
* @param {String} domid The id of the element
* @return {Bool | null}
* Ask if an element is enabled */
interfaceUtils.isEnabled=function(domid){
    var elem= document.getElementById(domid);
    if(elem){
        if(elem.hasAttribute("disabled")){
            return false;
        }else{ return true; }
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}

/** 
* @param {String} domid The id of the element
* @return {Object | null} Object with a "key" and a "value"
* Get the selected option in a sleect element */
interfaceUtils.getSelectedIndexValue=function(domid){
    var selector= document.getElementById(domid);
    if(selector){
        var obj={};
        obj.key = selector.options[selector.selectedIndex].value;
        obj.value =selector.options[selector.selectedIndex].innerHTML;
        return obj;
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }

}

/** 
* @param {String} classname The class of the elements
* @return {HTMLelements[] | null} array of HTMl elements
* Call the main dom.getElementsByClassName function with a warning if no elements exist */
interfaceUtils.getElementsByClassName=function(classname){
    var elems= document.getElementsByClassName(classname);
    if(elems){
        return elems;
    }else{
        console.log("No elements of class "+classname+" doesn't exist");
        return null;
    }
}


/** 
* @param {String} classname The class of the elements
* @return {HTMLelements[] | null} array of HTMl elements
* Call the main dom.getElementsByTagName function with a warning if no elements exist */
interfaceUtils.getElementsByTagName=function(tagname){
    var elems= document.getElementsByTagName(tagname);
    if(elems){
        return elems;
    }else{
        console.log("No elements of class "+classname+" doesn't exist");
        return null;
    }
}

/** 
* @param {String} domid The id of the element
* @param {String} choice thing to change
* @param {String} value to change it to
* @return {HTMLelement | null} HTMl element
* Get the an element and warn if none exists */
interfaceUtils.setValueForElement=function(domid,choice, value){
    var elem= document.getElementById(domid);
    if(elem){
        elem[choice]=value
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}


/** 
* @param {String} domid The id of the element
* @param {String} attr thing to change
* @param {String} value to change it to
* @return {HTMLelement | null} HTMl element
* Get the an element and warn if none exists */
interfaceUtils.setAttributeForElement=function(domid,attr, value){
    var elem= document.getElementById(domid);
    if(elem){
        elem.setAttribute(attr, value);
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}
/** 
* @param {String} domid The id of the element
* @return {HTMLelement | null} HTMl element
* Get the an element and warn if none exists */
interfaceUtils.getElementById=function(domid){
    var elem= document.getElementById(domid);
    if(elem){
        return elem;
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}

/** 
* @param {String} domid The id of the element
* @return {String | null} HTMl element
* Get the value of a dom element and warn if element does not exist*/
interfaceUtils.getValueFromDOM=function(domid){
    var elem= document.getElementById(domid);
    if(elem){
        return elem.value;
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}


/** 
* @param {String} domid The id of the element
* @return {String | null} innerHTMl
* Get the innerHTML of a dom element and warn if element does not exist*/
interfaceUtils.getInnerHTMLFromDOM=function(domid){
    var elem= document.getElementById(domid);
    if(elem){
        return elem.innerHTML;
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }
}

interfaceUtils.removeOptionFromSelect=function(domid,key){
    var select= document.getElementById(domid);
    if(select){
        var remove=0;
        for (var i=0; i<select.length; i++){
            if (select.options[i].value == key )
                remove=i;
        }
        select.remove(remove);
    }else{
        console.log("Select with id "+domid+" doesn't exist");
        return null;
    }
}

interfaceUtils.emptyViewers = function (options) {
    var containers = options.containers || ["fixed", "moving"];
    containers.forEach(function (c) {
        var container = document.getElementById(c + "_viewer");
        while (container.lastChild) {
            container.removeChild(container.lastChild);
        }
    });  
}


/** 
* @param {String} dzi Path and name of the DZI file
* @param {String} viewer String that identifies a viewer and its 
* associated components. For a single viewer the default is "ISS", 
* resulting in "ISS_viewer" as an identifier
* Open a DZI in a specific viewer. If a main location for images 
* is specified previously using the "url_prefix" variable, 
* it will be added to the dzi string */
interfaceUtils.openDZI=function(dzi,viewer){
    var possibleurlprefix=interfaceUtils.getValueFromDOM("url_prefix");
    if(possibleurlprefix){
        tmcpoints.url_prefix=possibleurlprefix;
    }
    tmcpoints[viewer+"_viewer"].open(tmcpoints.url_prefix + dzi);
    
}

/** 
* @param {String} domid The id of the element
* See if a dom is checked (mostly a checkbox) */
interfaceUtils.isChecked=function(domid){
    var check= document.getElementById(domid);
    if(check){
        var checked=check.checked;
        return checked;
    }else{
        console.log("Check with id "+domid+" doesn't exist");
        return null;
    }
}

/** 
* @param {String} domid The id of the element
* checl if an input has o has not its first options sslected */
interfaceUtils.checkSelectNotZero=function(domid){
    var selector= document.getElementById(domid);
    if(selector){
        var key = selector.options[selector.selectedIndex].value;
        if(key.toString()=="0") 
            return false;
        return true;
    }else{
        console.log("Element with id "+domid+" doesn't exist");
        return null;
    }

}


/** 
 * @param {object} ul dom object of the a tag 
 * find and actiate main tabs */
interfaceUtils.activateMainChildTabs=function(elid){
    if (!document.getElementById(elid)) {
        return;
    }
    //first, find children ul and then their main children onwards
    children=document.getElementById(elid).getElementsByTagName("a");
    maintabids=[];
    nonmainids=[];
    //find the main a and its corresponding panel and activate it.
    for(var i=0;i<children.length;i++){
        if(children[i].classList.contains("main-child")){
            maintabids.push(children[i].href.split("#")[1]);
            children[i].classList.add("active")
        }else{
            nonmainids.push(children[i].href.split("#")[1]);
            children[i].classList.remove("active")
        }
    }

    //console.log(maintabids,nonmainids)
    
    for(var i=0;i<maintabids.length;i++){
        var elem=document.getElementById(maintabids[i]);
        if(elem)
            elem.classList.add("active")
        else{
            console.log("element "+maintabids[i]+" doesn't exist");
        }
    }

    for(var i=0;i<nonmainids.length;i++){
        var elem=document.getElementById(nonmainids[i]);
        if(elem)
            elem.classList.remove("active")
        else{
            console.log("element "+nonmainids[i]+" doesn't exist");
        }   
    }
}

/** 
 * @param {object} a dom object of the a tag 
 * hides all the tabs that should not he  displayed except a itself */
interfaceUtils.hideTabsExcept = function (a) {
    //get a tag, get it's closes ul check the level, deactivate all but this
    const regex1 = RegExp("L([0-9]+)-tabs", 'g');
    //first, get closest ul contaninig list of a links
    var closestul = a.closest("ul");
    var level = 0;

    //find main child tabs and activate them
    
    //find href to know which id to look for and which to hide
    var elid = a[0].href.split("#")[1]
    console.log(elid,":")
    interfaceUtils.activateMainChildTabs(elid);

    //check for this ul's classes to see if any matches regex
    if (closestul !== null) {
        closestul[0].classList.forEach(
            function (v) {
                var arr = regex1.exec(v)
                if (arr !== null)
                    level = Number(arr[1]);
            }
        )
        
    } else {
        console.log("no tabs for this a tag");
    }

    var findthislevel = "L" + String(level) + "-tabs";

    var uls = document.getElementsByClassName(findthislevel);

    //find all a tags in this levels and their hrefs
    var as = [];

    for (var i = 0; i < uls.length; i++) {
        console.log(uls[i])
        var ulsas = uls[i].getElementsByTagName("a");
        for (var j = 0; j < ulsas.length; j++) {
            ana=ulsas[j].href.split("#")[1];
            //console.log(ana)
            //console.log("!ana.includes(elid)", !ana.includes(elid))
            if(!ana.includes(elid)){
                //only turn non elids
                as.push(ana)
                ulsas[j].classList.remove("active")
            }
        }    
    }

    for(var i=0;i<as.length;i++){
        //find elements with this id and deactivate them
        //console.log(as[i]);
        var el=document.getElementById(as[i]);
        
        if(el!==null && el.classList.length>0){
            el.classList.remove("active");
            el.classList.remove("show");
        }
    }
   
}

/** 
 * @param {object} a dom object of the a tag 
 * hides all the tabs that should not he  displayed except a itself */
 interfaceUtils.toggleRightPanel = function (a) {
    var op = tmapp["object_prefix"];
    var menu=document.getElementById(op + "_menu");
    var main=document.getElementById(op + "_viewer_container");
    var btn=document.getElementById(op + "_collapse_btn");
    var style = window.getComputedStyle(menu);
    if (style.display === 'none') {
        menu.style.display = "block";
        main.style.width = "66.66666%";
        main.style.maxWidth = "100%";
        btn.innerHTML = '<i class="bi bi-caret-right-fill"></i>';
    }
    else {
        menu.style.display = "none";
        main.style.width = "100%";
        main.style.maxWidth = "";
        btn.innerHTML = '<i class="bi bi-caret-left-fill"></i>';
    }
}


/** 
* @param {Object} options The id of the element
* Create a complete new tab with all the UI, accordion and buttons. 
* Options are not implemented but are there if needed in the future 
*/
interfaceUtils.generateDataTabUI = function(options){

    interfaceUtils._mGenUIFuncs.generateUUID();
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    divpane=interfaceUtils._mGenUIFuncs.generateTab();
    accordion=interfaceUtils._mGenUIFuncs.generateAccordion();
    accordioncontents=accordion.contents;
    
    //now that the 3 accordion items are created, fill tehm and 
    //add all to the corresponding main data tab

    item1rows=interfaceUtils._mGenUIFuncs.generateAccordionItem1();
    item1rows.forEach(row => accordioncontents[0].appendChild(row))

    item2rows=interfaceUtils._mGenUIFuncs.generateAccordionItem2();
    item2rows.forEach(row => accordioncontents[1].appendChild(row))

    item3rows=interfaceUtils._mGenUIFuncs.generateAccordionItem3();
    item3rows.forEach(row => accordioncontents[2].appendChild(row))

    buttonrow=interfaceUtils._mGenUIFuncs.generateRowOptionsButtons();

    menurow=interfaceUtils._mGenUIFuncs.rowForMarkerUI();

    divpane.appendChild(accordion.divaccordion);
    divpane.appendChild(buttonrow);
    divpane.appendChild(menurow);

    tabs1content=interfaceUtils.getElementById("level-1-tabsContent");
    if(tabs1content) tabs1content.appendChild(divpane);
    else { console.log("No level 1 tab conent"); return;}
}

/**
 * To not fill interfaceUtils with a lot of things, there is the _mGenUIFuncs
 * object encapsulating all the functions pertaining creation of tabs
 */
interfaceUtils._mGenUIFuncs={ctx:{aUUID:0}}

/** 
* @param {HTMLEvent} event event that triggered function
* Delete all trace of a tab including datautils.data.key*/
interfaceUtils._mGenUIFuncs.deleteTab=function(event){
    uid=event.target.id.split("_")[0];

    tabbutton=interfaceUtils.getElementById(uid+"_li-tab")
    tabbutton.remove();

    tabpane=interfaceUtils.getElementById(uid+"_marker-pane")
    tabpane.remove();

    delete dataUtils.data[uid];

    glUtils.deleteMarkers(uid);
    glUtils.draw();
}

/** 
* @param {HTMLEvent} event event that triggered function
* @param {Array string} array domid suffixes within group
* @param {Array Number} option this option will be shown while all others are hidden
* This function takes options within one specific tab and hide all except the one marked by option */
interfaceUtils._mGenUIFuncs.hideShow=function(event,array,options){
    uid=event.target.id.split("_")[0]
    array.forEach((domid, index)=>{
        newdomid=uid+domid;
        domelement=interfaceUtils.getElementById(newdomid);
        if(domelement){
            if(options.includes(index)){
                domelement.removeAttribute("style");
            }else{
                domelement.setAttribute("style",'visibility:hidden;display:none;');
            }
        }
    });
}

/** 
* @param {HTMLEvent} event event that triggered function
* @param {Array string} array domid suffixes within group
* @param {Number} option this option will be selected while all others are unselected
* This function takes options within one specific tab and deselects all except the one marked by option */
interfaceUtils._mGenUIFuncs.selectDeselect=function(event,array,options){
    uid=event.target.id.split("_")[0]
    array.forEach((domid, index)=>{
        newdomid=uid+domid;
        domelement=interfaceUtils.getElementById(newdomid);
        if(domelement){
            if(options.includes(index)){
                domelement.checked=true;
            }else{
                domelement.checked=false;
            }
        }
    });
}

/** 
* @param {HTMLEvent} event event that triggered function
* @param {Array string} array domid suffixes within group
* @param {Number} option this option will be enabled while all others are disabled
* This function takes options within one specific tab and disables all except the one marked by option */
interfaceUtils._mGenUIFuncs.enableDisable=function(event,array,options){
    uid=event.target.id.split("_")[0];
    array.forEach((domid, index)=>{
        newdomid=uid+domid;
        domelement=interfaceUtils.getElementById(newdomid);
        //console.log(domelement,index,options,(index in options).toString())
        if(domelement){
            if(options.includes(index)){
                domelement.disabled=false;
            }else{
                domelement.disabled=true;
            }
        }
    });
}

/** 
* @param {HTMLEvent} event event that triggered function
* Chages the name of the tab if this text in the form has changed */
interfaceUtils._mGenUIFuncs.ChangeTabName=function(event){
    uid=event.target.name.split("_")[0]
    domelement=interfaceUtils.getElementById(uid+"_marker-tab-name");
    if(domelement){
        if(event.target.value)
            domelement.innerText=event.target.value
        else
            domelement.innerText=uid;
    }
}

/**
 * @param {string} uid the data id
 * Returns an object full with inputs for a tab named as: 
 * "X","Y","gb_sr","gb_col","gb_name","cb_cmap","cb_col"
 * @returns {Object} allinputs
 */
interfaceUtils._mGenUIFuncs.getTabDropDowns = function(uid){
    allinputs={}
    allinputs["X"]=interfaceUtils.getElementById(uid+"_x-value");
    allinputs["Y"]=interfaceUtils.getElementById(uid+"_y-value");

    allinputs["gb_col"]=interfaceUtils.getElementById(uid+"_gb-col-value");
    allinputs["gb_name"]=interfaceUtils.getElementById(uid+"_gb-col-name");

    allinputs["cb_cmap"]=interfaceUtils.getElementById(uid+"_cb-cmap-value");
    allinputs["cb_col"]=interfaceUtils.getElementById(uid+"_cb-col-value");    

    allinputs["scale_col"]=interfaceUtils.getElementById(uid+"_scale-col");   
    allinputs["pie_col"]=interfaceUtils.getElementById(uid+"_piechart-col");   
    allinputs["shape_col"]=interfaceUtils.getElementById(uid+"_shape-col");   
    console.log(allinputs);
    return allinputs;
}

/**
 * @param {string} uid the data id
 * Returns an object full with inputs for a tab named as: 
 * "gb_sr", "gb_col", "cb_cmap", "cb_col", "cb_gr", "cb_gr_rand", "cb_gr_gene", "cb_gr_name"
 * @returns {Object} allinputs
 */
interfaceUtils._mGenUIFuncs.getTabRadiosAndChecks= function(uid){
    allradios={}

    allradios["cb_col"]=interfaceUtils.getElementById(uid+"_cb-bypoint");
    allradios["cb_gr"]=interfaceUtils.getElementById(uid+"_cb-bygroup");

    allradios["cb_gr_rand"]=interfaceUtils.getElementById(uid+"_cb-bygroup-rand");
    allradios["cb_gr_dict"]=interfaceUtils.getElementById(uid+"_cb-bygroup-dict");
    allradios["cb_gr_key"]=interfaceUtils.getElementById(uid+"_cb-bygroup-key"); 

    allradios["pie_check"]=interfaceUtils.getElementById(uid+"_use-piecharts"); 
    allradios["scale_check"]=interfaceUtils.getElementById(uid+"_use-scales"); 
    allradios["shape_check"]=interfaceUtils.getElementById(uid+"_use-shapes"); 
    
    
    
    return allradios;
}

/**
 * @param {string} uid the data id
 * Returns an object full with bools for checks and radios to see if they are checked
 * @returns {Object} allinputs
 */
 interfaceUtils._mGenUIFuncs.areRadiosAndChecksChecked = function(uid){

    var radios=interfaceUtils._mGenUIFuncs.getTabRadiosAndChecks(uid)
    var arechecked={};

    for(r in radios){
        arechecked[r]=radios[r].checked
    }
    
    return arechecked;
}


/**
 * Creates a unique id for each new tab 
 */
interfaceUtils._mGenUIFuncs.generateUUID=function(){
    //HAS TO START with letter
    //aUUID="U12345";
    aUUID='Uxxxxx'.replace(/[x]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
    });
    aUUID=aUUID.toUpperCase();  
    interfaceUtils._mGenUIFuncs.ctx.aUUID=aUUID;
}
   
/**
 * Creates a bootstrap tab to put on the top of the menu and it's pane, 
 * the pane is returned so it can be added to the corresponding existing parent o all panes
 * @returns {HTMLElement} divpane
 */
interfaceUtils._mGenUIFuncs.generateTab=function(){
    //create the tab and the space for the content
    //fill context with generated value for ID of data type
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

     /** 
     * TAB OBJECT
    */
    
    //first thing is to add the tab in the level 1. Which is a li with a button
    li1=HTMLElementUtils.createElement({"kind":"li", "id":generated+"_li-tab", "extraAttributes":{ "class":"nav-item", "role":"presentation"}});
    button1=HTMLElementUtils.createButton({"id":generated+"_marker-tab-name","extraAttributes":{ "class":"nav-link", "data-bs-toggle":"tab","data-bs-target":"#"+generated+"_marker-pane","type":"button","role":"tab","aria-controls":generated+"_marker","aria-selected":"false"}})

    button1.innerHTML="New dataset";

    li1.appendChild(button1);
    setTimeout(function(){button1.click()},0);
    ultabs1=interfaceUtils.getElementById("level-1-tabs");
    plusone=interfaceUtils.getElementById("plus-1");
    if(plusone && ultabs1) ultabs1.insertBefore(li1,plusone);
    else { console.log("No level 1 tabs"); return;}

    /** 
     * TAB PANE
    */
    //now the content of that tab pane which is a form like group to select the options for rendering
    //1.1
    divpane=HTMLElementUtils.createElement({"kind":"div", "id":generated+"_marker-pane", "extraAttributes":{  "class":"tab-pane",  "role":"tabpanel", "aria-labelledby":generated+"_marker-tab"}});

    //return this pane
    return divpane;
}

/**
 * Generate the scaffold of the accordion. if you want more parts for the accordion, do it here.
 * Returns an object with two elements: Pointers to the accordion contents so that we can fill them with the correct forms
 * @returns {Object} divpane={divaccordion:_,contents:_}
 */
interfaceUtils._mGenUIFuncs.generateAccordion=function(){

    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;
    /** 
     * MAIN ACCORDION
    */
    //inside the pane put an accordio with 3 accordion-items to put the options
    divaccordion=HTMLElementUtils.createElement({"kind":"div","id":generated+"_accordion-flush","extraAttributes":{"class":"accordion accordion-flush"}})

    //now 3 accordion items
    accordionitems=[];
    accordioncontents=[];
    ["File and coordinates","Render options","Advanced options"].forEach(function(title,index){
        divaccordionitem=HTMLElementUtils.createElement({ "kind":"div","extraAttributes":{"class":"accordion-item"}});
        h2accordionitem=HTMLElementUtils.createElement({ "kind":"h2","id":"flush-heading"+index.toString(),"extraAttributes":{"class":"accordion-header"}});
        buttonaccordionitem=HTMLElementUtils.createElement({ "kind":"button", "extraAttributes":{ "class":"accordion-button collapsed", "type":"button", "data-bs-toggle":"collapse", "data-bs-target":"#flush-collapse"+index.toString(), "aria-expanded":"false", "aria-controls":"flush-collapse"+index.toString()}})
        divaccordioncontent=HTMLElementUtils.createElement({ "kind":"div", "id":"flush-collapse"+index.toString(), "extraAttributes":{ "class":"accordion-collapse collapse tm-accordion-collapse", "data-bs-parent":"#"+generated+"_accordion-flush", "aria-labelledby":"flush-heading"+index.toString()}})
        buttonaccordionitem.innerText=title;

        h2accordionitem.appendChild(buttonaccordionitem);
        divaccordionitem.appendChild(h2accordionitem);
        divaccordionitem.appendChild(divaccordioncontent);

        accordionitems.push(divaccordionitem);
        accordioncontents.push(divaccordioncontent);
    })

    accordionitems.forEach(ait =>{divaccordion.appendChild(ait)});

    //return pointers to the accordion contents so that we can 
    //fill them with the correct forms
    return {divaccordion:divaccordion,contents:accordioncontents};

}

 /**
 *  Creates progrwss bar, input file picker, tab name, X and Y and returns rows to append to the accordion
 * @returns {array} array of rows
 */
interfaceUtils._mGenUIFuncs.generateAccordionItem1=function(){

    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;
    
    //row 0
    row0=HTMLElementUtils.createRow({id:generated+"_csv_progress_parent"});
    row0.classList.add("d-none");
    row0.innerHTML="Loading markers..."

    col01=HTMLElementUtils.createColumn({"width":12});
        div011=HTMLElementUtils.createElement({"kind":"div", "extraAttributes":{"class":"progress"}});
            div0111=HTMLElementUtils.createElement({"kind":"div", "id":generated+"_csv_progress", "extraAttributes":{"class":"progress-bar progress-bar-striped","role":"progressbar" ,"aria-valuenow":"10", "aria-valuemin":"0" ,"aria-valuemax":"100"}});

    //row 1
    row1=HTMLElementUtils.createRow({id:generated+"_row-1"});
        col11=HTMLElementUtils.createColumn({"width":6});
            div111=HTMLElementUtils.createElement({"kind":"div", "id":generated+"_input_csv"});
                label1111=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"for":generated+"_csv"}});
                label1111.innerText="File and coordinates";
                input1112=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_csv","extraAttributes":{ "name":generated+"_csv", 
                "class":"form-control-file form-control form-control-sm", "type":"file", "accept":".csv,.tsv,.txt"}});
                input1112.addEventListener("change",(event)=>{dataUtils.startCSVcascade(event)});
    
    //---------------------------------

    col12=HTMLElementUtils.createColumn({"width":6});
        div121=HTMLElementUtils.createElement({"kind":"div","id":"input-group"});
            label1221=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"for":generated+"_tab-name"}});
            label1221.innerText="Tab name";
            input1222=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_tab-name", "extraAttributes":{ "name":generated+"_tab-name", "class":"form-control","type":"text", "placeholder":"New dataset", "aria-label":"Tab name" }});
            input1222.innerText=generated; 
            input1222.addEventListener("change",(event)=>{interfaceUtils._mGenUIFuncs.ChangeTabName(event);})

    ///ROW 2

    row2=HTMLElementUtils.createRow({"id":generated+"_row-2"});
        col21=HTMLElementUtils.createColumn({"width":6});
            label211=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_x-label", "extraAttributes":{ "for":generated+"_x_value" }});
            label211.innerText="X coordinate"
            select212=HTMLElementUtils.createElement({"kind":"select", "id":generated+"_x-value", "extraAttributes":{ "class":"form-select form-select-sm", "aria-label":".form-select-sm"}});

        col22=HTMLElementUtils.createColumn({"width":6});
            label221=HTMLElementUtils.createElement({"kind":"label","id":generated+"_y-label","extraAttributes":{"for":generated+"_y-value" }});
            label221.innerText="Y coordinate";
            select222=HTMLElementUtils.createElement({"kind":"select", "id":generated+"_y-value", "extraAttributes":{ "class":"form-select form-select-sm", "aria-label":".form-select-sm"} });

    /*row3=HTMLElementUtils.createRow({"id":generated+"_row-3"});
        col30=HTMLElementUtils.createColumn({"width":4});
            button300=HTMLElementUtils.createButton({"id":generated+"_delete_button","innerText":"Close tab","class":"btn btn-primary","eventListeners":{"click":(event)=>interfaceUtils._mGenUIFuncs.deleteTab(event)}})*/

    row0.appendChild(col01)
        col01.appendChild(div011)
            div011.appendChild(div0111);

    row1.appendChild(col11);
        col11.appendChild(div111);  
            div111.appendChild(label1111);
            div111.appendChild(input1112);
    row1.appendChild(col12);
        col12.appendChild(div121);
            div121.appendChild(label1221);
            div121.appendChild(input1222);

    row2.appendChild(col21);
        col21.appendChild(label211);
        col21.appendChild(select212);
    row2.appendChild(col22);    
        col22.appendChild(label221);
        col22.appendChild(select222);

    /*row3.appendChild(col30);
        col30.appendChild(button300);*/


    return [row0,row1,row2];///,row3];

}

 /**
 *  Creates the forms to color by
 * @returns {array} array of rows
 */
interfaceUtils._mGenUIFuncs.generateColorByAccordion2= function(){
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    ///col 1

    //------------------------------------
    rowcb=HTMLElementUtils.createRow({"id":generated+"_colorby"});

    colcb1=HTMLElementUtils.createColumn({"width":12});

    labelcb11=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_cb-label"});
    labelcb11.innerHTML="<strong>Color options</strong>";


    //col 2
    //-----------------------------------

    colcb2=HTMLElementUtils.createColumn({"width":4});
        divformcheck1cb=HTMLElementUtils.createElement({"kind":"div","extraAttributes":{"class":"form-check"}});
            inputradio1cb=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bygroup","extraAttributes":{ "name":generated+"_flexRadioColorBy", "class":"form-check-input", "type":"radio", "checked":true}});
            labelcbgroup=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bygroup"}});
            labelcbgroup.innerText="Color by group";
        
        divformcheck2cb=HTMLElementUtils.createElement({"kind":"div", "extraAttributes":{"class":"form-check"}});
            inputradio2cb=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bypoint","extraAttributes":{"name":generated+"_flexRadioColorBy","class":"form-check-input","type":"radio"}});
            labelcbpoint=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bypoint"}});
            labelcbpoint.innerText="Color by marker";
   
    //------------------------

    colcb3=HTMLElementUtils.createColumn({"width":8});
        //create a whole group for color by group, random, key and group name
        divoptionscolgroup=HTMLElementUtils.createElement({"kind":"div","id":generated+"_cb-col-group-options","extraAttributes":{"class": "renderOptionContainer"}});

            rowkey=HTMLElementUtils.createElement({"kind":"div","id":generated+"_row-cb-gr-key","extraAttributes":{"class": "form-check"}});
                inputradiocbgrkey=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bygroup-key","extraAttributes":{ "name":generated+"_flexRadioColorByGroup", "class":"form-check-input", "type":"radio", "checked":true}});
                labelcbgroupkey=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bygroup-key"}});
                labelcbgroupkey.innerHTML="Generate color from key value<br>";

            rowrand=HTMLElementUtils.createElement({"kind":"div","id":generated+"_row-cb-gr-rand","extraAttributes":{"class": "form-check"}});
                inputradiocbgrrand=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bygroup-rand","extraAttributes":{ "name":generated+"_flexRadioColorByGroup", "class":"form-check-input", "type":"radio"}});
                labelcbgrouprand=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bygroup-rand"}});
                labelcbgrouprand.innerHTML="Generate color randomly<br>";

            rowdict=HTMLElementUtils.createElement({"kind":"div","id":generated+"_row-cb-gr-dict","extraAttributes":{"class": "form-check"}});
                inputradiocbgrdict=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bygroup-dict","extraAttributes":{ "name":generated+"_flexRadioColorByGroup", "class":"form-check-input", "type":"radio"}});
                labelcbgroupdict=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bygroup-dict"}});
                labelcbgroupdict.innerHTML="Use color from dictionary<br>";
                inputtextcbgrdict=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bygroup-dict-val","extraAttributes":{ "class":"form-text-input", "type":"text", "placeholder":"{'key1':''#FFFFFF',...}"}});
                inputtextcbgrdict.disabled=true

        divoptionscol=HTMLElementUtils.createElement({"kind":"div","id":generated+"_cb-col-options","extraAttributes":{"class": "renderOptionContainer","style":"visibility:hidden;display:none;"}});
            selectcbcol=HTMLElementUtils.createElement({"kind":"select","id":generated+"_cb-col-value","extraAttributes":{"class":"form-select form-select-sm","aria-label":".form-select-sm"}});
            labelcbcol=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_cb_col-colname-label","extraAttributes":{"for":generated+"_cb-col-value"} });
            labelcbcol.innerText="Select color column";
        divoptionscmap=HTMLElementUtils.createElement({"kind":"div", "id":generated+"_cb-cmap-options","extraAttributes":{"class": "renderOptionContainer","style":"visibility:hidden;display:none;"}});
            labelcbcmapvalue=HTMLElementUtils.createElement({"kind":"label","id":generated+"_cb-cmap-label","extraAttributes":{"for":generated+"_cb-cmap-value"}});
            labelcbcmapvalue.innerText="Color map (only if color column is numeral)";
            cmapoptions=[{"text":"None","value":""}];
            dataUtils._d3LUTs.forEach((lut)=>{ cmapoptions.push({"text":lut.replace("interpolate",""),"value":lut}) })
            selectcbcmap=HTMLElementUtils.selectTypeDropDown({ "id":generated+"_cb-cmap-value","class":"form-select form-select-sm","options":cmapoptions,"extraAttributes":{"aria-label":".form-select-sm"}})

    //listeners

    inputradio1cb.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.hideShow(event,["_cb-cmap-options","_cb-col-options","_cb-col-group-options"],[2])
    });
    inputradio2cb.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.hideShow(event,["_cb-cmap-options","_cb-col-options","_cb-col-group-options"],[0,1])
    });
    inputradiocbgrdict.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.enableDisable(event,["_cb-bygroup-dict-val"],[0])
    });
    inputradiocbgrrand.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.enableDisable(event,["_cb-bygroup-dict-val"],[])
    });
    inputradiocbgrkey.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.enableDisable(event,["_cb-bygroup-dict-val"],[])
    });

    rowcb.appendChild(colcb1);
        colcb1.appendChild(labelcb11);
    rowcb.appendChild(colcb2);
        colcb2.appendChild(divformcheck1cb);
            divformcheck1cb.appendChild(inputradio1cb);
            divformcheck1cb.appendChild(labelcbgroup);
        colcb2.appendChild(divformcheck2cb);
            divformcheck2cb.appendChild(inputradio2cb);
            divformcheck2cb.appendChild(labelcbpoint);
    rowcb.appendChild(colcb3);
        colcb3.appendChild(divoptionscolgroup);    
            divoptionscolgroup.appendChild(rowkey);
                rowkey.appendChild(inputradiocbgrkey);
                rowkey.appendChild(labelcbgroupkey);   
            divoptionscolgroup.appendChild(rowrand);
                rowrand.appendChild(inputradiocbgrrand);
                rowrand.appendChild(labelcbgrouprand);        
            divoptionscolgroup.appendChild(rowdict);
                rowdict.appendChild(inputradiocbgrdict);
                rowdict.appendChild(labelcbgroupdict);
                rowdict.appendChild(inputtextcbgrdict);
        colcb3.appendChild(divoptionscol);
            divoptionscol.appendChild(labelcbcol);
            divoptionscol.appendChild(selectcbcol);
        colcb3.appendChild(divoptionscmap);
            divoptionscmap.appendChild(labelcbcmapvalue);
            divoptionscmap.appendChild(selectcbcmap);

    return rowcb;
    
}

 /**
 *  Creates the forms to group by
 * @returns {array} a single rows
 */
  interfaceUtils._mGenUIFuncs.generateKeyColAccordion2= function(){
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    //row 0
    row0=HTMLElementUtils.createRow({id:generated+"_key_0"});
        collab=HTMLElementUtils.createColumn({"width":12});
            labellab=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_cb-label"});
            labellab.innerHTML="<strong>Group by</strong>";

        col00=HTMLElementUtils.createColumn({"width":6});
            label010=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_key-col-label", "extraAttributes":{ "for":generated+"_key-col" }});
            label010.innerText="Key to group by (optional)"
            select011=HTMLElementUtils.createElement({"kind":"select", "id":generated+"_gb-col-value", "extraAttributes":{ "class":"form-select form-select-sm", "aria-label":".form-select-sm"}});
            select011.disabled=false
            
            label012=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_name-col-label", "extraAttributes":{ "for":generated+"_name-col" }});
            label012.innerText="Extra column to display (optional)"
            select013=HTMLElementUtils.createElement({"kind":"select", "id":generated+"_gb-col-name", "extraAttributes":{ "class":"form-select form-select-sm", "aria-label":".form-select-sm"}});
            select013.disabled=false

    row0.appendChild(collab)
        collab.appendChild(labellab)

    row0.appendChild(col00);
        col00.appendChild(label010);
        col00.appendChild(select011);
        col00.appendChild(label012);
        col00.appendChild(select013);


    return row0;
}

 /**
 *  Creates the whole options section
 * @returns {array} array of rows
 */
interfaceUtils._mGenUIFuncs.generateAccordionItem2=function(){

    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;
    
    row1=interfaceUtils._mGenUIFuncs.generateKeyColAccordion2();
    row2=interfaceUtils._mGenUIFuncs.generateColorByAccordion2();

    return [row1, row2];
}

/**
 *  Creates piechart options
 * @returns {array} array of rows
 */
 interfaceUtils._mGenUIFuncs.generateAccordionItem3=function(){

    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    row2=interfaceUtils._mGenUIFuncs.generateAdvancedScaleAccordion3();
    row4=interfaceUtils._mGenUIFuncs.generateAdvancedShapeAccordion3();
    row3=interfaceUtils._mGenUIFuncs.generateAdvancedPiechartAccordion3();
    
    return [row2,row3,row4];
 }

 /**
 *  Creates the forms to scale by
 * @returns {array} a single rows
 */
    interfaceUtils._mGenUIFuncs.generateAdvancedScaleAccordion3= function(){
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    //row 0
    row0=HTMLElementUtils.createRow({id:generated+"_scale_0"});
        collab=HTMLElementUtils.createColumn({"width":12});
            labellab=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_cb-label"});
            labellab.innerHTML="<strong>Marker size</strong>";

        col00=HTMLElementUtils.createColumn({"width":6});
            divformcheck000=HTMLElementUtils.createElement({ "kind":"div", "extraAttributes":{"class":"form-check"}});
                inputcheck0000=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_use-scales","extraAttributes":{"class":"form-check-input","type":"checkbox" }});
                label0001=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_use-scales-label", "extraAttributes":{ "for":generated+"_use-scales" }});
                label0001.innerText="Use different size per marker"
                
        col01=HTMLElementUtils.createColumn({"width":6});
            label010=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_scale-col-label", "extraAttributes":{ "for":generated+"_scale-col" }});
            label010.innerText="Size column"
            select011=HTMLElementUtils.createElement({"kind":"select", "id":generated+"_scale-col", "extraAttributes":{ "class":"form-select form-select-sm", "aria-label":".form-select-sm"}});
            select011.disabled=true

    inputcheck0000.addEventListener("change", (event)=>{
        var value=event.target.checked;
        //var doms=["_gb-single","_gb-col","_gb-feature-value","_cb-colormap","_cb-bypoint","_cb-bygroup","_gb-feature-value",
        //          "_gb-col-value","_gb-col-name","_cb-cmap-value","_cb-col-value","_cb-bygroup-rand","_cb-bygroup-gene","_cb-bygroup-name" ]
        if(value)
            interfaceUtils._mGenUIFuncs.enableDisable(event, ["_scale-col"],[0])
        else 
            interfaceUtils._mGenUIFuncs.enableDisable(event, ["_scale-col"],[])
    })

    row0.appendChild(collab)
        collab.appendChild(labellab)

    row0.appendChild(col00)
        col00.appendChild(divformcheck000)
            divformcheck000.appendChild(inputcheck0000);
            divformcheck000.appendChild(label0001);

    row0.appendChild(col01);
        col01.appendChild(label010);
        col01.appendChild(select011);


    return row0;
}

 /**
 *  Creates the forms to shape by
 * @returns {array} a single rows
 */
  interfaceUtils._mGenUIFuncs.generateAdvancedShapeAccordion3= function(){
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    //row 0
    row0=HTMLElementUtils.createRow({id:generated+"_shape_0"});
        collab=HTMLElementUtils.createColumn({"width":12});
            labellab=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_cb-label"});
            labellab.innerHTML="<strong>Marker shape</strong>";

        col00=HTMLElementUtils.createColumn({"width":6});
            divformcheck000=HTMLElementUtils.createElement({ "kind":"div", "extraAttributes":{"class":"form-check"}});
                inputcheck0000=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_use-shapes","extraAttributes":{"class":"form-check-input","type":"checkbox" }});
                label0001=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_use-shapes-label", "extraAttributes":{ "for":generated+"_use-shapes" }});
                label0001.innerText="Use different shape per marker"
                
        col01=HTMLElementUtils.createColumn({"width":6});
            label010=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_shape-col-label", "extraAttributes":{ "for":generated+"_shape-col" }});
            label010.innerText="Shape column"
            select011=HTMLElementUtils.createElement({"kind":"select", "id":generated+"_shape-col", "extraAttributes":{ "class":"form-select form-select-sm", "aria-label":".form-select-sm"}});
            select011.disabled=true

    inputcheck0000.addEventListener("change", (event)=>{
        var value=event.target.checked;
        //var doms=["_gb-single","_gb-col","_gb-feature-value","_cb-colormap","_cb-bypoint","_cb-bygroup","_gb-feature-value",
        //          "_gb-col-value","_gb-col-name","_cb-cmap-value","_cb-col-value","_cb-bygroup-rand","_cb-bygroup-gene","_cb-bygroup-name" ]
        if(value)
            interfaceUtils._mGenUIFuncs.enableDisable(event, ["_shape-col","_use-piecharts","_piechart-col"],[0])
        else 
            interfaceUtils._mGenUIFuncs.enableDisable(event, ["_shape-col","_use-piecharts"],[1])
    })

    row0.appendChild(collab)
        collab.appendChild(labellab)

    row0.appendChild(col00)
        col00.appendChild(divformcheck000)
            divformcheck000.appendChild(inputcheck0000);
            divformcheck000.appendChild(label0001);

    row0.appendChild(col01);
        col01.appendChild(label010);
        col01.appendChild(select011);


    return row0;
}

 /**
 *  Creates the forms for piecharts
 * @returns {array} a single rows
 */
  interfaceUtils._mGenUIFuncs.generateAdvancedPiechartAccordion3= function(){
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    //row 0
    row0=HTMLElementUtils.createRow({id:generated+"_piechart_0"});
        collab=HTMLElementUtils.createColumn({"width":12});
            labellab=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_cb-label"});
            labellab.innerHTML="<strong>Pie-charts</strong>";

        col00=HTMLElementUtils.createColumn({"width":6});
            divformcheck000=HTMLElementUtils.createElement({ "kind":"div", "extraAttributes":{"class":"form-check"}});
                inputcheck0000=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_use-piecharts","extraAttributes":{"class":"form-check-input","type":"checkbox" }});
                label0001=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_use-piecharts-label", "extraAttributes":{ "for":generated+"_use-piecharts" }});
                label0001.innerText="Use pie-charts"
                
        col01=HTMLElementUtils.createColumn({"width":6});
            label010=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_piechart-col-label", "extraAttributes":{ "for":generated+"_piechart-col" }});
            label010.innerText="Pie-chart column"
            select011=HTMLElementUtils.createElement({"kind":"select", "id":generated+"_piechart-col", "extraAttributes":{ "class":"form-select form-select-sm", "aria-label":".form-select-sm"}});
            select011.disabled=true

    inputcheck0000.addEventListener("change", (event)=>{
        var value=event.target.checked;
        //var doms=["_gb-single","_gb-col","_gb-feature-value","_cb-colormap","_cb-bypoint","_cb-bygroup","_gb-feature-value",
        //          "_gb-col-value","_gb-col-name","_cb-cmap-value","_cb-col-value","_cb-bygroup-rand","_cb-bygroup-gene","_cb-bygroup-name" ]
        if(value){
            interfaceUtils._mGenUIFuncs.enableDisable(event, ["_piechart-col","_cb-bygroup","_cb-bypoint","_use-shapes","_shape-col","_cb-bygroup-key","_cb-bygroup-rand","_cb-bygroup-dict"],[0]);
        }
        else 
            interfaceUtils._mGenUIFuncs.enableDisable(event, ["_piechart-col","_cb-bygroup","_cb-bypoint","_use-shapes","_cb-bygroup-key","_cb-bygroup-rand","_cb-bygroup-dict"],[1,2,3,4,5,6]);
    })

    row0.appendChild(collab)
        collab.appendChild(labellab)

    row0.appendChild(col00)
        col00.appendChild(divformcheck000)
            divformcheck000.appendChild(inputcheck0000);
            divformcheck000.appendChild(label0001);

    row0.appendChild(col01);
        col01.appendChild(label010);
        col01.appendChild(select011);


    return row0;
}

 /**
 *  Creates the forms to color by
 * @returns {HTMLElement} row
 */
interfaceUtils._mGenUIFuncs.generateRowOptionsButtons=function(){
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;
    row0=HTMLElementUtils.createRow({"id":generated+"_row-option-buttons"});
        col00=HTMLElementUtils.createColumn({"width":5});
        col01=HTMLElementUtils.createColumn({"width":3});
            button010=HTMLElementUtils.createButton({"id":generated+"_delete-button","innerText":"Close tab","class":"btn btn-secondary","eventListeners":{"click":(event)=>interfaceUtils._mGenUIFuncs.deleteTab(event)}});
        col02=HTMLElementUtils.createColumn({"width":4});
            button020=HTMLElementUtils.createButton({"id":generated+"_update-view-button","innerText":"Update view","class":"btn btn-primary","eventListeners":{"click":(event)=> dataUtils.updateViewOptions(event) }});
    
    row0.appendChild(col00);
    row0.appendChild(col01);
        col01.appendChild(button010);
    row0.appendChild(col02);
        col02.appendChild(button020);

    return row0;

}

interfaceUtils._mGenUIFuncs.rowForMarkerUI=function(){

    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    row0=HTMLElementUtils.createRow({id:generated+"_menu-UI"});
    row0.classList.add("d-none");

    return row0;
}

/**
 * @param {string} uid id in datautils.data
 * @param {object} expectedHeader object of the type {input:expectedHeaderFromCSV}
 * If somehow there is an expect CSV this will help you del with that
*/
interfaceUtils._mGenUIFuncs.fillDropDownsIfExpectedCSV=function(uid,expectedHeader){
    //expected headr is an object that has these keys, other will be ignored;
    //"X","Y","gb_sr","gb_col","gb_name","cb_cmap","cb_col"
    if(expectedHeader){
        interfaceUtils._mGenUIFuncs.ctx.expectedHeader=expectedHeader;

        dropdowns=interfaceUtils._mGenUIFuncs.getTabDropDowns(uid);

        for(d in expectedHeader){
            if(dropdowns[d]){
                needle=expectedHeader[d];
                opts=dropdowns[d].options;
                for(var i=0;i<opts.length;i++){
                    var o=opts[i];
                    //console.log(o.value,);
                    proceed=o.value.includes(needle) 
                    if(proceed){
                        dropdowns[d].value=needle
                    }
                }               
            }
        }
    }
}

/**
 * @param {string} uid id in datautils.data
 * Create the menu with the options to select marker, select shape and color to draw
*/
interfaceUtils._mGenUIFuncs.groupUI=function(uid){
    //if we arrive here it's because  agroupgarden exists, all the information is there, 
    //also we need some info on color and options, but we can get that.
    var data_obj = dataUtils.data[uid];

    var _selectedOptions=interfaceUtils._mGenUIFuncs.areRadiosAndChecksChecked(uid);


    //I do this to know if I have name selected, and also to know where to draw the 
    //color from

    var table=HTMLElementUtils.createElement({"kind":"table","extraAttributes":{"class":"table table-striped marker_table"}});
    var thead=HTMLElementUtils.createElement({"kind":"thead"});
    var thead2=HTMLElementUtils.createElement({"kind":"thead"});
    var theadrow=HTMLElementUtils.createElement({"kind":"tr"});
    var tbody=HTMLElementUtils.createElement({"kind":"tbody"});

    var headopts=[""];
    var sortable = {}
    if(data_obj["_gb_col"]){
        headopts.push(data_obj["_gb_col"]);
        sortable[data_obj["_gb_col"]] = "sorttable_sort";
    }
    else { 
        headopts.push("Group");
        sortable["Group"] = "sorttable_sort";
    }
    
    var usename=false;
    if(data_obj["_gb_name"]){
        headopts.push(data_obj["_gb_name"]);
        sortable[data_obj["_gb_name"]] = "sorttable_sort";
        usename=true;
    }
    headopts.push("Counts");
    sortable["Counts"] = "sorttable_sort";
    if(!data_obj["_shape_col"]){
        headopts.push("Shape");
        sortable["Shape"] = "sorttable_nosort";
    }
    if(!data_obj["_cb_col"]){
        headopts.push("Color");
        sortable["Color"] = "sorttable_nosort";
    }
    headopts.forEach((opt)=>{
        var th=HTMLElementUtils.createElement({"kind":"th","extraAttributes":{"scope":"col","class":sortable[opt]}});
        th.innerText=opt
        theadrow.appendChild(th);
    });

    thead.appendChild(theadrow);

    if(data_obj["_gb_col"]){
        // add All row
        
        //row
        var tr=HTMLElementUtils.createElement({"kind":"tr","extraAttributes":{"class":"sorttable_nosort"}});
        //first spot for a check
        var td0=HTMLElementUtils.createElement({"kind":"td"});
        var td1=HTMLElementUtils.createElement({"kind":"td"});
        var td15=null;
        var td17=HTMLElementUtils.createElement({"kind":"td"});
        var td2=null;
        var td3=null;

        tr.appendChild(td0);
        tr.appendChild(td1);

        var check0=HTMLElementUtils.createElement({"kind":"input", "id":uid+"_all_check","extraAttributes":{"class":"form-check-input","type":"checkbox" }});
        check0.checked = true; 
        td0.appendChild(check0);
        check0.addEventListener("input",(event)=>{
            clist = interfaceUtils.getElementsByClassName(uid+"-marker-input");
            for (var i = 0; i < clist.length; ++i) { clist[i].checked = event.target.checked; }
        });
        var label1=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"for":uid+"_all_check","class":"cursor-pointer"}});
        label1.innerText="All";
        td1.appendChild(label1);

        if(usename){
            var td15=HTMLElementUtils.createElement({"kind":"td"});
            var label15=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"for":uid+"_all_check","class":"cursor-pointer"}});
            label15.innerText="All";
            td15.appendChild(label15);
            tr.appendChild(td15);
        }

        var label17=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"for":uid+"_all_check","class":"cursor-pointer"}});
        label17.innerText=data_obj["_processeddata"].length;    
        td17.appendChild(label17);        
        tr.appendChild(td17);

        if(!data_obj["_shape_col"]){
            var td2=HTMLElementUtils.createElement({"kind":"td"});
            tr.appendChild(td2);
        }
        if(!data_obj["_cb_col"]){
            var td3=HTMLElementUtils.createElement({"kind":"td"});
            tr.appendChild(td3);
        }

        thead2.appendChild(tr);
    }

    var count=0;
    for(i in data_obj["_groupgarden"]){

        var tree = data_obj["_groupgarden"][i]
        //row
        var tr=HTMLElementUtils.createElement({"kind":"tr"});
        //first spot for a check
        var td0=HTMLElementUtils.createElement({"kind":"td"});
        var td1=HTMLElementUtils.createElement({"kind":"td"});
        var td15=null;
        var td17=HTMLElementUtils.createElement({"kind":"td"});
        var td2=null;
        var td3=null;

        tr.appendChild(td0);
        tr.appendChild(td1);

        //remove space just in case
        var escapedID=tree["treeID"].replace(" ","_");
        var escapedName="";
        if(usename)
            escapedName=tree["treeName"];

        var check0=HTMLElementUtils.createElement({"kind":"input", "id":uid+"_"+escapedID+"_check","extraAttributes":{"class":"form-check-input "+uid+"-marker-input","type":"checkbox" }});
        check0.checked = true; 
        td0.appendChild(check0);

        var label1=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"for":uid+"_"+escapedID+"_check","class":"cursor-pointer"}});
        label1.innerText=tree["treeID"];
        td1.appendChild(label1);

        if(usename){
            var td15=HTMLElementUtils.createElement({"kind":"td"});
            var label15=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"for":uid+"_"+escapedID+"_check","class":"cursor-pointer"}});
            label15.innerText=tree["treeName"];    
            td15.appendChild(label15);        
            tr.appendChild(td15);
        }

        var label17=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"for":uid+"_"+escapedID+"_check","class":"cursor-pointer"}});
        label17.innerText=tree.size();    
        td17.appendChild(label17);        
        tr.appendChild(td17);

        if(!data_obj["_shape_col"]){
            td2 = HTMLElementUtils.createElement({"kind":"td"});
            var shapeoptions=[];
            markerUtils._symbolStrings.forEach((sho)=>{ shapeoptions.push({"text":sho,"value":sho}) })
            shapeinput2=HTMLElementUtils.selectTypeDropDown({ "id":uid+"_"+escapedID+"_shape","class":"form-select form-select-sm","options":shapeoptions,"extraAttributes":{"aria-label":".form-select-sm"}})
            shapeinput2.value=markerUtils._symbolStrings[count]

            count+=1;
            count=count % markerUtils._symbolStrings.length;

            tr.appendChild(td2);
            td2.appendChild(shapeinput2);
        }
        if(!data_obj["_cb_col"]){
            td3 = HTMLElementUtils.createElement({"kind":"td"});
            //the color depends on 3 possibilities , "cb_gr_rand","cb_gr_gene","cb_gr_name"
            if(_selectedOptions["cb_gr_rand"]){
                thecolor=overlayUtils.randomColor("hex");
            }else if(_selectedOptions["cb_gr_key"]){
                thecolor=HTMLElementUtils.determinsticHTMLColor(escapedID);
            }else if(_selectedOptions["cb_gr_dict"]){
                thecolor=HTMLElementUtils.determinsticHTMLColor(escapedName);
            }

            var colorinput3 = HTMLElementUtils.inputTypeColor({"id": uid+"_"+escapedID+"_color", "extraAttributes": {"value": thecolor}});
            tr.appendChild(td3);
            td3.appendChild(colorinput3);
        }
        tbody.appendChild(tr);
       
    }

    table.appendChild(thead);
    table.appendChild(thead2);
    table.appendChild(tbody);

    return table;
}

interfaceUtils._mGenUIFuncs.getGroupInputs = function(uid, key) {
    const data_obj = dataUtils.data[uid];

    let inputs = {};
    if (data_obj["_groupgarden"].hasOwnProperty(key)) {
        const tree = data_obj["_groupgarden"][key];
        const escapedID = tree["treeID"].replace(" ","_");
        const hasGroupUI = interfaceUtils.getElementById(uid + "_" + escapedID + "_shape");

        if (hasGroupUI) {
            inputs["visible"] = interfaceUtils.getElementById(uid + "_" + escapedID + "_check").checked;
            if (interfaceUtils.getElementById(uid + "_" + escapedID + "_shape"))
                inputs["shape"] = interfaceUtils.getElementById(uid + "_" + escapedID + "_shape").value;
            if (interfaceUtils.getElementById(uid + "_" + escapedID + "_color"))
                inputs["color"] = interfaceUtils.getElementById(uid + "_" + escapedID + "_color").value;
        }
    }
    return inputs;
}