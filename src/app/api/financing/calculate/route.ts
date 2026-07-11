import { NextRequest } from 'next/server';

const banks = [
  { id: 'iskanc', nameAr: 'بنك الإسكان', nameEn: 'Housing Bank', rate: 5.25, icon: '🏠' },
  { id: 'cairo', nameAr: 'بنك القاهرة عمان', nameEn: 'Cairo Amman Bank', rate: 5.5, icon: '🏛️' },
  { id: 'jkb', nameAr: 'البنك الأردني الكويتي', nameEn: 'Jordan Kuwait Bank', rate: 5.0, icon: '🏦' },
  { id: 'arab', nameAr: 'البنك العربي', nameEn: 'Arab Bank', rate: 5.25, icon: '🌍' },
  { id: 'ettihad', nameAr: 'بنك الاتحاد', nameEn: 'Union Bank', rate: 5.75, icon: '🤝' },
  { id: 'safwa', nameAr: 'بنك صفوة الإسلامي', nameEn: 'Safwa Islamic Bank', rate: 4.75, icon: '🕌' },
  { id: 'jib', nameAr: 'البنك الإسلامي الأردني', nameEn: 'Jordan Islamic Bank', rate: 4.5, icon: '⭐' },
  { id: 'ahli', nameAr: 'البنك الأهلي الأردني', nameEn: 'Jordan Ahli Bank', rate: 5.5, icon: '💳' },
  { id: 'societe', nameAr: 'بنك سوسيتيه جنرال', nameEn: 'Societe Generale', rate: 6.0, icon: '🌐' },
  { id: 'capital', nameAr: 'بنك رأس المال', nameEn: 'Capital Bank', rate: 5.0, icon: '💰' },
];

function calcMonthlyPayment(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function calcAmortization(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calcMonthlyPayment(principal, annualRate, months);
  const schedule = [];
  let balance = principal;

  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const principalPart = monthlyPayment - interest;
    balance -= principalPart;
    if (balance < 0) balance = 0;
    schedule.push({
      month: i,
      payment: Math.round(monthlyPayment),
      principal: Math.round(principalPart),
      interest: Math.round(interest),
      balance: Math.round(balance),
    });
  }

  return schedule;
}

export async function POST(request: NextRequest) {
  try {
    const { price, downPayment, termMonths, bankId } = await request.json();

    const carPrice = parseInt(price);
    const down = parseInt(downPayment) || 0;
    const months = parseInt(termMonths) || 60;

    if (!carPrice || carPrice <= 0) {
      return Response.json({ success: false, error: 'الرجاء إدخال سعر السيارة' });
    }

    const principal = carPrice - down;
    if (principal <= 0) {
      return Response.json({ success: false, error: 'الدفعة الأولى أكبر من سعر السيارة' });
    }

    const selectedBank = banks.find(b => b.id === bankId);
    const allResults = banks.map(bank => {
      const annualRate = bank.rate;
      const monthlyPayment = calcMonthlyPayment(principal, annualRate, months);
      const totalPayment = monthlyPayment * months;
      const totalInterest = totalPayment - principal;
      return {
        bankId: bank.id,
        bankName: bank.nameAr,
        bankIcon: bank.icon,
        rate: annualRate,
        monthlyPayment: Math.round(monthlyPayment),
        totalPayment: Math.round(totalPayment),
        totalInterest: Math.round(totalInterest),
        isSelected: bank.id === bankId || !bankId,
      };
    });

    const schedule = selectedBank
      ? calcAmortization(principal, selectedBank.rate, months)
      : calcAmortization(principal, allResults[0].rate, months);

    return Response.json({
      success: true,
      data: {
        carPrice,
        downPayment: down,
        principal,
        termMonths: months,
        selectedBank: selectedBank || banks[0],
        results: allResults,
        schedule: schedule.slice(0, 12),
        scheduleFull: schedule.length,
      },
    });
  } catch {
    return Response.json({ success: false, error: 'حدث خطأ في الحساب' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: banks });
}
