'use strict';

const formatDate = require( '../utils/format-date.js' );

let crawlerControlsView = {
  $start: {},
  $stop: {},
  $cover: {},
  startTime: undefined,

  init: function() {
    this.$start = $( '#crawler-start' );
    this.$stop = $( '#crawler-stop' );
    this.$cover = $( '#running-cover' );

    // Activate the start button
    this.$start.prop( 'disabled', false );
    this.startCrawlerListener();
    this.stopCrawlerListener();
  },

  startCrawlerListener: function() {
    this.$start.click( function() {
      if ( crawlerOptions.deleteQueueFile === true ) {
        fs.renameSync( 'mysavedqueue.json', 'oldsavedqueue.json' );
        updateStats( 0, 0 );
        crawler.queue = new SimpleCrawler.queue();
      }

      crawlerControlsView.startTime = formatDate();
      crawler.start();
      crawlerControlsView.$cover.hide();
      crawlerControlsView.$start.prop( 'disabled', true );
      crawlerControlsView.$stop.prop( 'disabled', false );
    } );
  },

  stopCrawlerListener: function() {
    this.$stop.click( function() {
      crawler.stop();
      crawler.queue.freeze( 'mysavedqueue.json', () => {
        
      } );
      crawlerControlsView.$cover.show();
      crawlerControlsView.$stop.prop( 'disabled', true );
      crawlerControlsView.$start.prop( 'disabled', false );
    } );
  },

  getStartTime: function() {
    return this.startTime;
  }

};

module.exports = crawlerControlsView;