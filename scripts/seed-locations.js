const http = require('http');

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Login
  const loginRes = await apiCall('POST', '/api/auth/login', { email: 'admin2@jocars.com', password: 'admin123' });
  const token = loginRes.data.token;
  console.log('Logged in');

  // Get existing provinces
  const provRes = await apiCall('GET', '/api/admin/provinces', null, token);
  const provinces = provRes.data;
  
  // Map province names to IDs
  const provMap = {};
  for (const p of provinces) {
    provMap[p.nameAr] = p.id;
  }
  
  // Get existing cities
  const cityRes = await apiCall('GET', '/api/admin/cities', null, token);
  const existingCities = cityRes.data.map(c => c.nameAr);
  console.log(`Existing cities: ${existingCities.length}`);
  
  // Governorate mappings for the sub-districts
  const cityData = [
    // Irbid sub-districts
    { nameAr: 'المزار الشمالي', province: 'اربد' },
    { nameAr: 'المزار الجنوبي', province: 'اربد' },
    { nameAr: 'الهاشمية الشمالية', province: 'اربد' },
    { nameAr: 'الربة', province: 'اربد' },
    { nameAr: 'القصر', province: 'اربد' },
    { nameAr: 'غور المزرعة', province: 'اربد' },
    { nameAr: 'غرندل', province: 'اربد' },
    { nameAr: 'فينان', province: 'اربد' },
    { nameAr: 'العارضة', province: 'اربد' },
    { nameAr: 'كريمة', province: 'اربد' },
    { nameAr: 'المشارع', province: 'اربد' },
    { nameAr: 'وقاص', province: 'اربد' },
    { nameAr: 'المنشية', province: 'اربد' },
    { nameAr: 'الكريمة', province: 'اربد' },
    { nameAr: 'دوقرة', province: 'اربد' },
    { nameAr: 'زحر', province: 'اربد' },
    { nameAr: 'بيت يافا', province: 'اربد' },
    { nameAr: 'حكما', province: 'اربد' },
    { nameAr: 'كتم', province: 'اربد' },
    { nameAr: 'بشرى', province: 'اربد' },
    { nameAr: 'النعيمة', province: 'اربد' },
    { nameAr: 'إيدون', province: 'اربد' },
    { nameAr: 'جمحا', province: 'اربد' },
    { nameAr: 'زوبيا', province: 'اربد' },
    { nameAr: 'تبنة', province: 'اربد' },
    { nameAr: 'جديتا', province: 'اربد' },
    { nameAr: 'كفر راكب', province: 'اربد' },
    { nameAr: 'بلعما', province: 'اربد' },
    { nameAr: 'صبحا', province: 'اربد' },
    
    // Karak sub-districts
    { nameAr: 'الطيبة (الكرك)', province: 'الكرك' },
    { nameAr: 'أدر', province: 'الكرك' },
    { nameAr: 'بصيرا', province: 'الكرك' },
    { nameAr: 'الشوبك', province: 'الكرك' },
    { nameAr: 'لب', province: 'الكرك' },
    
    // Ma'an sub-districts
    { nameAr: 'الجفر', province: 'معان' },
    { nameAr: 'وادي موسى', province: 'معان' },
    { nameAr: 'الطايبة (معان)', province: 'معان' },
    { nameAr: 'الراجف', province: 'معان' },
    { nameAr: 'دلاغة', province: 'معان' },
    { nameAr: 'ذيبان', province: 'معان' },
    
    // Mafraq sub-districts
    { nameAr: 'القادسية', province: 'الرمثا' },
    { nameAr: 'الحسينية', province: 'الرمثا' },
    { nameAr: 'المدورة', province: 'الرمثا' },
    { nameAr: 'مليح', province: 'الرمثا' },
    
    // Amman sub-districts
    { nameAr: 'مؤاب', province: 'عمان' },
    { nameAr: 'أم الرصاص', province: 'عمان' },
    { nameAr: 'ماعين', province: 'عمان' },
    
    // Ajloun sub-districts
    { nameAr: 'راكين', province: 'عجلون' },
    
    // Ma'an Governorate
    { nameAr: 'الحسا', province: 'الحسا' },
    
    // Tafilah
    { nameAr: 'الفحص', province: 'الطفيلة' },
  ];
  
  let added = 0;
  let skipped = 0;
  
  for (const city of cityData) {
    if (existingCities.includes(city.nameAr)) {
      console.log(`SKIP (exists): ${city.nameAr}`);
      skipped++;
      continue;
    }
    
    const provId = provMap[city.province];
    if (!provId) {
      console.log(`SKIP (no province): ${city.nameAr} -> ${city.province}`);
      skipped++;
      continue;
    }
    
    try {
      const res = await apiCall('POST', '/api/admin/cities', {
        nameAr: city.nameAr,
        nameEn: city.nameAr,
        provinceId: provId,
      }, token);
      
      if (res.success) {
        console.log(`ADDED: ${city.nameAr} -> ${city.province}`);
        added++;
      } else {
        console.log(`ERROR: ${city.nameAr}: ${res.error}`);
      }
    } catch (e) {
      console.log(`ERROR: ${city.nameAr}: ${e.message}`);
    }
  }
  
  console.log(`\nDone: ${added} added, ${skipped} skipped`);
}

main().catch(console.error);
