import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import * as path from 'path';
import { envs } from '../envs';

export class LambdaStack extends Construct {
  public readonly lambdaFunction: lambda.Function;
  nodeModulesLayer: lambda.LayerVersion;

  constructor(scope: Construct, environmentVariables: Record<string, any>) {
    super(scope, `${envs.STACK_NAME}`);

    const projectName = envs.PROJECT_NAME;
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

    this.nodeModulesLayer = new lambda.LayerVersion(this, `${envs.STACK_NAME}-node-modules-${stage}`, {
      code: lambda.Code.fromAsset(path.join(__dirname, `../dependencies`)),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Node modules layer for Battlesnake Nodejs'
    });

    this.lambdaFunction = new lambda.Function(this, `${envs.STACK_NAME}-${stage}`, {
      functionName: `${envs.PROJECT_NAME}-${stage}`,
      code: lambda.Code.fromAsset(path.join(__dirname, `../../dist`)),
      handler: `index.handler`,
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: environmentVariables,
      layers: [this.nodeModulesLayer],
      timeout: Duration.seconds(30),
      memorySize: 512
    });

    const lambdaUrl = this.lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });

    new CfnOutput(this, `${envs.STACK_NAME}UrlValue`, {
      value: lambdaUrl.url,
      exportName: projectName + 'UrlValue'
    });
  }
}
