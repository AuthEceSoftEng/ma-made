const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const Component = {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'ReusableComponent'
}

const Dataset = {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Datasets'
}

const Service = {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Services'
}

const VegaPlot = {
  vegaData: {
    type: mongoose.Schema.Types.Mixed
  },
  datasetId: {
    type: String
  },
  plottedColumns: {
    type: [String]
  },
  graphType: {
    type: String
  }
}

const TableView = {
  data: { type: mongoose.Schema.Types.Mixed },
  name: { type: String },
  columnOrder: { type: [String] }
}

const InstanceView = {
  data: { type: mongoose.Schema.Types.Mixed },
  name: { type: String },
  columnOrder: { type: [String] }
}

const SketchCol = {
  type: {
    type: String,
    enum: ['empty', 'Plot', 'Component', 'Service', 'Text', 'TableView', 'InstanceView']
  },
  content: {
    type: String
  },
  componentId: {
    type: mongoose.Schema.Types.ObjectId
  }
}

const DesignSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'Developer',
    required: true
  },
  application: {
    type: mongoose.Schema.ObjectId,
    ref: 'Application',
    required: true
  },
  selectedComponents: {
    type: [Component]
  },
  selectedDatasets: {
    type: [Dataset]
  },
  selectedServices: {
    type: [Service]
  },
  vegaPlots: { type: [VegaPlot] },
  tableViews: { type: [TableView] },
  instanceViews: { type: [InstanceView] },
  sketch: {
    grid: {
      rows: [
        {
          cols: [SketchCol]
        }
      ]
    },
  }
});

DesignSchema.index({ owner: 1, application: 1 }, { unique: true });
const Design = mongoose.model('Design', DesignSchema);
module.exports = Design;
