export const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash';

export function resolveModel(override?: string): string {
  const model = override?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  if (!model) throw new Error('Не задана модель');
  return model;
}
