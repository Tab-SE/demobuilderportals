// This script contains all the Tableau JavaScript API calls needed
// The reference manual can be found here - https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_ref.htm
// The JS API Tutorial can be found here - https://help.tableau.com/samples/en-us/js_api/tutorial.htm
var viz,workbook, activeSheet, options, placeholderDiv,selectedMarks,askindex=-1;

function loadVizInit () {
  // This function kicks off the process
  initialize();
  setViewMenuVisibility();
  if(getLastPageload()==null){
    loadVizByIndex(setViewMenuVisibility());
  }
  else{
    loadVizByIndex(getLastPageload());
  }
}
function loadVizByIndex (index,force,device ="") {
  // This function simply loads each dashboard
  // If all from the same workbook we can use activateSheetAsync() and method of the workbook class
  // https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_ref.htm#workbook_class
  // If from different workbooks we need to reload the new viz from scratch 
  var url = tab_server[index];
  if(url=="")
    return;
  hideEditAskButton();
  hideActionButton();
  var isSameWorkbook=false;
  if(workbook && !force && askindex==-1){
    var sheets = workbook.getPublishedSheetsInfo();
    sheets.map((sh)=>{
      if(sh.getUrl()==url){
        navigateToSheet(workbook,sh.getName(),index);
        isSameWorkbook=true;
      }
    })
  }
  if(!isSameWorkbook){
    placeholderDiv = document.getElementById("tableauViz");
    options = {device:device,width: '100%',height: '100%',hideTabs: true,hideToolbar: true,showShareOptions: false,
        onFirstInteractive: function () {
          workbook = viz.getWorkbook();
          activeSheet = workbook.getActiveSheet();
          getFiltersForViz(index);
          getParametersForViz(index);
          showWebEditIfExist(index);
          showActionIfExist(index);
          showAskButtonIfExist(index);
          viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, onMarksSelection);
        }
    }
    if(url){
      loadViz(placeholderDiv, url, options);
      storeLastPageload(index);
    }
  }
  askindex=-1;
}
function loadViz (placeholderDiv, url, options) {
  // https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_concepts_initializing.htm
  if(viz)
    viz.dispose();
  viz = new tableau.Viz(placeholderDiv, url, options);
  clearFiltersMenu();
}
function launchAsk(){
  // This switches between view mode and Ask Data mode
  if(askindex!=-1){
    loadVizByIndex(askindex,true);
    askindex=-1;
    return;
  }
  var containerDiv = document.getElementById("tableauViz");
  hideEditButton()
  var ask_options = {width: '100%',height: '100%',
  };
  viz.getCurrentUrlAsync().then(function(current_url){
    var indexv=tab_server.indexOf(current_url.split("?")[0]);
    askindex=indexv;
    loadViz (containerDiv, tab_ask[getElementIndexByIndex(tab_ask,indexv)].val, ask_options);    
  })
  
}
function launchEdit() {
  // When embedding Web Edit this is the technique used - https://medium.com/@kannanmadhav/embedding-tableau-web-edit-in-a-web-application-246ff53eee76
  var containerDiv = document.getElementById("tableauViz");
  viz.getCurrentUrlAsync().then(function(current_url){
    hideEditAskButton()
    edit_url = current_url.split('?')[0].replace('/views', '/authoring');                  
    edit_options = {hideTabs: true,hideToolbar: true,width: '100%',height: '100%',
      onFirstInteractive: function () {
          var iframe = document.querySelectorAll('iframe')[0];
          iframe.onload = function(){
            getIndexFromViz(viz).then (function(index){
              loadVizByIndex(index,true)
            })
          }
      }
    };
    loadViz (containerDiv, edit_url, edit_options);          
  })
}
function launchAction(){
  // Obtaining data from a Tableau dashboard via event listers 
  // This is an example of getting data from selected marks 
  // https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_concepts_events.htm
  if(!selectedMarks){
    window.open('http://google.com/search?q=There is no selection :-)');
    return;
  }
  var textOnly=getOnlyText(selectedMarks,[]);
  if(textOnly.length==0)
    window.open('http://google.com/search?q=There are no text values in your selection :-)');
  if(lengthInUtf8Bytes(textOnly.join(" "))<1024)
    window.open('http://google.com/search?q='+encodeURIComponent(textOnly.join(" ")));
  else
    window.open('http://google.com/search?q='+"Too many elements in your selection :-) Please reduce !");  
}
function onMarksSelection(marksEvent) {
  getIndexFromViz(viz).then (function(index){
    if(findElement(tab_action,index) && findElement(tab_action,index).val=="true")
      return marksEvent.getMarksAsync().then(reportSelectedMarks,(err)=>{alert("You don't have right to download data thus not able to see marks. Uncheck 'Actions' in the view settings")});
  })
}
function reportSelectedMarks(marks) {
  var curmarks = marks;
  selectedMarks=[];
  for (var markIndex = 0; markIndex < curmarks.length; markIndex++) {
    var pairs = curmarks[markIndex].getPairs();
    for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
        var pair = pairs[pairIndex]; 
        selectedMarks.push(pair.value)
    }
  }
}
function applyFilter(filterName,value) {
  // Filtering from the web page, pushing values into Tableau
  // https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_concepts_filtering.htm
  if(activeSheet.getSheetType()==tableau.SheetType.DASHBOARD)
    activeSheet.getWorksheets().map((ws)=>{
      ws.applyFilterAsync(filterName,value,tableau.FilterUpdateType.REPLACE);
    })
  else{
    activeSheet.applyFilterAsync(filterName,value,tableau.FilterUpdateType.REPLACE);
  }  
  hideDropDownList(filterName);
}
function resetViz() {
  // Action to rever the viz back to initial state 
  // Method of the viz class https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_ref.htm#viz_class 
  viz.revertAllAsync();
}
function dataDownload() {
  // Action to rever the viz back to initial state 
  // Method of the viz class https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_ref.htm#viz_class 
  viz.showExportDataDialog();
}
function applyParam(paramName,value) {
  // Same concept as filtering
  // https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_ref.htm#changeParameterValueAsync
  workbook.changeParameterValueAsync(paramName, value)
  hideDropDownList(paramName);
}

