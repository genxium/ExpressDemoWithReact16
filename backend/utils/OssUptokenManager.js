'use strict';

class OssUptokenManager {
  constructor(props) {
    this.props = props;
  }

  createUptokenAsync(constrainDict) {
    const instance = this;
    return this._createUptokenAsyncImpl(constrainDict); 
  }
}

exports.default = OssUptokenManager;
