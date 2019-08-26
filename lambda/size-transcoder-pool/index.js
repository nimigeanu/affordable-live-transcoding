var aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});


//for now using a constant pool size
//this value can be adjusted on the fly may situation require it
//const REQUIRED_POOL_SIZE = 0;
const REQUIRED_POOL_SIZE = process.env.STANDBY_POOL_SIZE;

//keep recently unassigned transcoders alive for a while so they get the chance to be reused
//new transcoders would need 1-1.5 minutes to start
const WAIT_TIME_AFTER_UNASSIGN = 60;

exports.handler = async (event) => {
    let lastOperation = event.LastOp;
    console.log("lastOperation: " + lastOperation);
    
    switch (lastOperation) {
      case "ASSIGN_TRANSCODER":
        await sizePool(lastOperation);
        break;
      case "ASSIGN_TRANSCODER_FAILED":
        await sizePool(lastOperation);
        break;
      case "UNASSIGN_TRANSCODER":
        await waitAndReSize();
        break;
      case "WAIT":
        await sizePool(lastOperation);
        break;
      default:
        await sizePool(lastOperation);
        break;
    }
    
    return {success:true};
};

async function sizePool(lastOperation){
    console.log("sizePool()");
    
    var params = {
      ExpressionAttributeValues: {
       ":v1": {
         S: "null"
        }
      },
      IndexName : "StreamName-index",
      KeyConditionExpression: "StreamName = :v1", 
      ProjectionExpression: "ChannelId, Running", 
      TableName: process.env.DYNAMODB_TRANSCODERS_TABLE
     };
    
    var query1Result = await ddb.query(params).promise();
    console.log("query1Result", query1Result);
    
    let availableTranscoders = query1Result.Count;
    console.log("availableTranscoders", availableTranscoders);
    
    if (availableTranscoders > REQUIRED_POOL_SIZE){
        //only destroy one transcoder at a time to avoid these being destroyed too early by concurrent runs
        let channelId = query1Result.Items[0].ChannelId.S;
        let running = query1Result.Items[0].Running.S == "YES";
        console.log("running: " + running);
        if (running)
            await destroyTranscoder(channelId);
        await waitAndReSize();
    }
    else if (availableTranscoders < REQUIRED_POOL_SIZE){
      await createTranscoders(REQUIRED_POOL_SIZE - availableTranscoders);
    }
    else if (lastOperation == "ASSIGN_TRANSCODER_FAILED"){
      await createTranscoders(1);
    }
}

async function createTranscoders(howMany){
  console.log("createTranscoders: " + howMany);
  const startExecutionResults = [];
  for (var i=0; i<howMany; i++) {
    //create one new transcoer
    var params = {
        stateMachineArn: process.env.SETUP_TRANSCODER_SM
    };
    var stepFunctions = new aws.StepFunctions();
    var startExecutionResult = stepFunctions.startExecution(params).promise();
    startExecutionResults.push(startExecutionResult);
  }
  
  await Promise.all(startExecutionResults);
  console.log("startExecutionResults: ", startExecutionResults);
}

async function destroyTranscoder(channelId){
    console.log("destroyTranscoder: ", channelId);
    var params = {
        stateMachineArn: process.env.DESTROY_TRANSCODER_SM,
        input: JSON.stringify({ChannelId:channelId})
    };
    var stepFunctions = new aws.StepFunctions();
      
    var startExecutionResult = await stepFunctions.startExecution(params).promise();
    console.log("startExecutionResult: ", startExecutionResult);
}

async function waitAndReSize(){
    console.log("waitAndSize()");
    var params = {
        stateMachineArn: process.env.DELAY_SIZE_TRANSCODER_POOL_SM,
        input: JSON.stringify({Seconds:WAIT_TIME_AFTER_UNASSIGN})
    };
    var stepFunctions = new aws.StepFunctions();
      
    var startExecutionResult = await stepFunctions.startExecution(params).promise();
    console.log("startExecutionResult: ", startExecutionResult);
}