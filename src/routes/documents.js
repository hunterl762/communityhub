const router = require('express').Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const {STAFF_ROLES,requireAuth,requireRoles} = require('../middleware/auth');
const dir = path.resolve(process.env.UPLOAD_DIR || 'storage/uploads');
const allowed = ['application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg'];
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:Number(process.env.MAX_UPLOAD_MB || 25)*1024*1024},fileFilter:(req,file,cb)=>{
  const ok=allowed.includes(file.mimetype); cb(ok?null:Object.assign(new Error('Unsupported file type'),{status:400}),ok);
}});
router.use(requireAuth);
router.get('/',async(req,res)=>{
  const [docs]=await db.query('SELECT d.*,f.name folder_name,IF(c.document_id IS NULL,0,1) database_stored FROM documents d LEFT JOIN document_folders f ON f.id=d.folder_id LEFT JOIN document_contents c ON c.document_id=d.id ORDER BY d.created_at DESC');
  const [folders]=await db.query('SELECT * FROM document_folders ORDER BY name');
  res.render('documents/index',{docs,folders,canManage:STAFF_ROLES.includes(req.session.user.role)});
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
      req.body.folder_id||null,String(req.body.title||req.file.originalname).slice(0,255),req.file.originalname,crypto.randomUUID(),req.file.mimetype,req.file.size,req.session.user.id
    ]);
    await conn.query('INSERT INTO document_contents(document_id,file_data,sha256) VALUES(?,?,?)',[doc.insertId,req.file.buffer,crypto.createHash('sha256').update(req.file.buffer).digest('hex')]);
    await conn.commit();res.redirect('/documents');
  } catch(error) { if(conn)await conn.rollback();next(error); }
  finally { if(conn)conn.release(); }
});
router.get('/:id/download',async(req,res,next)=>{
  const [[doc]]=await db.query('SELECT d.original_name,d.stored_name,d.mime_type,c.file_data FROM documents d LEFT JOIN document_contents c ON c.document_id=d.id WHERE d.id=?',[req.params.id]);
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
