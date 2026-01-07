import { defineFunction } from "@aws-amplify/backend";

export const availabilityNotification = defineFunction({
  name: "job-availability-notification",
  schedule: "every 1h"
})