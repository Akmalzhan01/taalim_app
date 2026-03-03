const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Public (or Private/Admin based on need)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            return res.status(500).json({ message: 'Cloudinary credentials missing' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'taalim_books' },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        const result = await streamUpload(req);
        res.json({
            url: result.secure_url,
            public_id: result.public_id
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

module.exports = router;
