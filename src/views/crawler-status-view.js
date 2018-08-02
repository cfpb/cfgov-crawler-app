'use strict';

let crawlerStatusView = {
  $stats: {},

  init: function() {
    this.$stats = $( '#stats-line' );
  },

  updateStats: function( fetched, queued ) {
    var html = '<strong>' + fetched + '</strong> pages fetched, ';
    html += '<strong>' + queued + '</strong> total queued URLs';
    crawlerStatusView.$stats.html( html );
  }
  
}

module.exports = crawlerStatusView;