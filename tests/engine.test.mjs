import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.window = globalThis;
await import('../js/engine.js');
const { calculateAppliance, calculatePlan, DEFAULTS, resolvePower } = globalThis.RVEngine;

const assumptions = { batteryVoltage: 12.5, batteryAh: 100, usableFraction: 0.95, inverterEfficiency: 0.85, electricityRate: 0.6, gasRate: 1.4 };

test('derives the missing watts from volts and amps', () => {
  const result = resolvePower({ volts: 12.5, amps: 6, watts: '' });
  assert.equal(result.valid, true);
  assert.equal(result.watts, 75);
  assert.equal(result.derived, 'watts');
});

test('blocks inconsistent three-value inputs', () => {
  const result = resolvePower({ volts: 12, amps: 5, watts: 100 });
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /does not match/);
});

test('includes inverter loss in battery draw', () => {
  const result = calculateAppliance({ source: 'inverter_ac', volts: 230, amps: '', watts: 1000, hours: 1 }, assumptions);
  assert.equal(result.valid, true);
  assert.equal(result.energyWh, 1000);
  assert.equal(Number(result.offGridWh.toFixed(1)), 1176.5);
});

test('keeps campsite and gas loads out of off-grid use', () => {
  const plan = calculatePlan({ ...assumptions, tripDays: 3, reservePercent: 20, solarWp: 0, solarHours: 0, solarYield: 0.7, hookupAmp: 10,
    appliances: [
      { name: 'Kettle', source: 'shore_ac', volts: 230, amps: '', watts: 1000, hours: 0.1, simultaneousGroup: 'Breakfast' },
      { name: 'Fridge on gas', source: 'gas', gasGrams: 300 },
    ],
  });
  assert.equal(plan.dailyOffGridWh, 0);
  assert.equal(plan.campsiteGroups[0].watts, 1000);
});

test('calculates mixed DC and AC draw as 106 Ah', () => {
  const plan = calculatePlan({ ...assumptions, batteryAh: 200, tripDays: 1, reservePercent: 0, solarWp: 0, solarHours: 0, solarYield: 0.7, hookupAmp: 10,
    appliances: [
      { name: 'AC load', source: 'inverter_ac', volts: 230, amps: '', watts: 1000, hours: 1 },
      { name: 'DC load', source: 'battery_dc', volts: 12.5, amps: 6, watts: '', hours: 2 },
    ],
  });
  assert.equal(Number(plan.dailyOffGridAh.toFixed(1)), 106.1);
});

test('reports a campsite group overload', () => {
  const plan = calculatePlan({ ...assumptions, tripDays: 1, reservePercent: 0, solarWp: 0, solarHours: 0, solarYield: 0.7, hookupAmp: 4,
    appliances: [
      { name: 'Kettle', source: 'shore_ac', volts: 230, amps: '', watts: 1200, hours: 0.1, simultaneousGroup: 'Breakfast' },
      { name: 'Toaster', source: 'shore_ac', volts: 230, amps: '', watts: 900, hours: 0.1, simultaneousGroup: 'Breakfast' },
    ],
  });
  assert.equal(plan.campsiteGroups[0].ok, false);
  assert.equal(Math.round(plan.campsiteGroups[0].amps * 10) / 10, 9.1);
});

test('uses the documented default constants', () => {
  assert.equal(DEFAULTS.batteryVoltage, 12.5);
  assert.equal(DEFAULTS.usableFraction.lithium, 0.95);
  assert.equal(DEFAULTS.usableFraction.agm, 0.5);
});
