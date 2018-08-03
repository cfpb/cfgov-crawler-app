'use strict';

const sqlite3 = require( 'sqlite3' ).verbose();

let databaseModel = {
  connectionStatus: undefined,

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

  init: function() {
    return new Promise( function( resolve, reject ) {
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
    } );
  },

  connection: undefined,

  /**
   * Get the current database stats
   */
  getRows: function() {
    return new Promise( function( resolve, reject ) {
      let sql = 'SELECT COUNT(*) as totalRows FROM cfpb;';
      databaseModel.connection.all( sql, [], ( err, rows ) => {
        if ( err ) {
          reject( err );
        } else {
          resolve( rows[0].totalRows );
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
          console.log( 'Updated DB: ' + params[6] );
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

