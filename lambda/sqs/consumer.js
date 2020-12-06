const AWS = require('aws-sdk');
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
const sqs = new AWS.SQS({ apiVersion: '2012-11-15' });
const cloudwatch = new AWS.CloudWatch({ apiVersion: '2010-08-01' });

exports.handler = async function(event) {
    // Lambda setup is provided via environment variables
    const { SNS_TOPIC_ARN, QUEUE_URL, INTERVAL, MAX_RETRIES } = process.env;
    const maxRetries = parseInt(MAX_RETRIES, 10);

    let haveRetries = false;

    for(const record of event.Records) {
        const body = JSON.parse(record.body);
        const alarmName = body.detail.alarmName;

        // Check alarm status
        const status = await getAlarmState(alarmName);
        const approxReceiveCount = record.attributes.ApproximateReceiveCount;
        
        if (status === "ALARM" && approxReceiveCount <= maxRetries) {
            // Send cloudwatch event to the SNS topic
            await sns.publish({
                TopicArn: SNS_TOPIC_ARN,
                Message: record.body,
            }).promise();

            // Hide the message in the queue until the next recurrence
            await sqs.changeMessageVisibility({
                QueueUrl: QUEUE_URL,
                ReceiptHandle: record.receiptHandle,
                VisibilityTimeout: INTERVAL,
            }).promise();

            haveRetries = true;
        } else {
            // Alarm is gone or max retries reached:
            // remove the message from the queue
            await sqs.deleteMessage({
                QueueUrl: QUEUE_URL,
                ReceiptHandle: record.receiptHandle
            }).promise();
        }
    }

    if (haveRetries) {
        // Throwing an error makes the lambda skip the deletion of the messages from the queue.
        throw new Error(`At least one alarm is still scheduled for retry`);
    }
}

async function getAlarmState(alarmName) {
    const { MetricAlarms, CompositeAlarms } = await cloudwatch.describeAlarms({
        AlarmNames: [alarmName],
        AlarmTypes: ['MetricAlarm', 'CompositeAlarm']
    }).promise();
    
    if (MetricAlarms.length) {
        // It's a metric alarm
        return MetricAlarms[0].StateValue;
    } else if (CompositeAlarms.length) {
        // It's a composite alarm
        return CompositeAlarms[0].StateValue;
    } else {
        throw new Error(`No alarm found with name ${alarmName}`);
    }
}