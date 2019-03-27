const express = require('express');
const router = express.Router();
const linechart = require('./templates/linechart');
const barchart = require('./templates/barchart');
const stackedbarchart = require('./templates/stackedbarchart');
const areachart = require('./templates/areachart');
const stackedareachart = require('./templates/stackedareachart');
const donutchart = require('./templates/donutchart');
const histogramchart = require('./templates/histogramchart');
const boxplotchart = require('./templates/boxplotchart');
const contourplotchart = require('./templates/contourplotchart');
const scatterplotchart = require('./templates/scatterplotchart');
const operations = require('./utilities/operations');

/** Operations **/

router.post('/operation/removeOutliers', (req, res) => {
	let data = req.body.data.data;
	let selectedColumn = req.body.data.selectedColumn;
	let downBound = operations.get_quantile(data[selectedColumn], 0.1);
	let upperBound = operations.get_quantile(data[selectedColumn], 0.9);
	let indexes = [];
	let vegaData = { 'data': {} };

	for (let i = 0; i < data[selectedColumn].length; i++) {
		if (data[selectedColumn][i] >= downBound && data[selectedColumn][i] <= upperBound) indexes.push(i);
	}

	for (let i = 0; i < Object.keys(data).length; i++) {
		vegaData.data[Object.keys(data)[i]] = indexes.map((item) => data[Object.keys(data)[i]][item]);
	}

	res.status(200).json(vegaData);

});

router.post('/operation/ascendingOrder', (req, res) => {
	let data = req.body.data.data;
	let selectedColumn = req.body.data.selectedColumn;
	let indexes = [];
	let vegaData = { 'data': {} };

	for (let i = 0; i < data[selectedColumn].length; i++) {
		indexes[i] = i;
	}

	indexes.sort((a, b) => data[selectedColumn][a] < data[selectedColumn][b] ? -1 : data[selectedColumn][a] > data[selectedColumn][b] ? 1 : 0);

	for (let i = 0; i < Object.keys(data).length; i++) {
		vegaData.data[Object.keys(data)[i]] = indexes.map((item) => data[Object.keys(data)[i]][item]);
	}

	res.status(200).json(vegaData);

});

router.post('/operation/descendingOrder', (req, res) => {
	let data = req.body.data.data;
	let selectedColumn = req.body.data.selectedColumn;
	let indexes = [];
	let vegaData = { 'data': {} };

	for (let i = 0; i < data[selectedColumn].length; i++) {
		indexes[i] = i;
	}

	indexes.sort((a, b) => data[selectedColumn][a] < data[selectedColumn][b] ? 1 : data[selectedColumn][a] > data[selectedColumn][b] ? -1 : 0);

	for (let i = 0; i < Object.keys(data).length; i++) {
		vegaData.data[Object.keys(data)[i]] = indexes.map((item) => data[Object.keys(data)[i]][item]);
	}

	res.status(200).json(vegaData);

});

router.post('/operation/topPercent', (req, res) => {
	let data = req.body.data.data;
	let selectedColumn = req.body.data.selectedColumn;
	let downBound = operations.get_quantile(data[selectedColumn], parseInt(req.body.bounds.top) / 100);
	let indexes = [];
	let vegaData = { 'data': {} };

	for (let i = 0; i < data[selectedColumn].length; i++) {
		if (data[selectedColumn][i] >= downBound) indexes.push(i);
	}

	for (let i = 0; i < Object.keys(data).length; i++) {
		vegaData.data[Object.keys(data)[i]] = indexes.map((item) => data[Object.keys(data)[i]][item]);
	}

	res.status(200).json(vegaData);

});

router.post('/operation/bottomPercent', (req, res) => {
	let data = req.body.data.data;
	let selectedColumn = req.body.data.selectedColumn;
	let upperBound = operations.get_quantile(data[selectedColumn], parseInt(req.body.bounds.bottom) / 100);
	let indexes = [];
	let vegaData = { 'data': {} };

	for (let i = 0; i < data[selectedColumn].length; i++) {
		if (data[selectedColumn][i] <= upperBound) indexes.push(i);
	}

	for (let i = 0; i < Object.keys(data).length; i++) {
		vegaData.data[Object.keys(data)[i]] = indexes.map((item) => data[Object.keys(data)[i]][item]);
	}

	res.status(200).json(vegaData);

});

router.post('/operation/rangePercent', (req, res) => {
	let data = req.body.data.data;
	let selectedColumn = req.body.data.selectedColumn;
	let downBound = operations.get_quantile(data[selectedColumn], parseInt(req.body.bounds.bottom) / 100);
	let upperBound = operations.get_quantile(data[selectedColumn], parseInt(req.body.bounds.top) / 100);
	let indexes = [];
	let vegaData = { 'data': {} };

	for (let i = 0; i < data[selectedColumn].length; i++) {
		if (data[selectedColumn][i] >= downBound && data[selectedColumn][i] <= upperBound) indexes.push(i);
	}

	for (let i = 0; i < Object.keys(data).length; i++) {
		vegaData.data[Object.keys(data)[i]] = indexes.map((item) => data[Object.keys(data)[i]][item]);
	}

	res.status(200).json(vegaData);

});

router.post('/operation/rangeValues', (req, res) => {
	let data = req.body.data.data;
	let selectedColumn = req.body.data.selectedColumn;
	let indexes = [];
	let vegaData = { 'data': {} };

	for (let i = 0; i < data[selectedColumn].length; i++) {
		if (data[selectedColumn][i] >= req.body.bounds.bottom && data[selectedColumn][i] <= req.body.bounds.top) indexes.push(i);
	}

	for (let i = 0; i < Object.keys(data).length; i++) {
		vegaData.data[Object.keys(data)[i]] = indexes.map((item) => data[Object.keys(data)[i]][item]);
	}

	res.status(200).json(vegaData);

});


/** Vega Graphs **/

router.post('/lineChart', (req, res) => {
	chartSpecs = linechart.lineChartTemplate({ "width": 600, "height": 600 })
	let fixed_data = [];

	for (let i = 0; i < Object.keys(req.body.data).length; i++) {
		fixed_data = fixed_data.concat(req.body.data[Object.keys(req.body.data)[i]].map((x, index) => ({ "x": index, "y": x, "c": Object.keys(req.body.data)[i] })));
	}

	chartSpecs["data"][0]["values"] = fixed_data;
	res.status(200).json(chartSpecs);
});


router.post('/barChart', (req, res) => {
	chartSpecs = barchart.barChartTemplate({ "width": 600, "height": 500 })
	let fixed_data = [];

	fixed_data = req.body.data[Object.keys(req.body.data)].map((x, index) => ({ "category": index, "amount": x, c: Object.keys(req.body.data) }));
	chartSpecs["data"][0]["values"] = fixed_data;

	res.status(200).json(chartSpecs);
});


router.post('/stackedBarChart', (req, res) => {
	chartSpecs = stackedbarchart.stackedBarChartTemplate({ "width": 600, "height": 500 })
	let fixed_data = [];

	for (let i = 0; i < Object.keys(req.body.data).length; i++) {
		fixed_data = fixed_data.concat(req.body.data[Object.keys(req.body.data)[i]].map((x, index) => ({ "x": index, "y": x, "c": Object.keys(req.body.data)[i] })));
	}

	chartSpecs["data"][0]["values"] = fixed_data;
	res.status(200).json(chartSpecs);
});


router.post('/areaChart', (req, res) => {
	chartSpecs = areachart.areaChartTemplate({ "width": 600, "height": 500 })
	let fixed_data = [];

	fixed_data = req.body.data[Object.keys(req.body.data)].map((x, index) => ({ "u": index + 1, "v": x, c: Object.keys(req.body.data) }));
	chartSpecs["data"][0]["values"] = fixed_data;

	res.status(200).json(chartSpecs);
});


router.post('/stackedAreaChart', (req, res) => {
	chartSpecs = stackedareachart.stackedAreaChartTemplate({ "width": 600, "height": 500 })
	let fixed_data = [];

	for (let i = 0; i < Object.keys(req.body.data).length; i++) {
		fixed_data = fixed_data.concat(req.body.data[Object.keys(req.body.data)[i]].map((x, index) => ({ "x": index, "y": x, c: Object.keys(req.body.data)[i] })));
	}

	chartSpecs["data"][0]["values"] = fixed_data;
	res.status(200).json(chartSpecs);
});


router.post('/donutChart', (req, res) => {
	chartSpecs = donutchart.donutChartTemplate({ "width": 200, "height": 200 })
	let fixed_data = [];

	for (let i = 0; i < Object.keys(req.body.data).length; i++) {
		fixed_data = fixed_data.concat({ "id": i + 1, "field": req.body.data[Object.keys(req.body.data)[i]].reduce((a, b) => a + b, 0), c: Object.keys(req.body.data)[i] });
	}

	chartSpecs["data"][0]["values"] = fixed_data;
	res.status(200).json(chartSpecs);
});


router.post('/histogramChart', (req, res) => {
	chartSpecs = histogramchart.histogramChartTemplate({ "width": 600, "height": 450 })
	let fixed_data = [];
	let maximum = Math.max(...req.body.data[Object.keys(req.body.data)]);
	let minimum = Math.min(...req.body.data[Object.keys(req.body.data)]);
	let range = Math.max(maximum, Math.abs(minimum));

	fixed_data = req.body.data[Object.keys(req.body.data)].map((x, index) => ({ "u": x, c: Object.keys(req.body.data) }));
	chartSpecs["data"][0]["values"] = fixed_data;
	chartSpecs["signals"][0]["bind"]["min"] = -0.1 * range;
	chartSpecs["signals"][0]["bind"]["max"] = 0.1 * range;
	chartSpecs["signals"][1]["bind"]["min"] = 0.001 * range;
	chartSpecs["signals"][1]["bind"]["max"] = 0.4 * range;
	chartSpecs["signals"][1]["bind"]["step"] = 0.001 * range;
	chartSpecs["signals"][1]["value"] = 0.1 * range;
	chartSpecs["data"][1]["transform"][0]["extent"] = [-range, range];
	chartSpecs["scales"][0]["domain"] = [-range, range];

	res.status(200).json(chartSpecs);
});


router.post('/boxPlotChart', (req, res) => {
	chartSpecs = boxplotchart.boxPlotChartTemplate({ "width": 500, "padding": 5 })

	let fixed_data = [];
	let keys = Object.keys(req.body.data);
	let data_length = req.body.data[keys[0]].length;

	for (let i = 0; i < data_length; i++) {
		let added_obj = {};
		for (let j = 0; j < keys.length; j++) {
			added_obj[keys[j]] = req.body.data[keys[j]][i];
			// added_obj.c =keys[j]
		}
		fixed_data = fixed_data.concat(added_obj);
	}

	chartSpecs["signals"][0]["value"] = keys;
	chartSpecs["data"][0]["values"] = fixed_data;

	res.status(200).json(chartSpecs);
});


router.post('/contourPlotChart', (req, res) => {
	chartSpecs = contourplotchart.contourPlotChartTemplate({ "width": 500, "height": 450 })

	let fixed_data = [];
	let keys = Object.keys(req.body.data);
	let data_length = req.body.data[keys[0]].length;

	for (let i = 0; i < data_length; i++) {
		let added_obj = {};
		added_obj[keys[0]] = req.body.data[keys[0]][i];
		added_obj[keys[1]] = req.body.data[keys[1]][i];
		fixed_data = fixed_data.concat(added_obj);
	}

	chartSpecs["data"][0]["values"] = fixed_data;
	chartSpecs["data"][0]["transform"][0]["expr"] = "datum['" + keys[0] + "'] != null && datum['" + keys[1] + "'] != null"
	chartSpecs["data"][1]["transform"][0]["x"]["expr"] = "scale('x', datum." + keys[0] + ")";
	chartSpecs["data"][1]["transform"][0]["y"]["expr"] = "scale('x', datum." + keys[1] + ")"
	chartSpecs["scales"][0]["domain"]["field"] = keys[0];
	chartSpecs["scales"][1]["domain"]["field"] = keys[1];
	chartSpecs["axes"][0]["title"] = keys[0];
	chartSpecs["axes"][1]["title"] = keys[1];
	chartSpecs["marks"][1]["encode"]["update"]["x"]["field"] = keys[0];
	chartSpecs["marks"][1]["encode"]["update"]["y"]["field"] = keys[1];

	res.status(200).json(chartSpecs);
});


router.post('/scatterPlotChart', (req, res) => {
	chartSpecs = scatterplotchart.scatterPlotChartTemplate({ "width": 600, "height": 500 })

	let fixed_data = [];
	let keys = Object.keys(req.body.data);
	let data_length = req.body.data[keys[0]].length;

	for (let i = 0; i < data_length; i++) {
		let added_obj = {};
		for (let j = 0; j < keys.length; j++) {
			added_obj[keys[j]] = req.body.data[keys[j]][i];
		}
		fixed_data = fixed_data.concat(added_obj);
	}

	chartSpecs["data"][0]["values"] = fixed_data;
	chartSpecs["signals"][0]["value"] = keys[0];
	chartSpecs["signals"][0]["bind"]["options"] = keys;
	chartSpecs["signals"][1]["value"] = keys[1];
	chartSpecs["signals"][1]["bind"]["options"] = keys;
	chartSpecs["data"][0]["transform"][0]["expr"] = "xField + ': ' + datum[xField] + ', ' + yField + ': ' + datum[yField]";

	res.status(200).json(chartSpecs);
});

module.exports = router;

