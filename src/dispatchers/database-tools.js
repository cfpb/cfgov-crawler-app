'use strict';

let databaseModel = require( '../models/database-model.js' );

let databaseTools = {

  closeDatabase: function() {
    databaseModel.closeConnection();
  },

  getDatabaseStats: function() {
    return new Promise( function( resolve, reject ) {
      databaseModel.getDatabaseStats()
      .then( function( rows ) {
        resolve( rows )
        }, function() {
          reject( err )
        } )
    } );
  },

  getConnectionStatus: function() {
    return databaseModel.connectionStatus;
  },

  /**
   * Update database using page object
   */
  updateFromPageObj: function( pageObj ) {
    return new Promise( function( resolve, reject ) {
      databaseModel.updateFromPageObj( pageObj ).
      then( function( rows ) {
        resolve( rows );
      }, function( err ) {
        console.log( err );
      } );
    } )
  }

}

module.exports = databaseTools;