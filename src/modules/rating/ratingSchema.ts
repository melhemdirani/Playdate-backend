import { z } from 'zod';

export const createRatingSchema = z.object({
  body: z.object({
    ratedId: z.string({
      required_error: 'Rated user ID is required',
    }),
    matchId: z.string({
      required_error: 'Match ID is required',
    }),
    rating: z.number({
      required_error: 'Rating is required',
    }).int().min(1).max(5),
  }),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>['body'];
