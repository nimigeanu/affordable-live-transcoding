const AWS = require('aws-sdk');
const fs = require('fs');

var medialive = new AWS.MediaLive();
var id = Math.random().toString(36).substring(7) + new Date().getTime().toString(36)


exports.handler = (event, context, callback) => {
    let inputParams = 
    {
       "Destinations": [
          {
             "StreamName": process.env.CODE_NAME + "/stream",
          },
          {
             "StreamName": process.env.CODE_NAME + "/stream",
          }
       ],
       "InputSecurityGroups": [
          process.env.INPUT_SECURITY_GROUP
       ],
       "Name": "Input-" + id,
       "Type": "RTMP_PUSH"
    }
    
    
    let channelParams = 
    {
       "Name": "Channel-" + id,
       "ChannelClass": "SINGLE_PIPELINE",
       "RoleArn": process.env.MEDIA_LIVE_ROLE,
       "InputAttachments": [
          {
             "InputId": "670529",
             "InputSettings": {
                "SourceEndBehavior": "CONTINUE",
                "InputFilter": "AUTO",
                "FilterStrength": 1,
                "DeblockFilter": "DISABLED",
                "DenoiseFilter": "DISABLED",
                "AudioSelectors": [],
                "CaptionSelectors": []
             }
          }
       ],
       "Destinations": [
          {
             "Id": "destination1",
             "Settings": [
                {
                   "Url": "xxx"
                }
             ]
          }
       ],
       "EncoderSettings": {
          "AudioDescriptions": [
             {
                "AudioSelectorName": "default",
                "CodecSettings": {
                   "AacSettings": {
                      "Bitrate": 64000,
                      "RawFormat": "NONE",
                      "Spec": "MPEG4"
                   }
                },
                "AudioTypeControl": "FOLLOW_INPUT",
                "LanguageCodeControl": "FOLLOW_INPUT",
                "Name": "audio_3_aac64"
             },
             {
                "AudioSelectorName": "default",
                "CodecSettings": {
                   "AacSettings": {
                      "Bitrate": 96000,
                      "RawFormat": "NONE",
                      "Spec": "MPEG4"
                   }
                },
                "AudioTypeControl": "FOLLOW_INPUT",
                "LanguageCodeControl": "FOLLOW_INPUT",
                "Name": "audio_2_aac96"
             }
          ],
          "CaptionDescriptions": [],
          "OutputGroups": [
             {
                "OutputGroupSettings": {
                   "HlsGroupSettings": {
                      "AdMarkers": [],
                      "CaptionLanguageSetting": "OMIT",
                      "CaptionLanguageMappings": [],
                      "HlsCdnSettings": {
                         "HlsMediaStoreSettings": {
                            "NumRetries": 10,
                            "ConnectionRetryInterval": 1,
                            "RestartDelay": 15,
                            "FilecacheDuration": 300,
                            "MediaStoreStorageClass": "TEMPORAL"
                         }
                      },
                      "InputLossAction": "EMIT_OUTPUT",
                      "ManifestCompression": "NONE",
                      "Destination": {
                         "DestinationRefId": "destination1"
                      },
                      "IvInManifest": "INCLUDE",
                      "IvSource": "FOLLOWS_SEGMENT_NUMBER",
                      "ClientCache": "ENABLED",
                      "TsFileMode": "SEGMENTED_FILES",
                      "ManifestDurationFormat": "FLOATING_POINT",
                      "SegmentationMode": "USE_SEGMENT_DURATION",
                      "OutputSelection": "MANIFESTS_AND_SEGMENTS",
                      "StreamInfResolution": "INCLUDE",
                      "IndexNSegments": 10,
                      "ProgramDateTime": "INCLUDE",
                      "ProgramDateTimePeriod": 600,
                      "KeepSegments": 21,
                      "SegmentLength": 6,
                      "TimedMetadataId3Frame": "PRIV",
                      "TimedMetadataId3Period": 10,
                      "CodecSpecification": "RFC_4281",
                      "DirectoryStructure": "SINGLE_DIRECTORY",
                      "SegmentsPerSubdirectory": 10000,
                      "Mode": "LIVE"
                   }
                },
                "Name": "TN2224",
                "Outputs": [
                   {
                      "OutputSettings": {
                         "HlsOutputSettings": {
                            "NameModifier": "_960x540_2000k",
                            "HlsSettings": {
                               "StandardHlsSettings": {
                                  "M3u8Settings": {
                                     "AudioPids": "492-498",
                                     "EcmPid": "8182",
                                     "PcrControl": "PCR_EVERY_PES_PACKET",
                                     "PmtPid": "480",
                                     "Scte35Pid": "500",
                                     "Scte35Behavior": "NO_PASSTHROUGH",
                                     "TimedMetadataPid": "502",
                                     "TimedMetadataBehavior": "NO_PASSTHROUGH",
                                     "VideoPid": "481"
                                  },
                                  "AudioRenditionSets": "PROGRAM_AUDIO"
                               }
                            }
                         }
                      },
                      "VideoDescriptionName": "video_960_540",
                      "AudioDescriptionNames": [
                         "audio_2_aac96"
                      ],
                      "CaptionDescriptionNames": []
                   },
                   {
                      "OutputSettings": {
                         "HlsOutputSettings": {
                            "NameModifier": "_640x360_800k",
                            "HlsSettings": {
                               "StandardHlsSettings": {
                                  "M3u8Settings": {
                                     "AudioPids": "492-498",
                                     "EcmPid": "8182",
                                     "PcrControl": "PCR_EVERY_PES_PACKET",
                                     "PmtPid": "480",
                                     "Scte35Pid": "500",
                                     "Scte35Behavior": "NO_PASSTHROUGH",
                                     "TimedMetadataPid": "502",
                                     "TimedMetadataBehavior": "NO_PASSTHROUGH",
                                     "VideoPid": "481"
                                  },
                                  "AudioRenditionSets": "PROGRAM_AUDIO"
                               }
                            }
                         }
                      },
                      "VideoDescriptionName": "video_640_360",
                      "AudioDescriptionNames": [
                         "audio_3_aac64"
                      ],
                      "CaptionDescriptionNames": []
                   }
                ]
             }
          ],
          "TimecodeConfig": {
             "Source": "SYSTEMCLOCK"
          },
          "VideoDescriptions": [
             {
                "CodecSettings": {
                   "H264Settings": {
                      "ColorMetadata": "INSERT",
                      "AdaptiveQuantization": "HIGH",
                      "Bitrate": 800000,
                      "EntropyEncoding": "CABAC",
                      "FlickerAq": "ENABLED",
                      "FramerateControl": "SPECIFIED",
                      "FramerateNumerator": 30000,
                      "FramerateDenominator": 1001,
                      "GopBReference": "ENABLED",
                      "GopNumBFrames": 3,
                      "GopSize": 60,
                      "GopSizeUnits": "FRAMES",
                      "Level": "H264_LEVEL_3",
                      "LookAheadRateControl": "HIGH",
                      "ParControl": "INITIALIZE_FROM_SOURCE",
                      "Profile": "MAIN",
                      "RateControlMode": "CBR",
                      "Syntax": "DEFAULT",
                      "SceneChangeDetect": "ENABLED",
                      "SpatialAq": "ENABLED",
                      "TemporalAq": "ENABLED"
                   }
                },
                "Height": 360,
                "Name": "video_640_360",
                "ScalingBehavior": "DEFAULT",
                "Width": 640
             },
             {
                "CodecSettings": {
                   "H264Settings": {
                      "ColorMetadata": "INSERT",
                      "AdaptiveQuantization": "HIGH",
                      "Bitrate": 2200000,
                      "EntropyEncoding": "CABAC",
                      "FlickerAq": "ENABLED",
                      "FramerateControl": "SPECIFIED",
                      "FramerateNumerator": 30000,
                      "FramerateDenominator": 1001,
                      "GopBReference": "ENABLED",
                      "GopNumBFrames": 3,
                      "GopSize": 60,
                      "GopSizeUnits": "FRAMES",
                      "Level": "H264_LEVEL_4_1",
                      "LookAheadRateControl": "HIGH",
                      "ParControl": "INITIALIZE_FROM_SOURCE",
                      "Profile": "HIGH",
                      "RateControlMode": "CBR",
                      "Syntax": "DEFAULT",
                      "SceneChangeDetect": "ENABLED",
                      "SpatialAq": "ENABLED",
                      "TemporalAq": "ENABLED"
                   }
                },
                "Height": 540,
                "Name": "video_960_540",
                "ScalingBehavior": "DEFAULT",
                "Width": 960
             }
          ]
       },
       "InputSpecification": {
          "Codec": "AVC",
          "Resolution": "HD",
          "MaximumBitrate": "MAX_20_MBPS"
       },
       "LogLevel": "DISABLED"
    }
    
    medialive.createInput(inputParams, function(err, data) {
      if (err) {
          console.log("err: " + err, err.stack);
          callback(err);
      }
      else {
        console.log("Destinations: ", data.Input.Destinations);
        let inputId = data.Input.Id; 
        let destinations = data.Input.Destinations;
        console.log("inputId: " + inputId);
        channelParams.InputAttachments[0].InputId = inputId;
        channelParams.Destinations[0].Settings[0].Url = process.env.MEDIA_STORE_DESTINATION_PREFIX + inputId;
        medialive.createChannel(channelParams, function(err, data) {
          if (err) {
              console.log(err, err.stack);
              callback(err);
          }
          else {
              //console.log(data);
              callback(null, {ChannelId:data.Channel.Id, InputId:inputId, IngestUri:destinations[0].Url});
          }
        });    
      }    
    });
};
