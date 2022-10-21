/*!
 * Start Bootstrap - SB Admin v7.0.5 (https://startbootstrap.com/template/sb-admin)
 * Copyright 2013-2022 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
 */
//
// Scripts
//
window.addEventListener("DOMContentLoaded", (event) => {
  // Toggle the side navigation
  const sidebarToggle = document.body.querySelector("#sidebarToggle");
  if (sidebarToggle) {
    // Uncomment Below to persist sidebar toggle between refreshes
    // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
    //     document.body.classList.toggle('sb-sidenav-toggled');
    // }
    sidebarToggle.addEventListener("click", (event) => {
      event.preventDefault();
      document.body.classList.toggle("sb-sidenav-toggled");
      localStorage.setItem(
        "sb|sidebar-toggle",
        document.body.classList.contains("sb-sidenav-toggled")
      );
    });
  }
});

// store the values in the browser's memory
function storeTableValue() {
  localStorage.setItem("gpTreeData", JSON.stringify(gpTreeData));
  localStorage.setItem("total_leaf_nodes", JSON.stringify(total_leaf_nodes));
  localStorage.setItem("totalData", JSON.stringify(totalData));
}

function previousSituation() {
  decisionSituationN = JSON.parse(localStorage.getItem("decisionSituationN"));
  console.log("previous decision" + decisionSituationN)
  if (decisionSituationN !== 0) {
    decisionSituationN -= 1;
    localStorage.setItem("decisionSituationN", decisionSituationN);
  }
}

function nextSituation() {
  decisionSituationN = JSON.parse(localStorage.getItem("decisionSituationN"));
  maxDecisionSituationN = JSON.parse(
    localStorage.getItem("maxDecisionSituation")
  );

  if (decisionSituationN !== maxDecisionSituationN) {
    decisionSituationN += 1;
    localStorage.setItem("decisionSituationN", decisionSituationN);
  }
}

function loadTable() {
  $(document).ready(function () {
    decisionSituationN = JSON.parse(localStorage.getItem("decisionSituationN"));
    if (decisionSituationN == null) {
      decisionSituationN = 0;
    }

    var rows = [];
    for (var i = 0; i < tableData.length; i++) {
      if (tableData[i]["DecisionSituationN"] == decisionSituationN) {
        rows.push(tableData[i]);
      }
    }

    var $table = $("#table");
    $table.bootstrapTable("load", rows);

    $("td").filter(function(){
        return $(this).text() == "true";
    }).parent('tr').addClass('table-info')

  });
}

function calDecisionSituation(tableData) {
  maxDecisionSituation = tableData[tableData.length - 1]["DecisionSituationN"];
  localStorage.setItem("maxDecisionSituation", maxDecisionSituation);
}

function findDecisionRow(tableData, allGpTree){
    decisionSituationN = JSON.parse(localStorage.getItem("decisionSituationN"));
    var rows = [];

    counter = 0
    while(tableData[counter]["DecisionSituationN"] != decisionSituationN){
        counter++;
    }

    for(var i = counter; i < tableData.length; i++){
        if (tableData[i]["DecisionSituationN"] == decisionSituationN) {
             rows.push(tableData[i])
        }
    }


    for (var i = 0; i < rows.length; i++){
        if(rows[i]['selectedRow'] == 'true'){
            return allGpTree[counter]
        } else{
            counter++
        }
    }
}
