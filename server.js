const express = require('express');
const cors = require('cors');
const scdl = require('soundcloud-downloader').default;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/info', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string' || !scdl.isValidUrl(url)) {
    return res.status(400).json({ error: 'Please provide a valid SoundCloud URL.' });
  }

  try {
    const info = await scdl.getInfo(url);
    res.json({
      title: info.title || 'Unknown Title',
      artist: info.user?.username || 'Unknown Artist',
      artwork: info.artwork_url || info.user?.avatar_url,
      duration: info.duration,
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch metadata.' });
  }
});

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string' || !scdl.isValidUrl(url)) {
    return res.status(400).json({ error: 'Please provide a valid SoundCloud URL.' });
  }

  try {
    const info = await scdl.getInfo(url);
    const title = info.title || 'soundcloud_track';
    const safeFilename = title.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');

    res.header('Content-Disposition', `attachment; filename="${safeFilename}.mp3"`);
    res.header('Content-Type', 'audio/mpeg');

    const stream = await scdl.download(url);
    stream.pipe(res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download track.' });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
