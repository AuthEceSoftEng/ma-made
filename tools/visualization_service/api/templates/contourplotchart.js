const template = {
  "$schema": "https://vega.github.io/schema/vega/v4.json",
  "width": 500,
  "height": 400,
  "padding": 5,
  "autosize": "pad",

  "signals": [
    {
      "name": "count", "value": 10,
      "bind": { "input": "select", "options": [1, 5, 10, 20] }
    },
    {
      "name": "points", "value": true,
      "bind": { "input": "checkbox" }
    }
  ],

  "data": [
    {
      "name": "source",
      "values": [],
      "transform": [
        {
          "type": "filter",
          "expr": ""
        }
      ]
    },
    {
      "name": "contours",
      "source": "source",
      "transform": [
        {
          "type": "contour",
          "x": {},
          "y": {},
          "size": [{ "signal": "width" }, { "signal": "height" }],
          "count": { "signal": "count" }
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "x",
      "type": "linear",
      "round": true,
      "nice": true,
      "zero": false,
      "domain": { "data": "source" },
      "range": "width"
    },
    {
      "name": "y",
      "type": "linear",
      "round": true,
      "nice": true,
      "zero": false,
      "domain": { "data": "source" },
      "range": "height"
    },
    {
      "name": "color",
      "type": "sequential",
      "zero": true,
      "domain": { "data": "contours", "field": "value" },
      "range": "heatmap"
    }
  ],

  "axes": [
    {
      "scale": "x",
      "grid": true,
      "domain": false,
      "orient": "bottom",
      "title": ""
    },
    {
      "scale": "y",
      "grid": true,
      "domain": false,
      "orient": "left",
      "title": ""
    }
  ],

  "legends": [{
    "fill": "color",
    "type": "gradient"
  }],

  "marks": [
    {
      "type": "path",
      "from": { "data": "contours" },
      "encode": {
        "enter": {
          "stroke": { "value": "#888" },
          "strokeWidth": { "value": 1 },
          "fill": { "scale": "color", "field": "value" },
          "fillOpacity": { "value": 0.35 }
        }
      },
      "transform": [
        { "type": "geopath", "field": "datum" }
      ]
    },
    {
      "name": "marks",
      "type": "symbol",
      "from": { "data": "source" },
      "encode": {
        "update": {
          "x": { "scale": "x" },
          "y": { "scale": "y" },
          "size": { "value": 4 },
          "fill": [
            { "test": "points", "value": "black" },
            { "value": "transparent" }
          ]
        }
      }
    }
  ],

  "config": {
    "range": {
      "heatmap": { "scheme": "greenblue" }
    }
  },

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
  contourPlotChartTemplate: function (specs) {
    Object.keys(specs).forEach(element => {
      template[element] = specs[element]
    });
    return template;
  }
}
