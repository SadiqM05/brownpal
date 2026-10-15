import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { EventSourceMapping, FilterCriteria, FilterRule, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { forumCleanup } from './functions/forum-cleanup/resource';
import { storage } from './storage/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  forumCleanup,
});

// ResLink accounts are created by administrators only; disable self sign-up.
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
};

// Forum clean-up: deleting a post removes its comments, read receipts and files, and deleting the
// last reply under a "deleted comment" placeholder removes the placeholder.
const { tables } = backend.data.resources;
const postTable = tables['Post'];
const commentTable = tables['Comment'];
const postReadTable = tables['PostRead'];
const cleanupLambda = backend.forumCleanup.resources.lambda;
const { bucket } = backend.storage.resources;

backend.forumCleanup.addEnvironment('POST_TABLE_NAME', postTable.tableName);
backend.forumCleanup.addEnvironment('COMMENT_TABLE_NAME', commentTable.tableName);
backend.forumCleanup.addEnvironment('POST_READ_TABLE_NAME', postReadTable.tableName);
backend.forumCleanup.addEnvironment('BUCKET_NAME', bucket.bucketName);

cleanupLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['dynamodb:Query', 'dynamodb:GetItem', 'dynamodb:DeleteItem', 'dynamodb:BatchWriteItem'],
    resources: [
      commentTable.tableArn,
      `${commentTable.tableArn}/index/*`,
      postReadTable.tableArn,
    ],
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
    filters: [FilterCriteria.filter({ eventName: FilterRule.isEqual('REMOVE') })],
  });
  mapping.node.addDependency(streamPolicy);
}
