'use strict';

const createCrawler = require( './src/crawler' ).create;
const loadSavedCrawlerQueue = require( './src/crawler' ).loadSavedQueue;
const databaseModel = require( './src/models/database-model' );
const crawlerControlsView = require( './src/views/crawler-controls-view' );
const crawlerStatusView = require( './src/views/crawler-status-view' );
const databaseStatusView = require( './src/views/database-status-view' );

const crawlerOptions = {
  URL: 'https://www.consumerfinance.gov/',
  deleteQueueFile: false
}

let crawler = createCrawler( crawlerOptions );

// Connect and check database before proceeding.
databaseModel.init( __dirname )
  .then( function() {
    // When the document is ready...
    $( document ).ready( function() {
      // Check and load the saved queue
      loadSavedCrawlerQueue( crawler );

      // ...initialize the Views
      crawlerControlsView.init();
      crawlerStatusView.init();
      databaseStatusView.init();

    } );
  }, function() {
    // HANDLE DB FAILURE!!!
  }
);


// const isURL = require( 'is-url' );
// const SimpleCrawler = require( 'simplecrawler' );
// const fs = require( 'fs' );
// const fileExists = require( './src/utils/file-exists' );
// const mkdirRecursive = require( './src/utils/mkdir-recursive' );
// const sqlite3 = require( 'sqlite3' ).verbose();

// var beautify = require( 'json-beautify' );

// const CFPB_INDEX = 'cfpb-index';
// const CFPB_INDEX_REPORT_URL = 'cfpb-index-report-url';

// var crawler = createCrawler( crawlerOptions );
// var queueCheck = 10;

/**
 * Initiates the environment for the crawler.
 */

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




// Register Dashboard events/functions
  // var $txt = $( '#test-area' );
  // 
  //,





