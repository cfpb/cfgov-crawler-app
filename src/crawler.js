'use strict';

const fs = require( 'fs' );
const SimpleCrawler = require( 'simplecrawler' );
const queue = SimpleCrawler.queue;
const sitemapCheck = require( './utils/sitemap-check' );
const pageModel = require( './models/page-model.js' );
const databaseTools = require( './dispatchers/database-tools.js' );
const fileExists = require( './utils/file-exists' );
const updateStats = require( './views/crawler-status-view' ).updateStats;
const dbStatusView = require( './views/database-status-view' );


/**
 * Initialize all the custom crawler settings
 * @param {object} siteCrawler
 */
function _init( crawler ) {

  _addPageIndexer( crawler );
  _addFetchConditions( crawler );
  _addFetchErrorHandler( crawler );
  _addCompleteHandler( crawler );

}

/**
 * Add page indexer, which parses the fetched data and sends it to the database.
 * @param {object} siteCrawler
 */
function _addPageIndexer( crawler ) {
  crawler.on( 'fetchcomplete', function( queueItem, responseBuffer, response ) {
    const stateData = queueItem.stateData;
    const contentType = ( stateData && stateData.contentType ) || '';
    const url = queueItem.url;

    if ( contentType.indexOf( 'text/html' ) > -1 && queueItem.host === crawler.host ) {
      let pageObj = pageModel.createPageObject( queueItem, responseBuffer );
      databaseTools.updateFromPageObj( pageObj )
      .then( function( ) {
        dbStatusView.updateDatabaseStats();
        crawler.queue.countItems( { fetched: true }, function( err, count ) {
          crawler.queue.getLength( function(err, length) {
            if (err) {
                throw err;
            }
            updateStats( count, length );
          });
        });
      }, function( err ) {
        console.log( err );
      } );
    }
  } );
}

function _addFetchConditions( crawler ) {
  // Don't fetch URLs that contain /external-site/
  crawler.addFetchCondition( function( queueItem, referrerQueueItem, callback ) {
    const regex = /(\/external-site\/)/i;
    callback( null, !queueItem.path.match( regex ) );
  });

  crawler.addFetchCondition( ( queueItem, referrerQueueItem, callback ) => {
    const downloadRegex =
    /\.(png|jpg|jpeg|gif|ico|css|js|csv|doc|docx|svg|pdf|xls|json|ttf|xml|woff|eot|zip|wav)/i;

    callback( null, !queueItem.url.match( downloadRegex ) );
  } );
}

function _addFetchErrorHandler( crawler ) {
  crawler.on( 'fetchclienterror', function( queueItem, error ) {
    console.log( 'fetch client error:' + error );
  } );
}

function _addCompleteHandler( crawler ) {
  crawler.on( 'complete', function() {
    databaseTools.closeDatabase();

    console.log( 'Index successfully completed.' );
  } );

}

function loadSavedQueue( crawler ) {
  // Defrost the existing queue
  if ( fileExists( './mysavedqueue.json' ) ) {
    crawler.queue.defrost( './mysavedqueue.json', () => {
      crawler.queue.countItems( { fetched: true }, function( err, count ) {

        // Saved the crawler queue
        if ( count > 0 && count > crawler.queueCheck ) {
          crawler.queueCheck = count + 100;
          console.log( 'Time to freeze the queue ( fetched = ' + count + ', queueCheck = ' + crawler.queueCheck );
          crawler.queue.freeze( 'mysavedqueue.json', () => {
          } );
          crawler.queueCheck += 100;
          console.log( 'New queueCheck: ' + crawler.queueCheck );
        }

        crawler.queue.getLength(function(err, length) {
          if (err) {
              throw err;
          }
          updateStats( count, length );

          if ( count === length ) {
            // TODO: Fix this line below
            $( '#stats-line' ).prepend( '<p><strong>It looks like you completed a crawl.</strong> To start a new one, hit the Start Crawler button now.</p>' );
            crawlerOptions.deleteQueueFile = true;
          }
        });
        console.log( 'Starting fetch/queue' + count + ', ' + crawler.queueCheck );
      } );

    } );  
  }
}

/**
 * Create site crawler.
 * @param {object} siteLocation
 */
function create ( options={} ) {
  const crawler = SimpleCrawler( options.URL );
  const crawlerDefaults = {
    URL: 'https://www.consumerfinance.gov/',
    host: 'www.consumerfinance.gov',
    interval: 3000,
    maxConcurrency: 5,
    filterByDomain: true,
    parseHTMLComments: false,
    parseScriptTags: false,
    respectRobotsTxt: false
  };

  Object.assign( crawler, crawlerDefaults, options );

  _init( crawler );

  crawler.queueCheck = 10;

  return crawler
}

module.exports = {
  create: create,
  loadSavedQueue: loadSavedQueue
};
