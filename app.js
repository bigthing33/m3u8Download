const M3u8Service = require("./src/services/M3u8Service");
const M3u8ServiceA = require("./src/services/M3u8ServiceA");
const path = require("path");

async function main() {
  const indexUrl =
   "https://tx-safety-video.acfun.cn/mediacloud/acfun/acfun_video/hls/oShu5tE-CBmK7R_Se_B8H4gPHDjtU-OHWYcHouKVg9F71FTQpulfJXMsZeEV4Iq8.m3u8?pkey=ABCVDOTUhgMhyZy8qVoRooEGKPwhkPuk1dZx-Kp0V-oTAwa6Vcjp-rDj1jW12oYxCAv6yH3891XH7rIyICUghHlA34k9WklQ9MslFVc04Rd4djAK9G-0fjMWRtCVLW17CTMHxCUcMtK8jw2GvLnpTQvhcd7lqvR3eyP5Q6wPn10ti_ioYHccVomLAjMswrHePvceym2f5AaYYActPKvlBpgEkdpRgnM8Du2rV6kT3Mqsyf_LJrG5UwYiM90oYlRot9w&safety_id=AAKTYNrLB_6ARoU0_T_xitp8s"
  const filename = `09FPS发射物的实现`;
  const videoPreUrl = `https://tx-safety-video.acfun.cn/mediacloud/acfun/acfun_video/hls/`;
  const destDir = path.join(__dirname, `./assets/A站编程/${filename}`);
  const m3u8Service = new M3u8ServiceA(
    indexUrl,
    destDir,
    filename,
    videoPreUrl
  );
  m3u8Service.timeout = 30000;
  await m3u8Service.downloadVideo();
}
main();
