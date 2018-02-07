'use strict';

const fs = require( 'fs' );
const SimpleCrawler = require( 'simplecrawler' );
const queue = SimpleCrawler.queue;
const md5 = require( 'md5' );

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
  const SEARCH = /<link rel=[\"']stylesheet[\"'] [^>]+wp-(?:content|includes)/g;
  const pageHMTL = responseBuffer.toString();

  return SEARCH.test( pageHMTL ) ;
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

/**
 * Add site index.
 * @param {string} siteCrawler
 */
function _addSiteIndexEvents( crawler ) {
  crawler.on('fetchcomplete', function( queueItem, responseBuffer ) {
    const stateData = queueItem.stateData;
    const contentType = ( stateData && stateData.contentType ) || '';
    const url = queueItem.url;

    if ( contentType.indexOf( 'text/html' ) > -1
         && queueItem.host === crawler.host ) {
      let components = _findAtomicComponents( url, responseBuffer );
      _addToQueueItem( queueItem, components );
      queueItem.hasWordPressContent =
        _hasWordPressContent( url, responseBuffer );
      queueItem.pageHash = _getPageHash( url, responseBuffer );
    }

    console.log( `Fetch complete: ${url}` );

    if ( queueItem.id > 0 && queueItem.id % 500 === 0 ) {
      fs.writeFile( 'site-index_' + new Date() + '.json',
                    JSON.stringify( crawler.queue ),
                    function(){} );
    }
  } );

  crawler.addDownloadCondition( ( queueItem, referrerQueueItem, callback ) => {
    const downloadRegex =
    /\.(png|jpg|jpeg|gif|ico|css|js|csv|doc|docx|svg|pdf|xls|json|ttf|xml)$/i;

    callback( null, !queueItem.url.match( downloadRegex ) );
  } );

  // crawler.addFetchCondition( ( queueItem, referrerQueueItem, callback ) => {
  //   // We only ever want to move one step away from example.com, so if the
  //   // referrer queue item reports a different domain, don't proceed
  //   callback(null, referrerQueueItem.host === crawler.host);
  // } );

  crawler.on( 'fetchclienterror', function( queueItem, error ) {
    console.log( 'fetch client error:' + error );
  } );

  crawler.on( 'complete', function() {
    console.log( 'Index successfully completed.' );
  } );

  return crawler;
};

/**
 * Add to the queueItem.
 * @param {string} queueItem
 * @param {string} components
 */
function _addToQueueItem( queueItem, components ) {
  const arrayMethod = 'push';
  if ( Array.isArray( queueItem.components ) === false ) {
    queueItem.components = [];
  }
  queueItem.components = queueItem.components.concat( components );

  return queueItem;
};

/**
 * Import the queue from a frozen JSON file on disk.
 * Code copied from
 * https://github.com/simplecrawler/simplecrawler/blob/
 * 5f14fa4950cf9cd52bf77566e02df604fc1207d0/lib/queue.js#L451
 * @param {String} filename Filename passed directly to
 * [fs.readFile]{@link https://nodejs.org/api/fs.html#fs_fs_readfile_file_options_callback}
 * @param {FetchQueue~defrostCallback} callback
 */
queue.prototype.defrost = function defrost( fileData, callback ) {
  var queue = this;
  var defrostedQueue = [];

  if ( !fileData.toString( 'utf8' ).length ) {
    return callback( new Error(
      'Failed to defrost queue from zero-length JSON.'
      )
    );
  }

  try {
    defrostedQueue = JSON.parse( fileData.toString( 'utf8' ) );
  } catch ( error ) {
    console.log( error )
    return callback( error );
  }

  queue._oldestUnfetchedIndex = defrostedQueue.length - 1;
  queue._scanIndex = {};

  for ( var i = 0; i < defrostedQueue.length; i++ ) {
    var queueItem = defrostedQueue[i];
    queue.push( queueItem );

    if ( queueItem.status === 'queued' )  {
      queue._oldestUnfetchedIndex =
        Math.min( queue._oldestUnfetchedIndex, i );
    }

    queue._scanIndex[queueItem.url] = true;
  }

  callback( null, queue );
};

/**
 * Reset site crawler queue.
 */
SimpleCrawler.prototype.resetQueue = function resetQueue( ) {
  this.queue = new queue();
};

/**
 * Create site crawler.
 * @param {object} siteLocation
 */
function create ( options={} ) {
  const crawler = SimpleCrawler( options.URL );

  const crawlerDefaults = {
    host: 'www.consumerfinance.gov',
    interval: 3800,
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
