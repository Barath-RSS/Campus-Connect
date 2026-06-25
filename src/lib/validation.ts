import { z } from 'zod';

/**
 * Centralized client-side validation schemas. These mirror the server-side
 * CHECK constraints on the database — keep them in sync.
 */
export const reportDescriptionSchema = z
  .string()
  .trim()
  .min(10, 'Please describe the issue in at least 10 characters.')
  .max(5000, 'Description must be 5000 characters or less.');

export const reportLandmarkSchema = z
  .string()
  .trim()
  .max(200, 'Landmark must be 200 characters or less.')
  .optional()
  .or(z.literal(''));

export const officialResponseSchema = z
  .string()
  .trim()
  .max(2000, 'Response must be 2000 characters or less.');

export const accessRequestReasonSchema = z
  .string()
  .trim()
  .max(500, 'Reason must be 500 characters or less.')
  .optional()
  .or(z.literal(''));

export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_RESPONSE_LENGTH = 2000;
export const MAX_LANDMARK_LENGTH = 200;
export const MAX_REASON_LENGTH = 500;
