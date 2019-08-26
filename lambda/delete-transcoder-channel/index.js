const AWS = require('aws-sdk');
var medialive = new AWS.MediaLive();

exports.handler = async (event) => {
    
    let channelId = event.ChannelId;
    console.log("channelId: ", channelId);
    
    let res = await medialive.deleteChannel({ChannelId: channelId}).promise();
    console.log("res: ", res);
    
    return {};
};
