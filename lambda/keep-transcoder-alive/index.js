var aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = async (event) => {
    
    let streamName = event.pathParameters.streamName;
    console.log("streamName: " + streamName);
    if (!streamName){
        //throw new Error("Expecting StreamName parameter...");
        return {statusCode:400, body: JSON.stringify({success:false, error: "Expecting StreamName parameter."}), headers: {'Content-Type': 'application/json'}};
    }
    var channelId;
    if (event.queryStringParameters){
        channelId = event.queryStringParameters.ChannelId;
    }
    console.log("channelId: " + channelId);
    if (!channelId){
        //throw new Error("Expecting ChannelId parameter...");
        return {statusCode:400, body: JSON.stringify({success:false, error: "Expecting ChannelId parameter."}), headers: {'Content-Type': 'application/json'}};
    }
    
    var params = {
        Key: {
            "ChannelId": {
                S: channelId
            }, 
        }, 
        TableName: process.env.DYNAMODB_TRANSCODERS_TABLE
    };
    var query1Result = await ddb.getItem(params).promise();
    console.log("query1Result", query1Result);
    let item = query1Result.Item;
    if (item){
        let itemStreamName = item.StreamName.S;
        console.log("itemStreamName: " + itemStreamName);
        if (itemStreamName == streamName){
            const params = {
                TableName: process.env.DYNAMODB_TRANSCODERS_TABLE,
                Key: {
                    "ChannelId": {S: channelId}
                },
                UpdateExpression: "set KeepAlive = :ka",
            
                ExpressionAttributeValues: {
                    ":ka": {N:new Date().getTime().toString()}
                },
                ReturnValues:"UPDATED_NEW"
            };
    
            let query2Result = await ddb.updateItem(params).promise();
            console.log("query2Result", query2Result);    
            let response = {
                statusCode: 200,
                body: JSON.stringify(query2Result),
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            return response;
        }
        else {
            return {statusCode:400, body: JSON.stringify({success:false, error: `Transcoder does not match stream name ${streamName}`}), headers: {'Content-Type': 'application/json'}};    
        }
    }
    else {
        return {statusCode:400, body: JSON.stringify({success:false, error: `No transcoder found matching channel ID ${channelId}`}), headers: {'Content-Type': 'application/json'}};
    }
};
