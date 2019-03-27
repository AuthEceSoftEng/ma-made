const template = {
  "$schema": "https://vega.github.io/schema/vega/v4.json",
  "width": 500,
  "height": 100,
  "padding": 5,

  "signals": [
    {
      "name": "binOffset", "value": 0,
      "bind": { "input": "range", "min": -0.1, "max": 0.1 }
    },
    {
      "name": "binStep", "value": 0.1,
      "bind": { "input": "range", "min": 0.001, "max": 0.4, "step": 0.001 }
    }
  ],

  "data": [
    {
      "name": "table",
      "values": [
        // { "u": -0.324099452164216 },
        // { "u": 4.9643515250010635 },
        // { "u": -0.05003877259110454 },
        // { "u": -0.11568764038081183 }
      ]
    },
    {
      "name": "binned",
      "source": "table",
      "transform": [
        {
          "type": "bin", "field": "u",
          "extent": [-1, 1],
          "anchor": { "signal": "binOffset" },
          "step": { "signal": "binStep" },
          "nice": false
        },
        {
          "type": "aggregate",
          "key": "bin0", "groupby": ["bin0", "bin1"],
          "fields": ["bin0"], "ops": ["count"], "as": ["count"]
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "xscale",
      "type": "linear",
      "range": "width",
      "domain": [-1, 1]
    },
    {
      "name": "yscale",
      "type": "linear",
      "range": "height", "round": true,
      "domain": { "data": "binned", "field": "count" },
      "zero": true, "nice": true
    },
    {
      "name": "color",
      "type": "ordinal",
      "range": "category",
      "domain": { "data": "table", "field": "c" }
    }
  ],

  "axes": [
    { "orient": "bottom", "scale": "xscale", "zindex": 1 },
    { "orient": "left", "scale": "yscale", "tickCount": 5, "zindex": 1 }
  ],

  "marks": [
    {
      "type": "rect",
      "from": { "data": "binned" },
      "encode": {
        "update": {
          "x": { "scale": "xscale", "field": "bin0" },
          "x2": {
            "scale": "xscale", "field": "bin1",
            "offset": { "signal": "binStep > 0.02 ? -0.5 : 0" }
          },
          "y": { "scale": "yscale", "field": "count" },
          "y2": { "scale": "yscale", "value": 0 },
          "fill": { "value": "steelblue" }
        },
        "hover": { "fill": { "value": "firebrick" } }
      }
    },
    {
      "type": "rect",
      "from": { "data": "table" },
      "encode": {
        "enter": {
          "x": { "scale": "xscale", "field": "u" },
          "width": { "value": 1 },
          "y": { "value": 25, "offset": { "signal": "height" } },
          "height": { "value": 5 },
          "fill": { "value": "steelblue" },
          "fillOpacity": { "value": 0.4 }
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
  histogramChartTemplate: function (specs) {
    Object.keys(specs).forEach(element => {
      template[element] = specs[element]
    });
    return template;
  }
}
