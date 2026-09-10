import { z } from "zod";
export const suggestionsInput=z.object({brief:z.string().max(1600),sources:z.array(z.object({id:z.string().max(200),revision:z.number().int().positive(),title:z.string().max(1000),summary:z.string().max(1000),body:z.string().max(4000)})).max(8)});
export const suggestionsSchema=z.object({suggestions:z.array(z.object({title:z.string().trim().min(1).max(60),direction:z.string().trim().min(1).max(300)})).length(3).refine(items=>new Set(items.map(item=>item.title.toLowerCase())).size===3,"Suggestions must be distinct")});
