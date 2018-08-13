'use strict';

const sqlite3 = require( 'sqlite3' ).verbose();
const electron = require( 'electron' );
const path = require( 'path' );
const fs = require( 'fs' );
// const userDir = ( electron.app || electron.remote.app ).getPath( 'userData' );
// const dbFolderPath = path.join( userDir, '/cfgov-crawler/' );
// const dbPath = path.join( dbFolderPath, 'cfpb-site.db');


let databaseModel = {
  connectionStatus: undefined,
  dbFolderPath: undefined,
  dbPath: undefined,
  connection: undefined,


  // Object reflecting the expected database structure
  databaseStructure: {
    url: 'text primary key', host: 'text', path: 'text', port: 'text',
    protocol: 'text', uriPath: 'text', stateData: 'text', components: 'text',
    hasWordPressContent: 'text', contentLinks: 'text', contentImages: 'text',
    metaTags: 'text', title: 'text', pageHash: 'text', sitemap: 'text',
    timestamp: 'text'
  },

  closeConnection: function() {
    databaseModel.connection.close( ( err ) => {
      if ( err ) {
        console.error( err.message );
      }
      console.log( 'Closed the database connection.' );
    });
  },

  createConnection: function() {
    return new Promise( function( resolve, reject ) {
      let db = new sqlite3.Database( databaseModel.dbPath, ( err ) => {
        if ( !err ) {
          console.log( 'Database connected!' );
          databaseModel.connectionStatus = 'connected';
          console.log( databaseModel.connectionStatus );
          resolve( db );
        } else {
          databaseModel.connectionStatus = 'failure';
          reject( err );
        }
      } );
    } );
  },

  checkTable: function( db ) {
    return new Promise( function( resolve, reject ) {
      // create table if it's not there
      let columns = Object.keys( databaseModel.databaseStructure );
      let tblSql = 'create table if not exists cfpb ( ';
      for ( let x = 0; x < columns.length; x++ ) {
        tblSql += columns[x] + ' ';
        tblSql += databaseModel.databaseStructure[columns[x]];
        if ( x !== columns.length - 1 ) {
          tblSql += ', ';
        }
      }
      tblSql += ' )';
      db.run( tblSql, [], ( err ) => {
        if ( err ) {
          this.connectionStatus = 'no-table';
          reject( err );
        } else {
          resolve( db );
        }
      } );
    } );
  },

  _checkDataDirectory: function( ) {
    return new Promise( function( resolve, reject ) {
      fs.mkdir( databaseModel.dbFolderPath, ( err, fd ) => {
        if ( err && err.code !== 'EEXIST') {
          console.log( 'Error creating directory!', err );
          reject( err );
        } else {
          resolve( );
        }
      } );
    });
  },

  init: function( directory ) {
    databaseModel.dbFolderPath = path.join( directory, 'database' );
    databaseModel.dbPath = path.join( databaseModel.dbFolderPath, 'cfpb-site.db' )
    console.log( databaseModel.dbFolderPath, databaseModel.dbPath );
    return new Promise( function( resolve, reject ) {
      databaseModel._checkDataDirectory( directory )
      .then( function() {
        databaseModel.createConnection()
        .then( function( db ) {
          databaseModel.checkTable( db )
          .then( function( db ) {
            databaseModel.connection = db;
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
      } )
    } );
  },

  /**
   * Get the current database stats
   */
  getDatabaseStats: function() {
    return new Promise( function( resolve, reject ) {
      let sql = 'SELECT url, timestamp FROM cfpb;';
      databaseModel.connection.all( sql, [], ( err, rows ) => {
        if ( err ) {
          reject( err );
        } else {
          resolve( rows );
        }
      } );
    } );
  },

  /**
   * Update database
   */
  update: function( sql, params ) {
    return new Promise( function( resolve, reject ) {
      databaseModel.connection.run( sql, params, ( err, rows ) => {
        if ( err ) {
          reject( err );
        } else {
          resolve( rows );
        }
      } );
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

    return {
      sql: sql,
      params: params
    };
  },

  /**
   * Update database using page object
   */
  updateFromPageObj: function( pageObj ) {
    return new Promise( function( resolve, reject ) {
      let sqlObj = databaseModel.createSqlFromPageObj( pageObj );
      databaseModel.update( sqlObj.sql, sqlObj.params )
      .then( function( rows ) {
        resolve( rows );
      }, function( err ) {
        console.log( err );
      } );
    } );

  }

};

module.exports = databaseModel;

