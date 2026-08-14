const source = {
  id: 'thetford-12v-2026-nl',
  title: 'Thetford 12V refrigerators, 2026 product range',
  url: 'https://www.thetford.com/app/uploads/2024/07/7.1_Thetford_12V-Refrigerators_2026_NL_LR.pdf',
  sourceDate: '2025-07',
  checkedDate: '2026-08-14',
  basis: 'IEC 62552-2020, as stated in the brochure',
};

const n4000Source = {
  id: 'thetford-n4000-support',
  title: 'Thetford N4000 series support and technical specifications',
  url: 'https://www.thetford.com/nl/welkom-bij-thetford-support/n4000-serie/',
  sourceDate: '2026-08-14',
  checkedDate: '2026-08-14',
  basis: 'IEC 62552-2020, as stated in the linked technical specification',
};

const compressor = (id, name, volumeLitres, dailyKwh) => ({
  id, name, category: 'compressor', volumeLitres, dailyKwh,
  supportedModes: ['battery_dc'], validationStatus: 'verified', source,
});
const absorption = (id, name, volumeLitres, dailyKwh, gasGramsPerDay, dcWatts) => ({
  id, name, category: 'absorption', volumeLitres, dailyKwh, gasGramsPerDay, dcWatts,
  supportedModes: ['battery_dc', 'shore_ac', 'gas'], validationStatus: 'verified', source: n4000Source,
});

export const FRIDGES = Object.freeze([
  compressor('T1090-E', 'T1090-E', 84, 0.35),
  compressor('T2095-E', 'T2095-E', 90, 0.36),
  compressor('T2120-C', 'T2120-C', 119, 0.45),
  compressor('T2138-C', 'T2138-C', 138, 0.50),
  compressor('T2152-C', 'T2152-C', 150, 0.46),
  compressor('T2160-C', 'T2160-C', 158, 0.56),
  compressor('T2175-C', 'T2175-C', 174, 0.56),
  absorption('N4080-E+', 'N4080-E+', 71, 2.6, 270, 140),
  absorption('N4090-E+', 'N4090-E+', 78, 2.9, 300, 140),
  absorption('N4141-E+', 'N4141-E+', 135, 4.5, 468, 205),
  absorption('N4142-E+', 'N4142-E+', 137, 4.5, 468, 205),
  absorption('N4145-E+', 'N4145-E+', 136, 4.3, 437, 205),
  absorption('N4150-E+', 'N4150-E+', 145, 4.3, 437, 205),
  absorption('N4170-E+', 'N4170-E+', 156, 4.3, 437, 205),
  absorption('N4175-E+', 'N4175-E+', 165, 4.3, 437, 205),
]);

export const fridgeById = (id) => FRIDGES.find((fridge) => fridge.id === id);
