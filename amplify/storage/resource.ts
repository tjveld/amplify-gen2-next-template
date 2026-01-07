import { defineStorage } from '@aws-amplify/backend';

export const contentBucket = defineStorage({
  name: 'content',
  isDefault: true,
});

export const uploadBucket = defineStorage({
  name: 'upload',
  access: (allow) => ({
    'upload/*': [
      allow.authenticated.to(['read','write', 'delete'])
    ],
  })
});