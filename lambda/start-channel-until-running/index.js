const AWS = require('aws-sdk');
var medialive = new AWS.MediaLive();

exports.handler = async (event) => {
    let channelId = event.ChannelId;
    console.log("channelId: ", channelId);
    
    var params = {
      ChannelId: channelId
    };
    
    var res = await medialive.startChannel(params).promise();
    console.log("res: ", res.State)    ;
    if (res.State == "RUNNING"){
        return {State:res.State};
    }
    else {
        throw new Error("Not yet ready: " + res.State);
    }
};
