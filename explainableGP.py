from flask import Flask, request, render_template
# from flask_bootstrap import Bootstrap
from parser import S_Parser
import sys
import json
app = Flask(__name__)
# Bootstrap(app)

@app.route('/', methods =['POST', 'GET'])
def home():
    equationFile = open('./static/json/eq2Data/eq2.json')
    dataFile = open('./static/json/eq2Data/eq2_data.json')
    mapFile = open('./static/json/eq2Data/viz2.json')
    tableFile = open('./static/json/eq2Data/sample.json')
    pathFile = open('./static/json/eq2Data/pathE.json')
    bindFile = open('./static/json/eq2Data/bind.json')
    pathData = json.load(pathFile)
    tableData = json.load(tableFile)
    eq = json.load(equationFile)
    eq1Data = json.load(dataFile)
    mapData = json.load(mapFile)
    bindData = json.load(bindFile)
    equation = eq['equation']
    operators = eq['operators']
    terminals = eq['terminals']
    total_leaf_nodes = eq1Data['num_of_leaf_nodes']
    return render_template('index.html', 
                                    totalData = 
                                        {
                                            "pathData": pathData,
                                            "tableData": tableData,
                                            "tree": eq1Data['dataList'], 
                                            "total_leaf_nodes": total_leaf_nodes, 
                                            'previous_s_expression': equation,
                                            'previous_terminals': terminals,
                                            'previous_operators': operators,
                                            'mapData': mapData,
                                            'bindData': bindData
                                            })


@app.route('/heuristic_tree_view', methods=['POST', 'GET'])
def heuristic_tree_view():
    # default values
    terminal = 'a,b'
    operator = '+'
    default_s_expression = '(+ a b)'
    terminal_set = parse_terminals(terminal)
    operator_set = parse_operators(operator)
    parser = S_Parser(operator_set, terminal_set)
    jsonFile, total_leaf_nodes = parser.parsing(default_s_expression)
    if request.method == "POST":
        terminal_set = parse_terminals(request.form['terminals'])
        operator_set = parse_operators(request.form['operators'])
        parser = S_Parser(operator_set, terminal_set)
        jsonFile, total_leaf_nodes = parser.parsing(request.form['s_expression'])
        return render_template('heuristic_tree_view.html', 
                                    gpTreeData = 
                                        {
                                            "tree": jsonFile, 
                                            "total_leaf_nodes": total_leaf_nodes, 
                                            'previous_s_expression': request.form['s_expression'],
                                            'previous_terminals': request.form['terminals'],
                                            'previous_operators': request.form['operators']
                                            })
    return render_template('heuristic_tree_view.html', 
                                    gpTreeData = 
                                        {
                                            "tree": jsonFile, 
                                            "total_leaf_nodes": total_leaf_nodes, 
                                            'previous_s_expression': default_s_expression,
                                            'previous_terminals': terminal,
                                            'previous_operators': operator

                                            })

@app.route('/second_visualization')
def secondView():
    return render_template('second_visualization.html')

@app.route('/third_visualization')
def thirdView():
    return render_template('third_visualization.html')

@app.route('/fourth_visualization')
def fourthView():
    return render_template('fourth_visualization.html')

def parse_terminals(terminals):
    terminal_set = set(terminals.split(','))
    return terminal_set

def parse_operators(operators):
    operator_set = set(operators.split(','))
    return operator_set

if __name__ == '__main__':
    app.run(debug = True)
