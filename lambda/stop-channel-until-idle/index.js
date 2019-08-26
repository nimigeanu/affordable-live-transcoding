const AWS = require('aws-sdk');
var medialive = new AWS.MediaLive();

exports.handler = async (event) => {
    let channelId = event.ChannelId;
    console.log("channelId: ", channelId);
    
    var params = {
      ChannelId: channelId
    };
    
    var res = await medialive.stopChannel(params).promise();
    console.log("res: ", res.State)    ;
    if (res.State == "IDLE"){
        return {State:res.State};
    }
    else {
        throw new Error("Not yet ready: " + res.State);
    }
};
