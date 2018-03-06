'use strict';

const createCrawler = require( './src/crawler' ).create;
const createGoogleSheets = require( './src/google-sheets' ).create;
const GitHub = require( './src/github' );
const isURL = require( 'is-url' );
const SimpleCrawler = require( 'simplecrawler' );
const fs = require( 'fs' );
const mkdirRecursive = require( './src/utils/mkdirRecursive' );
const sqlite3 = require( 'sqlite3' ).verbose();

var beautify = require( 'json-beautify' );

const CFPB_INDEX = 'cfpb-index';
const CFPB_INDEX_REPORT_URL = 'cfpb-index-report-url';

const crawlerOptions = {
  URL: 'https://www.consumerfinance.gov/'
}

var crawler = createCrawler( crawlerOptions );
var queueCheck = 100;

/**
 * Initiates the environment for the crawler.
 */
function init() {
  mkdirRecursive( './cache' );
}

var updateStats = {};

// FOR DEVELOPMENT ONLY: 
// Disable discovery during development
// crawler.discoverResources = false;

// FOR DEVELOPMENT ONLY: Emit all events!
// var originalEmit = crawler.emit;
// crawler.emit = function(evtName, queueItem) {
//     crawler.queue.countItems({ fetched: true }, function(err, completeCount) {
//         if (err) {
//             throw err;
//         }

//         crawler.queue.getLength(function(err, length) {
//             if (err) {
//                 throw err;
//             }

//             console.log("fetched %d of %d — %d open requests, %d open listeners",
//                 completeCount,
//                 length,
//                 crawler._openRequests.length,
//                 crawler._openListeners);
//         });
//     });

//     console.log(evtName, queueItem ? queueItem.url ? queueItem.url : queueItem : null);
//     originalEmit.apply(crawler, arguments);
// };


// FOR DEVELOPMENT ONLY: 
// Create a queue (for development purposes)
// crawler.queueURL( 'https://www.consumerfinance.gov/es/', undefined, true);
// crawler.queueURL( 'https://www.consumerfinance.gov/paying-for-college/', undefined, true );
// crawler.queueURL( 'https://www.consumerfinance.gov/paying-for-college/choose-a-student-loan/', undefined, true );
// crawler.queueURL( 'https://www.consumerfinance.gov/blog/', undefined, true);
// crawler.queueURL( 'https://www.consumerfinance.gov/data-research/', undefined, true);
// crawler.queueURL( 'https://www.consumerfinance.gov/ask-cfpb/', undefined, true);


// Dashboard Updates
crawler.on( 'fetchcomplete', ( queueItem, responseBuffer, response ) => {
  crawler.queue.countItems({ fetched: true }, function( err, count ) {
    if ( err ) {
        throw err;
    }

    if ( count > queueCheck ) {
      console.log( 'Time to freeze the queue ( fetched = ' + count + ', queueCheck = ' + queueCheck );
      crawler.queue.freeze( 'mysavedqueue.json', () => {
        
      } );
      queueCheck += 100;
      console.log( 'New queueCheck: ' + queueCheck );
    }

    crawler.queue.getLength(function(err, length) {
        if (err) {
            throw err;
        }
        updateStats( count, length );
    });

  } );
} );

// Initiate the stuff the crawler needs to work
init();

// Defrost the existing queue
crawler.queue.defrost( './mysavedqueue.json', () => {
  crawler.queue.countItems( { fetched: true }, function( err, count ) {
    if ( count > 0 ) {
      queueCheck = count + 100;
    }
    crawler.queue.getLength(function(err, length) {
      if (err) {
          throw err;
      }
      updateStats( count, length );
    });
    console.log( 'Starting fetch/queue' + count + ', ' + queueCheck );
  } );
} );

// Register Dashboard events/functions
$( document ).ready( function() {
  var $txt = $( '#test-area' );
  var $start = $( '#crawler-start' );
  var $stop = $( '#crawler-stop' );
  var $stats = $( '#stats-line' );
  var $cover = $( '#running-cover' );

  // Activate the start button
  $start.prop( 'disabled', false );

  updateStats = function( fetched, queued ) {
    var html = '<strong>' + fetched + '</strong> pages fetched, ';
    html += '<strong>' + queued + '</strong> total queued URLs';
    $stats.html( html );
  }
  
  $start.click( function() {
    crawler.start();
    $cover.hide();
    $start.prop( 'disabled', true );
    $stop.prop( 'disabled', false );
  } );

  $stop.click( function() {
    crawler.stop();
    crawler.queue.freeze( 'mysavedqueue.json', () => {
      
    } );
    $cover.show();
    $stop.prop( 'disabled', true );
    $start.prop( 'disabled', false );
  } );


} );
