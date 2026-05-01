import { z } from 'zod';

/**
 * Safely parse JSON string with Zod schema validation
 * @param json - JSON string to parse
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated data
 * @throws Error if JSON is invalid or doesn't match schema
 */
export function parseJson<T extends z.ZodType>(
  json: string,
  schema: T,
): z.infer<T> {
  const parsed: unknown = JSON.parse(json);
  return schema.parse(parsed);
}

/**
 * Safely parse JSON string with Zod schema validation
 * Returns null if parsing or validation fails
 */
export function tryParseJson<T extends z.ZodType>(
  json: string,
  schema: T,
): z.infer<T> | null {
  try {
    const parsed: unknown = JSON.parse(json);
    return schema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * Safely parse JSON string with Zod schema validation
 * Returns the result or a default value if parsing/validation fails
 */
export function parseJsonOrDefault<T extends z.ZodType>(
  json: string,
  schema: T,
  defaultValue: z.infer<T>,
): z.infer<T> {
  try {
    const parsed: unknown = JSON.parse(json);
    return schema.parse(parsed);
  } catch {
    return defaultValue;
  }
}
