/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cdk from 'aws-cdk-lib'
import { IacStack } from './iac/iac_stack'
import { envs } from './envs'

console.log('Starting the CDK')

const app = new cdk.App()

const awsAccount = envs.AWS_ACCOUNT_ID
const stackName = envs.STACK_NAME
const awsRegion = envs.AWS_REGION

const tags = {
  'project': 'BattlesnakeNodejs',
  'stack': 'BACK',
  'owner': 'Dev Community Maua'
}

const githubRef = process.env.GITHUB_REF || ''

let stage;
if (githubRef.includes('prod')) {
    stage = 'PROD';
} else if (githubRef.includes('homolog')) {
    stage = 'HOMOLOG';
} else if (githubRef.includes('dev')) {
    stage = 'DEV';
} else {
    stage = 'TEST';
}

new IacStack(app, `${stackName}-IaC-${stage}`, {
  env: {
    region: awsRegion,
    account: awsAccount
  },
  tags: tags
})

app.synth()