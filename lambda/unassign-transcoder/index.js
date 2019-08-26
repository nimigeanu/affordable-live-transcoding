var aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = async (event) => {
    
    var streamName = event.pathParameters.streamName;
    if (!streamName){
        throw new Error("Expecting StreamName parameter...");
    }
    
    var params = {
      ExpressionAttributeValues: {
       ":v1": {
         S: streamName
        }
      },
      IndexName : "StreamName-index",
      KeyConditionExpression: "StreamName = :v1", 
      ProjectionExpression: "ChannelId, IngestUri", 
      TableName: process.env.DYNAMODB_TRANSCODERS_TABLE,
      "Limit": 1
     };
    
    var query1Result = await ddb.query(params).promise();
    console.log("query1Result", query1Result);
    if (query1Result.Count > 0) {
        let channelId = query1Result.Items[0].ChannelId.S;
        const params = {
            TableName: process.env.DYNAMODB_TRANSCODERS_TABLE,
            Key: {
                "ChannelId": {S: channelId}
            },
            UpdateExpression: "set StreamName = :sn",
            
            ExpressionAttributeValues: {
                ":sn": {S:"null"}
            },
            ReturnValues:"UPDATED_NEW"
        };
    
        let query2Result = await ddb.updateItem(params).promise();
        console.log("query2Result", query2Result);    
        
        await invokeSizePool();
        
        return {
          statusCode: 200,
          body: JSON.stringify({success:true}),
          headers: {'Content-Type': 'application/json'}
        };
    }
    else {
        return {
          statusCode:400, 
          body: JSON.stringify({success:false, error:`No transcoder found with streamName ${streamName}`}),
          headers: {'Content-Type': 'application/json'}
        };
    }
};

async function invokeSizePool() {
    var lambda = new aws.Lambda();
    
    var params = {
        FunctionName: process.env.SIZE_TRANSCODER_POOL_FUNCTION,
        Payload: JSON.stringify({LastOp: "UNASSIGN_TRANSCODER"})
    };

    let invokeResult = await lambda.invoke(params).promise();
    console.log("invokeResult: ", invokeResult);
}