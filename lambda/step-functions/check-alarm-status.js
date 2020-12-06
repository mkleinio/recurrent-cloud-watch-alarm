const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({ apiVersion: '2010-08-01' });

exports.handler = async function(event) {
  const { alarmName } = event.cloudWatchAlarm.detail
  const status = await getAlarmState(alarmName)
    
  return {
    alarmName: alarmName,
    alarmStatus: status,
  }
}

async function getAlarmState(alarmName) {
  const { MetricAlarms, CompositeAlarms } = await cloudwatch.describeAlarms({
      AlarmNames: [alarmName],
      AlarmTypes: ['MetricAlarm', 'CompositeAlarm']
  }).promise()
  
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