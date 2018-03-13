'use strict';

const fs = require( 'fs' );
const SimpleCrawler = require( 'simplecrawler' );
const queue = SimpleCrawler.queue;
const md5 = require( 'md5' );
const cheerio = require( 'cheerio' );
const sqlite3 = require( 'sqlite3' ).verbose();

let db = new sqlite3.Database( './database/cfpb-site.db', ( err ) => {
  if ( !err ) {
    console.log( 'Database connected!' );
  }
} );

/**
 * Update database
 */
function _updateDatabase( sql, params ) {
  db.run( sql, params, ( err, rows ) => {
    if ( err ) throw err;
    console.log( 'Updated DB: ' + params[6] );
  } );
}

/**
 * Find content links, ignoring mega-menu items.
 * @param {object} $ A cheerio object of the HTML response
 */
function _findContentLinks( $ ) {
  var links = [];
  var $body = $( 'body' );
  $body.find( '.o-header' ).remove();
  $body.find( '.o-footer' ).remove();
  $body.find( 'a' ).each( ( i, ele ) => {
    var href = $( ele ).attr( 'href' );
    if ( typeof( href ) !== 'undefined' ) {
      links.push( href );
    } ;
  } );

  return links;
}

/**
 * Find atomic components.
 * @param {string} url The URL of the page being indexed.
 * @param {string} responseBuffer The HTML buffer contatining page HTML.
 */
function _findAtomicComponents( url, responseBuffer ) {
  const SEARCH = /(?:(?:class=")|\s)((?:o|m|a)-[^_"__\s]*)/g;
  const pageHMTL = responseBuffer.toString();
  const prefixLookup = [
    'a-',
    'm-',
    'o-'
  ];
  let matchType = undefined;
  const components = [];
  let match = undefined;
  while ( ( match = SEARCH.exec( pageHMTL ) ) !== null ) {
    match.forEach( function( match, groupIndex ) {
      matchType = match.substr( 0, 2 );
      if ( ( prefixLookup.indexOf( matchType ) > -1 )
          && ( components.indexOf( match ) === -1 ) ) {
        components.push( match );
      }
    } );
  }

  return components;
};

/**
 * Determine if page has WordPress content.
 * @param {string} url The URL of the page being indexed.
 * @param {string} responseBuffer The HTML buffer contatining page HTML.
 * @returns {boolean} True if page has WordPress content, false otherwise.
 */
function _hasWordPressContent( url, responseBuffer ) {
  // const SEARCH = /<link rel=[\"']stylesheet[\"'] [^>]+wp-(?:content|includes)/g;
  // const pageHMTL = responseBuffer.toString();

  // return SEARCH.test( pageHMTL ) ;
  return responseBuffer.indexOf( 'wp-content' ) > -1;

};

/**
 * Storing page hash --- can be used to determine if page has changed.
 * @param {string} url The URL of the page being indexed.
 * @param {string} responseBuffer The HTML buffer contatining page HTML.
 * @returns {string} Hash of page contents.
 */
function _getPageHash( url, responseBuffer ) {
  return md5( responseBuffer );
};

function _createSqlFromJson( json ) {
  let itemMap = [ 'host', 'path', 'port', 'protocol', 'uriPath', 'url', 'depth',
  'fetched', 'status', 'stateData', 'id', 'components', 'hasWordPressContent',
  'contentLinks', 'pageHash' ];
  var sql;
  var params = [];

  sql = 'INSERT OR REPLACE INTO cfpb(' + itemMap.join( ', ' );
  sql += ' ) values( ';
  sql += ( itemMap.map( function() { return '?'; } ) ).join( ', ' );
  sql += ')'

  itemMap.forEach( function( elem ) {
    var value = json[elem];
    if ( typeof value  === 'boolean' ) {
      value = String( value );
    } else if ( typeof value === 'object' ) {
      value = JSON.stringify( value );
    }
    params.push( value );
  } );

  console.log( sql, params );

  return {
    sql: sql,
    params: params
  };

}


/**
 * Add site index.
 * @param {string} siteCrawler
 */
function _addSiteIndexEvents( crawler ) {
  let itemMap = [ 'host', 'path', 'port', 'protocol', 'uriPath', 'url', 'depth',
    'fetched', 'status', 'stateData', 'id', 'components', 'hasWordPressContent',
    'contentLinks', 'pageHash' ];

  crawler.on( 'fetchcomplete', function( queueItem, responseBuffer ) {
    const stateData = queueItem.stateData;
    const contentType = ( stateData && stateData.contentType ) || '';
    const url = queueItem.url;
    var queueObj = queueItem;
    var $ = cheerio.load( responseBuffer );

    if ( contentType.indexOf( 'text/html' ) > -1
         && queueItem.host === crawler.host ) {

      // Find Atomic Components
      queueObj.components = _findAtomicComponents( url, responseBuffer );

      // Find Wordpress Content
      queueObj.hasWordPressContent =
        _hasWordPressContent( url, responseBuffer );

      // Find all links in content
      queueObj.contentLinks = _findContentLinks( $ );

      // Add the page hash
      queueObj.pageHash = _getPageHash( url, responseBuffer );

      var sqlData = _createSqlFromJson( queueObj );
      _updateDatabase( sqlData.sql, sqlData.params );

    }

  } );

  // Don't fetch URLs that contain /external-site/
  crawler.addFetchCondition( function( queueItem, referrerQueueItem, callback ) {
    callback( null, !queueItem.path.match( /(\/external-site\/)/ ); );
  });

  crawler.addFetchCondition( ( queueItem, referrerQueueItem, callback ) => {
    const downloadRegex =
    /\.(png|jpg|jpeg|gif|ico|css|js|csv|doc|docx|svg|pdf|xls|json|ttf|xml|woff|eot|zip|wav)/i;

    callback( null, !queueItem.url.match( downloadRegex ) );
  } );

  crawler.on( 'fetchclienterror', function( queueItem, error ) {
    console.log( 'fetch client error:' + error );
  } );

  crawler.on( 'complete', function() {
    db.close( ( err ) => {
      if ( err ) {
        console.error( err.message );
      }
      console.log( 'Closed the database connection.' );
    });

    console.log( 'Index successfully completed.' );
  } );

  return crawler;
};

/**
 * Create site crawler.
 * @param {object} siteLocation
 */
function create ( options={} ) {
  const crawler = SimpleCrawler( options.URL );

  const crawlerDefaults = {
    host: 'www.consumerfinance.gov',
    interval: 3000,
    maxConcurrency: 5,
    filterByDomain: true,
    parseHTMLComments: false,
    parseScriptTags: false,
    respectRobotsTxt: false
  };

  Object.assign( crawler, crawlerDefaults, options );

  _addSiteIndexEvents( crawler );

  return crawler
};

module.exports = { create };
