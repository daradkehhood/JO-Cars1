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
const cities=[
["اربد",["الحصن","الصريح","الضليل","خريبة","كفر عصيم","برين","جبيهة","حوران","رشيد","ظاظا","كفر الماء","لبن","مسعدة","الزوية","بلاط","الحمة","صرفا","الروضة","عين الجHM","الطفية","الرحمة","بئر الأصل","الحوراء","أبو رمانة","كفر كلية","الباقورة","المجيHM","الكازحة","الناصرة","عمّري","القصور","المحتشد","المنشية","الناصرية","كفر أسد","كفرنجة","مرج بني حميدة","دير أبي سعيد","العمري"]],
["عمان",["المدينة الصناعية","الجبيهة","سحاب","ناعور","صويلح","الشميساني","عبدون","تلاع العلي","أم النصارى","الجندويل","المدينة الرياضية","البلاونة","المقيBLة","الظاهرية","الZa'tari","الQasim","الSalam","Al Manara","Al Harith","Ara","Al Qasabin","Dir Allaa","Al Murayfa","Al Khaldiyah","Al Aziziyah","Al Mansourah","Al Mazra'a","Al Jellameh","Al Qusur","Umm Al Summaq","Abu Nusair","Umm Al Jimal","Umm Qais","Al Jizah","Al Husn","Al Dhulail","Anjara","Al Karak","Al Shuna","Al Kazakh","Al Nasirah","Kafar Kulayeh","Al Baqoura","Ain Al Basha"]],
["الكرك",["الطيبة","Ader","Bseira","Al Shoubak","Lubb","Al Mazar","Al Qasr","Mu'ta","Al Qatraneh","Al Hassa"]],
["معان",["Al Jafar","Wadi Musa","Al Taybeh","Al Rajif","Dlaigah","Dhiban","Al Petra","Bahr Al Mawt"]],
["الرمثا",["Al Qadisiyyah","Al Husayniyah","Al Madoura","Muleih","Sama Al Sarhan","Kafar Asad"]],
["عجلون",["Rakine","Kufranja","Dir Abu Said","Anjara","Al Muhtasab","Al Sarhan"]],
["مادبا",["Dhiban","Mahis","Al芙蓉","Al Jizah"]],
["السلط",["Al Fuhays","Ain Al Basha","Al Balqa","Dir Allaa"]],
["الطفيلة",["Al Faisaliyyah","Al Hassa"]],
["الزرقاء",["Al Russeifa","Al Hashimiyyah","Al Azraq"]],
["جرش",["Jarash"]],
["العقبة",["Al Aqaba","Al Quwayrah","Al Wadi"]]];
for(const[prov,names]of cities){
const pid=pm[prov.trim()];if(!pid){console.log("SKIP: "+prov);continue}
for(const c of names){if(ec.has(c)){s++;continue}
const r=await api("POST","/api/admin/cities",{nameAr:c,nameEn:c,provinceId:pid},token);
if(r.success){console.log("+ "+c);a++;ec.add(c)}else{console.log("! "+c+": "+(r.error||"err"))}
}}
console.log("Done: "+a+" added, "+s+" skipped");
}
main().catch(console.error);
