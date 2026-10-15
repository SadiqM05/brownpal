import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { EventSourceMapping, FilterCriteria, FilterRule, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { forumCleanup } from './functions/forum-cleanup/resource';
import { storage } from './storage/resource';
import { uploadGuard } from './storage/upload-guard/resource';

/** Requests one IP address may make to the API in five minutes before being blocked. Generous, because RAs on campus Wi-Fi can share an address. */
const API_REQUESTS_PER_IP_PER_5_MIN = 3000;

const backend = defineBackend({
  auth,
  data,
  storage,
  forumCleanup,
  uploadGuard,
});

// ResLink accounts are created by administrators only; disable self sign-up.
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
};
// Long passwords over composition rules, following NIST guidance.
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 12,
    requireLowercase: true,
    requireNumbers: true,
    requireUppercase: false,
    requireSymbols: false,
    temporaryPasswordValidityDays: 7,
  },
};

// Rate-limit the API per IP address.
const { graphqlApi, cfnResources: dataCfn } = backend.data.resources;
const apiStack = Stack.of(graphqlApi);
const apiRateLimit = new CfnWebACL(apiStack, 'ApiRateLimit', {
  scope: 'REGIONAL',
  defaultAction: { allow: {} },
  visibilityConfig: { cloudWatchMetricsEnabled: true, metricName: 'ResLinkApi', sampledRequestsEnabled: true },
  rules: [
    {
      name: 'RateLimitPerIp',
      priority: 0,
      action: { block: {} },
      statement: { rateBasedStatement: { limit: API_REQUESTS_PER_IP_PER_5_MIN, aggregateKeyType: 'IP' } },
      visibilityConfig: { cloudWatchMetricsEnabled: true, metricName: 'ResLinkApiRateLimit', sampledRequestsEnabled: true },
    },
  ],
});
new CfnWebACLAssociation(apiStack, 'ApiRateLimitAssociation', {
  resourceArn: dataCfn.cfnGraphqlApi.attrArn,
  webAclArn: apiRateLimit.attrArn,
});

// Upload guard: reads the start of each upload and deletes files that break the rules.
const { bucket } = backend.storage.resources;
const uploadGuardLambda = backend.uploadGuard.resources.lambda;
bucket.grantRead(uploadGuardLambda);
bucket.grantDelete(uploadGuardLambda);

// Forum clean-up: deleting a post removes its comments, read receipts and files; deleting the last
// reply under a "deleted comment" placeholder removes the placeholder; new posts and comments are
// checked for consistency.
const { tables } = backend.data.resources;
const postTable = tables['Post'];
const commentTable = tables['Comment'];
const postReadTable = tables['PostRead'];
const cleanupLambda = backend.forumCleanup.resources.lambda;

backend.forumCleanup.addEnvironment('POST_TABLE_NAME', postTable.tableName);
backend.forumCleanup.addEnvironment('COMMENT_TABLE_NAME', commentTable.tableName);
backend.forumCleanup.addEnvironment('POST_READ_TABLE_NAME', postReadTable.tableName);
backend.forumCleanup.addEnvironment('BUCKET_NAME', bucket.bucketName);

cleanupLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['dynamodb:GetItem', 'dynamodb:Scan', 'dynamodb:UpdateItem'],
    resources: [postTable.tableArn],
  }),
);
cleanupLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['dynamodb:Query', 'dynamodb:GetItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:BatchWriteItem'],
    resources: [commentTable.tableArn, `${commentTable.tableArn}/index/*`],
  }),
);
cleanupLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['dynamodb:Query', 'dynamodb:BatchWriteItem'],
    resources: [postReadTable.tableArn],
  }),
);
bucket.grantDelete(cleanupLambda, 'forum/*');

for (const [name, table] of [['Post', postTable], ['Comment', commentTable]] as const) {
  const streamPolicy = new Policy(Stack.of(table), `ForumCleanup${name}StreamPolicy`, {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
        resources: ['*'],
      }),
    ],
  });
  cleanupLambda.role?.attachInlinePolicy(streamPolicy);

  const mapping = new EventSourceMapping(Stack.of(table), `ForumCleanup${name}StreamMapping`, {
    target: cleanupLambda,
    eventSourceArn: table.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    retryAttempts: 3,
    bisectBatchOnError: true,
    filters: [FilterCriteria.filter({ eventName: FilterRule.or('INSERT', 'REMOVE') })],
  });
  mapping.node.addDependency(streamPolicy);
}
