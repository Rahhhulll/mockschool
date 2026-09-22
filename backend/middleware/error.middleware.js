const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(error.errors).map((item) => item.message),
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID",
    });
  }

  if (error?.code === 11000) {
    return res.status(409).json({
      message: "A record with the same value already exists",
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

module.exports = errorMiddleware;
