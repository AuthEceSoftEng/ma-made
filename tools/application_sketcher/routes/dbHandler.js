var express = require('express');
var router = express.Router();
var mongo = require('mongoskin');
const ObjectId = require('mongodb').ObjectID;
const request = require('request');
var db = mongo.db(process.env.mongo_url, { native_parser: true });
db.bind('developers');
db.bind('designs');
db.bind('datasets');
db.bind('services')
db.bind('reusablecomponents');


/**
 * @description Get design data of an app for a developer
 * @param req.query.developerUsername
 * @param req.query.applicationId
 */
router.get('/design', (req, res) => {
	db.developers.findOne({ 'username': req.query.developerUsername }, (err, developer) => {
		if (err) {
			return res.status(err.status ? err.status : 500).json(err.message ? err.message : err);
		} else {
			if (developer) {
				db.designs.aggregate([
					{
						$match: {
							owner: ObjectId(developer._id),
							application: ObjectId(req.query.applicationId)
						}
					},
					{
						$lookup: {
							from: "applications",
							localField: "application",
							foreignField: "_id",
							as: "application"
						}
					},
					{ $unwind: '$application' },
					{
						$lookup: {
							from: "reusablecomponents",
							localField: "selectedComponents",
							foreignField: "_id",
							as: "selectedComponents"
						}
					}
				], (err1, designs) => {
					if (err1) return res.status(err1.status ? err1.status : 500).json(err1.message ? err1.message : err1);
					return res.json(designs[0]);
				})
			} else {
				return Promise.reject({ status: 400, message: 'Developer not found' })
			}
		}
	})
});

/**
 * @description Add row to sketch of app
 * @param req.params.designId
 */
router.patch('/add-row/:designId', (req, res) => {
	db.designs.findOneAndUpdate({ _id: ObjectId(req.params.designId) },
		{
			$push: {
				'sketch.grid.rows': {
					_id: ObjectId(),
					cols: [{ type: 'empty', _id: ObjectId() }]
				}
			}
		}, { returnOriginal: false, projection: { 'sketch': 1 } }, (err1, design) => {
			if (err1) return res.status(500).json(err1);
			return res.json(design.value)
		})
});

/**
 * @description Remove row from sketch of app
 * @param req.params.designId
 * @param req.body.rowId
 */
router.patch('/remove-row/:designId', (req, res) => {
	db.designs.findOneAndUpdate({ _id: ObjectId(req.params.designId) },
		{
			$pull: {
				'sketch.grid.rows': { _id: ObjectId(req.body.rowId) }
			}
		}, { returnOriginal: false, projection: { 'sketch': 1 } }, (err1, design) => {
			if (err1) return res.status(500).json(err1);
			return res.json(design.value)
		})
});

/**
 * @description Add col to sketch of app
 * @param req.params.designId
 * @param req.body.rowId
 */
router.patch('/add-column/:designId', (req, res) => {
	db.designs.findOneAndUpdate(
		{
			_id: ObjectId(req.params.designId),
			'sketch.grid.rows._id': ObjectId(req.body.rowId)
		},
		{
			$push: {
				'sketch.grid.rows.$.cols': {
					type: 'empty',
					_id: ObjectId()
				}
			}
		}, { returnOriginal: false, projection: { 'sketch': 1 } }, (err1, design) => {
			if (err1) return res.status(500).json(err1);
			return res.json(design.value)
		})
});

/**
 * @description Remove col from sketch of app
 * @param req.params.designId
 * @param req.body.rowId
 * @param req.body.columnId
 */
router.patch('/remove-column/:designId', (req, res) => {
	db.designs.findOneAndUpdate({
		_id: ObjectId(req.params.designId),
		'sketch.grid.rows._id': ObjectId(req.body.rowId)
	},
		{
			$pull: {
				'sketch.grid.rows.$.cols': { _id: ObjectId(req.body.columnId) }
			}
		}, { returnOriginal: false, projection: { 'sketch': 1 } }, (err1, design) => {
			if (err1) return res.status(500).json(err1);
			return res.json(design.value)
		})
});

/**
 * @description Remove col from sketch of app
 * @param req.params.designId
 * @param req.body.rowId
 * @param req.body.col
 * @param req.body.col.type
 * @param req.body.col.content
 */
router.patch('/set-column/:designId', (req, res) => {
	let ok = false;
	db.designs.findOne({ _id: ObjectId(req.params.designId) }, { sketch: 1 }, (err1, design) => {
		if (err1) return res.status(500).json(err1);
		for (let r = 0; r < design.sketch.grid.rows.length; r++) {
			if (String(design.sketch.grid.rows[r]._id) === String(req.body.rowId)) {
				for (let c = 0; c < design.sketch.grid.rows[r].cols.length; c++) {
					if (String(design.sketch.grid.rows[r].cols[c]._id) === String(req.body.col._id)) {
						delete design.sketch.grid.rows[r].cols[c].componentId;
						design.sketch.grid.rows[r].cols[c].type = req.body.col.type;
						design.sketch.grid.rows[r].cols[c].content = req.body.col.content;
						if (req.body.col.type === 'Component') {
							design.sketch.grid.rows[r].cols[c].componentId = ObjectId(req.body.col.componentId);
						}
						ok = true;
						break;
					}
				}
			}
			if (ok) break;
		}

		db.designs.findOneAndUpdate({ _id: ObjectId(req.params.designId) },
			{
				$set:
					{ sketch: design.sketch }
			},
			{ returnOriginal: false, projection: { 'sketch': 1 } },
			(err2, _design) => {
				if (err2) return res.status(500).json(err2);
				return res.json(_design.value)
			}
		)
	})
});

/**
 * @description Remove col from sketch of app
 * @param req.params.designId
 * @param req.body.developerUsername
 * @param req.body.password - The gitlab password
 */
router.post('/make-issues/:designId', (req, res) => {

	// Authenticate with gitlab
	request.post({
		url: process.env.apps_vm_url + '/auth/user/',
		form: {
			username: req.body.developerUsername,
			password: req.body.password
		}
	}, function (error, response, body) {

		if (error) {
			return res.status(500).json({ message: 'Error communicating with gitlab ' })
		} else {
			if (response.statusCode != 201) {
				return res.status(401).json({ message: 'Wrong credentials' })
			} else {
				const gitlabToken = JSON.parse(body).user.private_token

				// Get the components and make issues
				db.designs.aggregate([
					{
						$match: {
							_id: ObjectId(req.params.designId),
						}
					},
					{
						$project: { application: 1, sketch: 1, selectedDatasets: 1, selectedServices: 1 }
					},
					{
						$lookup: {
							from: "applications",
							localField: "application",
							foreignField: "_id",
							as: "application"
						}
					},
					{
						$lookup: {
							from: "datasets",
							localField: "selectedDatasets",
							foreignField: "_id",
							as: "datasets"
						}
					},
					{
						$lookup: {
							from: "services",
							localField: "selectedServices",
							foreignField: "_id",
							as: "services"
						}
					},
					{ $unwind: '$application' },
				], (err1, designs) => {

					if (err1) return res.status(err1.status ? err1.status : 500).json(err1.message ? err1.message : err1);
					const design = designs[0];

					// Make gitlab issues for datasets
					design.datasets.concat(design.services).forEach((obj, dIndex) => {
						let isDataset = dIndex <= design.datasets.length - 1;
						setTimeout(() => {
							makeGitlabIssue(design.application.repo_id, gitlabToken,
								{
									title: `App-Design: Use ${obj.name} ${isDataset ? 'Dataset' : 'Service'}`,
									description: `Name: ${obj.name}\nId: ${obj._id}\nUrl: ${obj.url}\nDescription: ${obj.description}`,
									labels: `${isDataset ? 'design-use-dataset,' : 'design-use-service,'}` + (obj.tags && obj.tags.length > 0 ? obj.tags.map(t => t.text).join(',') : '')
								}, (err3, ok) => {
									if (err3) return res.status(500).json(err3);
									// Last rep
									if (dIndex === design.datasets.length - 1) {
										// Make gitlab issues for components
										const totalRows = design.sketch.grid.rows.length;
										design.sketch.grid.rows.forEach((row, rowIndex) => {
											row.cols.forEach((col, colIndex) => {
												setTimeout(() => {
													makeGitlabIssue(design.application.repo_id, gitlabToken,
														{
															title: `App-Design: Incorporate ${col.type} Column`,
															description: `RowNumber: ${rowIndex}, ColNumber: ${colIndex}\n${decideIssueDescription(col)}`,
															labels: 'design-sketch'
														}, (err4, ok) => {
															if (err4) return res.status(500).json(err4);
															if (rowIndex === totalRows - 1) {
																if (colIndex === design.sketch.grid.rows[totalRows - 1].cols.length - 1) {
																	return res.status(200).send('ok');
																}
															}
														})
												}, 1000 + (1000 * (rowIndex * totalRows + colIndex)))
											})
										})
									}
								})
						}, 1000 * (dIndex))
					})
				})
			}
		}
	})
})

module.exports = router;


function decideIssueDescription(col) {
	switch (col.type) {
		case 'Empty':
			return `Just an empty column`
		case 'Text':
			return col.content;
		case 'Plot':
			return `GraphType: ${col.content.graphType}\nPlotName: ${col.content.vegaData.name}\nVegaData: ${JSON.stringify(col.content.vegaData)}`
		case 'Service':
			return `${col.content}`
		case 'Component':
			return `ComponentId: ${col.componentId}\n${col.content}`
		case 'TableView':
			return col.content;
		case 'InstanceView':
			return col.content;
		default:
			return '';
	}
}

function makeGitlabIssue(repo_id, gitlabToken, { title, labels, description }, callback) {
	request.post({
		url: process.env.apps_vm_url + '/repos/project/' + repo_id + '/issues',
		headers: {
			'TOKEN': gitlabToken
		},
		form: { title, labels, description }
	}, (error, response, body) => {
		if (error) {
			callback(error)
		} else {
			callback(null, 'ok')
		}
	})
}