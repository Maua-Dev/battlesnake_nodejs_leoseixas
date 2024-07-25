import {
  Stack,
  StackProps,
  aws_iam as iam,
  aws_cloudwatch as cloudwatch,
  aws_sns as sns,
  aws_cloudwatch_actions as actions,
  Duration,
  CfnOutput,
  SecretValue,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda_stack';
import { envs as environments } from '../envs';
import { ComparisonOperator } from 'aws-cdk-lib/aws-cloudwatch';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';

export class IacStack extends Stack {
  constructor(scope: Construct, constructId: string, props?: StackProps) {
    super(scope, constructId, props);
    const githubRef = process.env.GITHUB_REF || '';

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

    const envs = {
      'STAGE': stage
    };

    const lambdaStack = new LambdaStack(this, envs);

    const userName = `${environments.PROJECT_NAME}User`;
    const password = `${environments.PROJECT_NAME}UserPassword7@`;
    const user = new iam.User(this, userName, {
      userName: userName,
      password: SecretValue.unsafePlainText(password),
      passwordResetRequired: true
    });

    const policy = new iam.Policy(this, `Policy-BattlesnakeNodejs-${stage}`, {
      statements: [
        new iam.PolicyStatement({
          actions: ['lambda:*'],
          resources: [lambdaStack.lambdaFunction.functionArn]
        }),
        new iam.PolicyStatement({
          actions: ['logs:*'],
          resources: ['arn:aws:logs:*:*:*']
        }),
        new iam.PolicyStatement({
          actions: ['cloudwatch:*'],
          resources: ['*']
        }),
      ]
    })

    policy.attachToUser(user)

    user.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('IAMUserChangePassword'));
    
    const alarm = lambdaStack.lambdaFunction.metricInvocations({
      period: Duration.hours(6)
    }).createAlarm(this, `${environments.PROJECT_NAME}LambdaAlarm`, {
      threshold: 5000,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
    })
    
    const topic = Topic.fromTopicArn(this, `${environments.PROJECT_NAME}Topic`, 
      `arn:aws:sns:${environments.AWS_REGION}:${environments.AWS_ACCOUNT_ID}:sns-battlesnake`
    )
    const snsAction = new SnsAction(topic)
    alarm.addAlarmAction(snsAction)
    
    new CfnOutput(this, 'IAMUserOutput', {
      value: user.userName,
      exportName: `${environments.PROJECT_NAME}UserValue`
    });
  
    new CfnOutput(this, 'IAMUserPasswordOutput-FirstTimePWD', {
      value: password,
      exportName: `${environments.PROJECT_NAME}IAMUserPasswordOutput-FirstTimePWD`
    });

    new CfnOutput(this, 'LambdaConsole', {
      value: `https://${environments.AWS_REGION}.console.aws.amazon.com/lambda/home?region=${environments.AWS_REGION}#/functions/${lambdaStack.lambdaFunction.functionName}?tab=code`,
      exportName: `${environments.PROJECT_NAME}LambdaConsoleValue`
    })
  }
}
