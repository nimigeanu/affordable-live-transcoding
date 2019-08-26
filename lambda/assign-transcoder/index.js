var aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = async (event) => {
    
    var streamName = event.pathParameters.streamName;
    if (!streamName){
        throw new Error("Expecting StreamName parameter...");
    }
    var assignedChannelInfo;
    
    var params = {
      ExpressionAttributeValues: {
        ":s1": {
          S: streamName
        }
      },
      IndexName : "StreamName-index",
      KeyConditionExpression: "StreamName = :s1", 
      ProjectionExpression: "ChannelId, IngestUri, Running, InputId", 
      TableName: process.env.DYNAMODB_TRANSCODERS_TABLE,
      "Limit": 1
    };
    
    var query0Result = await ddb.query(params).promise();
    console.log("query0Result", query0Result);
    if (query0Result.Count > 0){
      assignedChannelInfo = query0Result.Items[0];
    }
    else {

      params = {
        ExpressionAttributeValues: {
          ":v1": {
            S: "YES"
          },
          ":s1": {
            S: "null"
          },
        },
        IndexName : "Running-StreamName-index",
        KeyConditionExpression: "Running = :v1 and StreamName = :s1", 
        ProjectionExpression: "ChannelId, IngestUri, Running, InputId", 
        TableName: process.env.DYNAMODB_TRANSCODERS_TABLE,
        "Limit": 1
       };
      
      var query1Result = await ddb.query(params).promise();
      console.log("query1Result", query1Result);
      if (query1Result.Count > 0){
        assignedChannelInfo = query1Result.Items[0];
      }
      else {
        params = {
          ExpressionAttributeValues: {
              ":v1": {
                S: "NO"
              },
              ":s1": {
                S: "null"
              },
          },
          IndexName : "Running-StreamName-index",
          KeyConditionExpression: "Running = :v1 and StreamName = :s1", 
          ProjectionExpression: "ChannelId, IngestUri, Running, InputId", 
          TableName: process.env.DYNAMODB_TRANSCODERS_TABLE,
          "Limit": 1
        };
      
        var query2Result = await ddb.query(params).promise();
        console.log("query2Result", query2Result);    
        if (query2Result.Count > 0){
          assignedChannelInfo = query2Result.Items[0];
        }
      }
    }

    if (assignedChannelInfo){
        let channelId = assignedChannelInfo.ChannelId.S;
        let inputId = assignedChannelInfo.InputId.S;
        let ingestUri = assignedChannelInfo.IngestUri.S;
        let running = assignedChannelInfo.Running.S;
        
        const params = {
            TableName: process.env.DYNAMODB_TRANSCODERS_TABLE,
            Key: {
                "ChannelId": assignedChannelInfo.ChannelId
            },
            UpdateExpression: "set StreamName = :sn, KeepAlive = :ka",
            
            ExpressionAttributeValues: {
                ":sn": {S:streamName},
                ":ka": {N:new Date().getTime().toString()}
            },
            ReturnValues:"UPDATED_NEW"
        };
    
        let query3Result = await ddb.updateItem(params).promise();
        console.log("query3Result", query3Result);    
        
        await invokeSizePool();
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            success:true, 
            ChannelId: channelId, 
            IngestUri: ingestUri, 
            PlaybackUri:process.env.MEDIA_STORE_DESTINATION_PREFIX + inputId + ".m3u8",
            Running: running
          }),
          headers: {'Content-Type': 'application/json'}
        };
    }
    else {
        await invokeSizePool(true);
        return {
          statusCode:200, 
          body: JSON.stringify({success:false, error:"No.Channel.Available", newChannelRequested:true}),
          headers: {'Content-Type': 'application/json'}
        };
    }
};

async function invokeSizePool(failed) {
    var lambda = new aws.Lambda();
    
    let lastOp = failed ? "ASSIGN_TRANSCODER_FAILED" : "ASSIGN_TRANSCODER";
        
    var params = {
        FunctionName: process.env.SIZE_TRANSCODER_POOL_FUNCTION,
        Payload: JSON.stringify({LastOp: lastOp})
    };

    let invokeResult = await lambda.invoke(params).promise();
    console.log("invokeResult: ", invokeResult);
}