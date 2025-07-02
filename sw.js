const express = require('express');
const { exec } = require('child_process');
const app = express();
const path = require('path');
const fs = require('fs');

app.use(express.static('public'));

app.get('/download', (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const output = path.join(__dirname, 'video.%(ext)s');
  const command = `yt-dlp -f "bestvideo+bestaudio/best" --merge-output-format mp4 --no-check-certificate -o "${output}" "${url}"`;

  console.log(`Executing command: ${command}`);
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error.message}`);
      return res.status(500).json({ error: `Download failed: ${stderr || error.message}` });
    }
    const videoPath = path.join(__dirname, 'video.mp4');
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not generated' });
    }
    res.download(videoPath, 'video.mp4', (err) => {
      if (err) console.error(err);
      fs.unlink(videoPath, (err) => {
        if (err) console.error(err);
      });
    });
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
