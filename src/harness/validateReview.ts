import { z } from 'zod';

export const ReviewSchema = z.object({
  verdict: z.enum(['approve', 'revise', 'needs_human_professional']),
  score: z.number().min(0).max(10),
  issues: z.array(z.string()),
});

export type Review = z.infer<typeof ReviewSchema>;

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence?.[1] ?? text;
  return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
}

function safeParseReview(text: string) {
  try {
    return ReviewSchema.safeParse(extractJson(text));
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export async function validateReview(
  read: () => Promise<string>,
  retry: () => Promise<string>,
): Promise<Review> {
  const first = safeParseReview(await read());
  if (first.success) return first.data;

  const second = safeParseReview(await retry());
  if (second.success) return second.data;

  throw 'error' in second && second.error
    ? second.error
    : new Error('Ревьюер вернул невалидный JSON');
}
