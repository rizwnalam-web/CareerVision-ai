Recurring Patterns Observed
•	Disabled or non-functional AI search/discovery controls appear in at least four modules: Academy ("External Search" / "AI Search"), Global Hub Navigator ("AI Global Search"), Job Board ("AI Discover" / "AI Source from Saved"), and implicitly the Career Hub Heatmap ("AI Hub Search"). This strongly suggests a shared AI-search service or API key/integration that is not yet connected in this build.
•	Live-data widgets failing or stuck loading appear in at least three places: Sector Health Index and Talent Intelligence on Control, and the entire Career Hub Heatmap. A shared market-data feed appears to be the common point of failure.
•	The right-rail "Intelligence Feed" video and quote are identical across Control, Roadmap, Global, and Academy — this widget is not yet contextual/dynamic.
•	Onboarding appears incomplete: a user profile with 0% Skills/Education/Experience cascades into degraded experiences everywhere — empty trajectories beyond the first item, no personalization on the Job Board or Heatmap, and an empty Financial profile.
•	The financial-profile nudge ("Add monthly expenses to your financial profile to see breakdown") appears in the right rail of multiple unrelated modules (Roadmap, Global, Academy, Job Board, Heatmap), which may be intentional cross-promotion but currently feels like a repeated unaddressed prompt rather than a targeted nudge.
9.2 Top 5 Platform-Wide Priorities
1. Fix onboarding-to-profile pipeline.
Ensure the initial assessment/profile wizard actually populates Skills, Education, Experience, target role, location preferences, and currency — this single fix unblocks personalization across every other module.
2. Restore or stub live-data integrations gracefully.
Sector Health Index, Talent Intelligence, and the entire Heatmap module should never show indefinite loading or universal failure — implement honest empty/error states with retry, and cached fallbacks where possible.
3. Resolve the AI search/discovery feature gap.
Either ship a working AI-search experience across Academy, Global Hub, Job Board, and Heatmap, or temporarily hide/relabel these entry points as "Coming soon" to avoid the impression of a broken core feature.
4. Remove developer/debug surfaces from production.
The bottom status bar (IPEDS/O*NET sync status, build version, "multi-tenant secure cloud") should be removed from the end-user experience or relocated to an admin view.
5. Make the Intelligence Feed and financial nudges contextual.
Replace the static, repeated right-rail video/quote and financial-profile prompt with content relevant to the specific module and the user's actual profile state.
