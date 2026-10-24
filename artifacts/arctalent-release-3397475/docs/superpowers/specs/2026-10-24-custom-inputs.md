# ArcTalent custom inputs and CV import

The user reported an inactive CV importer and approved custom fictional profiles, typed check-in answers, editable SME employees and dated market assumptions, while retaining presets.

Keep the current Next.js/TypeScript application, three languages, Orion design, APIs and scoring model. Continue the existing GitHub/Replit release workflow. No new account, dependency or external AI service is needed.

- CV: the initial import action must explain and focus the synthetic-data confirmation instead of silently doing nothing. Confirmed PDF/TXT selection must work, including selecting the same file again. Validate type, non-empty content and the 5 MiB limit, show the selected filename/status, retain stale-request protection, and expose errors beside the importer. Retain the existing server confirmation and PDF protections.
- Individual: add a blank-profile action, editable identity, constraints, interests and all catalogue skill levels. Preserve presets. Save valid profiles through the existing pathway callback; show validation near Save.
- Check-in: let users type their work goal and preferred practice, choose the explicit matching category, and enter an integer session length from 5 to 180 minutes. Keep preset answers and the review/apply flow. Notes persist and appear in the learning rhythm; never infer aptitude from text.
- SME: add/edit/remove fictional members with the same profile fields, up to ten members. Store the roster with existing workforce settings, preserve old saves, reject duplicate IDs/unknown destinations and calculate every team count/export from the actual roster. Editing the active worker synchronizes the individual profile. An empty roster is valid and explains how to add a person.
- Evidence: an editable label/date/note and demand values from 0 to 100 for each catalogue skill produce a validated simulation snapshot. Clearly identify user-entered assumptions; never label them verified or scraped evidence. Apply through the existing snapshot callback so both individual/team views recalculate and changes remain explainable.

Verify real file selection, validation, custom data persistence, reset, both scenarios, three languages, keyboard focus and mobile layout. Publish only the tested source and check the public release.
