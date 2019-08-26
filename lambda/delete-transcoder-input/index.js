const AWS = require('aws-sdk');
var medialive = new AWS.MediaLive();

exports.handler = async (event) => {
    
    let inputId = event.InputId;
    console.log("inputId: ", inputId);
    
    let res = await medialive.deleteInput({InputId: inputId}).promise();
    console.log("res: ", res);
    
    return {};
};
