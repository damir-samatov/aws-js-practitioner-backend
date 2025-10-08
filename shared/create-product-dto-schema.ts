import {z} from 'zod';

export const productCreateDtoSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    price: z.number().positive(),
    count: z.number().int().min(1),
});

export type ProductCreateDto = z.infer<typeof productCreateDtoSchema>;