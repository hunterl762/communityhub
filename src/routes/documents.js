const router = require('express').Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const {STAFF_ROLES,requireAuth,requireRoles} = require('../middleware/auth');
const dir = path.resolve(process.env.UPLOAD_DIR || 'storage/uploads');
const DOCUMENT_ADMINS=['admin','management','owner'];
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:Number(process.env.MAX_UPLOAD_MB||25)*1024*1024}});
router.use(requireAuth);
router.get('/',async(req,res)=>{
  const [docs]=await db.query('SELECT d.*,f.name folder_name,IF(c.document_id IS NULL,0,1) database_stored FROM documents d LEFT JOIN document_folders f ON f.id=d.folder_id LEFT JOIN document_contents c ON c.document_id=d.id WHERE d.deleted_at IS NULL ORDER BY d.created_at DESC');
  const [folders]=await db.query('SELECT * FROM document_folders ORDER BY name');
  const canRemove=DOCUMENT_ADMINS.includes(req.session.user.role);
  const [removedDocs]=canRemove?await db.query('SELECT id,title,original_name,deleted_at FROM documents WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'): [[]];
  res.render('documents/index',{docs,folders,removedDocs,canRemove,canManage:STAFF_ROLES.includes(req.session.user.role),maxUploadMB:Number(process.env.MAX_UPLOAD_MB||25)});
});
router.post('/upload',requireRoles(STAFF_ROLES),upload.single('document'),async(req,res,next)=>{
  if(!req.file)return res.status(400).render('message',{title:'No document',message:'Select a document to upload.'});
  let conn;
  try {
    conn=await db.getConnection();
    const [[limits]]=await conn.query('SELECT @@max_allowed_packet packet_size');
    if(req.file.size+4096>Number(limits.packet_size))return res.status(413).render('message',{title:'Database upload limit',message:'This file exceeds the database packet limit. Ask the server administrator to raise max_allowed_packet or upload a smaller file.'});
    await conn.beginTransaction();
    const [doc]=await conn.query('INSERT INTO documents(folder_id,title,original_name,stored_name,mime_type,file_size,uploaded_by) VALUES(?,?,?,?,?,?,?)',[
      req.body.folder_id||null,String(req.body.title||req.file.originalname).slice(0,255),req.file.originalname,crypto.randomUUID(),req.file.mimetype||'application/octet-stream',req.file.size,req.session.user.id
    ]);
    await conn.query('INSERT INTO document_contents(document_id,file_data,sha256) VALUES(?,?,?)',[doc.insertId,req.file.buffer,crypto.createHash('sha256').update(req.file.buffer).digest('hex')]);
    await conn.commit();res.redirect('/documents');
  } catch(error) { if(conn)await conn.rollback();next(error); }
  finally { if(conn)conn.release(); }
});
for(const action of ['remove','restore'])router.post('/:id/'+action,requireRoles(DOCUMENT_ADMINS),async(req,res,next)=>{
  try{
    const sql=action==='remove'?'UPDATE documents SET deleted_at=NOW(),deleted_by=? WHERE id=? AND deleted_at IS NULL':'UPDATE documents SET deleted_at=NULL,deleted_by=NULL WHERE id=? AND deleted_at IS NOT NULL';
    const [result]=await db.query(sql,action==='remove'?[req.session.user.id,req.params.id]:[req.params.id]);
    if(!result.affectedRows)return res.status(404).render('message',{title:'Document unavailable',message:'This document was not found or its removal status has already changed.'});
    res.redirect('/documents');
  }catch(error){next(error);}
});
router.get('/:id/download',async(req,res,next)=>{
  const [[doc]]=await db.query('SELECT d.original_name,d.stored_name,d.mime_type,c.file_data FROM documents d LEFT JOIN document_contents c ON c.document_id=d.id WHERE d.id=? AND d.deleted_at IS NULL',[req.params.id]);
  if(!doc)return next();
  if(doc.file_data!==null){res.set('X-Content-Type-Options','nosniff');return res.type(doc.mime_type||'application/octet-stream').attachment(doc.original_name).send(doc.file_data);}
  // Preserve legacy downloads until the idempotent importer has run.
  if(path.basename(doc.stored_name)!==doc.stored_name)return res.status(404).render('message',{title:'Document unavailable',message:'The stored document path is invalid.'});
  res.download(path.join(dir,doc.stored_name),doc.original_name,error=>{if(error&&!res.headersSent)res.status(404).render('message',{title:'Document unavailable',message:'This legacy file is missing. Restore its backup or import it into the database.'});});
});
router.use((error,req,res,next)=>{
  if(error.code==='LIMIT_FILE_SIZE'||error.status===400)return res.status(error.code==='LIMIT_FILE_SIZE'?413:400).render('message',{title:'Upload failed',message:error.code==='LIMIT_FILE_SIZE'?'The document exceeds the configured upload limit.':error.message});
  next(error);
});
module.exports=router;
