const template = {
  "$schema": "https://vega.github.io/schema/vega/v4.json",
  "width": 200,
  "height": 200,
  "autosize": "none",

  "signals": [
    {
      "name": "startAngle", "value": 0,
      "bind": { "input": "range", "min": 0, "max": 6.29, "step": 0.01 }
    },
    {
      "name": "endAngle", "value": 6.29,
      "bind": { "input": "range", "min": 0, "max": 6.29, "step": 0.01 }
    },
    {
      "name": "padAngle", "value": 0,
      "bind": { "input": "range", "min": 0, "max": 0.1 }
    },
    {
      "name": "innerRadius", "value": 60,
      "bind": { "input": "range", "min": 0, "max": 90, "step": 1 }
    },
    {
      "name": "cornerRadius", "value": 0,
      "bind": { "input": "range", "min": 0, "max": 10, "step": 0.5 }
    },
    {
      "name": "sort", "value": false,
      "bind": { "input": "checkbox" }
    }
  ],

  "data": [
    {
      "name": "table",
      "values": [
        // {"id": 1, "field": 4},
        // {"id": 2, "field": 6},
        // {"id": 3, "field": 10},
        // {"id": 4, "field": 3},
        // {"id": 5, "field": 7},
        // {"id": 6, "field": 8}
      ],
      "transform": [
        {
          "type": "pie",
          "field": "field",
          "startAngle": { "signal": "startAngle" },
          "endAngle": { "signal": "endAngle" },
          "sort": { "signal": "sort" }
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "color",
      "type": "ordinal",
      "domain": { "data": "table", "field": "id" },
      "range": { "scheme": "category20" }
    },
    {
      "name": "color_legend",
      "type": "ordinal",
      "range": "category",
      "domain": { "data": "table", "field": "c" }
    }
  ],

  "marks": [
    {
      "type": "arc",
      "from": { "data": "table" },
      "encode": {
        "enter": {
          "fill": { "scale": "color", "field": "id" },
          "x": { "signal": "width / 2" },
          "y": { "signal": "height / 2" }
        },
        "update": {
          "startAngle": { "field": "startAngle" },
          "endAngle": { "field": "endAngle" },
          "padAngle": { "signal": "padAngle" },
          "innerRadius": { "signal": "innerRadius" },
          "outerRadius": { "signal": "width / 2" },
          "cornerRadius": { "signal": "cornerRadius" }
        }
      }
    }
  ],

  "legends": [
    {
      "fill": "color_legend",
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
  donutChartTemplate: function (specs) {
    Object.keys(specs).forEach(element => {
      template[element] = specs[element]
    });
    return template;
  }
}
