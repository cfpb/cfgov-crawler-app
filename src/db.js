'use strict';

const sqlite3 = require( 'sqlite3' ).verbose();

let db = new sqlite3.Database( './database/cfpb-site.db', ( err ) => {
  if ( !err ) {
    console.log( 'Database connected!' );
  }
} );


module.exprts = db;
