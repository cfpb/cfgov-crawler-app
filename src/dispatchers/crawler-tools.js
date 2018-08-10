'use strict';

const crawlerControlsView = require( '../views/crawler-controls-view.js' );

let crawlerTools = {
  getCrawlerStartTime: function() {
    return crawlerControlsView.getStartTime();
  }

}

module.exports = crawlerTools;