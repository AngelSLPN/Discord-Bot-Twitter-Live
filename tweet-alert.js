/**
 * Created by raiseandfall on 5/14/14.
 */

'use strict';

var Stream = require('user-stream'),
    events = require('events'),
    util   = require('util'),
    stream;
var lastTweetId;    

function TweetAlert(opts) {
  if (!(this instanceof TweetAlert)) {
    return new TweetAlert(opts);
  }

  events.EventEmitter.call(this);

  this.opts = opts;

  // New Twitter Stream
  stream = new Stream(opts);
}

//inherit
util.inherits(TweetAlert, events.EventEmitter);


TweetAlert.prototype.track = function() {
  var tweetAlert = this;

  // If missing parameters
  if (typeof this.opts !== 'object') {
    tweetAlert.emit('error', {
      message: 'Missing parameters'
    });
    return false;
  }

  // If user specific
  this.filteredScreenName = this.opts.screen_name || false;

  // Start the stream
  stream.stream();

  // Called when stream connected
  stream.on('connected', function() {
    tweetAlert.emit('connected');
  });

  // Called stream closed
  stream.on('close', function() {
    tweetAlert.emit('close');
  });

  // Error handler
  stream.on('error', function(data) {
    tweetAlert.emit('error', data);
  });

  // Called when data is received
  stream.on('data', function(json) {
    // Filter by user
    if (json.user) {
      // Filter data
      if (tweetAlert.isTracked(json)) {
        var tw = {
          id_str: json.id_str,
          in_reply_to_user_id_str: json.in_reply_to_user_id_str,
          json: json,
          text: json.text,
          screen_name: json.user.screen_name,
          name: json.user.name,
          id: json.user.id
        };
         
        if(lastTweetId!==tw.id_str){

        if (json.entities.urls) {
          if (Object.prototype.toString.call(json.entities.urls) === '[object Array]') {
            if (json.entities.urls.length > 0) {
              tw.url = json.entities.urls[0].expanded_url;
            }
          }
        }

        tweetAlert.emit('tweet', tw);
        lastTweetId=tw.id_str;
        }
      }
    }
  });
};


TweetAlert.prototype.isTracked = function(data) {
  if (!this.filteredScreenName) {
    return true;
  }

  if (typeof this.filteredScreenName === 'string') {
    if (this.filteredScreenName === data.user.screen_name) {
      return true;
    }
  } else if (Object.prototype.toString.call(this.filteredScreenName) === '[object Array]') {
    if (this.filteredScreenName.indexOf(data.user.screen_name) !== -1) {
      return true;
    }
  }

  return false;
};


TweetAlert.prototype.untrack = function() {
  if (stream) {
    stream.destroy();
    stream = null;
  }
};

module.exports = TweetAlert;