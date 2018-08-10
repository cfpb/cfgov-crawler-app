'use strict';

const dbTools = require( '../dispatchers/database-tools.js' );
const crawlerTools = require( '../dispatchers/crawler-tools.js' );

let databaseStatusView = {
  $dbStatus: {},
  $dbRows: {},
  $dbNewRows: {},

  init: function() {
    this.$dbStatus = $( '#db-info_status-span' );
    this.$dbRows = $( '#db-info_rows' );
    this.$dbNewRows = $( '#db-info_new-rows' );
    this.updateStatus( dbTools.getConnectionStatus() );
    this.updateDatabaseStats();
  },

  updateStatus: function( status ) {
    if ( status === 'connected' ) {
      this.$dbStatus.addClass( 'success' );
      this.$dbStatus.text( 'Successfully connected!' );
    } else if ( status === 'failure' ) {
      this.$dbStatus.addClass( 'error' );
      this.$dbStatus.text( 'Database connection failed!' );
    } else if ( status === 'no-table' ) {
      this.$dbStatus.addClass( 'error' );
      this.$dbStatus.text( 'Could not create the database table!' );
    }
  },

  updateDatabaseStats: function() {
    dbTools.getDatabaseStats()
    .then( function( rows ) {
      let rowText = rows.length + ' total rows exist in the database';
      let newRowText;
      let newRows = 0;
      let startTime = new Date( crawlerTools.getCrawlerStartTime() );

      databaseStatusView.$dbRows.text( rowText );
      for ( let x = 0; x < rows.length; x++ ) {
        let rowDate = new Date( rows[x].timestamp );
        if ( rowDate > startTime ) {
          newRows++;
        }
      }
      newRowText = newRows + ' rows have been updated/created since the crawler started.'
      databaseStatusView.$dbNewRows.text( newRowText );
    }, function( err ) {
      console.log( err );
    } );
  }

};

module.exports = databaseStatusView;