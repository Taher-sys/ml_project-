import { z } from "zod";

export const SensorInputSchema = z.object({
  air_temperature: z.number().min(200).max(400),
  process_temperature: z.number().min(200).max(400),
  rotational_speed: z.number().min(0).max(5000),
  torque: z.number().min(0).max(300),
  tool_wear: z.number().min(0).max(500),
  type: z.enum(["L", "M", "H"]),
});

export const ShapContributionSchema = z.object({
  feature: z.string(),
  value: z.number(),
});

export const FailureModeDiagnosisSchema = z
  .object({
    code: z.enum(["TWF", "HDF", "PWF", "OSF", "RNF", "NONE"]),
    name: z.string(),
    short_name: z.string().optional(),
    shortName: z.string().optional(),
    description: z.string().optional().default(""),
    indicators: z.array(z.string()).default([]),
  })
  .passthrough();

export const PredictionResponseSchema = z
  .object({
    failure_probability: z.number(),
    confidence_score: z.number(),
    uncertainty_std: z.number(),
    prediction: z.enum(["failure", "normal"]),
    shap_contributions: z.array(ShapContributionSchema).default([]),
    recommendation: z.string().default("Safe to operate"),
    safety_measures: z.array(z.string()).default([]),
    failure_mode: FailureModeDiagnosisSchema.optional(),
  })
  .passthrough();

export type SensorFormValues = z.infer<typeof SensorInputSchema>;
