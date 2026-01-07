import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Book: a
    .model({
      id: a.string().required(),
      title: a.string().required(),       // Book title
      author: a.string().required(),      // Primary author name
      isbn: a.string(),                   // ISBN-10/13 (optional)
      genres: a.string().array(),         // e.g., ["Fiction", "Fantasy"]
      description: a.string(),
      coverUrl: a.url(),               // store image URL
      available: a.boolean(),             // availability flag
      rating: a.float(),                   // average rating
    })
    .secondaryIndexes((index) => [
      index("isbn")
    ])
    .authorization((allow) => [
      // Matches your original: public access via API key
      allow.publicApiKey(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});