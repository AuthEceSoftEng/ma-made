const template = {
  "$schema": "https://vega.github.io/schema/vega/v4.json",
  "width": 500,
  "height": 200,
  "padding": 5,

  "signals": [
    {
      "name": "interpolate",
      "value": "monotone",
      "bind": {
        "input": "select",
        "options": [
          "basis",
          "cardinal",
          "catmull-rom",
          "linear",
          "monotone",
          "natural",
          "step",
          "step-after",
          "step-before"
        ]
      }
    }
  ],

  "data": [
    {
      "name": "table",
      "values": [
        // {"u": 1,  "v": 28}, {"u": 2,  "v": 55},
        // {"u": 3,  "v": 43}, {"u": 4,  "v": 91},
        // {"u": 5,  "v": 81}, {"u": 6,  "v": 53},
        // {"u": 7,  "v": 19}, {"u": 8,  "v": 87},
        // {"u": 9,  "v": 52}, {"u": 10, "v": 48},
        // {"u": 11, "v": 24}, {"u": 12, "v": 49},
        // {"u": 13, "v": 87}, {"u": 14, "v": 66},
        // {"u": 15, "v": 17}, {"u": 16, "v": 27},
        // {"u": 17, "v": 68}, {"u": 18, "v": 16},
        // {"u": 19, "v": 49}, {"u": 20, "v": 15}
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "type": "linear",
      "range": "width",
      "zero": false,
      "domain": { "data": "table", "field": "u" }
    },
    {
      "name": "yscale",
      "type": "linear",
      "range": "height",
      "nice": true,
      "zero": true,
      "domain": { "data": "table", "field": "v" }
    },
    {
      "name": "color",
      "type": "ordinal",
      "range": "category",
      "domain": { "data": "table", "field": "c" }
    }
  ],

  "axes": [
    { "orient": "bottom", "scale": "xscale", "tickCount": 20 },
    { "orient": "left", "scale": "yscale" }
  ],

  "marks": [
    {
      "type": "area",
      "from": { "data": "table" },
      "encode": {
        "enter": {
          "x": { "scale": "xscale", "field": "u" },
          "y": { "scale": "yscale", "field": "v" },
          "y2": { "scale": "yscale", "value": 0 },
          "fill": { "value": "steelblue" }
        },
        "update": {
          "interpolate": { "signal": "interpolate" },
          "fillOpacity": { "value": 1 }
        },
        "hover": {
          "fillOpacity": { "value": 0.5 }
        }
      }
    }
  ],

  "legends": [
    {
      "fill": "color",
      "encode": {
        "title": {
          "update": {
            "fontSize": { "value": 14 },
          },
        },
        "labels": {
          "interactive": true,
          "update": {
            "fontSize": { "value": 12 },
            "fill": { "value": "black" }
          },
          "hover": {
            "fill": { "value": "firebrick" }
          }
        },
        "symbols": {
          "update": {
            "stroke": { "value": "transparent" }
          }
        },
        "legend": {
          "update": {
            "stroke": { "value": "#ccc" },
            "strokeWidth": { "value": 1.5 }
          }
        }
      }
    }
  ]
}

module.exports = {
  areaChartTemplate: function (specs) {
    Object.keys(specs).forEach(element => {
      template[element] = specs[element]
    });
    return template;
  }
}
