var viz,workbook, activeSheet, options, placeholderDiv,selectedMarks,askindex=-1;

function loadVizInit () {
  initialize();
  var firstIndex=setViewMenuVisibility();
  loadVizByIndex(firstIndex);
}
function loadVizByIndex (index,force,device ="") {
  var url = tab_server[index];
  if(url=="")
    return;
  hideEditAskButton();
  hideActionButton();
  var isSameWorkbook=false;
  if(workbook && !force){
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
    if(url)
      loadViz(placeholderDiv, url, options);
  }
}
function loadViz (placeholderDiv, url, options) {
  if(viz)
    viz.dispose();
  viz = new tableau.Viz(placeholderDiv, url, options);
  clearFiltersMenu();
}
function launchAsk(){
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
  var containerDiv = document.getElementById("tableauViz");
  viz.getCurrentUrlAsync().then(function(current_url){
    hideEditAskButton()
    edit_url = current_url.split('?')[0].replace('/views', '/authoring');                  
    edit_options = {hideTabs: true,hideToolbar: true,width: '100%',height: '100%',
      onFirstInteractive: function () {
          var iframe = document.querySelectorAll('iframe')[0];
          iframe.onload = function(){
              viz.getCurrentUrlAsync().then (function(current_url){
                var index=tab_server.indexOf(current_url.split("?")[0]);
                loadVizByIndex(index,true)
              })
          }
      }
    };
    loadViz (containerDiv, edit_url, edit_options);          
  })
}
function launchAction(){
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
    return marksEvent.getMarksAsync().then(reportSelectedMarks);
}
function reportSelectedMarks(marks) {
  var curmarks = marks;
  selectedMarks=[];
  for (var markIndex = 0; markIndex < curmarks.length; markIndex++) {
    var pairs = curmarks[markIndex].getPairs();
    for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
        var pair = pairs[pairIndex]; 
        selectedMarks.push(pair.formattedValue)
    }
  }
}
function applyFilter(filterName,value) {
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
  viz.revertAllAsync();
}
function dataDownload() {
  viz.showExportDataDialog();
}
function saveView() {
  viz.showCustomViewsDialog();
}
function applyParam(paramName,value) {
  workbook.changeParameterValueAsync(paramName, value)
  hideDropDownList(paramName);
}

