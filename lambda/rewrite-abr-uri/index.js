'use strict';

//use a global variable to cache origins 
//if value not found or too old, it is looked upon in the database
var originCache;
//define the cache timeout (10 seconds)
var CACHE_TIMEOUT = 10 * 1000;

exports.handler = (event, context, callback) => {
 if (!originCache) {
   originCache = {};
 }
 console.log("originCache: ", originCache);
 const request = event.Records[0].cf.request;
 const uri = request.uri;
 console.log("uri: " + uri);
 
 if (/^\/[a-zA-Z0-9-]*\.m3u8$/.test(uri)){
  let streamName = uri.split(".")[0].substr(1);
  console.log("streamName: " + streamName);
  
  let now = new Date();
  if (originCache[streamName]){
    console.log("got cached item for " + streamName);
    let cacheItem = originCache[streamName];
    let lastUpdated = cacheItem.time;
    let timeout = now - lastUpdated;
    console.log("timeout: " + timeout);
    if (timeout < CACHE_TIMEOUT){
      console.log("using cached value: " + cacheItem.tag);
      setUri(request, cacheItem.tag);
      callback(null, request);
      return;
    }
    else {
      //delete expired value
      delete originCache[streamName];
    }
  }
  
  var AWS = require('aws-sdk');
  // Set the region 
  AWS.config.update({region: 'us-east-1'});

  var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

  var params = {
    ExpressionAttributeValues: {
     ":v1": {
       S: streamName
      }
    },
    IndexName : "StreamName-index",
    KeyConditionExpression: "StreamName = :v1", 
    ProjectionExpression: "Tag", 
    TableName: process.env.DYNAMODB_TRANSCODERS_TABLE,
    "Limit": 1
  };
  
  console.log("params: ", params);
  
  // Call DynamoDB to read the item from the table
  ddb.query(params, function(err, data) {
    var response;
    if (err) {
      console.log("Query Error", err);
      response = setError(err);
      callback(null, response);
    } else {
      console.log("Query Success", data);
      if (data.Count > 0){
        let tag = data.Items[0].Tag.S;
        console.log("tag: ", tag);
        originCache[streamName] = {tag: tag, time:new Date()};
        setUri(request, tag);
        callback(null, request);
      }
      else {
        response = setNotFound("No transcoder for " + streamName);
        callback(null, response);
      }
    }
    
  });
 }
 else {
    callback(null, request);
 }
};

function setUri(request, tag){
  request.uri = `/${tag}.m3u8`;
}

function setNotFound(text){
  const content = `
    <\!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Not Found :(</title>
      </head>
      <body>
        <p>${text}</p>
      </body>
    </html>
  `;
  var response = {
    body: content,
    status: '404',
    statusDescription: "Not Found"
  };
  return response;
}

function setError(text){
  const content = `
    <\!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Internal Error :(</title>
      </head>
      <body>
        <p>${text}</p>
      </body>
    </html>
  `;
  var response = {
    body: content,
    status: '502',
    statusDescription: "Internal Server Error"
  };
  return response;
}