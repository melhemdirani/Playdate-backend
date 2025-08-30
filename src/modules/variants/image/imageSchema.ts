import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export const imageInputSchema = z.object({
  publicId: z.string({
    required_error: "PublicId is required",
    invalid_type_error: "PublicId must be a string",
  }),
  url: z.string({
    required_error: "Url is required",
    invalid_type_error: "Url must be a string",
  }),
  fileName: z.string({
    required_error: "fileName is required",
    invalid_type_error: "fileName must be a string",
  }),
});

export const imageResponseSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  url: z.string(),
  fileName: z.string(),
  // createdAt: z.date().optional(),
  // updatedAt: z.date().optional(),
});

export const imageListResponseSchema = z.array(imageResponseSchema);

export type ImageInput = z.infer<typeof imageInputSchema>;
export type ImageResponse = z.infer<typeof imageResponseSchema>;
export type ImageListResponse = z.infer<typeof imageListResponseSchema>;

export const imageSelection = {
  id: true,
  publicId: true,
  url: true,
  // createdAt: true,
  // updatedAt: true,
  fileName: true,
};

export const imageInputJson = zodToJsonSchema(imageInputSchema);
export const imageResponseJson = zodToJsonSchema(imageResponseSchema);
export const imageListResponseJson = zodToJsonSchema(imageListResponseSchema);

//videos
//same as images

export const videoInputSchema = imageInputSchema;
export const videoResponseSchema = imageResponseSchema;
export const videoListResponseSchema = imageListResponseSchema;

export const videoSelection = {
  id: true,
  publicId: true,
  url: true,
  createdAt: true,
  updatedAt: true,
  videoLength: true,
};

export type VideoInput = z.infer<typeof videoInputSchema>;
export type VideoResponse = z.infer<typeof videoResponseSchema>;
export type VideoListResponse = z.infer<typeof videoListResponseSchema>;
