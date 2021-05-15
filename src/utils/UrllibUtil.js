var urllib = require("urllib");
class UrllibUtil {
  static async getBuffer(url, timeout = 50000) {
    const result = await urllib.request(url, { timeout });
    console.log(`get buffer status is ${result.status}`);
    result.status;
    return result.data;
  }
}

module.exports = UrllibUtil;
