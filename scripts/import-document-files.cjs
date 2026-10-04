require('dotenv').config();
const fs=require('fs/promises'),path=require('path'),crypto=require('crypto'),db=require('../src/db');
const apply=process.argv.includes('--apply');
(async()=>{
  const dir=path.resolve(process.env.UPLOAD_DIR||'storage/uploads');
  const [[limits]]=await db.query('SELECT @@max_allowed_packet packet_size');
  const [docs]=await db.query('SELECT d.id,d.stored_name,d.file_size FROM documents d LEFT JOIN document_contents c ON c.document_id=d.id WHERE c.document_id IS NULL ORDER BY d.id');
  let imported=0,failed=0;
  for(const doc of docs){
    try{
      if(path.basename(doc.stored_name)!==doc.stored_name)throw new Error('invalid path');
      const file=path.join(dir,doc.stored_name);
      const stat=await fs.stat(file);
      if(!stat.isFile())throw new Error('not a regular file');
      if(stat.size+4096>Number(limits.packet_size))throw new Error('exceeds max_allowed_packet');
      if(Number(doc.file_size)!==stat.size)throw new Error('file size differs from document metadata');
      if(apply){const buffer=await fs.readFile(file);await db.query('INSERT IGNORE INTO document_contents(document_id,file_data,sha256) VALUES(?,?,?)',[doc.id,buffer,crypto.createHash('sha256').update(buffer).digest('hex')]);}
      imported++;console.log('Document #'+doc.id+': '+(apply?'imported':'ready to import'));
    }catch(error){failed++;console.error('Document #'+doc.id+': '+(error.code||error.message));}
  }
  console.log((apply?'Import':'Dry run')+' complete: '+imported+' documents, '+failed+' failures. Original files retained.');
  if(failed)process.exitCode=1;
})().catch(error=>{console.error('Import failed:',error.code||'DATABASE_ERROR');process.exitCode=1;}).finally(()=>db.end());
