from pyparsing import OneOrMore, nestedExpr
from pyparsing.results import ParseResults
import random
import pandas as pd
import json
import os

class Node():
    def __init__(self, name) -> None:
        self.output = None
        self.name = name
        self.leftChild = None
        self.rightChild = None
        self.operatorsMapping = None
        self.leafNodeNum = 0
        self.valueList = []
    
    def setOperators(self, operatorMapping: dict):
        self.operatorsMapping = operatorMapping
    
    def setValue(self, value):
        self.output = value
    
    def setLeftChild(self, leftChild):
        self.leftChild = leftChild
    
    def setRightChild(self, rightChild):
        self.rightChild = rightChild
    
    def printTree(self, node):
        print(node.name, node.output)
        if node.leftChild is not None:
            self.printTree(node.leftChild)
        if node.rightChild is not None:
            self.printTree(node.rightChild)

    def calculateOutputValue(self, node):
        """
            Calculate the output value of nodes
        """
        if node.name in self.operatorsMapping.keys():
            node.leftChild.setOperators(self.operatorsMapping)
            node.rightChild.setOperators(self.operatorsMapping)
            self.calculateOutputValue(node.leftChild)
            self.calculateOutputValue(node.rightChild)
            node.output = self.operatorsMapping[node.name](node.leftChild.output , node.rightChild.output)
            self.valueList.append(node.output)
            return node.output
        else:
            self.valueList.append(node.output)
            return node.output

    
    def constructJson(self, node):
        node_dict = dict()
        node_dict['name'] = node.name
        node_dict['output'] = node.output
        node_dict['rank'] = self._queryRank(node.output)
        if node.leftChild is not None and node.rightChild is not None:
            node_dict['children'] = []
            node_dict['children'].append(self.constructJson(node.leftChild))
            node_dict['children'].append(self.constructJson(node.rightChild))
        
        return node_dict
    
    def _queryRank(self, value):
        self.valueList.sort(reverse = False)
        for i, num in enumerate(self.valueList):
            if num == value:
                return i

    

    def updateLeafNodeNum(self, node):
        if node.leftChild is not None:
            self.updateLeafNodeNum(node.leftChild)
        
        if node.rightChild is not None:
            self.updateLeafNodeNum(node.rightChild)
        
        if node.leftChild is None and node.rightChild is None:
            self.leafNodeNum += 1
        
        return self.leafNodeNum
        


class S_Parser():
    def __init__(self, operators: list, terminals: list):
        self.operators = operators
        self.terminals = terminals
        self.terminalValues = None

    def parsing(self, exp: str):
        """
            parsing S-expression directly from exp and generate random importances for nodes
        """
        total_leaf_nodes = 0
        generated_exp = self._breakdown(exp)
        return self._constructJson(generated_exp, total_leaf_nodes)

    def setTerminalValues(self, terminalValues: dict):
        self.terminalValues = terminalValues

    def setOperators(self, operatorMapping: dict):
        self.operatorMapping = operatorMapping

    def calculateOutputValue(self, node) -> float:
        return node.calculateOutputValue(node)
    
    def constructTree(self, exp: str) -> Node:
        generated_exp = self._breakdown(exp)
        tree = self._constructTree(generated_exp)
        tree.setOperators(self.operatorMapping)
        return tree
    
    def constructJsonFromTree(self, node):
        return node.constructJson(node)

    def calculateLeafNodeNum(self, node):
        return node.updateLeafNodeNum(node)

    def _constructTree(self, exp) -> Node:
        """
            Construct a tree using the breakdown list
        """
        # print(exp, '---')
        if exp[0] in self.operators:
            node = Node(exp[0])
            node.setLeftChild(self._constructTree(exp[1]))
            node.setRightChild(self._constructTree(exp[2]))
        elif exp in self.terminals:
            node = Node(exp)
            node.setValue(self.terminalValues[exp])
        else:
            node = Node(exp)
            node.setValue(float(exp))
        
        return node

    def _breakdown(self, exp: str):
        """
            break down the string into list
        """
        data = OneOrMore(nestedExpr()).parseString(exp)
        return data[0]

    def _constructJson(self, exp: list, total_leaf_nodes: int) -> dict:
        """
            Construct a json file using the breakdown list
        """
        parsed = {}
        if len(exp) > 2:
            parsed['children'] = []
        
        for element in exp:
            if isinstance(element, ParseResults):
                # recursively construct Json/dict using the sub lists
                parsed_sub_exp, total_leaf_nodes = self._constructJson(element, total_leaf_nodes)
                parsed['children'].append(parsed_sub_exp)
            else:
                if element in self.operators:
                    parsed['name'] = element
                    # temporarily generate a random number for the output
                    parsed['output'] = random.random()

                else:
                    total_leaf_nodes += 1
                    node = {'name': element, 'output': random.random()}
                    parsed['children'].append(node)
        return parsed, total_leaf_nodes
    
    def _calculate() -> float:
        pass

def addition(a, b):
    return a + b

def divSafe(a, b):
    if b != 0:
        return a / b
    else:
        return 1

def max(a, b):
    if a >= b:
        return a
    else:
        return b

def min(a, b):
    if a <= b:
        return a
    else:
        return b

def multiply(a, b):
    return a * b

def sub(a, b):
    return a - b


if __name__ == '__main__':
    dataFile = {}
    operatorsMapping = {
        '+': addition,
        '-': sub,
        '*': multiply,
        '/': divSafe,
        'min': min,
        'max': max
    }


    equationDataFile = open('./static/json/eq2Data/sample.json')
    eqData = json.load(equationDataFile)
    # print(eqData)

    equationFile = open('./static/json/eq2Data/eq2.json')
    eq = json.load(equationFile)
    equation = eq['equation']
    operators = eq['operators']
    terminals = eq['terminals']
    parser = S_Parser(operators, terminals)
    parser.setOperators(operatorsMapping)

    dataList = []
    maxDecisionSituations = (eqData[-1]['DecisionSituationN'] + 1)
    for i in range(maxDecisionSituations):
        subList = []
        for data in eqData:
            if data['DecisionSituationN'] == i:
                subList.append(data)

        dataList.append(subList)

    outputData = []
    for subList in dataList:
        for index, data in enumerate(subList):
            if data['selectedRow'] == 'true':
                outputData.append(data)
            if data['selectedRow'] == 'false' and index == (len(subList) - 1):
                outputData.append(data)

    # print(outputData)
    treeList = []
    for data in outputData:
        parser.setTerminalValues(data)
        tree = parser.constructTree(equation)
        parser.calculateOutputValue(tree)
        treeJsonFormat = parser.constructJsonFromTree(tree)
        treeList.append(treeJsonFormat)

    # print(len(treeList))
    dataFile['num_of_leaf_nodes'] = parser.calculateLeafNodeNum(tree)
    dataFile['dataList'] = treeList


    # for data in eqData:
    #     parser.setTerminalValues(data)
    #     tree = parser.constructTree(equation)
    #     parser.calculateOutputValue(tree)
    #     treeJsonFormat = parser.constructJsonFromTree(tree)
    #     dataList.append(treeJsonFormat)

    # dataFile['num_of_leaf_nodes'] = parser.calculateLeafNodeNum(tree)
    # dataFile['dataList'] = dataList
    

    with open('./static/json/eq2Data/eq2_data.json', 'w') as outfile:
        json.dump(dataFile, outfile)

