'use strict';

const dbTools = require( '../dispatchers/database-tools.js' );

let databaseStatusView = {
  $dbStatus: {},
  $dbRows: {},

  init: function() {
    this.$dbStatus = $( '#db-info_status-span' );
    this.$dbRows = $( '#db-info-rows' );
    this.updateStatus( dbTools.getConnectionStatus() );
    this.updateRowCount();
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

  updateRowCount: function() {
    dbTools.getRows()
    .then( function( numRows ) {
      let rowText = numRows + ' rows found in database';
      databaseStatusView.$dbRows.text( rowText );
    }, function( err ) {
      console.log( err );
    } );
  }

};

module.exports = databaseStatusView;