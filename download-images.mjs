import fs from "fs";
import https from "https";
import path from "path";

const urls = [
  "https://static.wixstatic.com/media/3d91bb_dbe57b5146fd49d1addc03794a9f5e20~mv2.jpeg/v1/fill/w_1600,h_1000,al_c,q_90/hero.jpeg",
  "https://static.wixstatic.com/media/3d91bb_3d38f544776f4e70ae10a0565d539111~mv2.jpg/v1/fill/w_800,h_800,al_c,q_90/instructor1.jpg",
  "https://static.wixstatic.com/media/11062b_38aa1bb019f84f17a5d13bfcb5df3f98~mv2.jpg/v1/fill/w_800,h_800,al_c,q_90/instructor2.jpg",
  "https://static.wixstatic.com/media/d6ea43f8a5da4e90a410deae39b162f5.jpg/v1/fill/w_800,h_800,al_c,q_90/about.jpg"
];

const dir = path.join(process.cwd(), "public/images");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

urls.forEach((url, i) => {
  const filename = `image${i + 1}.jpg`;
  const filepath = path.join(dir, filename);
  https.get(url, (res) => {
    const fileStream = fs.createWriteStream(filepath);
    res.pipe(fileStream);
    fileStream.on("finish", () => {
      fileStream.close();
      console.log(`Downloaded ${filename}`);
    });
  });
});
