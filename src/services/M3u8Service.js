var UrllibUtil = require("../utils/UrllibUtil");
var StringUtil = require("../utils/StringUtil");
var fs = require("fs");
var path = require("path");
class M3u8Service {
  constructor(m3u8Url, destDir, filename = `video.ts`) {
    this.m3u8Url = m3u8Url;
    this.destDir = destDir;
    // TODO 如果这个路径不存在，就创建这个路径
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    this.filename = filename;
  }

  async downloadVideoWithK() {
    await this.loadIndexListToFile();
    const indexList = this.getIndexListFromFile();
    const bestQuiltyVideoInfo = this.getBestQuiltyVideoInfo(indexList);
    await this.loadVideoClipListToFile(bestQuiltyVideoInfo.url);
    const videoClipList = this.getVideoClipListFromFile();
    // TODO 将videoClipList 全部下载下来
    await this.downloadByVideoClipArray(videoClipList);
  }
  async downloadVideoWithA() {
    await this.loadVideoClipListToFile(this.m3u8Url);
    const videoClipList = this.getVideoClipListFromFile();
    await this.downloadByVideoClipArray(videoClipList);
  }

  /**
   * 加载各种分别率的列表，并保存到目标路径
   */
  async loadIndexListToFile() {
    const infoBuffer = await UrllibUtil.getBuffer(this.m3u8Url);
    let infoStr = infoBuffer.toString();
    const preIndex = infoStr.indexOf(`({`);
    infoStr = infoStr.substring(preIndex + 1, infoStr.length - 2);
    infoStr = JSON.stringify(JSON.parse(infoStr), null, 2);
    const filePath = path.join(this.destDir, "indexList.json");
    fs.writeFileSync(filePath, infoStr);
    return this;
  }
  /**
   * 从目标路径从获取到IndexList
   * @returns 返回一个字符串，里面有IndexList信息
   */
  getIndexListFromFile() {
    const filePath = path.join(this.destDir, "indexList.json");
    const videoInfoStr = fs.readFileSync(filePath);
    return JSON.parse(videoInfoStr);
  }

  /**
   * 从indexList中获取到质量最好的indexInfo
   * @param {*} indexList
   */
  getBestQuiltyVideoInfo(indexList) {
    return indexList.flavors.reduce((pre, value) => {
      if (!pre) {
        return value;
      } else {
        if (pre.bitrate > value.bitrate) {
          return pre;
        } else {
          return value;
        }
      }
    }, undefined);
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
    const videoClipList = contentArray.filter((item) => {
      if (StringUtil.checkURL(item)) {
        return true;
      }
    });

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
          return UrllibUtil.getBuffer(item.url);
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
