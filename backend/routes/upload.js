const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
destination: function(req, file, cb) {
cb(null, 'uploads/');
},


filename: function(req, file, cb) {
    cb(
        null,
        Date.now() +
        '-' +
        file.originalname
    );
}


});

const upload = multer({ storage });

router.post(
'/',
authenticate,
upload.single('file'),
(req, res) => {

    if (!req.file) {
        return res.status(400).json({
            message: 'No file uploaded'
        });
    }

    res.json({
        success: true,
        fileName: req.file.filename,
        fileUrl:
            `${req.protocol}://${req.get('host')}/uploads/` +
            req.file.filename
    });
}


);

module.exports = router;
