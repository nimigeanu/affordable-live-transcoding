# Coordinated AWS MediaLive Transcoding

## Overview

Architecture that orchestrates AWS Elemental resources to transcode an ever-fluctuating number of live streams, and keep a fine balance between availability and cost.

AWS MediaLive is a flexible SaaS platform, capable to transcode live streams in a variety of formats. However, starting a transcoder thread (aka "channel") can take 1-2 minutes or more, depending on AWS inner-workings. For some use cases this is not good enough, as transcoded streams may need to be available immediately, and the start time of a streaming session is not known ahead of time. On the other hand, a "channel" that's started will incur costs. Proposed solution tries to mitigate this by keeping a minimum number of "standby" transcoders available for immediate use, and also monitor and reuse resources as much as possible.

## Features

* Supports an unlimited number of live "streams", each capable to be started and stopped at any time
* Transcoders are allocated to new streams on a best effort basis; these can make use of newly created, reused, or about-to-be-ready resources
* Effortless integration with any RTMP/HLS driven setup; many other architectures can be adapted with minimum adjustments
* Configurable number of preemptively running transcoders
* Distincly separated logic for "standby" transcoder allocation; can be later be improved with "rush hour" variations and next up add decisions based on stats or machine learning 
* API driven

## Setup

### Deploying the architecture

1. Sign in to the [AWS Management Console](https://aws.amazon.com/console), then click the button below to launch the CloudFormation template. Alternatively you can [download](template.yaml) the template and adjust it to your needs.

[![Launch Stack](https://cdn.rawgit.com/buildkite/cloudformation-launch-stack-button-svg/master/launch-stack.svg)](https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?stackName=affordable-live-transcoding&templateURL=https://s3.amazonaws.com/lostshadow/affordable-live-transcoding/template.yaml)

2. Adjust the parameters to fit your needs. Defaults are well suited for a newcomer architecture deployed in `us-east-1` (N.Virginia AWS region); see below for advanced usage scenarios or if you need to deploy to another region.  
3. Choose a name for your stack
4. Check the `I acknowledge that AWS CloudFormation might create IAM resources` box. This confirms you agree to have some required IAM roles and policies created by CloudFormation.
5. Hit the `Create` button. 
6. Wait for the `Status` of your CloudFormation template to become `CREATE_COMPLETE`. Note that this may take **2-3 minutes** or more.
7. Under `Outputs`, notice the `ApiEndpoint`; write this down for later use

#### Notes:
* The `StandbyPoolSize` parameter represents the number of unused transcoders to be kept on standby; the higher the number, the greater a chance a new broadcaster will be able to stream immediately; however larger pool sizes will incur bigger AWS costs for MediaLive
* The solution uses AWS Elemental MediaLive, MediaStore and MediaConvert, which are available in specific AWS Regions only. Therefore, you must deploy it in a region that supports the services.

### Testing your setup

1. Call the following API URL (use browser, Postman, CURL etc) to attempt starting a new transcoder for the stream `stream1`:
		GET {ApiEndpoint}/transcoders/stream1
	...be sure to replace {ApiEndpoint} with the value output by CloudFormation above (step 6)
	
	Repeat the call until the `success` of the response becomes `true` and the `Running` state of the response besomes `YES` (it will transition through a few intermediate states). Write down the `IngestUri` and `PlaybackUri` of the response

3. Point your RTMP broadcaster (any of [these](https://support.google.com/youtube/answer/2907883) will work) to the `IngestUri` output by the API call above and start streaming

	Note that, while some RTMP broadcasters require a simple URI, others (like [OBS Studio](https://obsproject.com)) require a **Server** and **Stream key**. In this case, split the `RtmpDestination` above at the last *slash* character, as following:
	
	**Server**: `rtmp://{IP}:1935/affordable-live-transcoding`  
	**Stream key**: `stream`

5. Test your video playback URL (output by the API call above as `PlaybackUri`) in your favorite HLS player or player tester. You may use [this one](https://video-dev.github.io/hls.js/demo/) if not sure

6. Call the following API URL (use browser, Postman, CURL etc) to stop the transcoder:
		DELETE {ApiEndpoint}/transcoders/stream1
	...be sure to replace {ApiEndpoint} with the value output by CloudFormation above

#### Notes:
* The above test scenario assumes starting and stopping a transcoder for the stream named `stream1`. An unlimited number of streams can be used, and their names are arbitrary

### Integration

Depending on your context, you will need at least the following to automate the process and/or put together a full featured streaming platform:

* Application logic to generate unique stream names for your contributors
* Integration with a RTMP broadcast tool or clear instructions for your users to broadcast with 3rd party software, based on the API-generated RTMP `IngestUri` locations
* A content management system capable to manipulate playback URLs for video players
* CDN

### Advanced usage scenarios

#### The "watchdog" mode

With this mode enabled (by setting the CloudFormation parameter `TranscoderWatchdog` to `true`) every transcoder will need periodically (every 1 minute in the default setup) "kept-alive" or they will be de-allocated and eventually cleaned up. This is meant to guard against situations where some transcoders may be kept running (and incuring costs) due to faulty logic or unstable source streaming environments like Wowza.

To "keep-alive" a transcoder and the associated stream, make the following API call at least every 1 minute:

		PUT {ApiEndpoint}/transcoders/{streamName}?ChannelId={channelId}

#### Adjusting the "pool" size

For the scope of this project, the number of standby transcoders is defined as an arbitrary fixed number. However, production may reveal situations where having this set to a different value at different times would greatly improve availability and/or reduce costs. 
* To manually set the "pool" size to a different value, simply alter its value in the `size-transcoder-pool` lambda function; the new value will be effective immediately
* To setup a logic that dynamically varies the size of the pool (e.g. based on hour of day or day of week) add logic to accomplish that directly in the `size-transcoder-pool` lambda function; it is also possible to invoke external resources to retrieve the respective value