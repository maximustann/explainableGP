class GPTree {
  // initialization
  constructor(total_leaf_nodes, divValue, divWidth, divHeight) {
    this.total_leaf_nodes = total_leaf_nodes
    this.divValue = divValue;
    this.divWidth = divWidth;
    this.divHeight = divHeight;


    this.width = this.divWidth + GPTree.rect_width * this.total_leaf_nodes - GPTree.margin.left - GPTree.margin.right;
    this.height = 300 + GPTree.rect_height * this.total_leaf_nodes - GPTree.margin.top - GPTree.margin.bottom;

    this.tree_width = this.width;
    this.tree_height = this.height;
    this.scale_factor = 1;


    // For the home page, we set the limit of height as 400
    if (divValue == "index") {
      if (this.height > 300) {
        this.height = 300;
      }
    }

    // Adjust the scale of the graph if the tree size larger than the canvas
    if (this.width > this.divWidth) {
      this.scaling_factor = (this.divWidth - GPTree.rect_width) / this.width;
      this.width = this.divWidth - GPTree.rect_width * 2;
    }
  } // initialization finished
  static  get rect_width(){
    return 60
  }
  static get rect_height(){
    return 30
  }
  static get margin(){
    return { top: 30, right: 30, bottom: 30, left: 30 };
  }
  static get color(){
    return d3.scaleLinear().domain([-20, 60]).range(["white", "purple"]);
  }

  static get stroke_scaler(){
    return d3.scaleLinear().domain([-100, 100]).range([1, 10]);
  }

  drawTree(treeData) {
    // declares a tree layout and assigns the size
    this.treemap = d3.tree().size([this.tree_width, this.tree_height]);

    //  assigns the data to a hierarchy using parent-child relationships
    this.nodes = d3.hierarchy(treeData);

    // maps the node data to the tree layout
    this.nodes = this.treemap(this.nodes);

    const handleZoom = (e) => this.g.attr("transform", e.transform);
    const zoom = d3
      .zoom()
      .on("zoom", handleZoom)
      .scaleExtent([this.scaling_factor, 1]);

    this.svg = d3
      .select("#GPTreeView")
      .append("svg")
      .attr("width", this.width + GPTree.margin.left + GPTree.margin.right)
      .attr("height", this.height + GPTree.margin.top + GPTree.margin.bottom)
      .attr("name", "tree");

    this.g = this.svg
      .append("g")
      .attr("transform", "translate(" + GPTree.margin.left + "," + GPTree.margin.top + ")");

    d3.select("#GPTreeView")
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity.scale(this.scaling_factor));

    // add links between nodes
    this.link = this.g
      .selectAll(".link")
      .data(this.nodes.descendants().slice(1))
      .enter()
      .append("path")
      .style("stroke", function (d) {
        return GPTree.color(d.data.rank);
      })
      .style("stroke-width", function (d) {
        return GPTree.stroke_scaler(d.data.rank);
      })
      .attr("class", "link")
      .attr("d", function (d) {
        return (
          "M" +
          (d.x + GPTree.rect_width / 2) +
          "," +
          (d.y + GPTree.margin.top) +
          "C" +
          (d.x + GPTree.rect_width / 2) +
          "," +
          (d.y + d.parent.y + GPTree.margin.top) / 2 +
          " " +
          (d.parent.x + GPTree.rect_width / 2) +
          "," +
          (d.y + d.parent.y + GPTree.rect_height + GPTree.margin.top) / 2 +
          " " +
          (d.parent.x + GPTree.rect_width / 2) +
          "," +
          (d.parent.y + GPTree.rect_height + GPTree.margin.top)
        );
      });

    // adds each node as a group
    this.node = this.g
      .selectAll(".node")
      .data(this.nodes.descendants())
      .enter()
      .append("g")
      .attr("class", function (d) {
        return "node" + (d.children ? " node--internal" : " node--leaf");
      })
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + (d.y + GPTree.margin.top) + ")";
      });

    // adds rectangular to the node
    this.node
      .append("rect")
      .attr("width", GPTree.rect_width)
      .attr("height", GPTree.rect_height)
      // .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", "2")
      .attr("fill", function (d) {
        return GPTree.color(d.data.rank);
      });

    // adds the text to the node
    this.node
      .append("text")
      .attr("dy", ".35em")
      // .attr("y", function(d) { return d.children ? -20 : 20; })
      .attr("y", GPTree.rect_height / 2)
      .attr("x", GPTree.rect_width / 2 - 15)
      // .style("text-anchor", "right")
      .text(function (d) {
        return d.data.name;
      });

    // adds output text to the nodes
    this.node
      .append("text")
      .attr("dy", ".35em")
      .attr("y", -20)
      .attr("x", GPTree.rect_width / 2 - 15)
      .text(function (d) {
        return Math.round(d.data.output * 1000) / 1000;
      });
  }

  cleanCanvas() {
    d3.selectAll("svg")
      .filter(function () {
        return d3.select(this).attr("name") == "tree";
      })
      .remove();
  }
}