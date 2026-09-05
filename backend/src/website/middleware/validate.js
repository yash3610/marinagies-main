function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((field) => {
      const value = req.body[field];
      return typeof value !== "string" || !value.trim();
    });

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Required fields: ${missing.join(", ")}`
      });
    }

    next();
  };
}

module.exports = { requireFields };
