// YOU DON'T NEED TO WORRY ABOUT THIS 
//Few explaination on each
var layout="";
window.onresize = function(e){
  var wd=document.querySelector('body').clientWidth;
  if(wd<800 && layout!="phone"){
    layout="phone";
    viz.getCurrentUrlAsync().then (function(current_url){
      var index=tab_server.indexOf(current_url.split("?")[0]);
      loadVizByIndex(index,true,layout);
    })
  }
  if(wd>=800 && layout!=""){
    layout="";
    viz.getCurrentUrlAsync().then (function(current_url){
      var index=tab_server.indexOf(current_url.split("?")[0]);
      loadVizByIndex(index,true,layout);
    })
  }
};
function showFilterBox(el){
  document.querySelector(`div[mid='${el}']`).classList.toggle("show");
  document.querySelectorAll(`.dropdown-content`).forEach((dd)=>{if(dd.getAttribute("mid")!=el)dd.classList.remove("show")});
}
function populateFilterMenu(fil){
  var links="";
  if(fil.getAppliedValues()==null){
    console.log("this filter as no applied values :"+fil.getFieldName());
    return;
  }
  fil.getAppliedValues().map((val)=>{
    var found=false;
    document.querySelectorAll(`[filName="${fil.getFieldName()}"]`).forEach((el)=>{
      console.log();
      if(el.text==val.value.toString())
        found=true;
    })
    if(!found ){
      links+=`<a filName="${fil.getFieldName()}" href="#" class="filter-entry" onclick="applyFilter('${fil.getFieldName()}','${val.value}')">${val.value}</a>`;
    }
  })
  var list=`
  <span class="filter_dropdown">
    <a onclick="showFilterBox('${fil.getFieldName()}')" href="#"><i class="fa fa-filter"></i><div id="Filter-text-${fil.getFieldName()}" class="editable">${fil.getFieldName()}</div></a>
    <div mid="${fil.getFieldName()}" class="dropdown-content">
    ${links}
    </div>
  </span>`
  if(document.querySelector(`div[mid='${fil.getFieldName()}']`)==null){
    document.getElementsByClassName("filter-container")[0].innerHTML=list+document.getElementsByClassName("filter-container")[0].innerHTML;
  }
  else{
    document.querySelector(`div[mid='${fil.getFieldName()}']`).innerHTML+=links;
  }
}
function populateParameterMenu(param){
  var links="";
  if(param.getAllowableValues()==null){
    console.log("this param as no allowable values :"+param.getName());
    return;
  }
  param.getAllowableValues().map((val)=>{
    var found=false;
    document.querySelectorAll(`[paramName="${param.getName()}"]`).forEach((el)=>{
      if(el.text==val.value)
        found=true;
    })
    if(!found ){
      links+=`<a paramName="${param.getName()}" href="#" class="filter-entry" onclick="applyParam('${param.getName()}','${val.value}')">${val.value}</a>`;
    }
  })
  var list=`
  <span class="filter_dropdown">
  <a onclick="showFilterBox('${param.getName()}')" href="#"><i class="fa fa-filter"></i><div id="Filter-text-${param.getName()}" class="editable">${param.getName()}</div></a>
    <div mid="${param.getName()}" class="dropdown-content">
    ${links}
    </div>
  </span>`
  if(document.querySelector(`div[mid='${param.getName()}']`)==null){
    document.getElementsByClassName("filter-container")[0].innerHTML=list+document.getElementsByClassName("filter-container")[0].innerHTML;
  }
  else{
    document.querySelector(`div[mid='${param.getName()}']`).innerHTML+=links;
  }
}
function getParametersForViz(index){
  workbook.getParametersAsync().then((current_param)=>{
    if(typeof(tab_all_params)!="undefined")tab_all_params[index]={parameters:current_param,viz:viz};
    current_param.map((f)=>{
      tab_param[index].map((cf)=>{
        if(cf==f.getName()){
          populateParameterMenu(f);
        }
      })
    })
    window.parent.restoreTexts();
  })
}
function getFiltersForViz(index){
  activeSheet.getFiltersAsync().then((current_filter)=>{
    if(typeof(tab_all_filters)!="undefined") {
      tab_all_filters[index].filters=[];
      current_filter.map((fl)=>{
        var found=false;
        tab_all_filters[index].filters.map(tb=>{
          if(tb.getFieldName()==fl.getFieldName())
            found=true;
        })
        if(found==false)
          tab_all_filters[index].filters.push(fl)

      })
      tab_all_filters[index].viz=viz;
    }
    current_filter.map((f)=>{
      tab_filter[index].map((cf)=>{
        if(cf==f.getFieldName()){
          populateFilterMenu(f);
        }
      })
    })
    window.parent.restoreTexts();
  })
}
function hideDropDownList(filterName){
  document.querySelector(`div[mid='${filterName}']`).classList.remove("show")
}
function hideEditAskButton(){
  document.getElementsByClassName("webedit")[0].style.display = "none";
  document.getElementsByClassName("askdata")[0].style.display = "none";
}
function hideEditButton(){
  document.getElementsByClassName("webedit")[0].style.display = "none";
}
function hideActionButton(){
  document.getElementsByClassName("action")[0].style.display = "none";
}
function showActionIfExist(index){
  var ids;
  tab_action.map((el,id)=>{
    if(el.key==String(index))
      ids=el;
  })
  if(ids && ids.val && ids.val=="true")
    document.getElementsByClassName("action")[0].style.display = "inline-flex";
}
function showWebEditIfExist(index){
  var ids;
  tab_web.map((el,id)=>{
    if(el.key==String(index))
      ids=el;
  })
  if(ids && ids.val && ids.val=="true")
    document.getElementsByClassName("webedit")[0].style.display = "inline-flex";
}
function showAskButtonIfExist(index){
  var ids;
  tab_ask.map((el,id)=>{
    if(el.key==String(index))
      ids=el;
  })
  if(ids && ids.val && ids.val!=""){
    document.getElementsByClassName("askdata")[0].style.display = "inline-flex";
  }
}
function getElementIndexByIndex(arr,index){
  var ids=-1;
  arr.map((el,id)=>{
    if(el.key==String(index))
      ids=id;
  })
  return ids
}
function navigateToSheet(workbook,sheetName,index){
  workbook.activateSheetAsync(sheetName).then(()=>{
    activeSheet=workbook.getActiveSheet();  
    const removeElements = (elms) => elms.forEach(el => el.remove());
    removeElements( document.querySelectorAll(".filter_dropdown") );
    getFiltersForViz(index);
    getParametersForViz(index);
    showWebEditIfExist(index);
    showActionIfExist(index);
    showAskButtonIfExist(index);
    // viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, onMarksSelection);
  });
}
function getOnlyText(from, to){
  from.map((el)=>{
    if(isNaN(el) && !/^(\d+|(\.\d+))(\.\d+)?%$/.test(el)){
      if(!to.includes(el))
        to.push(el);
    }
  })
  return to;
}
function clearFiltersMenu(){
  const removeElements = (elms) => elms.forEach(el => el.remove());
  removeElements( document.querySelectorAll(".filter_dropdown") );
}
function restoreImgs(){
  tab_img.map((el)=>{
    if(document.getElementById(el.key))
      document.getElementById(el.key).setAttribute('src',el.val);
  })
}
function restoreTexts(){
  tab_text.map((el)=>{
    if(document.getElementById(el.key))
      document.getElementById(el.key).innerHTML=decodeURIComponent(el.val);
  })
}
function lengthInUtf8Bytes(str) {
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}
function setViewMenuVisibility(){
  var firstIndex=[];
  tab_server.map((s,ind)=>{
    if(s==""){
      document.querySelector(`.viz[index='${ind+1}']`).style.display='none';
    }
    else{
      document.querySelector(`.viz[index='${ind+1}']`).style.display='inline-flex';
      firstIndex.push(ind);
    }
  })
  var lower=1000;
  firstIndex.map((el)=>{
    lower=Math.min(lower,el)
  })
  return lower;
}
function storeLastPageload(index){
  localStorage.setItem("lastpageloaded-grid",index);
}
function getLastPageload(index){
  var id=localStorage.getItem("lastpageloaded-grid");
  if(id!=null)
    return parseInt(id);
  return null;  

}
function getIndexFromViz(viz){
  return new Promise((resolve,reject)=>{
    viz.getCurrentUrlAsync().then (function(current_url){
      var index=tab_server.findIndex(element => element.includes(current_url.split("?")[0]));
      resolve(index);
    })
  })
}
function findElement(arr,keyVal){
  var found = arr.filter(function(item) { return item.key === keyVal.toString(); });
  return found[0] || null;
}
function initialize(){
  if(typeof(tab_img)!="undefined"){
    restoreImgs();
    restoreTexts();
    if(title_index) 
      document.querySelector("head title").text=title_index;
  }
}