var mainApp = angular.module("mainApp", ['ui-notification', 'ui.bootstrap'])
	.config(NotificationProvider => {
		NotificationProvider.setOptions({
			delay: 6000,
			positionX: 'center',
			positionY: 'top'
		});
	});

mainApp.controller('mainAppController', function ($rootScope, $scope, $compile, $q, $http, Notification, $uibModal) {
	const ct = $scope;

	ct.showPublishIssuesPopover = false;
	ct.password = {};

	/**
	 * **Constants**
	 */
	const API_KEY = 'AIzaSyDUWrqIHmcVhEFmVUgkgRrQU7_SM6H1Hd8';
	const defaultOptions = [
		{
			'name': 'Placeholder text',
			'text': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
			'type': 'Text'
		},
		{
			'name': 'Map of a place or address',
			'src': 'https://www.google.com/maps/embed/v1/place?key=' + API_KEY + '&q=Thessaloniki',
			'type': 'Service'
		},
		{
			'name': 'Map of search results',
			'src': 'https://www.google.com/maps/embed/v1/search?key=' + API_KEY + '&q=record+stores+in+Seattle',
			'type': 'Service'
		},
		{
			'name': 'Map of driving directions',
			'src': 'https://www.google.com/maps/embed/v1/directions?key=' + API_KEY + '&origin=Oslo+Norway&destination=Telemark+Norway',
			'type': 'Service'
		},
		{
			'name': 'Map of specific area',
			'src': 'https://www.google.com/maps/embed/v1/view?key=' + API_KEY + '&center=-33.8569,151.2152&zoom=18',
			'type': 'Service'
		},
		{
			'name': 'Street View',
			'src': 'https://www.google.com/maps/embed/v1/streetview?key=' + API_KEY + '&location=46.414382,10.013988',
			'type': 'Service'
		},
		{
			'name': 'Temperature Map',
			'src': 'https://darksky.net/map-embed/@temperature,39.000,-95.000,4.js?embed=true&timeControl=true&fieldControl=true&defaultField=temperature&defaultUnits=_c',
			'type': 'Service'
		}
	];

	// ct.currentSelectedOption = {};

	/**
	 * ************************************************
	 * ************************************************** *TASOS STARTS HERE* ************************************
	 * **************************************************
	 */
	ct.showFullScreenSpinner = function () {
		ct.fullScreenSpinner = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			backdrop: 'static',
			templateUrl: 'fullScreenModal.html',
			size: 'lg',
			scope: $scope,
			windowClass: 'background-transparent my-modal-centered opacity-1 padding-0'
		});
		ct.fullScreenSpinner.result.then(() => { }).catch((err) => { console.log(err) })
	}

	ct.closeFullScreenSpinner = function () {
		ct.fullScreenSpinner.close();
	}

	/**
	 * ********** *** **HTTP Calls** *********************
	 */
	ct.getAppDesignData = function () {
		return $http({
			method: 'GET',
			url: `/api/design`,
			params: { applicationId: ct.applicationId, developerUsername: ct.developerUsername },
		})
	}

	ct.addRowAPI = function () {
		return $http({
			method: 'PATCH',
			url: `/api/add-row/${ct.designId}`
		})
	}

	ct.removeRowAPI = function (rowId) {
		return $http({
			method: 'PATCH',
			url: `/api/remove-row/${ct.designId}`,
			data: { rowId }
		})
	}

	ct.addColumnAPI = function (rowId) {
		return $http({
			method: 'PATCH',
			url: `/api/add-column/${ct.designId}`,
			data: { rowId }
		})
	}

	ct.removeColumnAPI = function (rowId, columnId) {
		return $http({
			method: 'PATCH',
			url: `/api/remove-column/${ct.designId}`,
			data: { rowId, columnId }
		})
	}

	ct.setColumnAPI = function (rowId, col) {
		return $http({
			method: 'PATCH',
			url: `/api/set-column/${ct.designId}`,
			data: { rowId, col }
		})
	}

	ct.makeGitlabIssuesAPI = function (password) {
		return $http({
			method: 'POST',
			url: `/api/make-issues/${ct.designId}`,
			data: { developerUsername: ct.developerUsername, password }
		})
	}

	/**
	 * ********** *** **Init** *********************
	 */
	ct.init = function () {
		const query = queryToJson(window.location.search)
		if (query.applicationId && query.developerUsername) {
			ct.showFullScreenSpinner();
			ct.applicationId = query.applicationId;
			ct.developerUsername = query.developerUsername;
			ct.getAppDesignData()
				.then(data => {
					ct.designId = data.data._id
					ct.applicationName = data.data.application.name;
					ct.grid = data.data.sketch.grid;
					ct.options = defaultOptions.concat([
						...data.data.selectedComponents.map(c => ({ ...c, type: 'Component', name: c.tags.map((tag, i) => tag).filter(tag => tag !== '').join('.') })),
						...data.data.vegaPlots.map(v => ({ ...v, name: v.vegaData.name, type: 'Plot' })),
						...data.data.tableViews.map(v => ({ ...v, name: v.name, type: 'TableView' })),
						...data.data.instanceViews.map(v => ({ ...v, name: v.name, type: 'InstanceView' }))
					]).map((o, i) => ({ ...o, id: i }))
					setTimeout(() => {
						ct.renderSavedColumns();
					}, 200)
				})
				.catch(err => {
					console.log(err);
					Notification.error('Error fetching data')
				})
				.finally(() => {
					ct.closeFullScreenSpinner()
				})
		} else {
			alert('You must not access this Sketch App directly from the URL without specifying app 😀');
			window.close();
		}
	}
	ct.init();

	ct.addRow = function () {
		ct.showFullScreenSpinner();
		ct.addRowAPI()
			.then(data => {
				ct.grid.rows.push(data.data.sketch.grid.rows[data.data.sketch.grid.rows.length - 1])
			})
			.catch(err => {
				Notification.error('Error adding row')
			})
			.finally(() => {
				ct.closeFullScreenSpinner()
			})
	}

	ct.removeRow = function (rowId) {
		ct.showFullScreenSpinner();
		ct.removeRowAPI(rowId)
			.then(data => {
				const index = ct.grid.rows.findIndex(r => r._id === rowId);
				ct.grid.rows.splice(index, 1);
			})
			.catch(err => {
				Notification.error('Error removing row')
			})
			.finally(() => {
				ct.closeFullScreenSpinner()
			})
	}

	ct.addCol = function (rowId) {
		ct.showFullScreenSpinner();
		ct.addColumnAPI(rowId)
			.then(data => {
				const localRowIndex = ct.grid.rows.findIndex(r => r._id === rowId);
				const serverRowIndex = data.data.sketch.grid.rows.findIndex(r => r._id === rowId);
				const serverColsLength = data.data.sketch.grid.rows[serverRowIndex].cols.length;
				ct.grid.rows[localRowIndex].cols.push(data.data.sketch.grid.rows[serverRowIndex].cols[serverColsLength - 1]);
				// Here should rerender the other columns of the same row (if any)
				setTimeout(() => {
					ct.grid.rows.forEach(row => {
						if (row._id === rowId) {
							row.cols.forEach((col, i) => {
								if (i !== row.cols.length - 1) {
									if (col.type === 'Plot' || col.type === 'Service') {
										ct.renderColumnContent(rowId, col)
									}
								}
							})
						}
					})
				}, 150)
			})
			.catch(err => {
				Notification.error('Error adding column')
			})
			.finally(() => {
				ct.closeFullScreenSpinner()
			})
	}

	ct.removeCol = function (rowId, colId) {
		ct.showFullScreenSpinner();
		ct.removeColumnAPI(rowId, colId)
			.then(data => {
				const rowIndex = ct.grid.rows.findIndex(r => r._id === rowId);
				const colIndex = ct.grid.rows[rowIndex].cols.findIndex(c => c._id === colId);
				ct.grid.rows[rowIndex].cols.splice(colIndex, 1);
				// Here should rerender the other columns of the same row (if any)
				setTimeout(() => {
					ct.grid.rows.forEach(row => {
						if (row._id === rowId) {
							row.cols.forEach((col, i) => {
								if (col.type === 'Plot' || col.type === 'Service') {
									ct.renderColumnContent(rowId, col)
								}
							})
						}
					})
				}, 150)
			})
			.catch(err => {
				Notification.error('Error removing column')
			})
			.finally(() => {
				ct.closeFullScreenSpinner()
			})
	}

	ct.calcCol = function (totalCols) {
		return `col-md-${Math.floor(12 / totalCols)}`
	}

	ct.renderSavedColumns = function () {
		if (ct.grid) {
			ct.grid.rows.forEach(row => {
				row.cols.forEach(col => {
					ct.renderColumnContent(row._id, col)
				})
			})
		}
	}

	ct.renderColumnContent = function (rowId, col, updateColData = false) {

		$(`#col-${col._id} .column-content`).children().remove();

		if (updateColData) {
			ct.showFullScreenSpinner();
			let content;
			col.type = col.selectedOption.type;
			if (col.type === 'Plot') {
				content = col.selectedOption;
				render(col.selectedOption.vegaData, `#col-${col._id}`);
			} else {
				switch (col.type) {
					case 'Service':
						const { width } = getElementDimensions(`#col-${col._id}`);
						content = `<iframe id="content-${col._id}" frameborder="0" width="94%" height="${0.65 * width}px" style="border:0" src="${col.selectedOption.src}" allowfullscreen></iframe>`;
						break;
					case 'Text':
						content = `<p id="content-${col._id}">${col.selectedOption.text}</p>`;
						break;
					case 'Component':
						content = col.selectedOption.code;
						break;
					case 'TableView':
						content = returnHtmlTable(col.selectedOption);
						break;
					case 'InstanceView':
						content = returnHtmlDataInstance(col.selectedOption);
						break;
					default:
						break;
				}
				$(`#col-${col._id} .column-content`).append(content);
			}
			col.content = content;
			if (col.type === 'Component') { col.componentId = col.selectedOption._id }
			ct.setColumnAPI(rowId, col)
				.then(data => {
				})
				.catch(err => {
					Notification.error('Error updating column')
				})
				.finally(() => {
					ct.closeFullScreenSpinner()
				})

			// Else just render the content
		} else {
			if (col.type === 'Plot') {
				render(col.content.vegaData, `#col-${col._id}`);
			} else {
				$(`#col-${col._id} .column-content`).append(col.content);
			}
		}

	}

	// Function to deploy the Vega graph
	function render(spec, selector) {
		const { width } = getElementDimensions(selector)
		view = new vega.View(vega.parse({
			...spec,
			width,
			height: width,
			padding: 0,
			autosize: { type: 'fit' },
			...(!spec.schema ? { $schema: spec.schema } : {})
		})).renderer('canvas').initialize(`${selector} .column-content`).hover().run();
	}

	function getElementDimensions(selector, substractPadding = true) {
		const element = document.querySelector(selector);
		if (element) {
			const offsetHeight = element.offsetHeight;
			const offsetWidth = element.offsetWidth
			let width = offsetWidth; let height = offsetHeight;
			if (substractPadding) {
				const padding = window.getComputedStyle(element, null).getPropertyValue('padding');
				if (padding && padding !== '') {
					const spl = padding.split(' ');
					const paddingY = Number(spl[0].slice(0, -2));
					const paddingX = Number(spl[1].slice(0, -2));
					width = offsetWidth - paddingX; height = offsetHeight - paddingY;
				}
			}
			return { height, width }
		} else { return {} }
	}

	function queryToJson(queryString) {
		if (queryString.indexOf('?') > -1) {
			queryString = queryString.split('?')[1];
		}
		var pairs = queryString.split('&');
		var result = {};
		pairs.forEach(function (pair) {
			pair = pair.split('=');
			result[pair[0]] = decodeURIComponent(pair[1] || '');
		});
		return result;
	}

	ct.setShowPublishIssuesPopover = function (bool) {
		ct.showPublishIssuesPopover = bool;
	}

	ct.makeGitlabIssues = function () {
		ct.showFullScreenSpinner();
		ct.makeGitlabIssuesAPI(ct.password.text)
			.then(() => {
				Notification.success('Gitlab issues done!')
				if (confirm('Gitlab issues done. Do you want to redirect to Gitlab?')) {
					window.open(`${window.location.protocol}//${window.location.hostname}:8080`, '_blank')
				}
			})
			.catch(err => {
				Notification.error(err.data.message ? err.data.message : 'Something went wrong!')
				console.log(err)
			})
			.finally(() => {
				ct.closeFullScreenSpinner();
				ct.setShowPublishIssuesPopover(false);
			})
	}

	ct.onKeyPressPassword = function (evt) {
		if (evt.keyCode === 13 && ct.password && ct.password.text && ct.password.text !== '') {
			ct.makeGitlabIssues();
		}
	}

	function returnHtmlTable(colSelected) {
		const { data, columnOrder } = colSelected;
		let str = `<table class="table" style="word-break: break-all;"><thead>`
		columnOrder.forEach(col => {
			str += `<th>${col}</th>`
		})
		str += `</thead><tbody>`
		data.forEach(row => {
			str += `<tr>`
			columnOrder.forEach(col => {
				str += `<td>${row[col]}</td>`
			})
			str += `</tr>`
		})
		str += `</tbody></table>`

		return str;
	}

	function returnHtmlDataInstance(colSelected) {
		const { data, columnOrder } = colSelected;
		let str = `<div>`
		columnOrder.forEach(col => {
			str += `<div>
			<span style="font-weight:bold;">${col}:</span>&nbsp;
			<span>${data[col]}</span>
			</div>`
		})
		str += `</div>`

		return str;
	}

	/**
	 * ************************************************
	 * ************************************************** *TASOS ENDS HERE* ************************************
	 * **************************************************
	 */

});

