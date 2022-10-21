class RouteMap {
  constructor(mapData, pathData, divValue, divWidth, divHeight) {
    this.mapData = mapData;
    this.pathData = pathData;
    this.divValue = divValue;
    this.divWidth = divWidth;
    this.divHeight = divHeight;
    this.path = 0;
    this.edge = 0;


    // calculate the max X and Y
    const maxValues = this.calculateMax();
    this.maxX = maxValues[0];
    this.maxY = maxValues[1];

    // define the margins, canvas width and height
    this.margin = { top: 30, right: 30, bottom: 30, left: 30 };
    this.width = this.divWidth - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    this.widthScaler = d3
      .scaleLinear()
      .domain([0, this.maxX])
      .range([this.margin.left, this.width - this.margin.right]);

    this.heightScaler = d3
      .scaleLinear()
      .domain([0, this.maxY])
      .range([this.margin.top, this.height - this.margin.left]);
  }

  // The following functions return static values
  static get TASK(){
    return 0
  }

  static get NONTASK(){
    return 1
  }

  static get TASKNOTSERVED(){
    return 2
  }

  static get PASS(){
    return 3
  }

  static get SERVED(){
    return 0
  }

  static get OFFSET(){
    return 20
  }

  // draw map
  drawMap() {
    this.svg = d3
      .select("#Map")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0)

    this.g = this.svg.append("g");

    // set up the zoom-in ability
    const handleZoom = (e) => this.g.attr("transform", e.transform);
    const zoom = d3.zoom().on("zoom", handleZoom);
    d3.select("#Map").call(zoom);

    this.links = this.mapData.links.map((l) => {
      const source = this.mapData.nodes.find((n) => n.id === l.source);
      const target = this.mapData.nodes.find((n) => n.id === l.target);
      const task = l.task;
      return { source, target, task };
    });

    // draw links
    this.g
      .selectAll("line.link")
      .data(this.links, (d) => `${d.source.id}-${d.target.id}`)
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
          return "red";
        } else if (d.task == RouteMap.NONTASK) {
          return "blue";
        } else {
          return "Chartreuse";
        }
      })
      .on("mouseover", function (d) {
        d3.select(this).transition().duration(200).style("stroke-width", 10);
        d3.select('.tooltip').style("opacity", 0.9)
            .html("<p> source id: " + d.srcElement.__data__.source['id'] + "</p>"
                + "<p> target id: " + d.srcElement.__data__.target['id'] + "</p>").style("left", (d.pageX) + "px")
          .style("top", (d.pageY - 30) + "px");
      })
      .on("mouseout", function (d) {
        d3.select(this).transition().duration(200).style("stroke-width", 2);
        d3.select('.tooltip').style("opacity", 0);
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
      .attr("r", 10)
      .style("fill", function (d) {
        if (d.depot == true) {
          return "green";
        } else {
          return "blue";
        }
      });


    // initial point is the starting point of the truck, usually from depot
    const initialPoint = this.pathData[this.path][this.edge];
    const initialPosition = this.findSouceTarget(
      this.links,
      initialPoint.source,
      initialPoint.target
    );

  this.truck = this.g
    .append("image")
    .attr("xlink:href", "../static/image/truck.png")
    .attr("x", this.widthScaler(initialPosition.sourceX) - RouteMap.OFFSET)
    .attr("y", this.heightScaler(initialPosition.sourceY) - RouteMap.OFFSET)
    .attr("width", 40)
    .attr("height", 40);

  this.nodes
    .append("text")
    .style("font-size", "10px")
    .attr("dy", ".25em")
    .attr("y", 10)
    .attr("x", 10)
    .text(function (d) {
      if (d.depot == true) {
        return "depot";
      } else {
        return d.id;
      }
    });

  }

  async returnToPreviousPoint() {
    if(this.path == 0) {
      return
    }
    // reset the truck to the previous starting point
    this.path -= 1
    var targetPoint = this.pathData[this.path][0];
    var targetPosition = this.findSouceTarget(
        this.links,
        targetPoint.source,
        targetPoint.target
    );

    await d3.
      select("image")
      .transition()
      .duration(500)
      .attr("x", this.widthScaler(targetPosition.sourceX) - RouteMap.OFFSET)
      .attr("y", this.heightScaler(targetPosition.sourceY) - RouteMap.OFFSET)
      .end()


      for (let i = 0; i < this.pathData[this.path].length; i++) {
        var targetPoint = this.pathData[this.path][i];
        var targetPosition = this.findSouceTarget(
          this.links,
          targetPoint.source,
          targetPoint.target
        );
  
        this.g.selectAll("line.link")
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
              return "blue"
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
    // the reaction to the "next" button, run on the path and change the color of the edges

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

      // wait until the animation finishes
      await d3
        .select("image")
        .transition()
        .duration(500)
        .attr("x", this.widthScaler(targetPosition.targetX) - RouteMap.OFFSET)
        .attr("y", this.heightScaler(targetPosition.targetY) - RouteMap.OFFSET)
        .end();

      this.g.selectAll("line.link")
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
            return "Chartreuse";
          } else {
            return "red";
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
    }
    this.path += 1;
  }

  findSouceTarget(links, sourceId, targetId) {
    // find the link with provided sourceId and targetId
    for (const obj of links) {
      if (obj.source["id"] == sourceId && obj.target["id"] == targetId) {
        return {
          sourceX: obj.source["x"],
          sourceY: obj.source["y"],
          targetX: obj.target["x"],
          targetY: obj.target["y"],
          task: obj.task
        };
      }
  
      if (obj.source["id"] == targetId && obj.target["id"] == sourceId) {
        return {
          sourceX: obj.target["x"],
          sourceY: obj.target["y"],
          targetX: obj.source["x"],
          targetY: obj.source["y"],
          task: obj.task
        };
      }
    }
  }

  calculateMax() {
    // calculate the maximum value of nodes horizontally (maxX) and virtically (maxY)
    // in order to scale the canvas properly
    const totalNodes = self.mapData["nodes"]
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
}