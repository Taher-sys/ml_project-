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

export const PredictionResponseSchema = z.object({
  failure_probability: z.number().min(0).max(1),
  confidence_score: z.number().min(0).max(1),
  uncertainty_std: z.number().min(0),
  prediction: z.enum(["failure", "normal"]),
  shap_contributions: z.array(ShapContributionSchema),
  recommendation: z.string(),
  safety_measures: z.array(z.string()).default([]),
});

export type SensorFormValues = z.infer<typeof SensorInputSchema>;
