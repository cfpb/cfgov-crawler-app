'use strict';

const sqlite3 = require( 'sqlite3' ).verbose();
const dbView = require( '../views/database-status-view' );

let databaseTools = {

  // Object reflecting the expected database structure
  databaseStructure: {
    url: 'text primary key', host: 'text', path: 'text', port: 'text',
    protocol: 'text', uriPath: 'text', stateData: 'text', components: 'text',
    hasWordPressContent: 'text', contentLinks: 'text', contentImages: 'text',
    metaTags: 'text', title: 'text', pageHash: 'text', sitemap: 'text',
    timestamp: 'text'
  },

  createConnection: function() {
    return new Promise( function( resolve, reject ) {
      let db = new sqlite3.Database( './database/cfpb-site.db', ( err ) => {
        if ( !err ) {
          console.log( 'Database connected!' );
          dbView.initialStatus = 'connected';
          resolve( db );
        } else {
          dbView.initialStatus = 'failure';
          reject( err );
        }
      } );
    } );
  },

  checkTable: function( db ) {
    return new Promise( function( resolve, reject ) {
      // create table if it's not there
      let columns = Object.keys( databaseTools.databaseStructure );
      let tblSql = 'create table if not exists cfpb ( ';
      for ( let x = 0; x < columns.length; x++ ) {
        tblSql += columns[x] + ' ';
        tblSql += databaseTools.databaseStructure[columns[x]];
        if ( x !== columns.length - 1 ) {
          tblSql += ', ';
        }
      }
      tblSql += ' )';
      db.run( tblSql, [], ( err ) => {
        if ( err ) {
          dbView.initialStatus = 'no-table';
          reject( err );
        } else {
          resolve( db );
        }
      } );
    } );
  },

  init: function() {
    return new Promise( function( resolve, reject ) {
      databaseTools.createConnection()
      .then( function( db ) {
        databaseTools.checkTable( db )
        .then( function( db ) {
          databaseTools.connection = db;
          console.log( 'Database init() succeeded!' );
          resolve();
        }, function( err ) {
          console.log( 'Database checkTable failed!', err );
          reject();
        } );
      }, function( err ) {
        console.log( 'Database createConnection() failed!' );
        reject();
      } )
    } );
  },

  connection: undefined,

  /**
   * Update database
   */
  update: function( sql, params ) {
    this.connection.run( sql, params, ( err, rows ) => {
      if ( err ) throw err;
      console.log( 'Updated DB: ' + params[6] );
    } );
  },

  createSqlFromPageObj: function( pageObj ) {
    let sql,
        params = [],
        itemMap = Object.keys( this.databaseStructure );

    sql = 'INSERT OR REPLACE INTO cfpb(' + itemMap.join( ', ' );
    sql += ' ) values( ';
    sql += ( itemMap.map( function() { return '?'; } ) ).join( ', ' );
    sql += ')'

    itemMap.forEach( function( elem ) {
      var value = pageObj[elem];
      if ( typeof value  === 'boolean' ) {
        value = String( value );
      } else if ( typeof value === 'object' ) {
        value = JSON.stringify( value );
      }
      params.push( value );
    } );

    // console.log( sql, params );

    return {
      sql: sql,
      params: params
    };
  },

  /**
   * Update database using page object
   */
  updateFromPageObj: function( pageObj ) {
    let sqlObj = this.createSqlFromPageObj( pageObj );
    this.update( sqlObj.sql, sqlObj.params );
  }

};

module.exports = databaseTools;

