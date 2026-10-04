const STAFF_ROLES=['department_command','staff','admin','management','owner'];
const REVIEW_ROLES=['reviewer','department_command','staff','admin','management','owner'];
const DEPARTMENT_HEAD_ROLES=['department_command','admin','management','owner'];
const USER_MANAGER_ROLES=['admin','owner'];
function requireAuth(req,res,next){if(!req.session.user)return res.redirect('/auth/login');next();}
function requireRoles(roles){return (req,res,next)=>{if(!req.session.user)return res.redirect('/auth/login');if(!roles.includes(req.session.user.role))return res.status(403).render('message',{title:'Access denied',message:'You do not have permission to access this area.'});next();};}
module.exports={STAFF_ROLES,REVIEW_ROLES,DEPARTMENT_HEAD_ROLES,USER_MANAGER_ROLES,requireAuth,requireRoles};