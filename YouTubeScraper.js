const axios = require('axios'),
fetch = require('node-fetch');

class YouTubeScraper {
  constructor() {
    this.qualities = {
      audio: {
        0x1: '32',
        0x2: '64',
        0x3: '128',
        0x4: '192'
      },
      video: {
        0x1: '144',
        0x2: '240',
        0x3: '360',
        0x4: '480',
        0x5: '720',
        0x6: '1080',
        0x7: '1440',
        0x8: '2160'
      }
    };
  }

  async search(query) {
    try {
      const searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
        response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }),
        pageContent = await response.text(),
        jsonData = pageContent.match(/var ytInitialData\s*=\s*({.+?});/)?.[1];

      if (!jsonData) throw new Error('Data YouTube tidak ditemukan');

      const parsedData = JSON.parse(jsonData),
        searchResults = [],
        items = parsedData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents;

      if (!items) throw new Error('Tidak ada hasil pencarian');

      for (const item of items) {
        if (item.videoRenderer) {
          const videoData = item.videoRenderer;
          searchResults.push({
            title: videoData.title.runs[0].text,
            url: 'https://www.youtube.com/watch?v=' + videoData.videoId,
            videoId: videoData.videoId,
            duration: videoData.lengthText?.simpleText || 'Live',
            views: videoData.viewCountText?.simpleText || '0 views',
            uploaded: videoData.publishedTimeText?.simpleText || 'Unknown',
            thumbnail: videoData.thumbnail.thumbnails[0].url,
            channel: {
              name: videoData.ownerText?.runs[0]?.text || 'Unknown',
              url: 'https://www.youtube.com' + (videoData.ownerText?.runs[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || '')
            }
          });
          if (searchResults.length >= 10) break;
        }
      }

      return {
        success: true,
        data: searchResults
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async #fetchSaveTube(url, cdnSuffix, params = {}) {
    const headers = {
      accept: '*/*',
      authority: 'cdn' + cdnSuffix + '.savetube.su',
      referer: 'https://ytshorts.savetube.me/',
      origin: 'https://ytshorts.savetube.me/',
      'user-agent': 'Postify/1.0.0',
      'Content-Type': 'application/json'
    };

    try {
      const response = await axios.post(url, params, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async download(url, options = { type: 'video', quality: '720p' }) {
    try {
      const youtubeUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/(?:v|e(?:mbed)?)\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})|(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        match = url.match(youtubeUrlRegex);

      if (!match) throw new Error('URL YouTube tidak valid');

      const isAudio = options.type === 'audio',
        qualityMapping = {
          '144p': '1',
          '240p': '2',
          '360p': '3',
          '480p': '4',
          '720p': '5',
          '1080p': '6'
        },
        randomSuffix = Math.floor(Math.random() * 11) + 51,
        cdnSuffix = 'cdn' + randomSuffix + '.savetube.su',
        saveTubeData = await this.#fetchSaveTube('https://' + cdnSuffix + '/info', randomSuffix, { url }),
        contentType = isAudio ? 'audio' : 'video',
        qualityCode = isAudio ? '3' : qualityMapping[options.quality] || '5',
        downloadData = await this.#fetchSaveTube('https://' + cdnSuffix + '/download', randomSuffix, {
          downloadType: contentType,
          quality: this.qualities[contentType][qualityCode],
          key: saveTubeData.data.key
        });

      return {
        title: saveTubeData.data.title,
        duration: saveTubeData.data.durationLabel,
        thumbnail: saveTubeData.data.thumbnail,
        downloadUrl: downloadData.data.downloadUrl,
        quality: options.quality || '720p',
        type: options.type
      };
    } catch (error) {
      throw new Error('Download gagal: ' + error.message);
    }
  }
}

module.exports = YouTubeScraper;
