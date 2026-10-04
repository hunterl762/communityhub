// API clients always receive JSON, including malformed bodies and database failures.
module.exports = function fivemErrors(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ok:false,error:'Invalid JSON request body'});
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ok:false,error:'Request body is too large'});
  }
  if(error.status===400)return res.status(400).json({ok:false,error:error.message});
  // Log only the code, not SQL parameters, credentials, link codes or licenses.
  console.error('[FiveM API]', error.code || 'INTERNAL_ERROR');
  const schemaErrors = ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'];
  const errorMessage = schemaErrors.includes(error.code)
    ? 'FiveM database schema is incomplete. Apply migrations 005, 006 and 007 after migration 004.'
    : 'Community Hub could not complete the request. Check website logs and the database connection.';
  return res.status(503).json({ok:false,error:errorMessage});
};
