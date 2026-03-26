import { VINResult } from '@/types';

const WMI_MAP: Record<string, string> = {
  'WVW': 'VOLKSWAGEN', 'WV2': 'VOLKSWAGEN', 'WV1': 'VOLKSWAGEN', '3VW': 'VOLKSWAGEN',
  'WBA': 'BMW', 'WBS': 'BMW', 'WBY': 'BMW', '5UX': 'BMW', 'WUZ': 'BMW',
  'WAU': 'AUDI', 'WAP': 'PORSCHE', 'WP0': 'PORSCHE', 'WP1': 'PORSCHE',
  'WDB': 'MERCEDES-BENZ', 'WDC': 'MERCEDES-BENZ', 'WDD': 'MERCEDES-BENZ', 'WDF': 'MERCEDES-BENZ', 'W1K': 'MERCEDES-BENZ', 'W1N': 'MERCEDES-BENZ', 'W1V': 'MERCEDES-BENZ',
  'TMB': 'ŠKODA', 'TMP': 'ŠKODA',
  'YV1': 'VOLVO', 'YV4': 'VOLVO', 'YV2': 'VOLVO',
  'WF0': 'FORD', 'WF1': 'FORD', '1FA': 'FORD', '3FA': 'FORD',
  'W0L': 'OPEL', 'W0V': 'OPEL',
  'JTD': 'TOYOTA', 'JTE': 'TOYOTA', 'JTN': 'TOYOTA', 'JTH': 'LEXUS',
  'SJN': 'NISSAN', 'JN1': 'NISSAN', 'VSK': 'NISSAN',
  'KMH': 'HYUNDAI', 'TMA': 'HYUNDAI', '5NP': 'HYUNDAI',
  'KNA': 'KIA', 'KNC': 'KIA', 'U5Y': 'KIA', 'U6Y': 'KIA',
  'JMZ': 'MAZDA', 'JM3': 'MAZDA', 'JM7': 'MAZDA',
  'VF3': 'PEUGEOT', 'VF7': 'CITROËN',
  'VF1': 'RENAULT', 'VF6': 'RENAULT',
  'SHH': 'HONDA', 'JHM': 'HONDA', '2HG': 'HONDA',
  'JA3': 'MITSUBISHI', 'JA4': 'MITSUBISHI', 'JMB': 'MITSUBISHI', 'JMY': 'MITSUBISHI',
  'JF1': 'SUBARU', 'JF2': 'SUBARU', '4S3': 'SUBARU', '4S4': 'SUBARU',
  '5YJ': 'TESLA', '7SA': 'TESLA', 'LRW': 'TESLA',
  'ZFA': 'FIAT', 'ZAR': 'ALFA ROMEO', 'ZLA': 'LANCIA', 'ZAM': 'MASERATI',
  'SAL': 'LAND ROVER', 'SAJ': 'JAGUAR', 'SAR': 'LAND ROVER',
  'WME': 'SMART', 'VSS': 'SEAT', 'TRU': 'AUDI',
  'UU1': 'DACIA', 'UU6': 'DACIA',
  'WDZ': 'MERCEDES-BENZ', 'WMW': 'MINI', 'WMA': 'MAN',
  'XTA': 'LADA', 'Y6D': 'LADA', 'GHT': 'RIVIAN',
  'WUA': 'AUDI', 'WA1': 'AUDI',
  'YS3': 'SAAB', 'LFV': 'VOLKSWAGEN',
};

const YEAR_CODES: Record<string, number> = {
  'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
  'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
  'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
  'S': 2025, 'T': 2026,
  '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
  '6': 2006, '7': 2007, '8': 2008, '9': 2009,
};

const INVALID_CHARS = /[IOQ]/i;

export function decodeVIN(vin: string): VINResult {
  if (!vin || typeof vin !== 'string') {
    return { isValid: false, error: 'VIN is required' };
  }

  const cleaned = vin.trim().toUpperCase();

  if (cleaned.length !== 17) {
    return { isValid: false, error: `VIN must be 17 characters (got ${cleaned.length})` };
  }

  if (INVALID_CHARS.test(cleaned)) {
    return { isValid: false, error: 'VIN must not contain I, O, or Q' };
  }

  const wmi = cleaned.substring(0, 3);
  const vds = cleaned.substring(3, 9);
  const yearCode = cleaned.charAt(9);
  const plant = cleaned.charAt(10);
  const serial = cleaned.substring(11, 17);

  const make = WMI_MAP[wmi] || undefined;
  const modelYear = YEAR_CODES[yearCode] || undefined;

  return {
    isValid: true,
    vin: cleaned,
    wmi,
    vds,
    make,
    modelYear,
    yearCode,
    plant,
    serial,
  };
}
