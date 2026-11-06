export const interestEvents = ['view', 'website', 'phone', 'email'] as const;
export type InterestEvent = (typeof interestEvents)[number];
