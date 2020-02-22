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
const port = process.env.PORT || 8000;

var client_id = '282c01d3abd34d04a9dfa45af7f6b4b2'; // Your client id
var client_secret = '1e54bde5cab74e5ba50bfc18d029f126'; // Your secret
var redirect_uri = 'http://localhost:8000/callback'; // Your redirect uri

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

let authSuccess = false;

var stateKey = 'spotify_auth_state';

var app = express();

var users = [
	{
		songsInCommon:
			'Never Really Over | Beautiful People | The One | Movie Star | Round Round | Payphone | Bingbian | Good as You | Youth | Way Back Home | Oh Ma Na Ye | Run',
		user: 'Brian Zhang',
			score: '96',
		userProfilePic: 'https://www.algomau.ca/wp-content/uploads/2018/11/2.1.21-Sociology-Testimonials-Lucia-Luciani.jpg',
		userProfile: 'https://open.spotify.com/user/21tuu2w3g6ldhcges44cr6d4q?si=9D4kJmhGSECmM5Tgf50NKw',
	},
	{
		songsInCommon: 
			['Purple Passion | Cloud | Whistle | Bye Bye Bye | Benny Blanco | The Assembly Call | Thing For You | Oh NaNa| Heaven | Young| Moment| Good Day'],
		user: 'Timothy Oakley',
		score: '93',
		userProfilePic: 'data:image/jpeg;base64,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',
		userProfile: 'https://open.spotify.com/user/mofyoakley?si=ixlygjZ5SbuMy68LgDTS_Q',
	},
	
	{
		songsInCommon:
			'Good Night | Imagine | One Moment In Time | Hotel California | Already Gone | Back To You | All Of Me | Hold My Hand | Perfect | Let Me Love You | Symphony | Whatever It Takes',
		score: '89',
		user: 'Farhan Zaman',
		userProfilePic: 'https://www.algomau.ca/wp-content/uploads/2018/10/6.3.2-Brampton-Meet-our-Alumni-Headshots-Bobby-Karmakar.jpg',
		userProfile: 'https://open.spotify.com/user/gvmysxry9za7dr87b3lejwoiz',
	},
	
	{
		songsInCommon:
			'Delicate | Long As I Live | One Number Away | Wait | Supplies | Thunder | More Than You Know | Sign of the Times | Issues | Lucky You | 2U | No Brainer ',
		user: 'Henry Chandler',
		score: '82',
		userProfilePic: 'https://matthewdahl.me/public/images/headshot_square.jpg',
		userProfile: 'https://open.spotify.com/user/22kv65lyxqrvlz5whoglqkvfq?si=K3r3igS_SIOIW7Va_dTNxw',
	},
];

app.get('/express_backend', (req, res) => {
  res.send({ express: users });
});

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {
  //res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' });
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
        // Gets array of playlists
        request.get(options, function(error, response, body) {
            //console.log(body);
  
            var ids = new Array;
            let all_tracks = new Array;
            let track_names = new Array;
  
            var playlists = body['items']; 
            playlists.forEach(playlist => ids.push(playlist['id']));
            //console.log('track: ' + JSON.stringify(playlists[0]['tracks']));
            //console.log("ids:" + ids);

            let promises = [];
            
            for (id in ids) {
                //console.log('access_token', access_token);

                let id_options = {
                  url: 'https://api.spotify.com/v1/playlists/' + ids[id] + '/tracks',
                  headers: { 'Authorization': 'Bearer ' + access_token },
                  json: true
                }
                
                // Gets tracks from playlist
                // Tracks from the playlist are stored in body
                promises.push(new Promise((resolve, reject) => {
                    request.get(id_options, function(error, response, body) {
                      track_names.push(body.items[0].track.name);
                      //console.log('all track names: '+ track_names);
                      all_tracks.push(body);
                      //calculate_Sentiment(track_names);
                      resolve(true);
                    });
                    
                }))
  
            }
            Promise.all(promises).then(result => {
              console.log('track names:' + track_names);
              calculate_Sentiment(track_names);
              //console.log('result', result);
          })

          });
        // we can also pass the token to the browser to make requests from there
        authSuccess = true;
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        authSuccess = true;
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
  //res.seqwnd({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' });
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
    console.dir("sentiment score: " + JSON.stringify(result.comparative)); 
}

//console.log('Listening on 5000');
app.listen(port, () => console.log(`Listening on port ${port}`));
