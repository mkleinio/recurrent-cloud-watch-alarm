const AWS = require('aws-sdk');
const sns = new AWS.SNS({ apiVersion: '2010-08-01' });

exports.handler = async function(event) {
  const { cloudWatchAlarm, sendEventResult } = event;
  const { SNS_TOPIC_ARN } = process.env;
  const retries = sendEventResult ? sendEventResult.retries : 0;

  await sns.publish({
    TopicArn: SNS_TOPIC_ARN,
    Message: JSON.stringify(cloudWatchAlarm),
  }).promise();

  return {
    retries: retries + 1
  }
}