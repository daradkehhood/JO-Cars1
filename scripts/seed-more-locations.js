const http = require("http");
function api(m,p,b,t){return new Promise((y,n)=>{const o={hostname:"localhost",port:3000,path:p,method:m,headers:{"Content-Type":"application/json; charset=utf-8",...(t?{Authorization:"Bearer "+t}:{})}};const q=http.request(o,r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>{try{y(JSON.parse(d))}catch(e){n(e)}})});q.on("error",n);if(b)q.write(JSON.stringify(b));q.end()})}
async function main(){
const lr=await api("POST","/api/auth/login",{email:"admin2@jocars.com",password:"admin123"});
const token=lr.data.token;
const pr=await api("GET","/api/admin/provinces",null,token);
const pm={};for(const p of pr.data)pm[p.nameAr.trim()]=p.id;
const cr=await api("GET","/api/admin/cities",null,token);
const ec=new Set(cr.data.map(c=>c.nameAr));
let a=0,s=0;
const data=[
["اربد",["الحرث","دير علا","عجلون","almog","الحوراء","عين جالوت","المโRIG","الصUH","الكHAN","النAHI","الBARIQ","الRIYADH","المQABLA","الSHAMS","الQASR","الFURD","الHUSN","الSALT","الMADABA","الKARAK","الAQABA","الTAFILAH","الMAAN","الZARQA","الMADABA","الBALQA","الJERASH","الAJLOUN","الMAFRAQ","الIRBID","الAMMAN","الAQABA","الTAFILAH","الMAAN","الKARAK","الMADABA","الBALQA","الJERASH","الAJLOUN","الMAFRAQ","الIRBID","الAMMAN"]],
["عمان",["الجبيهة","المدينة الصناعية","سحاب","ناعور","صويلح","الشميساني","عبدون","تلاع العلي","أم النصارى","الجندويل","المدينة الرياضية","البلاونة","المقيBLة","الظاهرية","الZa'tari","الQasim","الSalam","Al Manara","Al Harith","Ara","Al Qasabin","Dir Allaa","Al Murayfa","Al Khaldiyah","Al Aziziyah","Al Mansourah","Al Mazra'a","Al Jellameh","Al Qusur","Umm Al Summaq","Abu Nusair","Umm Al Jimal","Umm Qais","Al Jizah","Al Husn","Al Dhulail","Anjara","Al Karak","Al Shuna","Al Kazakh","Al Nasirah","Kafar Kulayeh","Al Baqoura","Ain Al Basha","Deir Alla","Al Qasr","Al Muhtasab","Al Sarhan","Kufranja","Rakine","Dir Abu Said","Mahis","Al芙蓉","Al Fuhays","Al Balqa","Al Faisaliyyah","Al Russeifa","Al Hashimiyyah","Al Azraq","Jarash","Al Aqaba","Al Quwayrah","Al Wadi"]],
["الكرك",["الطيبة","أدر","بصيرا","الشوبك","لب","المزار الجنوبي","القصر","مؤتة","القطرانة","الحسا","الكرك","الجفر","وادي موسى","الطايبة","الراجف","دلاغة","ذيبان","البتراء","البحر الميت"]],
["معان",["الجفر","وادي موسى","الطايبة","الراجف","دلاغة","ذيبان","البتراء","البحر الميت","معان","الحسا","القويرة","الوادي"]],
["الرمثا",["القادسية","الحسينية","المدورة","مليح","سما السرحان","كفر أسد","الرمثا","الحصن","الضليل","صبيحة","ظاظا","كفر عصيم","برين","جبيهة","حوران","رشيد"]],
["عجلون",["راكين","كفرنجة","دير أبي سعيد","عنجرة","المحتشد","الصريح","عجلون","ماحص","الHAQ","الKAFRET"]],
["مادبا",["دوقرة","ماحص","ال芙蓉","الجيزه","مادبا","الهيثم","ال⊣","المريHM","دير أبي سعيد"]],
["السلط",["الفحيص","عين الباشا","البلقاء","دير علا","السلط","الموقر","الهاشمية"]],
["الطفيلة",["الفحص","الحسا","الطفيلة","الكرك"]],
["الزرقاء",["الرصيفة","الهاشمية","الأزرق","الزرقاء"]],
["جرش",["جرش","المحتشد","الصريح"]],
["العقبة",["العقبة","القويرة","الوادي"]]];
for(const[prov,names]of data){
const pid=pm[prov.trim()];if(!pid)continue;
for(const c of names){if(ec.has(c)){s++;continue}
const r=await api("POST","/api/admin/cities",{nameAr:c,nameEn:c,provinceId:pid},token);
if(r.success){console.log("+ "+c);a++;ec.add(c)}}
}
console.log("Done: "+a+" added, "+s+" skipped");
}
main().catch(console.error);
