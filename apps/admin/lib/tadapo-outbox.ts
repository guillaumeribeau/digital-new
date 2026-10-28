import { getDb, type TadapoMail } from '@nova/database';
/** A public submission can enqueue only; it never receives access to commercial mail. */
export async function transferTadapoMail(limit=100) {
  for(let n=0;n<limit;n++){
    const transferred=await getDb().$transaction(async tx=>{
      const rows=await tx.$queryRaw<TadapoMail[]>`SELECT * FROM "TadapoMail" WHERE "transferredAt" IS NULL ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1`;
      const m=rows[0];if(!m)return false;
      await tx.commercialEmail.create({data:{brand:"tadapo",id:m.id,tadapoOrderId:m.orderId,kind:m.kind,payloadEncrypted:m.payloadEncrypted,expiresAt:new Date(m.createdAt.getTime()+23*3600000)}});
      await tx.tadapoMail.update({where:{id:m.id},data:{transferredAt:new Date()}});return true;
    });
    if(!transferred)return;
  }
}
