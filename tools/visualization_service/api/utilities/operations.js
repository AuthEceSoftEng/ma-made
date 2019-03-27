const compute = require('compute.io');

module.exports = {
  get_quantile: function(data, quantile){
    return compute.quantile(data, quantile);
  },
  get_sum: function(data){
    return compute.sum(data);
  },
  get_min: function(data){
    return compute.min(data);
  },
  get_max: function(data){
    return compute.max(data);
  },
  get_max_index: function(data){
    return compute.argmax(data);
  },
  evaluate_polynomial: function(coef, list_of_vals){
    return compute.polyval(coef, list_of_vals);
  }
};