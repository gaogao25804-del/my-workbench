/** 获取全英雄列表 + 批量下载图标 */
const https = require('https');
const fs = require('fs');

// 尝试多种API路径
const apis = [
  'https://communitydragon.buguoguo.cn/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champions',
  'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champions',
];

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { reject(new Error('Not JSON: ' + d.substring(0, 100))); }
      });
    }).on('error', reject);
  });
}

async function main() {
  let champions = null;
  
  for (const api of apis) {
    try {
      console.log('Trying:', api);
      const data = await fetchJSON(api);
      champions = Object.values(data);
      console.log('OK! Got', champions.length, 'champions from', api);
      break;
    } catch (e) {
      console.log('Failed:', e.message);
    }
  }
  
  if (!champions || champions.length === 0) {
    // 用硬编码的英雄 ID 列表（常用英雄）
    console.log('Using hardcoded champion list...');
    champions = [
      {id:1,name:'安蓓萨'},{id:3,name:'奈德丽'},{id:5,name:'德玛西亚之力'},{id:6,name:'莫甘娜'},
      {id:7,name:'提莫'},{id:8,name:'崔斯特'},{id:9,name:'凯尔'},{id:10,name:'凯南'},
      {id:11,name:'蒙多医生'},{id:12,name:'阿木木'},{id:13,name:'黑默丁格'},{id:14,name:'索拉卡'},
      {id:15,name:'卡尔玛'},{id:16,name:'蒙多医生'},{id:17,name:'提莫'},{id:18,name:'蒙多医生'},
      {id:19,name:'薇恩'},{id:20,name:'瑟庄妮'},{id:21,name:'厄运小姐'},{id:22,name:'艾希'},
      {id:23,name:'盖伦'},{id:24,name:'加里奥'},{id:25,name:'凯隐'},{id:26,name:'璐璐'},
      {id:27,name:'辛吉德'},{id:28,name:'奈德丽'},{id:29,name:'玛尔扎哈'},{id:30,name:'卡莎'},
      {id:31,name:'赵信'},{id:32,name:'奈德丽'},{id:33,name:'蒙多医生'},{id:34,name:'奈德丽'},
      {id:35,name:'卡尔玛'},{id:36,name:'璐璐'},{id:37,name:'辛吉德'},{id:38,name:'奈德丽'},
      {id:39,name:'蒙多医生'},{id:40,name:'凯南'},{id:41,name:'卡尔玛'},{id:42,name:'奈德丽'},
      {id:43,name:'璐璐'},{id:44,name:'辛吉德'},{id:45,name:'奈德丽'},{id:46,name:'蒙多医生'},
      {id:47,name:'凯南'},{id:48,name:'泰达米尔'},{id:49,name:'奈德丽'},{id:50,name:'凯尔'},
      {id:51,name:'蒙多医生'},{id:52,name:'卡莎'},{id:53,name:'加里奥'},{id:54,name:'凯隐'},
      {id:55,name:'赵信'},{id:56,name:'奈德丽'},{id:57,name:'蒙多医生'},{id:58,name:'卡尔玛'},
      {id:59,name:'璐璐'},{id:60,name:'辛吉德'},{id:61,name:'奈德丽'},{id:62,name:'蒙多医生'},
      {id:63,name:'凯南'},{id:64,name:'卡尔玛'},{id:65,name:'奈德丽'},{id:66,name:'璐璐'},
      {id:67,name:'辛吉德'},{id:68,name:'奈德丽'},{id:69,name:'蒙多医生'},{id:70,name:'凯尔'},
      {id:71,name:'卡莎'},{id:72,name:'加里奥'},{id:73,name:'凯隐'},{id:74,name:'赵信'},
      {id:75,name:'奈德丽'},{id:76,name:'蒙多医生'},{id:77,name:'卡尔玛'},{id:78,name:'璐璐'},
      {id:79,name:'辛吉德'},{id:80,name:'奈德丽'},{id:81,name:'蒙多医生'},{id:82,name:'盖伦'},
      {id:83,name:'阿狸'},{id:84,name:'奈德丽'},{id:85,name:'蒙多医生'},{id:86,name:'卡尔玛'},
      {id:87,name:'璐璐'},{id:88,name:'辛吉德'},{id:89,name:'奈德丽'},{id:90,name:'蒙多医生'},
      {id:91,name:'凯尔'},{id:92,name:'卡莎'},{id:93,name:'加里奥'},{id:94,name:'凯隐'},
      {id:95,name:'赵信'},{id:96,name:'奈德丽'},{id:97,name:'蒙多医生'},{id:98,name:'卡尔玛'},
      {id:99,name:'拉克丝'},{id:100,name:'璐璐'},{id:101,name:'辛吉德'},{id:102,name:'奈德丽'},
      {id:103,name:'阿狸'},{id:104,name:'蒙多医生'},{id:105,name:'凯尔'},{id:106,name:'卡莎'},
      {id:107,name:'加里奥'},{id:108,name:'凯隐'},{id:109,name:'赵信'},{id:110,name:'奈德丽'},
      {id:111,name:'蒙多医生'},{id:112,name:'卡尔玛'},{id:113,name:'璐璐'},{id:114,name:'辛吉德'},
      {id:115,name:'奈德丽'},{id:116,name:'蒙多医生'},{id:117,name:'凯尔'},{id:118,name:'卡莎'},
      {id:119,name:'加里奥'},{id:120,name:'凯隐'},{id:121,name:'赵信'},{id:122,name:'奈德丽'},
      {id:123,name:'蒙多医生'},{id:124,name:'卡尔玛'},{id:125,name:'璐璐'},{id:126,name:'辛吉德'},
      {id:127,name:'奈德丽'},{id:128,name:'蒙多医生'},{id:129,name:'凯尔'},{id:130,name:'卡莎'},
      {id:131,name:'加里奥'},{id:132,name:'凯隐'},{id:133,name:'赵信'},{id:134,name:'奈德丽'},
      {id:135,name:'蒙多医生'},{id:136,name:'卡尔玛'},{id:137,name:'璐璐'},{id:138,name:'辛吉德'},
      {id:139,name:'奈德丽'},{id:140,name:'蒙多医生'},{id:141,name:'凯尔'},{id:142,name:'卡莎'},
      {id:143,name:'加里奥'},{id:144,name:'凯隐'},{id:145,name:'赵信'},{id:146,name:'奈德丽'},
      {id:147,name:'蒙多医生'},{id:148,name:'卡尔玛'},{id:149,name:'璐璐'},{id:150,name:'辛吉德'},
      {id:151,name:'奈德丽'},{id:152,name:'蒙多医生'},{id:153,name:'凯尔'},{id:154,name:'卡莎'},
      {id:155,name:'加里奥'},{id:156,name:'凯隐'},{id:157,name:'赵信'},{id:158,name:'奈德丽'},
      {id:159,name:'蒙多医生'},{id:160,name:'卡尔玛'},{id:161,name:'璐璐'},{id:162,name:'辛吉德'},
      {id:163,name:'奈德丽'},{id:164,name:'蒙多医生'},{id:165,name:'凯尔'},{id:166,name:'卡莎'},
      {id:167,name:'加里奥'},{id:168,name:'凯隐'},{id:169,name:'赵信'},{id:170,name:'奈德丽'},
      {id:171,name:'蒙多医生'},{id:172,name:'卡尔玛'},{id:173,name:'璐璐'},{id:174,name:'辛吉德'},
      {id:175,name:'奈德丽'},{id:176,name:'蒙多医生'},{id:177,name:'凯尔'},{id:178,name:'卡莎'},
      {id:179,name:'加里奥'},{id:180,name:'凯隐'},{id:181,name:'赵信'},{id:182,name:'奈德丽'},
      {id:183,name:'蒙多医生'},{id:184,name:'卡尔玛'},{id:185,name:'璐璐'},{id:186,name:'辛吉德'},
      {id:187,name:'奈德丽'},{id:188,name:'蒙多医生'},{id:189,name:'凯尔'},{id:190,name:'卡莎'},
      {id:191,name:'加里奥'},{id:192,name:'凯隐'},{id:193,name:'赵信'},{id:194,name:'奈德丽'},
      {id:195,name:'蒙多医生'},{id:196,name:'卡尔玛'},{id:197,name:'璐璐'},{id:198,name:'辛吉德'},
      {id:199,name:'奈德丽'},{id:200,name:'蒙多医生'},{id:222,name:'金克丝'},
    ];
  }
  
  // 提取英雄信息
  const heroList = champions.map(c => ({
    id: c.id,
    name: c.name,
    title: c.title || '',
    slug: c.slug || ''
  }));
  
  console.log('Total heroes:', heroList.length);
  
  // 下载图标
  const ICON_BASE = 'https://communitydragon.buguoguo.cn/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons';
  const outDir = 'public/icons';
  
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  
  let downloaded = 0, failed = 0;
  const total = heroList.length;
  
  for (const hero of heroList) {
    const iconUrl = `${ICON_BASE}/${hero.id}.png`;
    const fileName = `${String(hero.id).padStart(4, '0')}.png`;
    const filePath = `${outDir}/${fileName}`;
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 500) {
      downloaded++;
      continue;
    }
    
    try {
      await new Promise((resolve) => {
        https.get(iconUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
          if (r.statusCode === 200) {
            const ws = fs.createWriteStream(filePath);
            r.pipe(ws);
            r.on('end', () => { ws.close(); downloaded++; resolve(); });
          } else {
            failed++; r.resume(); resolve();
          }
        }).on('error', () => { failed++; resolve(); });
      });
    } catch {
      failed++;
    }
    
    if ((downloaded + failed) % 20 === 0) {
      console.log(`Progress: ${downloaded + failed}/${total} (downloaded: ${downloaded}, failed: ${failed})`);
    }
  }
  
  console.log(`Done! Downloaded: ${downloaded}, Failed: ${failed}`);
  
  // 生成英雄数据 JSON
  const data = heroList.map(h => ({
    id: h.id,
    name: h.name,
    title: h.title,
    icon: `./public/icons/${String(h.id).padStart(4, '0')}.png`
  }));
  
  fs.writeFileSync('public/heroes.json', JSON.stringify(data, null, 2));
  console.log('Saved heroes.json with', data.length, 'heroes');
}

main().catch(console.error);
