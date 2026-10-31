const https = require('https');
const fs = require('fs');

const url = 'https://communitydragon.buguoguo.cn/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champions';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' } }, r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    if (d.startsWith('<!DOCTYPE')) {
      console.log('Got HTML page, length:', d.length);
      
      // 尝试提取 champion 数据
      const idNameRegex = /"id":\s*(\d+),\s*"name":\s*"([^"]+)"/g;
      const results = [];
      let match;
      while ((match = idNameRegex.exec(d)) !== null) {
        results.push({ id: parseInt(match[1]), name: match[2] });
      }
      
      if (results.length > 0) {
        console.log('Extracted', results.length, 'champions');
        fs.writeFileSync('public/heroes_extracted.json', JSON.stringify(results, null, 2));
      } else {
        console.log('No champions found via regex');
        // 尝试另一种模式
        const iconRegex = /\/v1\/champion-icons\/(\d+)\.png/g;
        const ids = new Set();
        let m2;
        while ((m2 = iconRegex.exec(d)) !== null) {
          ids.add(parseInt(m2[1]));
        }
        console.log('Found', ids.size, 'champion IDs from icon refs');
      }
    } else {
      // 可能是 JSON
      try {
        const j = JSON.parse(d);
        const vals = Object.values(j);
        console.log('JSON OK,', vals.length, 'champions');
        const simplified = vals.map(c => ({ id: c.id, name: c.name, title: c.title || '', slug: c.slug || '' }));
        fs.writeFileSync('public/heroes_extracted.json', JSON.stringify(simplified, null, 2));
      } catch (e) {
        console.log('Parse failed:', e.message);
      }
    }
  });
}).on('error', e => console.log('Error:', e.message));
