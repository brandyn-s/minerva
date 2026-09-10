import {readFileSync} from 'node:fs';
// Optional owner-authorized Vercel preview access; never log cookie values.
export async function previewAccess(context){
 const path=process.env.MINERVA_BROWSER_COOKIE_FILE;if(!path)return;
 const cookies=readFileSync(path,'utf8').split('\n').filter(line=>line.includes('\t')&&(!line.startsWith('#')||line.startsWith('#HttpOnly_'))).map(line=>{const [domain,,path,secure,expires,name,value]=line.replace(/^#HttpOnly_/,'').split('\t');return {domain,path,secure:secure==='TRUE',expires:expires==='0'?-1:Number(expires),name,value,httpOnly:true};}).filter(c=>c.name==='_vercel_jwt');
 await context.addCookies(cookies);
}

export async function mockDirections(page){
 await page.route('**/api/expedition/suggestions',route=>route.fulfill({json:{suggestions:[{title:'Change scale',direction:'Explore a different scale.'},{title:'Share ownership',direction:'Explore shared ownership.'},{title:'Make it reversible',direction:'Explore reversible versions.'}]}}));
}
