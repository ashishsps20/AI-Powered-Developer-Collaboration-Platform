const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong',
    // Do not include stack trace in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
