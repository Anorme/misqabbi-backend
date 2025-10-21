export const attachImagesToBody = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map(file => file.path); // Cloudinary URLs
  }
  next();
};
