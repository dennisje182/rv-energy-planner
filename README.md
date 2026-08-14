# RV Energy Planner

A clean, private successor project for one coherent RV energy-planning tool.

## Purpose

Help a user answer two related questions without switching between separate calculators:

1. **Quick check**: What does a single appliance use, cost, and require from the battery?
2. **Full RV plan**: Can the combined appliance plan be supported by the selected battery, solar input, and campsite supply?

This repository is a new build. Existing calculator repositories remain unchanged and are reference material only.

## Planned capabilities

- Calculate the missing value when any two of volts, amps, and watts are entered.
- Calculate operating energy, electricity cost, DC battery draw, and single-load runtime.
- Build a combined appliance plan and calculate total daily energy demand.
- Compare demand with usable AGM and lithium battery capacity.
- Model inverter losses for AC loads.
- Estimate solar recovery, clearly marked as an estimate.
- Check campsite connection limits.
- Offer fridge-oriented presets and inputs as part of the same tool.
- Explain every result, assumption, warning, and limitation.

## Product shape

The tool will have two modes that use the same calculation engine:

- **Quick check**, for a single appliance or scenario.
- **Energy plan**, for the complete RV setup.

A single source of truth will hold technical assumptions, including battery usable-capacity percentages, voltage reference, inverter efficiency, and calculation limits. The app will not present a single-appliance runtime as though it were the runtime of the entire RV.

## Project status

Foundation created. No calculator code has been copied or merged.

See [docs/PRODUCT_SCOPE.md](docs/PRODUCT_SCOPE.md) and [docs/FEATURE_INVENTORY.md](docs/FEATURE_INVENTORY.md).
