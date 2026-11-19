// Screenshots of the normally rendered public tour; no direct tile downloads.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const packageIndex = process.argv.indexOf('--playwright-package');
const { chromium } = require(packageIndex >= 0 ? path.resolve(process.argv[packageIndex + 1]) : 'playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'datasets/palace');
const folder = path.join(out, 'candidates/tour-screenshots');
const source = 'https://thamquanvr360.dinhdoclap.gov.vn/';
const manifestPath = path.join(out, 'tour-screenshot-manifest.json');

(async () => {
  fs.mkdirSync(folder, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const records = [];
  try {
    await page.goto(source, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(8000);
    const frame = page.frames().find(f => f.url().includes('sanpham.starglobal3d.vn/smart-heritage-3d/dinh-doc-lap/'));
    if (!frame) throw new Error('Official tour frame not found');
    const targets = await frame.evaluate(() => {
      const pano = document.getElementById('panorama');
      if (typeof pano?.get !== 'function') throw new Error('Tour not ready');
      const selected = [];
      for (let i = 0; i < pano.get('scene.count'); i++) {
        const scene = pano.get(`scene[${i}].name`);
        const label = scene.includes('phong_khanh_tiet') ? 'reception'
          : scene.includes('phong_noi_cac') ? 'cabinet'
          : /mat_tien_dinh|phia_truoc_dinh/.test(scene) ? 'facade'
          : /^(scene_01_dai_yen_\(1\)|scene_02_phong_tiep_khach_tong_thong_\(1\)|scene_03_phong_giai_tri_\(1\))$/.test(scene) ? 'other' : null;
        if (label) selected.push({ scene, suggested_label: label });
      }
      return selected;
    });
    for (const target of targets) {
      await frame.evaluate(scene => {
        const pano = document.getElementById('panorama');
        pano.set('autorotate.enabled', false);
        pano.call(`loadscene("${scene}", null, MERGE, BLEND(0));`);
      }, target.scene);
      await frame.waitForFunction(scene => document.getElementById('panorama').get('xml.scene') === scene, target.scene);
      await page.waitForTimeout(1800);
      const initial = await frame.evaluate(() => {
        const pano = document.getElementById('panorama');
        pano.set('autorotate.enabled', false);
        return { h: pano.get('view.hlookat'), v: pano.get('view.vlookat') };
      });
      for (const [index, offset] of [-25, 0, 25].entries()) {
        const id = `tour-${target.scene.replace(/^scene_/, '').replace(/[()]/g, '')}-${index}`;
        const camera = { h: initial.h + offset, v: Math.max(-10, Math.min(20, initial.v)), fov: 90 };
        await frame.evaluate(view => {
          const pano = document.getElementById('panorama');
          pano.call(`lookat(${view.h},${view.v},${view.fov});`);
        }, camera);
        await page.waitForTimeout(500);
        const file = path.join(folder, `${id}.png`);
        const pixels = await page.screenshot({ path: file, clip: { x: 80, y: 80, width: 1280, height: 640 } });
        records.push({ id, ...target, camera, source_page: source, viewer_url: frame.url(),
          local_path: path.relative(out, file).replaceAll('\\', '/'),
          file_sha256: crypto.createHash('sha256').update(pixels).digest('hex'),
          panorama_group: target.scene, split_group: 'official-tour-session',
          review_status: 'pending', label: null, rights_status: 'reuse_license_not_verified',
          author: 'Official Independence Palace tour / StarGlobal 3D', license: null,
          transformations: 'Browser screenshot of central viewport at 1280x640; no generated content',
          intended_split: 'train', captured_at: new Date().toISOString() });
        fs.writeFileSync(manifestPath, JSON.stringify(records, null, 2));
      }
      console.log(target.scene, target.suggested_label, 'captured');
    }
    console.log('Captured:', records.length, 'screenshots. Review before training.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
