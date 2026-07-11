import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const brandsData: { nameAr: string; nameEn: string; slug: string; models: string[] }[] = [
  // Japanese
  { nameAr: 'تويوتا', nameEn: 'Toyota', slug: 'toyota', models: ['كورولا', 'كامري', 'يارس', 'راف فور', 'فورتشنر', 'لاند كروزر', 'برادو', 'هايلكس', 'هيلكس', 'افالون', 'سيينا', 'تاكوما', 'توندرا', '4Runner', 'Supra', 'GR86', 'بريوس', 'CH-R', 'Venza', 'ميراي', 'bZ4X'] },
  { nameAr: 'هوندا', nameEn: 'Honda', slug: 'honda', models: ['سيفيك', 'أكورد', 'CR-V', 'HR-V', 'سي آر زد', 'فيت', 'جاز', 'أوديسي', 'بايلوت', 'باسبورت', 'ريدجلاين', 'إنسايت', 'كلاريتي', 'إيليمنت', 'إس'] },
  { nameAr: 'نيسان', nameEn: 'Nissan', slug: 'nissan', models: ['صني', 'سنترا', 'التيميا', 'باترول', 'إكس تريل', 'قشقاي', 'باث فايندر', 'نافارا', 'فرونتير', 'أرمادا', 'تيتان', 'مورانو', 'لوف', 'ماكسيما', 'فيرسا', 'كيكس', 'جوك', 'ليف', 'زد', 'جي تي آر'] },
  { nameAr: 'مازدا', nameEn: 'Mazda', slug: 'mazda', models: ['مازدا 3', 'مازدا 6', 'CX-5', 'CX-30', 'CX-9', 'MX-5', 'CX-50', 'CX-90', 'RX-8', 'BT-50', 'مازدا 2'] },
  { nameAr: 'سوبارو', nameEn: 'Subaru', slug: 'subaru', models: ['أوت باك', 'فورستر', 'إمبريزا', 'ليجاسي', 'WRX', 'أسانت', 'كروس تريك', 'BRZ', 'ليفورغ', 'تراي بيكا'] },
  { nameAr: 'سوزوكي', nameEn: 'Suzuki', slug: 'suzuki', models: ['فيتارا', 'سويفت', 'بالينو', 'إرتيجا', 'سياز', 'جيمني', 'كيزاشي', 'إس-برسو', 'GSX', 'فان'] },
  { nameAr: 'ميتسوبيشي', nameEn: 'Mitsubishi', slug: 'mitsubishi', models: ['لانسر', 'باجيرو', 'أوتلاندر', 'مونترو', 'آسx', 'إكليبس كروس', 'ميراج', 'لانسر إيفولوشن', 'ديليكا', 'ترايتون'] },
  { nameAr: 'دايهاتسو', nameEn: 'Daihatsu', slug: 'daihatsu', models: ['كوبورا', 'تيريوس', 'ماتريا', 'تافت', 'هيجت', 'بون', 'ميري', 'أتراي', 'سيريون', 'وايك'] },
  { nameAr: 'لكزس', nameEn: 'Lexus', slug: 'lexus', models: ['ES', 'RX', 'NX', 'GX', 'LX', 'LS', 'IS', 'RC', 'LC', 'UX', 'LM', 'RZ', 'TX', 'HS'] },
  { nameAr: 'أكورا', nameEn: 'Acura', slug: 'acura', models: ['MDX', 'RDX', 'TLX', 'ILX', 'NSX', 'RLX', 'Integra', 'ZDX', 'SLX', 'Legend'] },
  { nameAr: 'إنفينيتي', nameEn: 'Infiniti', slug: 'infiniti', models: ['Q50', 'Q60', 'QX50', 'QX60', 'QX80', 'Q70', 'QX30', 'QX55', 'M', 'FX'] },

  // German
  { nameAr: 'مرسيدس', nameEn: 'Mercedes-Benz', slug: 'mercedes', models: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'G-Class', 'A-Class', 'CLA', 'CLS', 'SL', 'SLC', 'AMG GT', 'EQB', 'EQC', 'EQS', 'EQE', 'EQA', 'V-Class', 'X-Class'] },
  { nameAr: 'بي إم دبليو', nameEn: 'BMW', slug: 'bmw', models: ['الفئة الثالثة', 'الفئة الخامسة', 'الفئة السابعة', 'X1', 'X3', 'X5', 'X6', 'X7', 'Z4', 'M3', 'M4', 'M5', 'M8', 'i4', 'iX', 'i7', 'i3', 'الفئة الأولى', 'الفئة الثانية', 'X2', 'X4'] },
  { nameAr: 'أودي', nameEn: 'Audi', slug: 'audi', models: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'TT', 'R8', 'S3', 'S4', 'S5', 'RS7', 'A5', 'A7', 'Q2', 'SQ5', 'A1'] },
  { nameAr: 'فولكس فاجن', nameEn: 'Volkswagen', slug: 'volkswagen', models: ['باسات', 'جولف', 'باسات CC', 'توارق', 'تايغون', 'توكس', 'أطلس', 'تيجوان', 'بولز', 'بولو', 'جيتا', 'شاران', 'كاليفورنيا', 'أماروك', 'ماجوتان', 'بورا', 'سيروكو', 'سيكات', 'ترانزبورتر', 'فيستا'] },
  { nameAr: 'بورش', nameEn: 'Porsche', slug: 'porsche', models: ['911', 'كايين', 'ماكان', 'باناميرا', 'تايكان', 'كايمان', 'بوكستر', 'كاريرا', 'سبايدر', 'توربو'] },
  { nameAr: 'أوبل', nameEn: 'Opel', slug: 'opel', models: ['كورسا', 'أسترا', 'إنسيغنيا', 'ميريفا', 'موكا', 'غراند لاند', 'كروس لاند', 'كاديت', 'فيكترا', 'زامبيا'] },
  { nameAr: 'مايباخ', nameEn: 'Maybach', slug: 'maybach', models: ['S-Class', 'GLS', '57', '62', 'SUV'] },

  // American
  { nameAr: 'فورد', nameEn: 'Ford', slug: 'ford', models: ['فوكس', 'فيوجن', 'إكسبلورر', 'إكسبيديشن', 'موستانج', 'رينجر', 'إف 150', 'إف 250', 'إيدج', 'إسكيب', 'إيكو سبورت', 'برونكو', 'مافريك', 'ترانزيت', 'تورس', 'فييستا', 'جي تي', 'موستانج ماخ-إي', 'فليكس', 'كراون فيكتوريا'] },
  { nameAr: 'شيفروليه', nameEn: 'Chevrolet', slug: 'chevrolet', models: ['ماليبو', 'كابتيفا', 'ترافيرس', 'تاهو', 'سوبربان', 'كامارو', 'كورفيت', 'إكوبينوكس', 'تراكس', 'كروز', 'سبارك', 'إمبالا', 'سلفرادو', 'كولورادو', 'بليزر', 'تريل بليزر', 'سيلفرادو', 'أسترو', 'فان'] },
  { nameAr: 'جمس', nameEn: 'GMC', slug: 'gmc', models: ['سييرا', 'يوكن', 'أكاديا', 'تيرين', 'كانيون', 'سافانا', 'سييرا 2500', 'سييرا 3500', 'يوكن XL', 'هيوما'] },
  { nameAr: 'كاديلاك', nameEn: 'Cadillac', slug: 'cadillac', models: ['إسكاليد', 'XT5', 'XT4', 'XT6', 'CT5', 'CT4', 'CT6', 'سيفيل', 'دي فيل', 'ليريك', 'سيليستيك', 'إلدورادو'] },
  { nameAr: 'لينكولن', nameEn: 'Lincoln', slug: 'lincoln', models: ['نافيجيتور', 'أفياتور', 'كورسير', 'نوتيلوس', 'موك', 'كونتيننتال', 'تاون كار', 'مارك'] },
  { nameAr: 'بيويك', nameEn: 'Buick', slug: 'buick', models: ['إنكلايف', 'إنفجن', 'إنكور', 'لاكروس', 'ريجال', 'فيرا نور', 'لي سابر', 'بارك أفينيو', 'سكايلارك'] },
  { nameAr: 'كرايسلر', nameEn: 'Chrysler', slug: 'chrysler', models: ['300', 'باسفيكا', 'فواجنر', 'تاون آند كنتري', 'سيبرينغ', 'نيويوركر', 'إمبريال'] },
  { nameAr: 'دودج', nameEn: 'Dodge', slug: 'dodge', models: ['تشارجر', 'تشالنجر', 'دورانجو', 'غراند كرافان', 'جورني', 'أفنجر', 'دارت', 'فايبر', 'رام', 'ماغنوم', 'نيون'] },
  { nameAr: 'جيب', nameEn: 'Jeep', slug: 'jeep', models: ['رانجلر', 'جراند شيروكي', 'شيروكي', 'رينيجيد', 'كومباس', 'باتريوت', 'ليبرتي', 'جليدييتور', 'كوادرا تريك', 'ميلان'] },
  { nameAr: 'رام', nameEn: 'Ram', slug: 'ram', models: ['1500', '2500', '3500', 'بروماستر', '4500', '5500', 'بروماستر سيتي', 'داكوتا'] },
  { nameAr: 'تسلا', nameEn: 'Tesla', slug: 'tesla', models: ['موديل 3', 'موديل Y', 'موديل S', 'موديل X', 'سايبر تراك', 'رودستر', 'سيمي'] },

  // Korean
  { nameAr: 'هيونداي', nameEn: 'Hyundai', slug: 'hyundai', models: ['إلنترا', 'سوناتا', 'توسان', 'سانتا في', 'أزيرا', 'أكسنت', 'كريتا', 'i10', 'i20', 'i30', 'كوليبري', 'بالي سايد', 'كيونا', 'ستاريا', 'أيونيك 5', 'أيونيك 6', 'نيبو', 'سانترو', 'فيراكروز', 'إكسيلر'] },
  { nameAr: 'كيا', nameEn: 'Kia', slug: 'kia', models: ['سيراتو', 'سبورتاج', 'سورينتو', 'كادنزا', 'بيكانتو', 'ريو', 'سيلتوس', 'ستونيك', 'EV6', 'EV9', 'موهافي', 'أوبتيما', 'نيو', 'ستينجر', 'كارينز', 'بوريجو', 'سيدونا', 'فورس', 'سول', 'أم كانتي'] },
  { nameAr: 'جينيسيس', nameEn: 'Genesis', slug: 'genesis', models: ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80', 'GV90'] },
  { nameAr: 'شيفروليه', nameEn: 'Daewoo', slug: 'daewoo', models: ['لانوس', 'نوبيرا', 'لاسيتي', 'ماتيز', 'كالوس', 'إسبيرو', 'تيكو', 'ليجانزا', 'ماغنوس', 'توسكا'] },
  { nameAr: 'سانج يونج', nameEn: 'SsangYong', slug: 'ssangyong', models: ['تيفولي', 'روديوس', 'كيرون', 'ريكستون', 'ستافيك', 'كوراندو', 'مسو', 'تشيرمان', 'فاميلي'] },

  // British
  { nameAr: 'لاند روفر', nameEn: 'Land Rover', slug: 'land-rover', models: ['رينج روفر', 'Ranger Rover Sport', 'Ranger Rover Velar', 'Ranger Rover Evoque', 'ديسكفري', 'ديسكفري سبورت', 'دفاع', 'فريلاندر', 'سيريز 1', 'سيريز 2'] },
  { nameAr: 'جاكوار', nameEn: 'Jaguar', slug: 'jaguar', models: ['F-PACE', 'E-PACE', 'I-PACE', 'XF', 'XE', 'XJ', 'F-TYPE', 'XK', 'S-TYPE', 'E-TYPE'] },
  { nameAr: 'بنتلي', nameEn: 'Bentley', slug: 'bentley', models: ['كونتننتال جي تي', 'فلينج سبير', 'بنتايغا', 'موالسان', 'بروكلاندز', 'توربو آر', 'آرناج'] },
  { nameAr: 'رولز رويس', nameEn: 'Rolls-Royce', slug: 'rolls-royce', models: ['جوست', 'فانتوم', 'كولينان', 'سبيكتر', 'غوست', 'دون', 'سيلفر سيراف', 'سيلفر سبيرت'] },
  { nameAr: 'أستون مارتن', nameEn: 'Aston Martin', slug: 'aston-martin', models: ['DB11', 'DB12', 'DBS', 'Vantage', 'DBX', 'فالكون', 'ون-77', 'فيراج', 'رابيد', 'DBS سوبرليجيرا'] },
  { nameAr: 'مكلارين', nameEn: 'McLaren', slug: 'mclaren', models: ['720S', '765LT', 'Senna', 'P1', 'GT', '750S', 'Artura', '600LT', '570S', 'Elva'] },
  { nameAr: 'لوتس', nameEn: 'Lotus', slug: 'lotus', models: ['Eletre', 'ايمي وو', 'Exige', 'Elise', 'Evora', 'Esprit', 'Seven', 'Europa'] },
  { nameAr: 'ميني', nameEn: 'Mini', slug: 'mini', models: ['Cooper', 'Cooper S', 'John Cooper Works', 'Countryman', 'Clubman', 'Convertible', 'Electric', 'Paceman', 'Coupe', 'Roadster'] },

  // Italian
  { nameAr: 'فيراري', nameEn: 'Ferrari', slug: 'ferrari', models: ['488', 'F8', 'SF90', '812', 'بوروسانج', 'روفوما', 'أورو', 'لا فيراري', 'كاليفورنيا', '355', '360', '430', '458', 'لاومبرغيني'] },
  { nameAr: 'لامبورغيني', nameEn: 'Lamborghini', slug: 'lamborghini', models: ['أوروس', 'هواراكان', 'أفينتادور', 'ريفينتون', 'سيدان', 'كاونتاش', 'ديابلو', 'مورسييلاغو', 'غالاردو', 'فينينو', 'سينتيناريو'] },
  { nameAr: 'مازيراتي', nameEn: 'Maserati', slug: 'maserati', models: ['ليفانتي', 'جيبلي', 'كواتروبورتي', 'جران توريزمو', 'MC20', 'جران كوبيه', 'سبايدر', 'شمال'] },
  { nameAr: 'ألفا روميو', nameEn: 'Alfa Romeo', slug: 'alfa-romeo', models: ['جوليا', 'ستلفيو', 'تونالي', 'ميتو', 'جوليتا', '4C', 'سبايدر', '147', '156', '159'] },
  { nameAr: 'فيات', nameEn: 'Fiat', slug: 'fiat', models: ['500', 'باندا', 'تيبو', 'دوبلو', 'بونسو', 'ستيلا', 'كروما', 'برافو', 'ريديمنتوي'] },
  { nameAr: 'باجاني', nameEn: 'Pagani', slug: 'pagani', models: ['هويارا', 'زوندا', 'أوتيميا', 'دينو'] },

  // French
  { nameAr: 'بيجو', nameEn: 'Peugeot', slug: 'peugeot', models: ['208', '308', '408', '508', '2008', '3008', '5008', 'بوكسر', 'بارتنر', 'ريفتر', '206', '207', '307', '301', 'RCP'] },
  { nameAr: 'سيتروين', nameEn: 'Citroen', slug: 'citroen', models: ['C3', 'C4', 'C5', 'C1', 'C-Elysee', 'بيرلينجو', 'جامبي', 'سباس تورير', 'DS3', 'DS4', 'DS5', 'DS7', 'DS9', 'ساكسو'] },
  { nameAr: 'رينو', nameEn: 'Renault', slug: 'renault', models: ['ميغان', 'كلور', 'سينك', 'كابتور', 'كادجار', 'تاليسمان', 'لوجان', 'ساندرورو', 'داستر', 'لكونا', 'تويزنج', 'فلوانس', 'مانتيرو', 'أركنا'] },

  // Chinese
  { nameAr: 'بي واي دي', nameEn: 'BYD', slug: 'byd', models: ['Seal', 'سونغ', 'كين', 'هان', 'تانغ', 'يوان', 'أتو 3', 'دولفين', 'شاي', 'دينزا', 'F3'] },
  { nameAr: 'جيري', nameEn: 'Geely', slug: 'geely', models: ['كولوراي', 'إمجراند', 'بين يوي', 'أزاكارا', 'مونجارو', 'جايزلي', 'أوكافانغو', 'سيمفوني', 'إمجراند L'] },
  { nameAr: 'إم جي', nameEn: 'MG', slug: 'mg', models: ['MG5', 'MG6', 'HS', 'ZS', 'RX5', 'MG4', 'ZS EV', 'HS PHEV', 'مارفل R', 'هيكتور'] },
  { nameAr: 'تشيري', nameEn: 'Chery', slug: 'chery', models: ['تيجو 7', 'تيجو 8', 'تيجو 9', 'أريزو 5', 'أريزو 6', 'أريزو 8', 'فولكوين T1', 'فولكوين T2', 'فولكوين T11', 'QQ'] },
  { nameAr: 'جريت وول', nameEn: 'Great Wall', slug: 'great-wall', models: ['هافال H6', 'هافال جوليون', 'هافال H9', 'وينجل', 'ستيد', 'بوجو', 'فلوريد', 'صفر', 'أورا', 'تانك 300', 'تانك 500'] },
  { nameAr: 'نانيانغ', nameEn: 'Changan', slug: 'changan', models: ['CS35', 'CS55', 'CS75', 'CS95', 'ألسبن', 'رايستار', 'أوننت', 'بناي', 'سينا'] },
  { nameAr: 'نيو', nameEn: 'NIO', slug: 'nio', models: ['ES6', 'ES8', 'EC6', 'ET5', 'ET7', 'ES7', 'EC7', 'EL7'] },
  { nameAr: 'إكسبنغ', nameEn: 'XPeng', slug: 'xpeng', models: ['P7', 'G9', 'P5', 'G6', 'G3', 'G3i'] },
  { nameAr: 'لي أوتو', nameEn: 'Li Auto', slug: 'li-auto', models: ['L9', 'L8', 'L7', 'One', 'MEGA'] },
  { nameAr: 'نيكسترو إيف', nameEn: 'Neta', slug: 'neta', models: ['U', 'V', 'S', 'GT', 'L'] },

  // Swedish
  { nameAr: 'فولفو', nameEn: 'Volvo', slug: 'volvo', models: ['XC40', 'XC60', 'XC90', 'S60', 'S90', 'V60', 'V90', 'EC40', 'EX30', 'EX90', 'C30', 'C40', 'V40', 'S40', '850', '240'] },
  { nameAr: 'كونيجسيج', nameEn: 'Koenigsegg', slug: 'koenigsegg', models: ['جيسكو', 'ريغيرا', 'أجيرا', 'CCX', 'CCR', 'ون:1', 'جيميرا'] },

  // Others
  { nameAr: 'سكودا', nameEn: 'Skoda', slug: 'skoda', models: ['أوكتافيا', 'سوبرب', 'كاميك', 'كودياك', 'فابيا', 'رابيد', 'سكالا', 'إنياق', 'سيتغو', 'إيتشي'] },
  { nameAr: 'سيات', nameEn: 'Seat', slug: 'seat', models: ['ليون', 'ألتييا', 'إيبيزا', 'أرونا', 'أتيكا', 'تاراكو', 'الم إكس', 'ملاغا', 'توليدو', 'إينكا'] },
  { nameAr: 'داسيا', nameEn: 'Dacia', slug: 'dacia', models: ['داستر', 'سانديرو', 'لوجان', 'جامبي', 'داستر', 'داكر', 'دوستر', 'لودغي'] },
  { nameAr: 'لادا', nameEn: 'Lada', slug: 'lada', models: ['فيستا', 'جرانتا', 'نيفا', 'لارغوس', 'إكس راي', 'كالينا', 'بريورا', 'ريكس'] },
  { nameAr: 'هامر', nameEn: 'Hummer', slug: 'hummer', models: ['H1', 'H2', 'H3', 'EV'] },
  { nameAr: 'الرمز', nameEn: 'Brabus', slug: 'brabus', models: ['B40', 'B63', 'B70', 'G-Class Brabus', 'Mercedes Brabus', 'Rocket', 'SV12'] },
  { nameAr: 'مورغان', nameEn: 'Morgan', slug: 'morgan', models: ['Plus-4', 'Plus-6', 'Super 3', 'Aero 8', '4/4', 'Roadster'] },
  { nameAr: 'ستونيغ', nameEn: 'Rimac', slug: 'rimac', models: ['نيفر', 'كونسبت ون', 'كونسبت 2'] },
];

async function main() {
  let brandCount = 0;
  let modelCount = 0;

  for (const brandData of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { slug: brandData.slug },
      update: { nameAr: brandData.nameAr, nameEn: brandData.nameEn },
      create: { nameAr: brandData.nameAr, nameEn: brandData.nameEn, slug: brandData.slug },
    });
    brandCount++;

    for (const modelName of brandData.models) {
      const slug = `${brandData.slug}-${modelName.replace(/\s+/g, '-').toLowerCase()}`;
      await prisma.carModel.upsert({
        where: { slug_brandId: { slug, brandId: brand.id } },
        update: {},
        create: { nameAr: modelName, nameEn: modelName, slug, brandId: brand.id },
      });
      modelCount++;
    }
  }

  console.log(`✅ ${brandCount} شركة و ${modelCount} موديل`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
