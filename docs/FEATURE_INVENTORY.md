# Feature inventory and consolidation map

This is a planning inventory. It records the intended knowledge areas for the new build, not copied source code or a completed code-level comparison.

| Knowledge area | New-tool treatment |
| --- | --- |
| V/A/W calculation | Shared calculation-engine capability |
| Appliance energy and electricity cost | Core result in Quick check and Energy plan |
| Per-appliance battery draw and runtime | Quick check result, explicitly limited to one load |
| Combined appliance demand | Core Energy plan result |
| Battery chemistry and usable capacity | Shared setup, with visible usable-capacity assumptions |
| Inverter efficiency | Shared AC-load assumption |
| Solar recovery | Energy plan estimate, clearly qualified |
| Campsite supply limit | Energy plan warning/check |
| Fridge runtime data or presets | Optional appliance presets within the shared tool |
| Educational explanations | Contextual help and transparent limitations |

## Consolidation principles

1. Build a new, modular calculation engine. Do not copy or merge existing application files.
2. Use one data model for appliance loads in both modes.
3. Reuse concepts only when their assumptions can be made consistent.
4. Keep specialist fridge content as a preset or guided input, rather than a separate application.
5. Retain existing repositories unchanged until the new tool is validated against agreed test scenarios.

## Decisions required before implementation

- Exact battery usable-capacity defaults and whether users may change them.
- Solar-input model and its minimum data requirements.
- Appliance preset source, ownership, and update process.
- First-release target audience, internal, dealer, or public.
- Test scenarios that define a trustworthy result.
