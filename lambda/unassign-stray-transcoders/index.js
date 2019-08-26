var aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = async (event) => {
    let now = new Date().getTime().toString();
    var params = {
        ProjectionExpression: "ChannelId",
        FilterExpression: "StreamName <> :null and KeepAlive < :ka",
        ExpressionAttributeValues: {
             ":null": {S: "null"},
             ":ka": {N: (now - 2 * 60 * 1000).toString()}
        },
        TableName: process.env.DYNAMODB_TRANSCODERS_TABLE
    };
    var query1Result = await ddb.scan(params).promise();
    console.log("query1Result", query1Result);
    let items = query1Result.Items;
    if (items){
        let query2Results = [];
        for (var i=0; i<items.length; i++){
            let item = items[i];
            let channelId = item.ChannelId.S;
            const params = {
                TableName: process.env.DYNAMODB_TRANSCODERS_TABLE,
                Key: {
                    "ChannelId": {S: channelId}
                },
                UpdateExpression: "set StreamName = :null",
                ExpressionAttributeValues: {
                    ":null": {S: "null"}
                },
                ReturnValues:"UPDATED_NEW"
            };
            let query2Result = await ddb.updateItem(params).promise();
            query2Results.push(query2Result);
            console.log("query2Result", query2Result);
        }
        await Promise.all(query2Results);
        return {success: true};
    }
    return {success:false};
};
