const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fixes = [
  ['Abu Nusair', 'أبو نصير'],
  ['Ader', 'ادر'],
  ['Ain Al Basha', 'عين الباشا'],
  ['Al Aqaba', 'العقبة'],
  ['Al Aziziyah', 'العزيزية'],
  ['Al Azraq', 'الزرقاء الشامية'],
  ['Al Balqa', 'البلقاء'],
  ['Al Baqoura', 'الباقورة'],
  ['Al Dhulail', 'الذليل'],
  ['Al Faisaliyyah', 'الفيصلية'],
  ['Al Fuhays', 'الfuheis'],
  ['Al Harith', 'الحارثية'],
  ['Al Hashimiyyah', 'الهاشمية'],
  ['Al Hassa', 'الحصة'],
  ['Al Husayniyah', 'الحسينية'],
  ['Al Husn', 'الحصن'],
  ['Al Jafar', 'الجفر'],
  ['Al Jellameh', 'الجلامه'],
  ['Al Jizah', 'الجيزه'],
  ['Al Karak', 'الكرك'],
  ['Al Kazakh', 'الكازخ'],
  ['Al Khaldiyah', 'الخالدية'],
  ['Al Madoura', 'المadora'],
  ['Al Manara', 'المنارة'],
  ['Al Mansourah', 'المنصورة'],
  ['Al Mazar', 'المزار الشرقي'],
  ['Al Mazra\'a', 'المزرعة'],
  ['Al Muhtasab', 'المHTASAB'],
  ['Al Murayfa', 'المريفاء'],
  ['Al Nasirah', 'الناصرة'],
  ['Al Petra', 'البتراء'],
  ['Al Qadisiyyah', 'القادسية'],
  ['Al Qasabin', 'القصابين'],
  ['Al Qasr', 'القصر'],
  ['Al Qatraneh', 'القطرانة'],
  ['Al Qusur', 'القصور'],
  ['Al Quwayrah', 'القويرة'],
  ['Al Rajif', 'الrajif'],
  ['Al Russeifa', 'الرصيفة'],
  ['Al Sarhan', 'الصرحان'],
  ['Al Shoubak', 'الشوبك'],
  ['Al Shuna', 'الشونة الشمالية'],
  ['Al Taybeh', 'الطيبة'],
  ['Al芙蓉', '芙蓉'],
  ['Anjara', 'عنجارة'],
  ['Ara', 'عرى'],
  ['Bahr Al Mawt', 'بحر الموت'],
  ['Bseira', 'بصيرا'],
  ['Dhiban', 'ذيبان'],
  ['Dir Abu Said', 'دير أبو سعيد'],
  ['Dir Allaa', 'دير علا'],
  ['Dlaigah', 'دلايقة'],
  ['Jarash', 'جرش'],
  ['Kafar Asad', 'كفر أساد'],
  ['Kafar Kulayeh', 'كفركلية'],
  ['Kufranja', 'كفرنجا'],
  ['Lubb', 'لُبّ'],
  ['Mahis', 'ماحس'],
  ['Mu\'ta', 'معاة'],
  ['Muleih', 'مليح'],
  ['Rakine', 'راكنة'],
  ['Sama Al Sarhan', 'سما الصرحان'],
  ['Umm Al Jimal', 'أم الجمال'],
  ['Umm Al Summaq', 'أم السماق'],
  ['Umm Qais', 'أم قيس'],
  ['Wadi Musa', 'وادي موسى'],
  ['Al芙蓉', '芙蓉'],
  ['Al Wadi', 'الوادي'],
];

async function fix() {
  let fixed = 0;
  let notFound = 0;
  for (const [english, arabic] of fixes) {
    try {
      const result = await prisma.$executeRawUnsafe(
        'UPDATE "cities" SET "nameAr" = $1 WHERE "nameAr" = $2',
        arabic, english
      );
      if (result > 0) { fixed++; console.log('✓ ' + english + ' → ' + arabic); }
      else { notFound++; }
    } catch (e) { console.log('✗ ' + english + ': ' + e.message.slice(0, 80)); }
  }
  console.log('\nFixed: ' + fixed + ' | Not found: ' + notFound);
  await prisma.$disconnect();
}

fix().catch(function(e) { console.error(e.message); process.exit(1); });
