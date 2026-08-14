const { DEFAULTS: defaults, calculateAppliance, calculatePlan, format } = globalThis.RVEngine;
const { FRIDGES, fridgeById } = globalThis.RVFridges;

const app = document.querySelector('#app');
const copy = (value) => JSON.parse(JSON.stringify(value));
const blankAppliance = () => ({ name: '', source: 'battery_dc', volts: '', amps: '', watts: '', hours: '', dailyEnergyWh: '', gasGrams: '', simultaneousGroup: '' });
const state = {
  mode: 'plan',
  plan: {
    tripDays: 3, reservePercent: 20, batteryAh: 120, batteryType: 'lithium', inverterRating: 1000,
    inverterEfficiency: defaults.inverterEfficiency, solarWp: 200, solarHours: 3, solarYield: defaults.defaultSolarYield,
    hookupAmp: 10, electricityRate: defaults.defaultElectricityRate, gasRate: defaults.defaultGasRate,
    batteryVoltage: defaults.batteryVoltage, appliances: [{ name: 'LED lighting', source: 'battery_dc', volts: 12.5, amps: 2, watts: '', hours: 4, dailyEnergyWh: '', gasGrams: '', simultaneousGroup: '' }],
  },
  quick: { name: 'Appliance', source: 'battery_dc', volts: 12.5, amps: '', watts: '', hours: 1, dailyEnergyWh: '', gasGrams: '', simultaneousGroup: '' },
  fridge: { selectedId: 'T2120-C', powerMode: 'battery_dc', leftId: 'T2120-C', rightId: 'N4141-E+' },
};

const escape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const selected = (condition) => condition ? ' selected' : '';
const checked = (condition) => condition ? ' checked' : '';
const numberValue = (value) => value ?? '';
const usableFraction = () => state.plan.batteryType === 'agm' ? defaults.usableFraction.agm : defaults.usableFraction.lithium;
const planAssumptions = () => ({ ...state.plan, usableFraction: usableFraction() });
const sourceOptions = (value) => `
  <option value="battery_dc"${selected(value === 'battery_dc')}>12 V battery</option>
  <option value="inverter_ac"${selected(value === 'inverter_ac')}>230 V via inverter</option>
  <option value="shore_ac"${selected(value === 'shore_ac')}>230 V campsite only</option>
  <option value="gas"${selected(value === 'gas')}>Gas</option>`;
const status = (kind, text) => `<span class="status ${kind}">${text}</span>`;

function applianceInputs(appliance, index, scope) {
  const gas = appliance.source === 'gas';
  const energyOverride = appliance.dailyEnergyWh !== '' && appliance.dailyEnergyWh !== undefined;
  return `
    <div class="appliance" data-appliance="${index}" data-scope="${scope}">
      <div class="appliance-top"><strong>${scope === 'plan' ? `Load ${index + 1}` : 'Appliance details'}</strong>${scope === 'plan' ? '<button class="button-danger remove-appliance" type="button">Remove</button>' : ''}</div>
      <div class="form-grid">
        <label>Name<input data-appliance-key="name" value="${escape(appliance.name)}" placeholder="e.g. kettle"></label>
        <label>Power source<select data-appliance-key="source">${sourceOptions(appliance.source)}</select></label>
        <label>Volts<input data-appliance-key="volts" inputmode="decimal" value="${escape(numberValue(appliance.volts))}" ${gas || energyOverride ? 'disabled' : ''} placeholder="V"></label>
        <label>Amps<input data-appliance-key="amps" inputmode="decimal" value="${escape(numberValue(appliance.amps))}" ${gas || energyOverride ? 'disabled' : ''} placeholder="A"></label>
        <label>Watts<input data-appliance-key="watts" inputmode="decimal" value="${escape(numberValue(appliance.watts))}" ${gas || energyOverride ? 'disabled' : ''} placeholder="W"></label>
        <label>${gas ? 'Gas use per day' : energyOverride ? 'Daily energy' : 'Hours per day'}<input data-appliance-key="${gas ? 'gasGrams' : energyOverride ? 'dailyEnergyWh' : 'hours'}" inputmode="decimal" value="${escape(numberValue(gas ? appliance.gasGrams : energyOverride ? appliance.dailyEnergyWh : appliance.hours))}" ${energyOverride ? 'disabled' : ''} placeholder="${gas ? 'g' : energyOverride ? 'Wh' : 'h'}"></label>
        <label>Used together group<input data-appliance-key="simultaneousGroup" value="${escape(appliance.simultaneousGroup)}" ${appliance.source !== 'shore_ac' ? 'disabled' : ''} placeholder="e.g. Breakfast"></label>
      </div>
      ${gas ? '<p class="inline-note">Gas cost is shown, but gas use is deliberately excluded from battery and campsite results.</p>' : energyOverride ? '<p class="inline-note">This selected fridge uses a source-backed daily-energy value. The V/A/W fields are intentionally not estimated.</p>' : '<p class="inline-note">Enter any two of V, A and W. The third is calculated. Give shore appliances a group only if they may be used at the same time.</p>'}
    </div>`;
}

function renderHeader() {
  return `
    <header class="hero">
      <div class="topline"><span class="pilot">Public pilot</span><span>No account. No saved data. Planning guidance only.</span></div>
      <div class="topline"><div><h1>Plan your RV energy with fewer surprises.</h1><p>Bring your fridge, appliances, battery, solar and campsite connection into one honest energy picture.</p></div></div>
      <nav class="nav" aria-label="Planner journeys">
        <button data-mode="plan" class="${state.mode === 'plan' ? 'active' : ''}" type="button">Plan my RV</button>
        <button data-mode="quick" class="${state.mode === 'quick' ? 'active' : ''}" type="button">Check an appliance</button>
        <button data-mode="fridges" class="${state.mode === 'fridges' ? 'active' : ''}" type="button">Compare fridges</button>
      </nav>
    </header>`;
}

function renderQuick() {
  const result = calculateAppliance(state.quick, { ...planAssumptions(), usableFraction: usableFraction() });
  const power = result.power;
  const resultContent = result.valid ? `
    <div class="grid three results">
      <div class="metric"><span class="eyebrow">Energy per day</span><div class="value">${format.whole(result.energyWh)} Wh</div><small>${format.number(result.energyWh / 1000, 2)} kWh, ${format.currency(result.cost)}</small></div>
      <div class="metric"><span class="eyebrow">Battery draw</span><div class="value">${format.number(result.offGridWh / state.plan.batteryVoltage)} Ah</div><small>${result.source === 'shore_ac' ? 'Campsite-only load, excluded from battery sizing.' : 'Includes inverter loss where relevant.'}</small></div>
      <div class="metric"><span class="eyebrow">Single-load runtime</span><div class="value">${format.duration(result.singleRuntimeHours)}</div><small>This is one appliance alone, not whole-RV endurance.</small></div>
    </div>
    <div class="card results"><div class="section-heading"><div><p class="eyebrow">Calculated values</p><h3>${format.number(power?.volts)} V · ${format.number(power?.amps)} A · ${format.number(power?.watts)} W</h3></div>${power?.derived ? status('estimate', `${power.derived} calculated`) : status('ok', 'values agree')}</div><p>${result.note ?? 'The cost uses your electricity rate from the planner assumptions.'}</p></div>` : `<ul class="warning-list">${result.errors.map((message) => `<li class="alert">${escape(message)}</li>`).join('')}</ul>`;
  return `
    <section id="main" class="view ${state.mode === 'quick' ? 'active' : ''}">
      <div class="section-heading"><div><p class="eyebrow">Quick check</p><h2>Check one appliance without losing the bigger picture.</h2><p>The same calculation rules are used in the full plan. Results are estimates, not an installation approval.</p></div></div>
      <div class="card form-card">${applianceInputs(state.quick, 0, 'quick')}</div>
      ${resultContent}
    </section>`;
}

function renderPlanResults(result) {
  const hasOffGrid = result.dailyOffGridWh > 0;
  const batteryStatus = !hasOffGrid ? status('warn', 'Add an off-grid load') : result.batteryOk ? status('ok', 'Current battery meets this estimate') : status('alert', 'Battery capacity gap');
  const batteryAction = !hasOffGrid ? 'Add a 12 V or inverter-powered appliance to calculate a battery requirement.' : result.batteryOk ? 'Keep a practical reserve and verify appliance ratings before relying on the result.' : `Consider at least ${format.whole(result.requiredNominalAh)} Ah nominal ${state.plan.batteryType === 'agm' ? 'AGM' : 'lithium'} capacity under these assumptions.`;
  const campsiteContent = result.campsiteGroups.length ? result.campsiteGroups.map((group) => `<li class="${group.ok ? '' : 'alert'}"><strong>${escape(group.name)}</strong>: ${format.whole(group.watts)} W, ${format.number(group.amps)} A. ${group.ok ? `${format.number(group.marginAmps)} A margin.` : `${format.number(Math.abs(group.marginAmps))} A above the selected connection.`}</li>`).join('') : '<li>Assign shore loads that may run together to a named group to check their combined campsite demand.</li>';
  return `
    <section class="results" aria-live="polite">
      <div class="section-heading"><div><p class="eyebrow">Your energy picture</p><h2>Read these results in order.</h2><p>Battery and solar describe off-grid use. Campsite checks describe only the groups you define as simultaneous.</p></div></div>
      ${result.errors.length ? `<ul class="warning-list">${result.errors.map((message) => `<li class="alert">${escape(message)}</li>`).join('')}</ul>` : ''}
      <div class="grid three">
        <div class="metric"><span class="eyebrow">Daily off-grid use</span><div class="value">${format.number(result.dailyOffGridAh)} Ah</div><small>${format.whole(result.dailyOffGridWh)} Wh from 12 V and inverter loads.</small></div>
        <div class="metric"><span class="eyebrow">Battery for this trip</span><div class="value">${format.whole(result.requiredNominalAh)} Ah</div><small>Nominal ${state.plan.batteryType === 'agm' ? 'AGM' : 'lithium'} capacity, including reserve.</small></div>
        <div class="metric"><span class="eyebrow">Inverter to consider</span><div class="value">${format.whole(result.recommendedInverterWatts)} W</div><small>Largest inverter load plus 25% planning margin.</small></div>
      </div>
      <div class="grid two results">
        <div class="card"><div class="section-heading"><div><p class="eyebrow">Battery check</p><h3>${batteryStatus}</h3></div></div><p>${batteryAction}</p><p class="hint">Entered usable energy: ${format.whole(result.usableBatteryWh)} Wh. Estimated storage requirement: ${format.whole(result.requiredStorageWh)} Wh.</p></div>
        <div class="card"><div class="section-heading"><div><p class="eyebrow">Solar recovery</p><h3>${status('estimate', 'Daily estimate')}</h3></div></div><p>${format.whole(result.solarWh)} Wh/day estimated recovery. Daily balance: ${result.dailyBalanceWh >= 0 ? '+' : ''}${format.whole(result.dailyBalanceWh)} Wh.</p><p class="hint">Weather, shade, panel angle and season can change this materially. It is never a battery guarantee.</p></div>
      </div>
      <div class="card results"><p class="eyebrow">Campsite hookup, ${escape(state.plan.hookupAmp)} A selected</p><h3>Combined groups, not isolated appliances</h3><ul class="warning-list">${campsiteContent}${result.ungroupedShoreLoads.length ? `<li class="alert">These shore loads have no simultaneous-use group: ${escape(result.ungroupedShoreLoads.join(', '))}. Add one before relying on campsite capacity.</li>` : ''}</ul></div>
      <details><summary>Show calculation assumptions</summary><p>Battery planning uses ${escape(state.plan.batteryVoltage)} V, ${state.plan.batteryType === 'agm' ? '50%' : '95%'} usable capacity and ${format.number(state.plan.inverterEfficiency * 100, 0)}% inverter efficiency. Single-load runtime is never used as the whole-RV endurance result.</p></details>
    </section>`;
}

function renderPlan() {
  const result = calculatePlan(planAssumptions());
  return `
    <section id="main" class="view ${state.mode === 'plan' ? 'active' : ''}">
      <div class="section-heading"><div><p class="eyebrow">Plan my RV</p><h2>Start with the trip, then add the equipment.</h2><p>Every result states what it does and does not cover, so a quick estimate does not become a false promise.</p></div></div>
      <div class="grid three">
        <article class="card step"><p class="eyebrow">1. The trip</p><h3>How long before charging or hookup?</h3><p>Choose the planning period and a practical reserve.</p></article>
        <article class="card step"><p class="eyebrow">2. The loads</p><h3>What actually uses energy?</h3><p>Add the fridge and every relevant electrical appliance.</p></article>
        <article class="card step"><p class="eyebrow">3. The setup</p><h3>What can support it?</h3><p>Check battery, solar, inverter and campsite connection together.</p></article>
      </div>
      <section class="card form-card"><p class="eyebrow">Trip context</p><div class="form-grid compact">
        <label>Days between charging or hookup<input data-plan-key="tripDays" inputmode="decimal" value="${escape(state.plan.tripDays)}"></label>
        <label>Energy reserve<input data-plan-key="reservePercent" inputmode="decimal" value="${escape(state.plan.reservePercent)}"><span class="hint">Percent</span></label>
        <label>Electricity price<input data-plan-key="electricityRate" inputmode="decimal" value="${escape(state.plan.electricityRate)}"><span class="hint">Euro per kWh</span></label>
      </div></section>
      <section class="card form-card"><div class="section-heading"><div><p class="eyebrow">Appliances</p><h3>Add realistic daily use</h3></div><button class="button add-appliance" type="button">Add appliance</button></div>
        ${state.plan.appliances.map((appliance, index) => applianceInputs(appliance, index, 'plan')).join('')}
        <div class="actions"><button class="button-secondary fridge-add" type="button">Choose a verified Thetford fridge</button><span class="hint">This opens the model selector and adds the chosen mode to this plan.</span></div>
      </section>
      <section class="card form-card"><p class="eyebrow">Your electrical setup</p><div class="form-grid">
        <label>Battery size<input data-plan-key="batteryAh" inputmode="decimal" value="${escape(state.plan.batteryAh)}"><span class="hint">Nominal Ah</span></label>
        <label>Battery type<select data-plan-key="batteryType"><option value="lithium"${selected(state.plan.batteryType === 'lithium')}>Lithium</option><option value="agm"${selected(state.plan.batteryType === 'agm')}>AGM / lead-acid</option></select></label>
        <label>Inverter rating<input data-plan-key="inverterRating" inputmode="decimal" value="${escape(state.plan.inverterRating)}"><span class="hint">Continuous W</span></label>
        <label>Campsite connection<select data-plan-key="hookupAmp">${[4, 6, 10, 16].map((amp) => `<option value="${amp}"${selected(Number(state.plan.hookupAmp) === amp)}>${amp} A</option>`).join('')}</select></label>
      </div>
      <details><summary>Advanced planning assumptions</summary><div class="form-grid compact"><label>Planning voltage<input data-plan-key="batteryVoltage" inputmode="decimal" value="${escape(state.plan.batteryVoltage)}"><span class="hint">V, default 12.5</span></label><label>Inverter efficiency<input data-plan-key="inverterEfficiency" inputmode="decimal" value="${escape(state.plan.inverterEfficiency)}"><span class="hint">0 to 1, default 0.85</span></label><label>Solar array<input data-plan-key="solarWp" inputmode="decimal" value="${escape(state.plan.solarWp)}"><span class="hint">Wp</span></label><label>Peak-sun hours<input data-plan-key="solarHours" inputmode="decimal" value="${escape(state.plan.solarHours)}"><span class="hint">Per day</span></label><label>Solar yield factor<input data-plan-key="solarYield" inputmode="decimal" value="${escape(state.plan.solarYield)}"><span class="hint">0 to 1</span></label><label>Gas price<input data-plan-key="gasRate" inputmode="decimal" value="${escape(state.plan.gasRate)}"><span class="hint">Euro per kg</span></label></div></details>
      </section>
      ${renderPlanResults(result)}
    </section>`;
}

function fridgeOptions(value, category) {
  return FRIDGES.filter((fridge) => !category || fridge.category === category).map((fridge) => `<option value="${fridge.id}"${selected(fridge.id === value)}>${fridge.name} · ${fridge.volumeLitres} L</option>`).join('');
}

function fridgeCard(fridge) {
  if (!fridge) return '<div class="empty">Choose a fridge.</div>';
  const modeInfo = fridge.category === 'compressor' ? '12 V compressor' : 'Absorption, select a power source before adding';
  return `<article class="model-card"><p class="eyebrow">${escape(modeInfo)}</p><h3>${escape(fridge.name)}</h3><p>${fridge.volumeLitres} L · ${format.number(fridge.dailyKwh, 2)} kWh/24h</p><dl><dt>Data status</dt><dd>${status('ok', fridge.validationStatus)}</dd><dt>Consumption basis</dt><dd>${escape(fridge.source.basis)}</dd>${fridge.gasGramsPerDay ? `<dt>Gas use</dt><dd>${fridge.gasGramsPerDay} g/24h</dd>` : ''}</dl><p class="source">Source checked ${escape(fridge.source.checkedDate)}: <a href="${escape(fridge.source.url)}" target="_blank" rel="noreferrer">${escape(fridge.source.title)}</a></p></article>`;
}

function addFridgeToPlan() {
  const fridge = fridgeById(state.fridge.selectedId);
  if (!fridge || fridge.validationStatus !== 'verified') return;
  const mode = fridge.category === 'compressor' ? 'battery_dc' : state.fridge.powerMode;
  const appliance = blankAppliance();
  appliance.name = fridge.name;
  appliance.source = mode;
  if (mode === 'gas') {
    appliance.gasGrams = fridge.gasGramsPerDay;
  } else if (mode === 'shore_ac') {
    appliance.dailyEnergyWh = fridge.dailyKwh * 1000;
    appliance.volts = 230;
    appliance.watts = Math.round((fridge.dailyKwh * 1000) / 24);
  } else if (fridge.category === 'compressor') {
    appliance.dailyEnergyWh = fridge.dailyKwh * 1000;
    appliance.volts = 12.5;
  } else {
    appliance.volts = 12.5;
    appliance.watts = fridge.dcWatts;
    appliance.hours = 24;
  }
  state.plan.appliances.push(appliance);
  state.mode = 'plan';
  render();
}

function renderFridges() {
  const current = fridgeById(state.fridge.selectedId);
  const left = fridgeById(state.fridge.leftId);
  const right = fridgeById(state.fridge.rightId);
  const electricityRate = Number(state.plan.electricityRate) || defaults.defaultElectricityRate;
  const gasRate = Number(state.plan.gasRate) || defaults.defaultGasRate;
  const comparisonCost = (fridge) => fridge.category === 'absorption' ? (fridge.gasGramsPerDay / 1000) * gasRate : fridge.dailyKwh * electricityRate;
  return `
    <section id="main" class="view ${state.mode === 'fridges' ? 'active' : ''}">
      <div class="section-heading"><div><p class="eyebrow">Verified Thetford model data</p><h2>Compare fridges, then add one to the energy plan.</h2><p>Only source-backed models are listed. Older values from the previous tool are not carried forward until their source is checked.</p></div></div>
      <div class="card form-card"><div class="form-grid compact"><label>Fridge model<select data-fridge-key="selectedId">${fridgeOptions(state.fridge.selectedId)}</select></label><label>Power mode<select data-fridge-key="powerMode" ${current?.category === 'compressor' ? 'disabled' : ''}>${sourceOptions(state.fridge.powerMode).replace('<option value="inverter_ac"', '<option value="inverter_ac" disabled').replace('<option value="shore_ac"', '<option value="shore_ac"').replace('<option value="gas"', '<option value="gas"')}</select><span class="hint">Compressor models use 12 V battery energy.</span></label><div class="actions"><button class="button fridge-add" type="button">Add to my RV plan</button></div></div>${fridgeCard(current)}</div>
      <div class="section-heading"><div><p class="eyebrow">Side-by-side comparison</p><h2>Daily running implication</h2><p>Prices come from the plan assumptions. Compare cost only when the chosen power sources are genuinely available.</p></div></div>
      <div class="comparison"><div class="card"><label>First model<select data-fridge-key="leftId">${fridgeOptions(state.fridge.leftId)}</select></label>${fridgeCard(left)}<p class="inline-note">Indicative daily energy cost: ${format.currency(comparisonCost(left))}</p></div><div class="card"><label>Second model<select data-fridge-key="rightId">${fridgeOptions(state.fridge.rightId)}</select></label>${fridgeCard(right)}<p class="inline-note">Indicative daily energy or gas cost: ${format.currency(comparisonCost(right))}</p></div></div>
    </section>`;
}

function render() {
  app.innerHTML = `<div class="shell">${renderHeader()}<main class="container"><div class="notice"><div>ⓘ</div><div><strong>Educational planning pilot</strong>It does not design wiring, fuses, BMS protection or an installation. Check equipment documentation and a qualified installer before making a decision.</div></div>${renderPlan()}${renderQuick()}${renderFridges()}<footer class="footer">RV Energy Planner, pilot. Refreshing the page clears your inputs by design.</footer></main></div>`;
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { state.mode = button.dataset.mode; render(); }));
  document.querySelectorAll('[data-plan-key]').forEach((field) => field.addEventListener('change', () => { state.plan[field.dataset.planKey] = field.value; render(); }));
  document.querySelectorAll('[data-appliance]').forEach((row) => {
    const index = Number(row.dataset.appliance);
    const target = row.dataset.scope === 'quick' ? state.quick : state.plan.appliances[index];
    row.querySelectorAll('[data-appliance-key]').forEach((field) => field.addEventListener('change', () => { target[field.dataset.applianceKey] = field.value; render(); }));
  });
  document.querySelector('.add-appliance')?.addEventListener('click', () => { state.plan.appliances.push(blankAppliance()); render(); });
  document.querySelectorAll('.remove-appliance').forEach((button) => button.addEventListener('click', () => { const row = button.closest('[data-appliance]'); state.plan.appliances.splice(Number(row.dataset.appliance), 1); render(); }));
  document.querySelectorAll('[data-fridge-key]').forEach((field) => field.addEventListener('change', () => { state.fridge[field.dataset.fridgeKey] = field.value; if (field.dataset.fridgeKey === 'selectedId' && fridgeById(field.value)?.category === 'compressor') state.fridge.powerMode = 'battery_dc'; render(); }));
  document.querySelectorAll('.fridge-add').forEach((button) => button.addEventListener('click', addFridgeToPlan));
}

render();
