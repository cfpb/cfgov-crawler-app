'use strict';

const google = require( 'googleapis' );
const scopes = ['https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'];
const sheetsAPI = google.sheets( 'v4' );
const drive = google.drive( 'v3' );

const authEmail = process.env.CFPB_INDEXER_GOOGLE_CLIENT_EMAIL;
const authKey = process.env.CFPB_INDEXER_GOOGLE_PRIVATE_KEY;

/**
 * Build the header row for the spreadsheet.
 * @param {string} url The URL of the page being indexed.
 * @param {string} responseBuffer The HTML buffer contatining page HTML.
 */
function buildSheetHeader( columns ) {
  const cells = columns.map( value => {
    return {
      userEnteredValue: {
        stringValue: value
      },
      userEnteredFormat: {
        textFormat: {
          bold: true
        }
      }
    }
  } );
  return [ { values: cells } ];
}

function buildSheetBody( data ) {
  return data.map( row => {
    let cells = row.map( column => {

      return {
        userEnteredValue: {
          stringValue: column
        }
      };
    } );
    return { values: cells }
  } );
}

function createSheets( sheets ) {
  return sheets.map( sheet => {
    const header = buildSheetHeader( sheet.columns );
    const body = buildSheetBody( sheet.getData() );

    return {
      properties: {
        title: sheet.title
      },
      data: [ {
        rowData: header.concat( body ),
        columnMetadata: sheet.columnSize.map( size => ( { 'pixelSize': size } ) )
      } ]
    };
  } );
}

async function createSpreadsheet( authClient, sheets ) {
  let promiseResolve;
  let promiseReject;
  const sheetsPromise = new Promise( ( resolve, reject ) => {
    promiseResolve = resolve;
    promiseReject = reject;
  } );
  const request = {
    auth: authClient,
    resource: {
      properties: {
        title: new Date(),
      },
      sheets: createSheets( sheets )
    }
  };

  sheetsAPI.spreadsheets.create( request, ( err, response ) => {
    if ( err ) {
      promiseReject( err );
    }

    const spreadsheetId = response.spreadsheetId;
    const sheetId = response.sheets[0].properties.sheetId;
    grantPermissions( authClient, spreadsheetId );
    promiseResolve( response.spreadsheetUrl );
  } );

  return sheetsPromise;
}

async function grantPermissions( authClient, spreadsheetId ) {
  var permission = {
    'type':  'anyone',
    'role':  'writer'
  };

  await drive.permissions.create( {
    auth: authClient,
    resource: permission,
    fileId: spreadsheetId,
    fields: 'id',
  }, ( err, res ) => {
    if ( err ) {
      console.error( err );

      return;
    }
  } );
}

async function authorizeAPI( authConfig ) {
  const jwtClient = new google.auth.JWT(
    authConfig.authEmail,
    null,
    authConfig.authKey.replace( /\\n/g, '\n' ),
    scopes,
    null
  );

   await jwtClient.authorize( ( err, tokens ) => {
    if ( err ) {
      console.log( err );
      return false;
    }
  } );

  return jwtClient;
}

async function create( sheets ) {
  const authClient = await authorizeAPI(
    { authEmail: authEmail, authKey: authKey }
  );
  const spreadSheetURL = await createSpreadsheet( authClient, sheets );

  return spreadSheetURL;
}

module.exports = { create };
