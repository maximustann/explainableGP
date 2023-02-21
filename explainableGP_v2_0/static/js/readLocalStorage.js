
if(localStorage.getItem('gpTreeData') != null) {
    gpTreeData = JSON.parse(localStorage.getItem('gpTreeData'))
    total_leaf_nodes = JSON.parse(localStorage.getItem('total_leaf_nodes'))
    // totalData = JSON.parse(localStorage.getItem('totalData'))
}



// const s_expression = totalData.previous_s_expression
// const terminals = totalData.previous_terminals
// const operators = totalData.previous_operators


// document.forms['gpTree']['s_expression'].setAttribute('value', s_expression)
// document.forms['gpTree']['terminals'].setAttribute('value', terminals)
// document.forms['gpTree']['operators'].setAttribute('value', operators)