# Recurrent Alarm

This repository is part of my blog post about recurrent CloudWatch alarms.

**[Check the original post to get the full context](https://mklein.io/2020/12/08/recurrent-alarms/)**

## Requirements

- Yarn

## Setup

```bash
# Install dependencies
$ yarn

# Copy & fill the vars template
$ cp .vars.yml.template .vars.yml # ... and fill ".vars.yml"

# Deploy the SQS solution...
$ yarn run deploy-sqs
# ... or the Step Functions solution
$ yarn run deploy-step-functions
```

## Tear down

```bash
# Remove the SQS solution stack...
$ yarn run remove-sqs
# ... and/or the Step Functions stack solution
$ yarn run remove-step-functions
```
