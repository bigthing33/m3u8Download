var UrllibUtil = require("../utils/UrllibUtil");
var StringUtil = require("../utils/StringUtil");
var fs = require("fs");
var path = require("path");
class M3u8Service {
  constructor(m3u8Url, destDir, filename = `video.ts`, videoPreUrl) {
    this.m3u8Url = m3u8Url;
    this.destDir = destDir;
    this.videoPreUrl = videoPreUrl;
    // TODO 如果这个路径不存在，就创建这个路径
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    this.filename = `${filename}.ts`;
    this.timeout = 10000;
  }

  async downloadVideo() {
    await this.loadVideoClipListToFile(this.m3u8Url, this.timeout);
    const videoClipList = this.getVideoClipListFromFile();
    console.log(`videoClipList`, videoClipList);
    await this.downloadByVideoClipArray(videoClipList);
  }

  async loadVideoClipListToFile(url) {
    const buffer = await UrllibUtil.getBuffer(url);
    const filePath = path.join(this.destDir, "index.m3u8");
    fs.writeFileSync(filePath, buffer);
    return this;
  }
  getVideoClipListFromFile() {
    const filePath = path.join(this.destDir, "index.m3u8");
    const buffer = fs.readFileSync(filePath);
    const indexM3u8Str = buffer.toString();
    return this._convertStrToVideClipList(indexM3u8Str);
  }
  _convertStrToVideClipList(indexM3u8Str) {
    const preIndex = indexM3u8Str.indexOf(`#EXTINF`);
    const aftIndex = indexM3u8Str.indexOf(`#EXT-X-ENDLIST`);
    const contentStr = indexM3u8Str.substring(preIndex, aftIndex);
    const contentArray = contentStr.split(`\n`);
    const videoClipList = contentArray.reduce((pre, item) => {
      if (item.indexOf(`#EXTINF:`) !== -1) {
        return pre;
      } else {
        return pre.concat(this.videoPreUrl + item);
      }
    }, []);
    // const videoClipList = contentArray.filter((item) => {
    //   if (StringUtil.checkURL(item)) {
    //     return true;
    //   }
    // });

    return videoClipList;
  }

  async downloadByVideoClipArray(videoClipList) {
    const videoArray = videoClipList.map((url, index) => {
      return { url, index };
    });

    const downLoadOnce = async () => {
      console.log(`downLoadOnce start`);
      //  遍历videoMap 下载内容
      const resolves = videoArray.map((item) => {
        if (item.data) {
          return Promise.resolve(item.data);
        } else {
          return UrllibUtil.getBuffer(item.url, this.timeout);
        }
      });
      const results = await Promise.allSettled(resolves);
      for (let i = 0; i < videoArray.length; i++) {
        if (videoArray[i].data) {
          continue;
        }
        if (results[i].status === "fulfilled") {
          videoArray[i].data = results[i].value;
        }
      }
    };

    const isDownloadComplete = () => {
      const unDownVideo = videoArray.find((item) => {
        if (!item.data) {
          return true;
        }
      });
      if (unDownVideo) {
        return false;
      }
      return true;
    };
    while (!isDownloadComplete()) {
      await downLoadOnce();
    }
    const bufferArray = [];
    videoArray.map((item) => {
      bufferArray[item.index] = item.data;
    });
    const videoBuffer = Buffer.concat(bufferArray);
    const filePath = path.join(this.destDir, this.filename);
    fs.writeFileSync(filePath, videoBuffer);
  }
}

module.exports = M3u8Service;
