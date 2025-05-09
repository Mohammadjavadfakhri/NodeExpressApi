const express = require('express');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');


const router = express.Router();


router.get('/', auth, (req, res) => {
    const videoDir = path.join(__dirname, '../videos');
    fs.readdir(videoDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading videos' });
        }
        const videos = files.filter(file => file.endsWith('.mp4'));
        res.json(videos);
    });
});


router.get('/stream/:filename', auth, (req, res) => {
    const videoPath = path.join(__dirname, '../videos', req.params.filename);
    if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ error: 'Video not found'});
    }


const stat = fs.statSync(videoPath);
const fileSize = stat.size;
const range = req.headers.range;

if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    
    const file = fs.createReadStream(videoPath, { start, end});
    const head = {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': 'video/mp4'
};

res.writeHead(206, head);
file.pipe(res);
} else {
    const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
    };

    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
   }
});

module.exports = router;