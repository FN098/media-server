import z from "zod";

export const RatingInputSchema = z.number().int().min(1).max(5).nullable();
