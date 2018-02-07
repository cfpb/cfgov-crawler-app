'use strict';

const GitHubApi = require( 'github' );
const github = new GitHubApi( {
  debug: true
} );
const AUTH_TOKEN = process.env.CFPB_INDEXER_GITHUB_TOKEN;
const OWNER = process.env.GITHUB_ORG_NAME
const SITE_INDEX_REPO = 'site-index';
const SITE_INDEX_PATH = 'site-index.json';

class GitHub {
  static createGist( options ) {
    return github.gists.create( options )
           .catch( err => console.log( err ) );
  }
/**
 * Get the blob sha for the site-index.json from Github.
 * @param {string} url The URL of the page being indexed.
 * @param {string} responseBuffer The HTML buffer contatining page HTML.
 */
  static async getBlobSha( filePath ) {

    const commits = await github.repos.getCommits( {
      owner: OWNER,
      repo: SITE_INDEX_REPO,
      path: filePath
    } );

    const commitSha = commits.data.shift().sha;

    const gitTree = await github.gitdata.getTree( {
      sha: commitSha,
      owner: OWNER,
      repo: SITE_INDEX_REPO,
      path: filePath,
      recursive: false
    } );

    const blobSha = gitTree.data.tree.find( tree =>
      tree.path === filePath
    ).sha;

    return blobSha;
  }
  static async updateFile( data, filePath = SITE_INDEX_PATH ) {
    GitHub.authenticate();
    const sha = await GitHub.getBlobSha( filePath );

    return github.repos.updateFile( {
      sha,
      owner: OWNER,
      repo: SITE_INDEX_REPO,
      path: filePath,
      message: 'Updating Index',
      content: Buffer.from( data ).toString( 'base64' )
    } )
    .catch( err => console.log( err ) )

  }
  static authenticate( ) {
    github.authenticate( {
      type: 'oauth',
      token: AUTH_TOKEN
    } );
  }
}

module.exports = {
                   createGist: GitHub.createGist,
                   updateFile: GitHub.updateFile
                 };
