import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api';

const NHTSA_API = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
  try {
    const { vin } = await params;
    if (!vin || vin.length < 6) return errorResponse('رقم هيكل غير صالح');

    const vinUpper = vin.toUpperCase();

    const res = await fetch(`${NHTSA_API}/${vinUpper}?format=json`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();

    if (!data?.Results) {
      return fallbackDecode(vinUpper);
    }

    const extract = (varName: string) =>
      data.Results.find((r: any) => r.Variable === varName)?.Value || null;

    const make = extract('Make');
    const model = extract('Model');
    const year = extract('Model Year');
    const trim = extract('Trim');
    const engine = extract('Engine Model');
    const fuel = extract('Fuel Type - Primary');
    const bodyClass = extract('Body Class');
    const drivetrain = extract('Drive Type');
    const engineCylinders = extract('Engine Number of Cylinders');
    const engineDisplacement = extract('Displacement (CC)');
    const plant = extract('Plant City');
    const series = extract('Series');

    const decoded = {
      vin: vinUpper,
      isValid: data.Results?.some((r: any) => r.Variable === 'Error Code' && r.Value === '0'),
      confidence: data.Results?.some((r: any) => r.Variable === 'Error Code' && r.Value === '0') ? 1 : 0.5,
      manufacturer: make,
      model,
      year: year ? parseInt(year) : null,
      trim,
      engine,
      fuelType: fuel,
      bodyClass,
      drivetrain,
      engineCylinders: engineCylinders ? parseInt(engineCylinders) : null,
      engineDisplacement: engineDisplacement ? parseInt(engineDisplacement) : null,
      plantCity: plant,
      series,
      raw: data.Results?.filter((r: any) => r.Value).slice(0, 30) || [],
    };

    return successResponse(decoded);
  } catch (e) {
    return errorResponse('فشل فك رقم الهيكل', 500);
  }
}

function fallbackDecode(vin: string) {
  const wmi = vin.slice(0, 3);
  const vds = vin.slice(3, 9);
  const vis = vin.slice(9, 17);
  const yearCode = vin[9];
  const plantCode = vin[10];

  const yearMap: Record<string, number> = {
    L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025, T: 2026,
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016,
    H: 2017, J: 2018, K: 2019,
  };
  const year = yearMap[yearCode] || null;

  const wmiBrands: Record<string, string> = {
    'JTD': 'TOYOTA', 'JT2': 'TOYOTA', 'JT3': 'TOYOTA',
    '1FA': 'FORD', '1FM': 'FORD', '1FT': 'FORD',
    '2FA': 'FORD', '2FM': 'FORD',
    '3FA': 'FORD', '3FM': 'FORD',
    '1HG': 'HONDA', '2HG': 'HONDA',
    '19U': 'ACURA', '2HH': 'ACURA',
    'KMH': 'HYUNDAI', 'KNA': 'HYUNDAI',
    'KLA': 'KIA', 'KNC': 'KIA',
    'JN1': 'NISSAN', 'JN8': 'NISSAN', '3N1': 'NISSAN', '5N1': 'NISSAN',
    '4S3': 'SUBARU', 'JF1': 'SUBARU',
    'JM1': 'MAZDA', 'JM3': 'MAZDA',
    'JT6': 'LEXUS', 'JTH': 'LEXUS',
    'SAL': 'LAND ROVER', 'SMT': 'LAND ROVER',
    'WBA': 'BMW', 'WBS': 'BMW', '5GA': 'BMW',
    'WDB': 'MERCEDES', 'WDD': 'MERCEDES', '4JG': 'MERCEDES',
    'WAU': 'AUDI', 'WA1': 'AUDI',
    'WVW': 'VOLKSWAGEN', 'WVG': 'VOLKSWAGEN',
    'VF1': 'RENAULT', 'VF3': 'PEUGEOT',
    'ZAR': 'ALFA ROMEO',
    'JSA': 'SUZUKI',
    'MNT': 'NISSAN',
    'TMB': 'SKODA',
  };
  const manufacturer = wmiBrands[wmi] || null;

  return successResponse({
    vin,
    isValid: true,
    confidence: 0.3,
    manufacturer,
    model: null,
    year,
    plantCode,
    note: 'تم فك الرقم جزئياً - النتائج غير مؤكدة',
  });
}
