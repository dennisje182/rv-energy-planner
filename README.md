# RV Energy Planner

A dependency-free public pilot that brings RV appliance checks, fridge comparison and trip-level energy planning into one browser tool.

## Use the pilot

The start page is **Plan my RV**. It guides a user through trip context, appliances, electrical setup and one combined result.

- **Plan my RV** calculates daily off-grid use, battery capacity for the chosen trip, solar recovery estimate, inverter sizing indication and combined campsite-load groups.
- **Check an appliance** calculates the missing value when two of volts, amps and watts are known, then shows cost, battery draw and standalone runtime.
- **Compare fridges** shows only source-backed Thetford models and adds a chosen operating mode to the plan.

The app deliberately stores nothing. Refreshing the page starts a new session.

## Safety boundary

This is educational planning guidance, not an electrical installation design or approval. It does not size wiring, fuses or BMS protection, and solar recovery is explicitly an estimate. Check product documentation and the actual installation before deciding.

## Calculation rules

- Planning reference: 12.5 V.
- Usable battery capacity: 95% for lithium and 50% for AGM / lead-acid.
- Inverter efficiency: 85% default, editable in the advanced assumptions.
- Inverter indication: largest entered inverter load plus a 25% planning margin.
- Campsite checks sum only appliances in the same named simultaneous-use group.
- Gas and campsite-only loads do not inflate off-grid battery demand.

See [the product scope](docs/PRODUCT_SCOPE.md), [feature inventory](docs/FEATURE_INVENTORY.md), and [fridge data register](docs/FRIDGE_DATA_REGISTER.md).

## Development

The pilot is plain HTML, CSS and ES modules. No source code from the earlier calculator repositories is copied here.

```
npm test
```

The GitHub Pages workflow publishes the `main` branch. Before the first public release, make the repository public and set Pages to use **GitHub Actions**.
