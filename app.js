/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '282c01d3abd34d04a9dfa45af7f6b4b2'; // Your client id
var client_secret = '1e54bde5cab74e5ba50bfc18d029f126'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-collaborative playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me/playlists/',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
    
        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
            //console.log(body);
  
            var ids = new Array;
            let all_tracks = new Array;
            let track_names = new Array;
  
            var playlists = body['items']; 
            playlists.forEach(playlist => ids.push(playlist['id']));
            //console.log('track: ' + JSON.stringify(playlists[0]['tracks']));
            //console.log("ids:" + ids);

            for (id in ids) {
                //console.log('access_token', access_token);

                let id_options = {
                  url: 'https://api.spotify.com/v1/playlists/' + ids[id] + '/tracks',
                  headers: { 'Authorization': 'Bearer ' + access_token },
                  json: true
                }
  
                request.get(id_options, function(error, response, body) {
                    // console.log('error', JSON.stringify(error,null,2));
                     //console.log('response', JSON.stringify(response,null,2));
                    //console.log('body', JSON.stringify(body,null,2));
                  //console.log('url: '+ id_options['url']);
                  //console.log('this track name: '+ body.items[0].track.name);
                  track_names.push(body.items[0].track.name);
                  console.log('all track names: '+ track_names);
                  all_tracks.push(body);
                  calculate_Sentiment(track_names);
                });
                
            }
          });
        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

function calculate_Sentiment(A){
    var Sentiment = require('sentiment');
    var sentiment = new Sentiment();
    var result = sentiment.analyze(A.join(' '));
    console.dir("result: " + JSON.stringify(result.comparative)); 
}

console.log('Listening on 8888');
app.listen(8888);
