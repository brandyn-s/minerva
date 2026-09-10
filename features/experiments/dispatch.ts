export async function dispatch(id:string){
 if(!process.env.EXPEDITION_DATABASE_URL)return;
 const [{start},{expeditionWorkflow}]=await Promise.all([import('workflow/api'),import('../../workflows/expedition')]);
 await start(expeditionWorkflow,[id]);
}
