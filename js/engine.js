const DEFAULTS = Object.freeze({
  batteryVoltage: 12.5,
  usableFraction: { lithium: 0.95, agm: 0.5 },
  inverterEfficiency: 0.85,
  inverterMargin: 0.25,
  gridVoltage: 230,
  defaultElectricityRate: 0.6,
  defaultGasRate: 1.4,
  defaultSolarYield: 0.7,
});

const finite = (value) => Number.isFinite(Number(value));
const number = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  return finite(value) ? Number(value) : null;
};
const positive = (value) => number(value) !== null && number(value) > 0;
const round = (value, places = 1) => Number(value.toFixed(places));

function resolvePower(values) {
  const volts = number(values.volts);
  const amps = number(values.amps);
  const watts = number(values.watts);
  const provided = [volts, amps, watts].filter((value) => value !== null && value > 0).length;
  const errors = [];

  if ([volts, amps, watts].some((value) => value !== null && value <= 0)) {
    errors.push('Use positive electrical values.');
  }
  if (provided < 2) {
    errors.push('Enter any two of volts, amps, and watts.');
  }
  if (errors.length) return { valid: false, errors, volts, amps, watts, derived: null };

  let derived = null;
  let resolvedVolts = volts;
  let resolvedAmps = amps;
  let resolvedWatts = watts;
  if (volts === null) {
    resolvedVolts = watts / amps;
    derived = 'volts';
  } else if (amps === null) {
    resolvedAmps = watts / volts;
    derived = 'amps';
  } else if (watts === null) {
    resolvedWatts = volts * amps;
    derived = 'watts';
  } else {
    const expectedWatts = volts * amps;
    if (Math.abs(expectedWatts - watts) / expectedWatts > 0.01) {
      errors.push('Volts × amps does not match the entered watts.');
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    volts: resolvedVolts,
    amps: resolvedAmps,
    watts: resolvedWatts,
    derived,
  };
}

function calculateAppliance(appliance, assumptions) {
  const source = appliance.source;
  const hours = number(appliance.hours);
  const electricSources = ['battery_dc', 'inverter_ac', 'shore_ac'];
  const power = resolvePower(appliance);
  const electricityRate = number(assumptions.electricityRate) ?? DEFAULTS.defaultElectricityRate;
  const gasRate = number(assumptions.gasRate) ?? DEFAULTS.defaultGasRate;
  const inverterEfficiency = number(assumptions.inverterEfficiency) ?? DEFAULTS.inverterEfficiency;
  const batteryVoltage = number(assumptions.batteryVoltage) ?? DEFAULTS.batteryVoltage;
  const batteryAh = number(assumptions.batteryAh);
  const usableFraction = number(assumptions.usableFraction);
  const overridesEnergy = positive(appliance.dailyEnergyWh);
  const errors = [];

  if (source === 'gas') {
    const grams = number(appliance.gasGrams);
    if (!(grams > 0)) errors.push('Enter positive gas use in grams per day.');
    return {
      valid: errors.length === 0,
      errors,
      source,
      power: null,
      energyWh: 0,
      offGridWh: 0,
      shoreWatts: 0,
      gasGrams: grams ?? 0,
      cost: grams > 0 ? (grams / 1000) * gasRate : 0,
      singleRuntimeHours: null,
      note: 'Gas use is excluded from battery and campsite calculations.',
    };
  }

  if (!electricSources.includes(source)) {
    return { valid: false, errors: ['Choose a power source.'], source, energyWh: 0, offGridWh: 0, shoreWatts: 0 };
  }

  let energyWh = 0;
  if (overridesEnergy) {
    energyWh = Number(appliance.dailyEnergyWh);
  } else {
    if (!(hours > 0)) errors.push('Enter positive operating hours per day.');
    if (!power.valid) errors.push(...power.errors);
    if (!errors.length) energyWh = power.watts * hours;
  }
  if (!(inverterEfficiency > 0 && inverterEfficiency <= 1)) errors.push('Inverter efficiency must be between 1% and 100%.');
  const offGridWh = source === 'battery_dc' ? energyWh : source === 'inverter_ac' ? energyWh / inverterEfficiency : 0;
  const shoreWatts = source === 'shore_ac' && power.valid ? power.watts : 0;
  let singleRuntimeHours = null;
  if (source !== 'shore_ac' && batteryAh > 0 && usableFraction > 0 && power.valid) {
    const usableWh = batteryAh * batteryVoltage * usableFraction;
    const batteryDrawWatts = source === 'inverter_ac' ? power.watts / inverterEfficiency : power.watts;
    singleRuntimeHours = usableWh / batteryDrawWatts;
  }
  return {
    valid: errors.length === 0,
    errors,
    source,
    power,
    energyWh,
    offGridWh,
    shoreWatts,
    gasGrams: 0,
    cost: energyWh ? (energyWh / 1000) * electricityRate : 0,
    singleRuntimeHours,
    note: overridesEnergy ? 'Daily energy comes from the selected fridge data.' : null,
  };
}

function calculatePlan(plan) {
  const batteryVoltage = number(plan.batteryVoltage) ?? DEFAULTS.batteryVoltage;
  const batteryAh = number(plan.batteryAh) ?? 0;
  const usableFraction = number(plan.usableFraction) ?? DEFAULTS.usableFraction.lithium;
  const tripDays = number(plan.tripDays) ?? 0;
  const reserveFraction = (number(plan.reservePercent) ?? 0) / 100;
  const solarWp = number(plan.solarWp) ?? 0;
  const solarHours = number(plan.solarHours) ?? 0;
  const solarYield = number(plan.solarYield) ?? DEFAULTS.defaultSolarYield;
  const hookupAmp = number(plan.hookupAmp) ?? 0;
  const results = plan.appliances.map((appliance) => calculateAppliance(appliance, {
    ...plan,
    batteryVoltage,
    batteryAh,
    usableFraction,
  }));
  const offGridWh = results.reduce((sum, result) => sum + (result.valid ? result.offGridWh : 0), 0);
  const dailyCost = results.reduce((sum, result) => sum + (result.valid ? result.cost : 0), 0);
  const solarWh = solarWp > 0 && solarHours > 0 && solarYield > 0 ? solarWp * solarHours * solarYield : 0;
  const dailyBalanceWh = solarWh - offGridWh;
  const requiredStorageWh = Math.max(offGridWh, Math.max(0, offGridWh - solarWh) * tripDays) * (1 + reserveFraction);
  const usableBatteryWh = batteryAh * batteryVoltage * usableFraction;
  const requiredUsableAh = requiredStorageWh / batteryVoltage;
  const requiredNominalAh = usableFraction > 0 ? requiredUsableAh / usableFraction : 0;
  const inverterLoads = results.filter((result) => result.source === 'inverter_ac' && result.power?.valid);
  const largestInverterWatts = inverterLoads.reduce((max, result) => Math.max(max, result.power.watts), 0);
  const recommendedInverterWatts = largestInverterWatts * (1 + DEFAULTS.inverterMargin);
  const groups = new Map();
  results.forEach((result, index) => {
    if (result.source !== 'shore_ac' || !result.shoreWatts) return;
    const group = plan.appliances[index].simultaneousGroup?.trim();
    if (!group) return;
    groups.set(group, (groups.get(group) ?? 0) + result.shoreWatts);
  });
  const campsiteGroups = [...groups.entries()].map(([name, watts]) => {
    const amps = watts / DEFAULTS.gridVoltage;
    return { name, watts, amps, marginAmps: hookupAmp - amps, ok: hookupAmp > 0 && amps <= hookupAmp };
  });
  const ungroupedShoreLoads = plan.appliances
    .filter((appliance, index) => results[index].source === 'shore_ac' && results[index].shoreWatts && !appliance.simultaneousGroup?.trim())
    .map((appliance) => appliance.name || 'Unnamed shore load');
  const errors = results.flatMap((result, index) => result.errors.map((message) => `Appliance ${index + 1}: ${message}`));
  return {
    appliances: results,
    errors,
    dailyOffGridWh: offGridWh,
    dailyOffGridAh: offGridWh / batteryVoltage,
    dailyCost,
    solarWh,
    dailyBalanceWh,
    requiredStorageWh,
    requiredUsableAh,
    requiredNominalAh,
    usableBatteryWh,
    batteryOk: usableBatteryWh >= requiredStorageWh && requiredStorageWh > 0,
    recommendedInverterWatts,
    campsiteGroups,
    ungroupedShoreLoads,
  };
}

const format = {
  number: (value, digits = 1) => Number(value || 0).toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits }),
  whole: (value) => Math.round(value || 0).toLocaleString('en-GB'),
  currency: (value) => `€${Number(value || 0).toFixed(2)}`,
  duration: (hours) => hours === null || !Number.isFinite(hours) ? 'Not available' : hours < 24 ? `${format.number(hours)} h` : `${format.number(hours / 24)} days`,
};

globalThis.RVEngine = { DEFAULTS, calculateAppliance, calculatePlan, format, resolvePower };
