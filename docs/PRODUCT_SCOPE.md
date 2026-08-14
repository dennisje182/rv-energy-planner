# Product scope

## Problem statement

RV users need a defensible answer to whether an appliance or full appliance plan can be supported by their electrical setup. Existing calculators cover pieces of that question separately. RV Energy Planner will provide one consistent calculation model and explain its result.

## Primary users

- RV owners planning or checking an electrical setup.
- Dealers or product teams explaining the impact of appliances on power demand.

## User journeys

### Quick check

A user enters a single appliance and its operating time. The app calculates power, energy, cost, battery draw, and indicative runtime, including inverter losses for AC loads.

### Energy plan

A user lists appliances and their daily use, then selects battery capacity, battery chemistry, inverter efficiency, solar assumptions, and campsite supply. The app calculates combined demand, remaining battery margin, estimated solar contribution, and campsite-load warnings.

## Functional boundaries

Included:

- DC and AC appliance loads.
- V/A/W completion when two values are known.
- Energy in Wh and kWh, cost, Ah draw, and battery margin.
- Combined loads and daily use assumptions.
- AGM and lithium usable-capacity assumptions.
- Solar recovery estimates and campsite current checks.
- Fridge-focused presets, clearly labelled as typical values rather than product specifications.

Excluded from the first release:

- Formal electrical-system design or certification output.
- Wiring, fuse, cable, or battery-BMS sizing.
- Claims of guaranteed appliance runtime.
- Automatic product recommendations.

## Non-negotiable result rules

- Every material calculation assumption is visible and editable where appropriate.
- Single-load runtime and complete-RV endurance are distinct results.
- Estimated solar yield is never presented as a guarantee.
- AC conversion losses are included consistently.
- Warnings explain why they appear and what the user should check.

## Initial technical direction

A dependency-light static web application with calculation logic separated from the interface. The calculation engine will be unit-testable before visual development accelerates.
