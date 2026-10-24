# ArcTalent introduction page implementation plan

**Goal:** Open ArcTalent with a clear, calm introduction, then let visitors enter personal career planning or the SME workspace deliberately.

**Design:** Keep the existing obsidian, cyan and indigo brand and geometric typography. The page is a career route guide: a single filled hero sheet with a short welcome, two entry links and a static, labelled branching-path illustration. It explains shared foundations visually without charts, counters or a dashboard preview. Three short steps explain profile → scenarios → real courses. A separate team invitation links directly to SME planning. Copy identifies the prototype and illustrative nature of the route; no invented outcomes, customers or statistics.

**Direction:** design-taste-frontend draw `page-is-the-object`, seed 416287438, with palette/type kept. ArcTalent's arc between existing skills and alternative careers becomes the route-guide sheet. Drawn route artwork replaces nonexistent photography; no animation or external asset is needed. Existing explicit indigo brand takes precedence over the skill's generic colour prohibitions.

**Architecture:** `/` becomes the translated introduction. `/workspace` renders the existing application unchanged; `/workspace/team` sets its initial view to the team tab. Add a separate Back to introduction link without changing the existing application navigation handlers. Root providers preserve language/display settings, and existing app storage keys preserve profiles, goals and team state. Workspace links disable speculative prefetch to keep the introductory page light.

- [x] Add a failing production integration assertion that the root page introduces ArcTalent and links to both workspaces without dashboard content.
- [x] Implement the introduction, responsive CSS, all three languages and workspace routes; preserve existing app handlers and state.
- [x] Verify production pages, all unit/type/format/integration checks, browser entry/home links, locale changes, saved state and responsive overflow. Inspect screenshots.
- [ ] Include with the typed workforce destination release; publish and verify both public journeys.

Review focus: every entry link reaches the intended workspace, home never resets saved data, translated headline/controls fit, keyboard navigation and reduced motion remain usable, and the intro does not import/render dashboard charts or call the model.

Local ledger: 144 unit tests, type/format/build and 25 production integration checks passed. Actual Chrome checks covered both entry links, home links, persisted worker goals, English/Malay/Chinese, 320/375/440px phones, tablet and desktop. A 440px label-spacing suspicion was resolved and checked with real element bounds. The 768px headline wrapped to three lines; a stacked hero at the tablet breakpoint keeps the welcome readable. Temporary viewport overrides are reset. A read-only review found no further confirmed issues. Final public verification is pending below.
