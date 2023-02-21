class RouteMap {
  constructor(mapData, pathData, bindData, divValue, divWidth, divHeight) {
    this.mapData = mapData;
    this.pathData = pathData;
    this.bindData = bindData;
    this.divValue = divValue;
    this.divWidth = divWidth;
    this.divHeight = divHeight;
    this.path = 0;
    this.edge = 0;
    this.capacityRemaining = 100;
    this.decisionSituation = 0;

    // calculate the max X and Y
    const maxValues = this.calculateMax();
    this.maxX = maxValues[0];
    this.maxY = maxValues[1];

    // define the margins, canvas width and height
    this.margin = 30;
    this.width = this.divWidth - this.margin - this.margin;
    this.height = 500 - this.margin - this.margin;

    this.widthScaler = d3
      .scaleLinear()
      .domain([0, this.maxX])
      .range([this.margin, this.width - this.margin]);

    this.heightScaler = d3
      .scaleLinear()
      .domain([0, this.maxY])
      .range([this.margin, this.height - this.margin * 2]);

    this.barScaler = d3.scaleLinear().domain([0, 1]).range([0, RouteMap.CAPACITYBARLENGTH]);
  }

  // The following functions return static values
  static get DEPOT() {
    return 1;
  }

  static get TASK() {
    return 0;
  }

  static get NONTASK() {
    return 1;
  }

  static get TASKNOTSERVED() {
    return 2;
  }

  static get PASS() {
    return 3;
  }

  static get SERVED() {
    return 0;
  }

  static get OFFSET() {
    return 20;
  }
  
  static get CIRCLE(){
    return 5;
  }

  static get CAPACITYBARLENGTH(){
    return 15;
  }

  static get TASKCOLOR() {
    return "red";
  }

  static get NONTASKCOLOR() {
    return "blue";
  }
  static get SERVEDCOLOR() {
    return "Chartreuse";
  }

  static get TRUCKWIDTH(){
    return 20;
  }

  static get TRUCKHEIGHT(){
    return 20;
  }

  // draw map
  drawMap() {
    const margin = this.margin;
    const maxY = this.maxY;
    var widthScaler = this.widthScaler;
    var heightScaler = this.heightScaler;
    var barScaler = this.barScaler;
    var currentBindData = this.bindData[this.decisionSituation]
    this.svg = d3
      .select("#Map")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("name", "map");

    this.div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    this.g = this.svg.append("g");

    // set up the zoom-in ability
    // const handleZoom = (e) => this.g.attr("transform", e.transform);
    // const zoom = d3.zoom().on("zoom", handleZoom);
    // d3.select("#Map").call(zoom);

    this.links = this.mapData.links.map((l) => {
      const source = this.mapData.nodes.find((n) => n.id === l.source);
      const target = this.mapData.nodes.find((n) => n.id === l.target);
      const task = l.task;
      return { source, target, task };
    });



    // add property to the links
    for (let link of this.links) {
      for (let bind of currentBindData) {
        if (
          link.task == RouteMap.TASK &&
          link.source.id == bind.source &&
          link.target.id == bind.target ||
          link.source.id == bind.target &&
          link.target.id == bind.source
        ) {
          // console.log(link.source.id, link.target.id, bind['RQ'])
          link["property"] = bind;
          link["RQ"] = bind["RQ"];
          // console.log(link['RQ'])
          link["Capacity"] = 1;
        }  else if(link.task == RouteMap.NONTASK){
          link['RQ'] = bind['RQ']
        }
      }
    }

    // draw links
    this.g
      .selectAll("line.link")
      // .data(this.links, (d) => `${d.source.id}-${d.target.id}`)
      .data(this.links)
      .enter()
      .append("line")
      .classed("link", true)
      .attr("x1", (d) => this.widthScaler(d.source.x))
      .attr("x2", (d) => this.widthScaler(d.target.x))
      .attr("y1", (d) => this.heightScaler(d.source.y))
      .attr("y2", (d) => this.heightScaler(d.target.y))
      .attr("source_id", (d) => d.source.id)
      .attr("target_id", (d) => d.target.id)
      .style("stroke-width", 2)
      .style("stroke", function (d) {
        if (d.task == RouteMap.TASK) {
          return RouteMap.TASKCOLOR;
        } else if (d.task == RouteMap.NONTASK) {
          return RouteMap.NONTASKCOLOR;
        } else {
          return RouteMap.SERVEDCOLOR;
        }
      })
      .on("mouseover", function (d) {
        d3.select(this).transition().duration(200).style("stroke-width", 10);
        // if the path is not a task, then the tooltip will not show up
        if (d.srcElement.__data__.property != undefined) {
          d3.select(".tooltip")
            .style("opacity", 0.9)
            .html(RouteMap.pretty(d.srcElement.__data__.property))
            .style("left", d.pageX + "px")
            .style("top", d.pageY - margin + "px");
        }
      })
      .on("mouseout", function (d) {
        d3.select(this).transition().duration(200).style("stroke-width", 2);
        d3.select(".tooltip").style("opacity", 0);
      });

    // add nodes to each point
    this.nodes = this.g
      .selectAll("g.node")
      .data(this.mapData.nodes, (d) => d.id)
      .enter()
      .append("g")
      .classed("node", true)
      .attr(
        "transform",
        (d) => `translate(${this.widthScaler(d.x)},${this.heightScaler(d.y)})`
      );

    // add circles to nodes
    this.nodes
      .append("circle")
      .attr("r", RouteMap.CIRCLE)
      .style("fill", function (d) {
        if (d.depot == true) {
          return "green";
        } else {
          return "blue";
        }
      });

    // initial point is the starting point of the truck, usually from depot
    const initialPoint = this.pathData[this.path][this.edge];
    // console.log(this.links)
    const initialPosition = this.findSouceTarget(
      this.links,
      initialPoint.source,
      initialPoint.target
    );



    var capacityData = [this.capacityRemaining, 0];
    this.capacity = this.svg
      .append("g")
      .attr("class", "capacity")
      .attr(
        "transform",
        "translate(" +
          (this.widthScaler(initialPosition.sourceX) - RouteMap.OFFSET) +
          ", " +
          (this.heightScaler(initialPosition.sourceY) - RouteMap.OFFSET) +
          ")"
      );
    let pie = d3.pie();
    let arc = d3.arc().innerRadius(8).outerRadius(12);

    this.arcs = this.capacity
      .selectAll("arc")
      .data(pie(capacityData))
      .enter()
      .append("g");

    this.arcs
      .append("path")
      .attr("fill", (data, i) => {
        return d3.schemeSet3[i];
      })
      .attr("d", arc);

    this.capacity
      .data(capacityData)
      .append("text")
      .style("font-size", "5px")
      .attr("dy", ".25em")
      .attr("dx", "-1.2em")
      .text(function (d) {
        return d + "%";
      });

    this.nodes
      .append("text")
      .style("font-size", "10px")
      .attr("dy", ".25em")
      .attr("y", -10)
      .attr("x", -15)
      .text(function (d) {
        if (d.depot == true) {
          return "depot";
        } else {
          return d.id;
        }
      });

    const legendData = ["Task", "Non-task", "Served", "Task Not Completed"];

    // add a legend to the Map
    this.legend = this.svg
      .selectAll(".legend")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", function (d, i) {
        return (
          "translate(" +
          (widthScaler(i++) * 1.5 )+ 
          "," +
          (heightScaler(maxY) + margin) +
          ")"
        );
      });
    this.legend
      .append("text")
      .text(function (d) {
        return d;
      })
      .attr("transform", "translate(15, 9)")
      .style("font-size", "10px");

    this.legend
      .append("line")
      .attr("x1", 0)
      .attr("x2", 12)
      .attr("y1", 4)
      .attr("y2", 4)
      .style("stroke-width", 2)
      .style("stroke", function (d) {
        if (d == "Non-task") {
          return RouteMap.NONTASKCOLOR;
        } else if (d == "Served") {
          return RouteMap.SERVEDCOLOR;
        } else {
          return RouteMap.TASKCOLOR;
        }
      })
      .attr("stroke-dasharray", function (d) {
        if (d == "Task Not Completed") {
          return 4;
        }
      });

    let capacityLegend = this.svg
      .append("g")
      .attr("class", "capacityLegend")
      .attr(
        "transform",
        "translate(" +
          widthScaler(legendData.length) * 1.75 +
          "," +
          (heightScaler(maxY) + margin) +
          ")"
      )
      .selectAll("arc")
      .data(pie(capacityData))
      .enter()
      .append("g")
      .append("path")
      .attr("fill", (data, i) => {
        let value = data.data;
        return d3.schemeSet3[i];
      })
      .attr("d", arc);

    this.svg
      .select(".capacityLegend")
      .append("text")
      .style("font-size", "5px")
      .attr("dy", ".25em")
      .attr("dx", "-1.2em")
      .text("100%");

    this.svg
      .select(".capacityLegend")
      .append("text")
      .text("Remaining Capacity")
      .attr("transform", "translate(15, 9)")
      .style("font-size", "10px");

    var bar = this.svg
      .append("g")
      .attr("class", "gb")
      .selectAll("rect")
      .data(this.links)
      .enter()
      .append("rect")
      .attr("width", function (d) {
        if (d.task != RouteMap.TASK) {
          return 0;
        }
        // if the path is horizontal
        if (d.source["x"] != d.target["x"]) {
          return barScaler(1);
        } else {
          return barScaler(0.2);
        }
      })
      .attr("height", function (d) {
        if (d.task != RouteMap.TASK) {
          return 0;
        }
        // if the path is horizontal
        if (d.source["x"] != d.target["x"]) {
          return barScaler(0.2);
        } else {
          return barScaler(1);
        }
      })
      .attr("x", function (d) {
        if (d.task != RouteMap.TASK) {
          return 0;
        }
        // if the path is horizontal
        if (d.source["x"] != d.target["x"]) {
          if (d.source['x'] <= d.target['x']){
            return widthScaler(d.source["x"] + 0.3);
          } else {
            return widthScaler(d.target["x"] + 0.3);
          }
        } else {
          return widthScaler(d.source["x"] + 0.1);
        }
      })
      .attr("y", function (d, i) {
        if (d.task != RouteMap.TASK) {
          return 0;
        }
        // if the path is horizontal
        if (d.source["x"] != d.target["x"]) {
            return heightScaler(d.source["y"] + 0.1);
        } else {
          if (d.source["y"] <= d.target["y"]){
            return heightScaler(d.source["y"] + 0.2);
          } else {
            return heightScaler(d.target["y"] + 0.2);
          }
        }
      })
      .attr("fill", "lightgrey")
      .attr("stroke", "darkgrey")
      .attr("stroke-width", "2px")

    // console.log(this.links)
    this.progress = this.svg
      .append("g")
      .attr("class", "progress")
      .selectAll("rect")
      .data(this.links)
      .enter()
      .append("rect")
      .attr("width", function (d, i) {
        if (d.task != RouteMap.TASK) {
          return 0;
        }
        // if the path is horizontal
        if (d.source["x"] != d.target["x"]) {
          return barScaler(1);
        } else {
          return barScaler(0.2);
        }
      })
      .attr("height", function (d) {
        if (d.task != RouteMap.TASK) {
          return 0;
        }
        // if the path is horizontal
        if (d.source["x"] != d.target["x"]) {
          return barScaler(0.2);
        } else {
          return barScaler(1);
        }
      })
      .attr("x", function (d) {
        if (d.task != RouteMap.TASK) {
          return 0;
        }
        // if the path is horizontal
        if (d.source["x"] != d.target["x"]) {
          if (d.source['x'] <= d.target['x']){
            return widthScaler(d.source["x"] + 0.3);
          } else {
            return widthScaler(d.target["x"] + 0.3);
          }
        } else {
          return widthScaler(d.source["x"] + 0.1);
        }
      })
      .attr("y", function (d, i) {
        if (d.task != RouteMap.TASK) {
          return 0;
        }
        // if the path is horizontal
        if (d.source["x"] != d.target["x"]) {
          return heightScaler(d.source["y"] + 0.1);
        } else {
          if (d.source["y"] <= d.target["y"]){
            return heightScaler(d.source["y"] + 0.2);
          } else{
            return heightScaler(d.target["y"] + 0.2);
          }
        }
      })
      .attr("fill", "red");

      this.truck = this.g
      .append("image")
      .attr("class", "image")
      .attr("xlink:href", "./static/image/truck.png")
      .attr(
        "transform",
        "translate(" +
          (this.widthScaler(initialPosition.sourceX) - RouteMap.OFFSET) +
          ", " +
          (this.heightScaler(initialPosition.sourceY) - RouteMap.OFFSET) +
          ")"
      )
      .attr("width", RouteMap.TRUCKWIDTH)
      .attr("height", RouteMap.TRUCKHEIGHT);
  }

  // Move the truck to previous point
  async returnToPreviousPoint() {
    if (this.path == 0) {
      return;
    }
    // reset the truck to the previous starting point
    this.path -= 1;
    var targetPoint = this.pathData[this.path][0];
    var targetPosition = this.findSouceTarget(
      this.links,
      targetPoint.source,
      targetPoint.target
    );

    await d3
      .select("image")
      .transition()
      .duration(500)
      .attr("x", this.widthScaler(targetPosition.sourceX) - RouteMap.OFFSET)
      .attr("y", this.heightScaler(targetPosition.sourceY) - RouteMap.OFFSET)
      .end();

    for (let i = 0; i < this.pathData[this.path].length; i++) {
      var targetPoint = this.pathData[this.path][i];
      var targetPosition = this.findSouceTarget(
        this.links,
        targetPoint.source,
        targetPoint.target
      );

      this.g
        .selectAll("line.link")
        .filter(function () {
          return (
            (d3.select(this).attr("source_id") == targetPoint.source &&
              d3.select(this).attr("target_id") == targetPoint.target) ||
            (d3.select(this).attr("target_id") == targetPoint.source &&
              d3.select(this).attr("source_id") == targetPoint.target)
          );
        })
        .transition()
        .style("stroke", function () {
          if (targetPosition.task == RouteMap.TASK) {
            return "red";
          } else {
            return "blue";
          }
        })
        .style("stroke-width", 2)
        .attr("stroke-dasharray", function () {
          if (targetPoint.serve == RouteMap.TASKNOTSERVED) {
            return 0;
          }
        });
    }
  }

  async driveForward() {
    var currentBindData = this.bindData[this.decisionSituation]
    var barScaler = this.barScaler;
    var widthScaler = this.widthScaler;
    var heightScaler = this.heightScaler;
    // the reaction to the "next" button, run on the path and change the color of the edges

    // Rebind the data into the links add property to the links
    for (let link of this.links) {
      for (let bind of currentBindData) {
        if (
          link.task == RouteMap.TASK &&
          link.source.id == bind.source &&
          link.target.id == bind.target ||
          link.source.id == bind.target &&
          link.target.id == bind.source
        ) {
          link["property"] = bind;
          link["RQ"] = bind["RQ"];
          link["Capacity"] = 1;
        } else if(link.task == RouteMap.NONTASK){
          link['RQ'] = bind['RQ']
        }
      }
    }
    // if the path reaches the length of the data, reset to the starting point
    if (this.path == this.pathData.length) {
      this.path = 0;
    }

    for (let i = 0; i < this.pathData[this.path].length; i++) {
      var targetPoint = this.pathData[this.path][i];
      var targetPosition = this.findSouceTarget(
        this.links,
        targetPoint.source,
        targetPoint.target
      );
      // console.log(targetPosition.remainingCapacity)

      // console.log(targetPoint, this.capacityRemaining)
      // if the truck drive back to the depot, the capacityRemaining restore to 100
      if (
        targetPosition.task == RouteMap.NONTASK &&
        targetPoint.target != RouteMap.DEPOT
      ) {
        var capacityData = [
          this.capacityRemaining,
          100 - this.capacityRemaining,
        ];
      } else if (
        targetPoint.target == RouteMap.DEPOT
      ) {
        // console.log('depot')
        this.capacityRemaining = 100;
        var capacityData = [
          this.capacityRemaining,
          100 - this.capacityRemaining,
        ];
      } else if (
        targetPosition.task == RouteMap.TASK &&
        targetPoint.serve == RouteMap.PASS
      ) {
        var capacityData = [
          this.capacityRemaining,
          100 - this.capacityRemaining,
        ]; 
      } else {
        this.capacityRemaining = targetPosition.remainingCapacity;
        var capacityData = [
          this.capacityRemaining,
          100 - this.capacityRemaining,
        ];
      }

      // console.log(targetPoint)

      // wait until the animation finishes
      await d3
        .selectAll(".image, .capacity")
        .transition()
        .duration(500)
        .attr(
          "transform",
          "translate(" +
            (this.widthScaler(targetPosition.targetX) - RouteMap.OFFSET) +
            ", " +
            (this.heightScaler(targetPosition.targetY) - RouteMap.OFFSET) +
            ")"
        )
        .end();

      let pie = d3.pie();
      let arc = d3.arc().innerRadius(8).outerRadius(12);

      this.arcs.remove();
      // console.log(capacityData)
      this.arcs = this.capacity
        .selectAll("arc")
        .data(pie(capacityData))
        .enter()
        .append("g");

      this.arcs
        .append("path")
        .attr("fill", (data, i) => {
          let value = data.data;
          return d3.schemeSet3[i];
        })
        .attr("d", arc);

      this.capacity
        .select("text")
        .data(capacityData)
        .style("font-size", "5px")
        .attr("dy", ".25em")
        .attr("dx", "-1.2em")
        .text(function (d) {
          // console.log(d)
          return d + "%";
        });

      this.g
        .selectAll("line.link")
        .filter(function () {
          return (
            (d3.select(this).attr("source_id") == targetPoint.source &&
              d3.select(this).attr("target_id") == targetPoint.target) ||
            (d3.select(this).attr("target_id") == targetPoint.source &&
              d3.select(this).attr("source_id") == targetPoint.target)
          );
        })
        .transition()
        .duration(500)
        .style("stroke", function () {
          if (targetPoint.serve == RouteMap.TASK) {
            return RouteMap.SERVEDCOLOR;
          } else {
            return RouteMap.TASKCOLOR;
          }
        })
        .style("stroke-width", 2)
        .attr("stroke-dasharray", function () {
          if (targetPoint.serve == RouteMap.TASKNOTSERVED) {
            return 4;
          } else {
            return 0;
          }
        });

      // console.log(targetPoint)
      // update the link capacity
      for (let link of this.links) {
        // console.log(link)
        // if the current link is a task, two directions
        if (
          (link.task == RouteMap.TASK &&
            link.source.id == targetPoint.source &&
            link.target.id == targetPoint.target) ||
          (link.task == RouteMap.TASK &&
            link.source.id == targetPoint.target &&
            link.target.id == targetPoint.source)
        ) {
        // then we iterate for all the binding data and found the task capacity
          for (let bind of currentBindData) {
            if (
              (bind.source == targetPoint.source &&
                bind.target == targetPoint.target) ||
              (bind.target == targetPoint.source &&
                bind.source == targetPoint.target)
            ) {
              // console.log(bind.source, bind.target)
              link["Capacity"] = bind.PASSCAP;
            }
          }
        }
      }

      this.progress.remove();
      this.progress = this.svg
        .append("g")
        .attr("class", "progress")
        .selectAll("rect")
        .data(this.links)
        .enter()
        .append("rect")
        .attr("width", function (d, i) {
          if (d.task != RouteMap.TASK) {
            return 0;
          }
          // if the path is horizontal
          if (d.source["x"] != d.target["x"]) {
            // console.log(d)
            return barScaler(d.Capacity);
          } else {
            return barScaler(0.2);
          }
        })
        .attr("height", function (d) {
          if (d.task != RouteMap.TASK) {
            return 0;
          }
          // if the path is horizontal
          if (d.source["x"] != d.target["x"]) {
            return barScaler(0.2);
          } else {
            // console.log(d)
            return barScaler(d.Capacity);
          }
        })
        .attr("x", function (d) {
          if (d.task != RouteMap.TASK) {
            return 0;
          }
          // if the path is horizontal
          if (d.source["x"] != d.target["x"]) {
            if (d.source['x'] <= d.target['x']){
              return widthScaler(d.source["x"] + 0.3);
            } else {
              return widthScaler(d.target["x"] + 0.3);
            }
          } else {
            return widthScaler(d.target["x"] + 0.1);
          }
        })
        .attr("y", function (d, i) {
          if (d.task != RouteMap.TASK) {
            return 0;
          }
          // if the path is horizontal
          if (d.source["x"] != d.target["x"]) {
            return heightScaler(d.target["y"] + 0.1);
          } else {
            if (d.source["y"] <= d.target["y"]){
              return heightScaler(d.source["y"] + 0.2);
            } else{
              return heightScaler(d.target["y"] + 0.2)
            }
          }
        })
        .attr("fill", "red");
    }
    this.path += 1;
    this.decisionSituation += 1
  }

  findSouceTarget(links, sourceId, targetId) {
    // find the link with provided sourceId and targetId
    for (const obj of links) {
      if (obj.source["id"] == sourceId && obj.target["id"] == targetId) {
        // console.log(obj)
        return {
          sourceX: obj.source["x"],
          sourceY: obj.source["y"],
          targetX: obj.target["x"],
          targetY: obj.target["y"],
          task: obj.task,
          remainingCapacity: RouteMap.scaleAndRound(obj.RQ),
          // passCapacity: obj.PASSCAP
        };
      }

      if (obj.source["id"] == targetId && obj.target["id"] == sourceId) {
        // console.log(obj.RQ * 20)
        return {
          sourceX: obj.target["x"],
          sourceY: obj.target["y"],
          targetX: obj.source["x"],
          targetY: obj.source["y"],
          task: obj.task,
          remainingCapacity: RouteMap.scaleAndRound(obj.RQ),
          // passCapacity: obj.PASSCAP
        };
      }
    }
  }

  static scaleAndRound(rq){
    return Math.round(rq * 20)
  }

  static pretty(bindData) {
    var output;
    if (bindData == undefined) {
      return "Non-task";
    }

    output =
      // "<p> CFD:" +
      // bindData["CFD"] +
      "CFH:" +
      bindData["CFH"] +
      // ", CR:" +
      // bindData["CR"] +
      // ", CTD:" +
      // bindData["CTD"] +
      // ", DEM:" +
      // bindData["DEM"] +
      // ", FRT:" +
      // bindData["FRT"] +
      // ", FULL:" +
      // bindData["FULL"] +
      // ", CR:" +
      // bindData["CR"] + 
      // ", FUT:" +
      // bindData["FUT"] +
      // ", RQ:" + 
      // bindData["RQ"]
      "</p>";
    return output;
    // return JSON.stringify(bindData)
  }

  calculateMax() {
    // calculate the maximum value of nodes horizontally (maxX) and virtically (maxY)
    // in order to scale the canvas properly
    const totalNodes = self.mapData["nodes"];
    var maxX = 0;
    var maxY = 0;
    for (const obj of totalNodes) {
      if (obj["x"] > maxX) {
        maxX = obj["x"];
      }

      if (obj["y"] > maxY) {
        maxY = obj["y"];
      }
    }
    return [maxX, maxY];
  }
  
  resetCanvas() {
    // reset the canvas and the truck
    d3.selectAll("svg")
      .filter(function () {
        return d3.select(this).attr("name") == "map";
      })
      .remove();
    
    this.decisionSituation = 0;
    this.path = 0;
    this.edge = 0;
    this.capacityRemaining = 100;
  }
}
