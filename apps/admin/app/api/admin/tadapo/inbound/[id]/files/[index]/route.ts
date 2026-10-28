import { workspaceDb } from "../../../../../../../../lib/brand-context";
import { unseal } from '@nova/shared/secure-payload';
import { authenticate } from '../../../../../../../../lib/access';
import { z } from 'zod';
export async function GET(request:Request,{params}:{params:Promise<{id:string;index:string}>}) {
  try {
    await authenticate(request.headers);const p=await params;
    const email=await workspaceDb(request.headers).tadapoInboundEmail.findUniqueOrThrow({where:{id:z.uuid().parse(p.id)}});
    const files=z.array(z.object({filename:z.string(),encrypted:z.string().optional(),archived:z.boolean().optional()})).parse(email.attachments);
    const file=files[z.coerce.number().int().nonnegative().parse(p.index)];if(!file?.archived||!file.encrypted)throw Error();
    const data=unseal(file.encrypted);if(typeof data!=='string')throw Error();
    return new Response(Buffer.from(data,'base64'),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }catch{return new Response(null,{status:404});}
}
