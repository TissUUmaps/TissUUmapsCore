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

interfaceUtils._mGenUIFuncs={ctx:{aUUID:0}}

interfaceUtils._mGenUIFuncs.deleteTab=function(event){
    uid=event.target.id.split("_")[0];

    tabbutton=interfaceUtils.getElementById(uid+"_li-tab")
    tabbutton.remove();

    tabpane=interfaceUtils.getElementById(uid+"_marker-pane")
    tabpane.remove();

    delete dataUtils.data[uid];
}

interfaceUtils._mGenUIFuncs.hideShow=function(event,array,option){
    uid=event.target.name.split("_")[0]
    array.forEach((domid, index)=>{
        newdomid=uid+domid;
        domelement=interfaceUtils.getElementById(newdomid);
        if(domelement){
            if(index != option){
                domelement.setAttribute("style",'visibility:hidden;display:none;');
            }else{
                domelement.removeAttribute("style");
            }
        }
    });
}

interfaceUtils._mGenUIFuncs.selectDeselect=function(event,array,option){
    uid=event.target.name.split("_")[0]
    array.forEach((domid, index)=>{
        newdomid=uid+domid;
        domelement=interfaceUtils.getElementById(newdomid);
        if(domelement){
            if(index != option){
                domelement.checked=false;
            }else{
                domelement.checked=true;
            }
        }
    });
}

interfaceUtils._mGenUIFuncs.enableDisable=function(event,array,option){
    uid=event.target.name.split("_")[0]
    array.forEach((domid, index)=>{
        newdomid=uid+domid;
        domelement=interfaceUtils.getElementById(newdomid);
        if(domelement){
            if(index != option){
                domelement.disabled=false
            }else{
                domelement.disabled=true
            }
        }
    });
}

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

interfaceUtils._mGenUIFuncs.getTabDropDowns= function(uid){
    allinputs={}
    allinputs["X"]=interfaceUtils.getElementById(uid+"_x-value");
    allinputs["Y"]=interfaceUtils.getElementById(uid+"_y-value");

    allinputs["gb_sr"]=interfaceUtils.getElementById(uid+"_gb-feature-value");
    allinputs["gb_col"]=interfaceUtils.getElementById(uid+"_gb-col-value");
    allinputs["gb_name"]=interfaceUtils.getElementById(uid+"_gb-col-name");

    allinputs["cb_cmap"]=interfaceUtils.getElementById(uid+"_cb-cmap-value");
    allinputs["cb_col"]=interfaceUtils.getElementById(uid+"_cb-col-value");    
    
    return allinputs;
}

interfaceUtils._mGenUIFuncs.getTabRadios= function(uid){
    allradios={}
    allradios["gb_sr"]=interfaceUtils.getElementById(uid+"_gb-feature-value");
    allradios["gb_col"]=interfaceUtils.getElementById(uid+"_gb-col-value");

    allradios["cb_cmap"]=interfaceUtils.getElementById(uid+"_cb-colormap");
    allradios["cb_col"]=interfaceUtils.getElementById(uid+"_cb-bypoint");
    allradios["cb_gr"]=interfaceUtils.getElementById(uid+"_cb-bygroup");

    allradios["cb_gr_rand"]=interfaceUtils.getElementById(uid+"_cb-bygroup-rand");
    allradios["cb_gr_gene"]=interfaceUtils.getElementById(uid+"_cb-bygroup-gene");
    allradios["cb_gr_name"]=interfaceUtils.getElementById(uid+"_cb-bygroup-name");   
    
    return allradios;
}


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

    button1.innerHTML=generated;

    li1.appendChild(button1);
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
    ["File and coordinates","Render options","Charts"].forEach(function(title,index){
        divaccordionitem=HTMLElementUtils.createElement({ "kind":"div","extraAttributes":{"class":"accordion-item"}});
        h2accordionitem=HTMLElementUtils.createElement({ "kind":"h2","id":"flush-heading"+index.toString(),"extraAttributes":{"class":"accordion-header"}});
        buttonaccordionitem=HTMLElementUtils.createElement({ "kind":"button", "extraAttributes":{ "class":"accordion-button collapsed", "type":"button", "data-bs-toggle":"collapse", "data-bs-target":"#flush-collapse"+index.toString(), "aria-expanded":"false", "aria-controls":"flush-collapse"+index.toString()}})
        divaccordioncontent=HTMLElementUtils.createElement({ "kind":"div", "id":"flush-collapse"+index.toString(), "extraAttributes":{ "class":"accordion-collapse collapse", "data-bs-parent":"#"+generated+"_accordion-flush", "aria-labelledby":"flush-heading"+index.toString()}})
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
 *  ACCORDION ITEM 1
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
            input1222=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_tab-name", "extraAttributes":{ "name":generated+"_tab-name", "class":"form-control","type":"text", "placeholder":generated, "aria-label":"Tab name" }});
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

    row3=HTMLElementUtils.createRow({"id":generated+"_row-3"});
        col30=HTMLElementUtils.createColumn({"width":4});
            button300=HTMLElementUtils.createButton({"id":generated+"_delete_button","innerText":"Close tab","class":"btn btn-primary","eventListeners":{"click":(event)=>interfaceUtils._mGenUIFuncs.deleteTab(event)}})

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

    row3.appendChild(col30);
        col30.appendChild(button300);


    return [row0,row1,row2,row3];

}

interfaceUtils._mGenUIFuncs.generateGroupByAccordion1= function(){
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    ///col 1

    //------------------------------------
    rowgb=HTMLElementUtils.createRow({"id":generated+"_groupby"});
        colgb1=HTMLElementUtils.createColumn({"width":12});
            labelgb11=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_gb-label"});
            labelgb11.innerHTML="<strong>Group by</strong>";

    //col 2
    //-----------------------------------

    colgb2=HTMLElementUtils.createColumn({"width":6});
        divformcheck1=HTMLElementUtils.createElement({ "kind":"div", "extraAttributes":{"class":"form-check"}});
            inputradio1=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_gb-single","extraAttributes":{"name":generated+"_flexRadioGroupBy","class":"form-check-input","type":"radio" }});
            inputradio1.checked=true;
            labelgbnone=HTMLElementUtils.createElement({"kind":"label", "extraAttributes":{"class":"form-check-label","for":generated+"_gb-single" }});
            labelgbnone.innerText="Single row";

        divformcheck2=HTMLElementUtils.createElement({ "kind":"div", "extraAttributes":{"class":"form-check"} });
            inputradio2=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_gb-col", "extraAttributes":{ "name":generated+"_flexRadioGroupBy", "class":"form-check-input", "type":"radio"  }});
            labelgbcol=HTMLElementUtils.createElement({"kind":"label", "extraAttributes":{ "class":"form-check-label", "for":generated+"_gb-col" } });
            labelgbcol.innerText="By Column";

    //------------------------

    colgb3=HTMLElementUtils.createColumn({"width":6});

        divoptionsnone=HTMLElementUtils.createElement({"kind":"div", "id":generated+"_gb-single-options"});
            labelgbnonefeature=HTMLElementUtils.createElement({ "kind":"label","id":generated+"_gb_none-feature-label","extraAttributes":{"for":generated+"_gb-feature-value"}});
            labelgbnonefeature.innerText="Feature to display";
            selectgbnone=HTMLElementUtils.createElement({"kind":"select","id":generated+"_gb-feature-value","extraAttributes":{"class":"form-select form-select-sm","aria-label":".form-select-sm"}});

        divoptionscol=HTMLElementUtils.createElement({ "kind":"div","id":generated+"_gb-col-options" , "extraAttributes":{"style":'visibility:hidden;display:none;'}});
            labelgbcolvalue=HTMLElementUtils.createElement({"kind":"label","id":generated+"_gb-col-value-label","extraAttributes":{"for":generated+"_gb-col-value"}});
            labelgbcolvalue.innerText="Column group";
            selectgbcol=HTMLElementUtils.createElement({"kind":"select","id":generated+"_gb-col-value","extraAttributes":{"class":"form-select form-select-sm","aria-label":".form-select-sm" }});
            labelgbcolname=HTMLElementUtils.createElement({"kind":"label","id":generated+"_gb-col-name-label","extraAttributes":{"for":generated+"_gb-col-name"}});
            labelgbcolname.innerText="Group name";
            selectgbcolname=HTMLElementUtils.createElement({"kind":"select","id":generated+"_gb-col-name","extraAttributes":{"class":"form-select form-select-sm","aria-label":".form-select-sm" }});

    inputradio1.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.hideShow(event,["_gb-single-options","_gb-col-options"],0);
        interfaceUtils._mGenUIFuncs.hideShow(event,["_cb-cmap-options","_cb-col-options","_cb-col-group-options"],0)
        interfaceUtils._mGenUIFuncs.enableDisable(event,["_cb-bygroup"],0);
        interfaceUtils._mGenUIFuncs.selectDeselect(event,["_cb-colormap","_cb-bypoint","_cb-bygroup"],0);        
    });
    inputradio2.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.hideShow(event,["_gb-single-options","_gb-col-options"],1);
        interfaceUtils._mGenUIFuncs.enableDisable(event,["_cb-bygroup"],1);
    });

    rowgb.appendChild(colgb1);
        colgb1.appendChild(labelgb11);
    rowgb.appendChild(colgb2);
        colgb2.appendChild(divformcheck1);
            divformcheck1.appendChild(inputradio1);
            divformcheck1.appendChild(labelgbnone);
        colgb2.appendChild(divformcheck2);
            divformcheck2.appendChild(inputradio2);
            divformcheck2.appendChild(labelgbcol);
    rowgb.appendChild(colgb3);
        colgb3.appendChild(divoptionsnone);
            divoptionsnone.appendChild(labelgbnonefeature);
            divoptionsnone.appendChild(selectgbnone);
        colgb3.appendChild(divoptionscol);
            divoptionscol.appendChild(labelgbcolvalue);
            divoptionscol.appendChild(selectgbcol);
            divoptionscol.appendChild(labelgbcolname);
            divoptionscol.appendChild(selectgbcolname);

    return rowgb;
    
}

interfaceUtils._mGenUIFuncs.generateColorByAccordion1= function(){
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    ///col 1

    //------------------------------------
    rowcb=HTMLElementUtils.createRow({"id":generated+"_colorby"});

    colcb1=HTMLElementUtils.createColumn({"width":12});

    labelcb11=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_cb-label"});
    labelcb11.innerHTML="<strong>Color options</strong>";


    //col 2
    //-----------------------------------

    colcb2=HTMLElementUtils.createColumn({"width":6});
        divformcheck1cb=HTMLElementUtils.createElement({"kind":"div","extraAttributes":{"class":"form-check"}});
            inputradio1cb=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-colormap","extraAttributes":{"name":generated+"_flexRadioColorBy","class":"form-check-input","type":"radio"}});
            labelcbcmap=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-colormap"}});
            labelcbcmap.innerText="Color map";
        divformcheck2cb=HTMLElementUtils.createElement({"kind":"div", "extraAttributes":{"class":"form-check"}});
            inputradio2cb=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bypoint","extraAttributes":{"name":generated+"_flexRadioColorBy","class":"form-check-input","type":"radio"}});
            labelcbpoint=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bypoint"}});
            labelcbpoint.innerText="Color by point";
        divformcheck3cb=HTMLElementUtils.createElement({"kind":"div","extraAttributes":{"class":"form-check"}});
            inputradio3cb=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bygroup","extraAttributes":{ "name":generated+"_flexRadioColorBy", "class":"form-check-input", "type":"radio"}});
            inputradio3cb.disabled=true;
            labelcbgroup=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bygroup"}});
            labelcbgroup.innerText="Color by group";
   
    //------------------------

    colcb3=HTMLElementUtils.createColumn({"width":6});
        divoptionscmap=HTMLElementUtils.createElement({"kind":"div", "id":generated+"_cb-cmap-options","extraAttributes":{"class": "renderOptionContainer"}});
            labelcbcmapvalue=HTMLElementUtils.createElement({"kind":"label","id":generated+"_cb-cmap-label","extraAttributes":{"for":generated+"_cb-cmap-value"}});
            labelcbcmapvalue.innerText="Color map";
            cmapoptions=[];
            dataUtils._d3LUTs.forEach((lut)=>{ cmapoptions.push({"text":lut.replace("interpolate",""),"value":lut}) })
            selectcbcmap=HTMLElementUtils.selectTypeDropDown({ "id":generated+"_cb-cmap-value","class":"form-select form-select-sm","options":cmapoptions,"extraAttributes":{"aria-label":".form-select-sm"}})

        divoptionscol=HTMLElementUtils.createElement({"kind":"div","id":generated+"_cb-col-options","extraAttributes":{"class": "renderOptionContainer","style":"visibility:hidden;display:none;"}});
            selectcbcol=HTMLElementUtils.createElement({"kind":"select","id":generated+"_cb-col-value","extraAttributes":{"class":"form-select form-select-sm","aria-label":".form-select-sm"}});
            labelcbcol=HTMLElementUtils.createElement({"kind":"label", "id":generated+"_cb_col-colname-label","extraAttributes":{"for":generated+"_cb-col-value"} });
            labelcbcol.innerText="Color column";

        //create a whole group for color by group, random, gene and group name
        divoptionscolgroup=HTMLElementUtils.createElement({"kind":"div","id":generated+"_cb-col-group-options","extraAttributes":{"class": "renderOptionContainer","style":"visibility:hidden;display:none;"}});

            rowrand=HTMLElementUtils.createElement({"kind":"div","id":generated+"_row-cb-gr-rand","extraAttributes":{"class": "renderOption"}});
                inputradiocbgrrand=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bygroup-rand","extraAttributes":{ "name":generated+"_flexRadioColorByGroup", "class":"form-check-input", "type":"radio"}});
                labelcbgrouprand=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bygroup-rand"}});
                labelcbgrouprand.innerHTML="Color randomly<br>";

            rowgene=HTMLElementUtils.createElement({"kind":"div","id":generated+"_row-cb-gr-gene","extraAttributes":{"class": "renderOption"}});
                inputradiocbgrgene=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bygroup-gene","extraAttributes":{ "name":generated+"_flexRadioColorByGroup", "class":"form-check-input", "type":"radio"}});
                labelcbgroupgene=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bygroup-gene"}});
                labelcbgroupgene.innerHTML="Color by gene<br>";

            rowname=HTMLElementUtils.createElement({"kind":"div","id":generated+"_row-cb-gr-name","extraAttributes":{"class": "renderOption"}});
                inputradiocbgrname=HTMLElementUtils.createElement({"kind":"input", "id":generated+"_cb-bygroup-name","extraAttributes":{ "name":generated+"_flexRadioColorByGroup", "class":"form-check-input", "type":"radio"}});
                labelcbgroupname=HTMLElementUtils.createElement({"kind":"label","extraAttributes":{"class":"form-check-label","for":generated+"_cb-bygroup-name"}});
                labelcbgroupname.innerHTML="Color by name<br>";


    //listeners

    inputradio1cb.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.hideShow(event,["_cb-cmap-options","_cb-col-options","_cb-col-group-options"],0)
    });
    inputradio2cb.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.hideShow(event,["_cb-cmap-options","_cb-col-options","_cb-col-group-options"],1)
    });
    inputradio3cb.addEventListener("change",(event)=>{
        interfaceUtils._mGenUIFuncs.hideShow(event,["_cb-cmap-options","_cb-col-options","_cb-col-group-options"],2)
    });

    rowcb.appendChild(colcb1);
        colcb1.appendChild(labelcb11);
    rowcb.appendChild(colcb2);
        colcb2.appendChild(divformcheck1cb);
            divformcheck1cb.appendChild(inputradio1cb);
            divformcheck1cb.appendChild(labelcbcmap);
        colcb2.appendChild(divformcheck2cb);
            divformcheck2cb.appendChild(inputradio2cb);
            divformcheck2cb.appendChild(labelcbpoint);
        colcb2.appendChild(divformcheck3cb);
            divformcheck3cb.appendChild(inputradio3cb);
            divformcheck3cb.appendChild(labelcbgroup);
    rowcb.appendChild(colcb3);
        colcb3.appendChild(divoptionscmap);
            divoptionscmap.appendChild(labelcbcmapvalue);
            divoptionscmap.appendChild(selectcbcmap);
        colcb3.appendChild(divoptionscol);
            divoptionscol.appendChild(labelcbcol);
            divoptionscol.appendChild(selectcbcol);
        colcb3.appendChild(divoptionscolgroup);
            divoptionscolgroup.appendChild(rowrand);
                rowrand.appendChild(inputradiocbgrrand);
                rowrand.appendChild(labelcbgrouprand);            
            divoptionscolgroup.appendChild(rowgene);
                rowgene.appendChild(inputradiocbgrgene);
                rowgene.appendChild(labelcbgroupgene);            
            divoptionscolgroup.appendChild(rowname);
                rowname.appendChild(inputradiocbgrname);
                rowname.appendChild(labelcbgroupname);

    return rowcb;
    
}

interfaceUtils._mGenUIFuncs.generateAccordionItem2=function(){

    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;
    
    rowgb=interfaceUtils._mGenUIFuncs.generateGroupByAccordion1();
    rowcb=interfaceUtils._mGenUIFuncs.generateColorByAccordion1();


    return [rowgb,rowcb];
}

//first funciton called to create tab
interfaceUtils.generateDataTabUI = function(csvheader){

    interfaceUtils._mGenUIFuncs.generateUUID();
    generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;

    divpane=interfaceUtils._mGenUIFuncs.generateTab();
    accordion=interfaceUtils._mGenUIFuncs.generateAccordion();
    accordioncontents=accordion.contents;

    divpane.appendChild(accordion.divaccordion);
    
    //1.0
    tabs1content=interfaceUtils.getElementById("level-1-tabsContent");
    if(tabs1content) tabs1content.appendChild(divpane);
    else { console.log("No level 1 tab conent"); return;}
    
    //now that the 3 accordion items are created, fill tehm and 
    //add all to the corresponding main data tab

    item1rows=interfaceUtils._mGenUIFuncs.generateAccordionItem1();
    item1rows.forEach(row => accordioncontents[0].appendChild(row))

    item2rows=interfaceUtils._mGenUIFuncs.generateAccordionItem2();
    item2rows.forEach(row => accordioncontents[1].appendChild(row))
    
}


interfaceUtils.fillColorMaps = function(uid){
    input=null;
    if(uid) input=interfaceUtils.getElementById(uid+"_cb-cmap-value");
    else {
        generated=interfaceUtils._mGenUIFuncs.ctx.aUUID;
        input=interfaceUtils.getElementById(generated+"_cb-cmap-value");
    }
    for(cm in dataUtils._d3LUTs){
        val=dataUtils._d3LUTs[cm]
        opt = HTMLElementUtils.createElement({"kind":"option","value":val});
        opt.innerHTML=val.replace("interpolate","");
        input.appendChild(opt);
    }

}
