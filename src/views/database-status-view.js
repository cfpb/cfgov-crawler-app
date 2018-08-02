'use strict';

let databaseStatusView = {
  $dbStatus: {},
  initialStatus: undefined,

  init: function() {
    this.$dbStatus = $( '#db-status-span' );
    this.updateStatus( this.initialStatus );
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
  }

};

module.exports = databaseStatusView;