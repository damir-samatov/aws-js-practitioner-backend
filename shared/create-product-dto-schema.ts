import {z} from 'zod';

export const productCreateDtoSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    price: z.number().positive(),
    count: z.number().int().min(1),
});

export const productCreateCsvDtoSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: z.string(),
    count: z.string(),
});

export type ProductCreateDto = z.infer<typeof productCreateDtoSchema>;

export type ProductCreateCsvDto = z.infer<typeof productCreateCsvDtoSchema>;