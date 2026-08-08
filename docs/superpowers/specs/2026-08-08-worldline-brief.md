# WORLDLINE — Master Brief (verbatim, as provided by Aryan, 2026-08-08)

> Source of truth for the V2 redesign. The design spec and implementation plan derive from this.
> Concept: Tenet + Interstellar. Not Matrix. Not neon. Warm instrumentation emerging from darkness.

---

WORLDLINE — Immersive Spatial Portfolio Redesign

Master Product, UX, Visual Design & Implementation Discovery Prompt

You are an expert creative technologist, product designer, interaction designer, 3D web experience designer, UX architect, and senior full-stack engineer. You are working on my personal developer portfolio, currently an Angular-based frontend consuming content from a separate CMS/backend. Your task is to redesign and evolve the portfolio into a deeply immersive, cinematic, spatial experience inspired by the conceptual qualities of Interstellar and Tenet, while maintaining the primary purpose of the website: communicating who I am, what I build, how I think, and why my engineering work is valuable.

This is not a request to blindly implement a particular library or technical approach. Before implementation, inspect the existing project, understand its architecture and constraints, research/discover the best current libraries and techniques for the required experience, compare viable approaches, and then choose the most appropriate stack for each capability. Do not assume that a particular 3D, animation, physics, graphics, interaction, or UI library is the correct answer. The result should feel like a real digital product, not a concept-art recreation.

## 1. CORE CONCEPT

The portfolio is called: **WORLDLINE**. The central metaphor: a portfolio experienced as a spacecraft / command deck moving through a person's professional worldline. The visitor is the **Observer**. Career, projects, experiments, writing, skills, and future direction form a **Worldline**. The website is the vessel through which the observer explores that worldline.

Interstellar-inspired qualities: cosmic scale, silence, isolation, awe, gravitational phenomena, deep space, enormous negative space, warm light against darkness, scientific instrumentation, human curiosity, exploration, temporal scale.

Tenet-inspired qualities: temporal inversion, forward/reverse motion, causality, symmetry, entropy, information moving through time, reversible transitions, objects behaving differently depending on temporal direction, subtle temporal anomalies.

Do not copy characters, logos, scenes, interfaces, terminology, music, or copyrighted visual assets from either film. Use them only as conceptual and atmospheric references. The resulting identity must be original.

## 2. DESIGN THESIS

Code is what I build. Time is the medium through which I built it. The portfolio is the worldline.

Should NOT feel like: a conventional developer portfolio, a SaaS dashboard, a generic futuristic website, a Star Wars-style control panel, a spaceship simulator, cards floating over a space background, excessive glassmorphism, an AI-generated "futuristic" landing page.

Should feel like: a believable spacecraft command environment that happens to contain a developer portfolio. The environment is the metaphor. The content remains the product.

## 3. PRIMARY EXPERIENCE

BLACK → environment emerges → systems initialize → ship interior becomes visible → viewport reveals deep space → observer identified → WORLDLINE // CONTROL DECK → portfolio becomes interactive.

Opening: deliberate, quiet, mysterious, premium, cinematic, technically sophisticated. Avoid excessive splash screens. Reach useful content quickly.

## 4. THE SPACESHIP DECK

Central command position, panoramic viewport, deep space outside, subtle celestial bodies, spacecraft geometry, consoles, navigation instrumentation, mission displays, communication systems, timeline/orbital elements, ambient illumination, physical depth, reflections where performance allows. The ship should feel functional, not decorative. Every visible element should have a reason to exist. No fake telemetry.

## 5. NAVIGATION MODEL

**Horizontal movement = movement through the spacecraft. Vertical movement = exploration within a section.** Core design decision.

`← ABOUT ← HOME → WORK → JOURNAL → CONTACT →`

Horizontal swipe/drag moves between major environments; the transition feels like the camera physically moving through the spacecraft, not a webpage sliding. CURRENT STATION → camera movement → environment transition → arrival → new station active → content interaction.

## 6. PRIMARY DECK STATIONS

- 01 — HOME · Command Deck: identity, first impression, orientation, overview, introduction to the worldline.
- 02 — WORK · Mission Control: projects, professional work, engineering accomplishments, technical depth, case studies.
- 03 — JOURNAL · Transmission Archive: blogs, technical writing, thoughts, experiments, observations.
- 04 — ABOUT · Observer Station: biography, career, experience, skills, worldline timeline, philosophy.
- 05 — CONTACT · Communications: contact form, social links, professional communication.
- (06 — SYSTEMS / EXPERIMENTS: only if actual content justifies it.)

## 7. HOME / COMMAND DECK

WORLDLINE // CONTROL DECK · OBSERVER · ARYAN MISHRA · SOFTWARE ENGINEER · "I build systems that solve real problems and create meaningful experiences." · [ EXPLORE WORLDLINE ]. Subtle: system state, worldline position, mission count, latest project, professional state, navigation indicator. Do not overload the hero. Visitor immediately understands: who, what, what the site represents, where to explore next.

## 8. PROJECTS AS MISSIONS

Projects as Missions/Events within the worldline (MISSION 042 · JOB HUNT · objective/status/technology · [ OBSERVE MISSION ]). Use terminology sparingly; content stays understandable; not every label becomes sci-fi jargon.

## 9. PROJECT CONSTELLATION

Projects as points/nodes in a spatial system, positioned by meaningful dimensions (chronology, category, technology relationships, importance, evolution, complexity). Inspect, approach/select, see metadata, enter case study, return. Communicates relationships, not just spectacle.

## 10. PROJECT DETAIL EXPERIENCE

Transition feels like approaching a mission object. Reveals: objective, problem, context, role, architecture, technologies, decisions, challenges, results, lessons, links. No shallow descriptions. Prioritize engineering evidence.

## 11. BLACK BOX MODE

Optional deeper layer per project: BLACK BOX — PROBLEM / DECISION / TRADE-OFF / IMPLEMENTATION / RESULT / LESSON. Difficult decisions, failed approaches, trade-offs, architecture choices, performance problems, constraints, lessons. Demonstrates engineering maturity.

## 12. EXPERIENCE / SYSTEM VIEW

Two modes where valuable: [ EXPERIENCE ] polished human case study · [ SYSTEM ] technical representation (architecture, components, data flow, integrations, infrastructure). No diagrams for decoration.

## 13. WORLDLINE TIMELINE

Visually significant career timeline (2019 ─ 2021 ─ 2024 ─ ● NOW ─ 2027 ─ 2030): education, early experience, milestones, major projects, current position, future direction. Interactive: hover preview, select focus, expand detail, return. Communicates progression, not merely dates.

## 14. JOURNAL AS TRANSMISSIONS

Blog = TRANSMISSION ARCHIVE. Posts as transmissions (TRANSMISSION_018 · SOURCE · SIGNAL · TITLE · DATE · [ DECODE ]). Subtle signal/decode open transition. Reading experience: typography, readability, accessibility, comfortable width; the environment becomes quieter during reading.

## 15. TEMPORAL INVERSION

Global state TEMPORAL FLOW → FORWARD / ← INVERTED. When inverted: certain transitions reverse, particles reverse, camera paths retrace, environmental effects reverse, selected UI transitions play backward, timeline can reverse. Never reverses content reading order; never required for navigation; atmospheric layer.

## 16. TEMPORAL ECHO

On major section transitions, previous environment briefly remains as a faint echo. "The past doesn't disappear. It remains observable." Very subtle.

## 17. GRAVITATIONAL INTERACTION

Pointer as subtle gravitational influence: particles bend slightly, elements shift microscopically, orbital objects react, thin lines distort. Discovered, not announced.

## 18. 3D INTERACTIVE OBJECTS

Meaningful 3D objects: mission console, navigation console, comms terminal, data recorder, star map, project nodes, orbital visualization, observation window, spacecraft models, planets/moons, abstract engineering objects. Diegetic navigation with conventional fallback always available.

## 19. FREE LOOK

Optional mode to look around the bridge, inspect environment, discover objects, view exterior. Never required for core content.

## 20. TECHNOLOGY CONSTELLATION

Interactive technology ecosystem if content supports it; relationships reflect real technical relationships; selecting reveals context, related tech, projects used in, experience, articles. No fabricated proficiency metrics.

## 21. COMMUNICATIONS / CONTACT

COMMUNICATION LINK · CHANNEL OPEN · RECIPIENT ARYAN · MESSAGE · [ TRANSMIT ]. Form remains obvious and usable; restrained transmission confirmation; no puzzles.

## 22. EASTER EGGS

Small number: hidden black-hole interaction, keyboard sequence, temporal anomaly, hidden insignia, secret transmission, alternate visualization, temporary UI inversion, hidden metadata, dev mode. Limited; reward curiosity without obstructing.

## 23. VISUAL LANGUAGE

Mood: dark, cinematic, mysterious, sophisticated, technical, atmospheric, premium, restrained. Typography: existing system where appropriate; technical monospace + clean modern UI + occasional expressive/editorial. No decorative overuse.

## 24. COLOR DIRECTION

Environment: near-black, charcoal, deep space tones. Interface: muted whites, cool greys. Accent: restrained warm amber/gold. Optional secondary signal colors for actual system states. Avoid neon blue + purple sci-fi. "Warm instrumentation emerging from darkness", not gaming RGB.

## 25. MATERIAL AND LIGHTING

Metallic, engineered, slightly worn, believable, premium. Subtle reflections, realistic falloff, ambient illumination, emissive displays, atmospheric depth. No excessive chrome.

## 26. ANIMATION PRINCIPLES

Motion with causality (accelerate, decelerate, orbit, emerge, collapse, reverse, settle). Physical continuity. Temporal direction. Restraint — use stillness as aggressively as motion. stillness → movement → stillness is critical.

## 27. INTERACTION HIERARCHY

Primary: navigation, projects, journal, about, contact. Secondary: constellation, timeline, technology graph, system views. Tertiary: free look, temporal inversion, gravitational interactions, Easter eggs, environmental discovery. A visitor who never touches secondary/tertiary still gets an excellent portfolio.

## 28. RESPONSIVE

High-end desktop: full immersion. Standard desktop: reduced complexity. Tablet: simplified spatial navigation. Mobile: touch-first; horizontal swipe remains meaningful; vertical explores; clear orientation (current section, available directions, worldline position).

## 29. ACCESSIBILITY

Keyboard, visible focus, semantic content, screen-reader structure, reduced motion, contrast, accessible forms, non-pointer navigation, fallback without 3D. Reduced motion simplifies camera, parallax, particles, inversion, transitions. Fully usable without 3D.

## 30. PERFORMANCE PHILOSOPHY

Impressive without irresponsible. Evaluate rendering, animation, asset loading, model/texture optimization, particles, post-processing, camera transitions, interaction detection, responsive rendering, lazy loading, caching, progressive enhancement. Choose by ecosystem maturity, Angular compatibility, bundle impact, rendering/mobile performance, accessibility, maintainability, browser support, DX, long-term health.

## 31. LIBRARY / TECHNOLOGY DISCOVERY

Technical discovery phase before implementation: 3D ecosystems, animation, gesture, physics (only if meaningful), model loading, post-processing (bloom/DoF/motion blur/volumetrics/chromatic — only if worthwhile), graph visualization, smooth scrolling, accessibility behavior, performance strategy, Angular integration (lifecycle, SSR implications, change detection, cleanup, routing, maintainability). Produce a technology decision record: CAPABILITY / OPTIONS / SELECTED / WHY / TRADE-OFFS / RISKS. Do not over-engineer; smallest reliable set.

## 32. EXISTING PROJECT DISCOVERY

Inspect thoroughly: package config, Angular version, standalone architecture, routing, layouts, components, design system, typography, theming, global styles, animation infrastructure, assets, environments, CMS integration, project/blog detail architecture, SEO, error handling, deployment, performance optimizations, testing. Plus README, instructions, conventions, decisions. Don't replace functioning architecture just to implement the visual redesign.

## 33. PRESERVE EXISTING ARCHITECTURE

Angular standalone + TypeScript + SCSS + separate CMS + client routing + lazy pages + shared components + core services + layout + Material/theming + CMS-driven content + markdown + SEO service + error handling + Vercel. Constraints unless discovery shows compelling reason. Evolution, not destructive rewrite.

## 34. EXISTING ATMOSPHERIC SYSTEM

A full-screen animated background/rain layer already exists. Don't automatically remove; evolve (temporal particles / exterior debris / atmospheric field). Evaluate existing app reveal as part of the cinematic boot. Preserve stacking model unless justified.

## 35. CMS CONTENT MODEL

Visual experience remains compatible with dynamic CMS content. No hardcoding to make the concept work. Immersive layer is a presentation/interaction system over the content model.

## 36. ROUTING MODEL

Major destinations = meaningful routes. Spatial navigation and conventional routing coexist. Normal navigation, deep links, refresh, back/forward, shareable URLs all work.

## 37. SEO

Meaningful titles, descriptions, canonicals, crawlable content, semantic headings, accessible text, metadata, social sharing. 3D never the only representation of important information.

## 38. ERROR / FALLBACK STATES

3D init failure → beautiful 2D deck. Slow assets → meaningful progressive loading. CMS down → existing error architecture, useful UX. WebGL unavailable → graceful. Reduced motion → static/low-motion deck. Never a broken tech experiment.

## 39. LOADING EXPERIENCE

WORLDLINE / INITIALIZING ENVIRONMENT / CORE SYSTEM…ONLINE / NAVIGATION…ONLINE / ARCHIVE…ONLINE / COMMUNICATION…ONLINE / OBSERVER DETECTED — but no artificial waiting; only stages corresponding to real initialization.

## 40. DESKTOP NAVIGATION

Horizontal gesture (primary), mouse drag, keyboard (←→ sections, ↑↓ exploration, ENTER activate, ESC back), plus conventional navigation always. Immersion never traps.

## 41. MOBILE NAVIGATION

Horizontal swipe between stations, vertical within; section indicator, progress, accessible controls, touch-friendly targets, orientation cues. No precision gestures.

## 42. CONTENT-FIRST RULE

Every decision: "Does this help the visitor understand Aryan better?" Hierarchy: PERSON → EXPERIENCE → ENGINEERING → PROJECTS → THINKING → EXPERIMENTATION → ATMOSPHERE. Never 3D-first.

## 43. DESIGN QUALITY BAR

Closer to cinematic interactive experience / premium product / experimental museum interface / spacecraft command environment than a normal personal site. Strong hierarchy, spatial continuity, restrained motion, deliberate typography, believable environment, excellent micro-interactions, high information quality, strong engineering storytelling. Avoid: generic gradients, rounded-card excess, glassmorphism excess, neon overload, fake statistics, excessive HUDs, excessive particles, constant motion, decorative text, confusing navigation, inaccessible interaction.

## 44. IMPLEMENTATION WORKFLOW

PHASE 0 repository discovery (architecture/route/component/design-system/asset/CMS/animation maps, risk areas) → PHASE 1 experience architecture (stations, spatial relationships, navigation/transition model, content & interaction hierarchy, mobile, a11y; experience map) → PHASE 2 visual system (color, type, materials, lighting, spacing, UI geometry, HUD rules, environmental rules, animation principles) → PHASE 3 technology discovery (evaluate alternatives, document) → PHASE 4 prototype (vertical slice: deck, one 3D environment, one station transition, one project, one vertical flow, responsive, reduced-motion) → PHASE 5 core systems (deck navigation, camera/environment transitions, stations, interaction states, project presentation, timeline, environmental state, responsive) → PHASE 6 content (CMS integration) → PHASE 7 advanced interactions (inversion, gravity, constellation, tech graph, free look, echoes, eggs) → PHASE 8 performance (profile, measure, optimize on evidence) → PHASE 9 accessibility → PHASE 10 polish.

## 45. ACCEPTANCE CRITERIA

Concept immediately readable · horizontal = sections · vertical = exploration · 3D enhances · content easy to access · engineering demonstrated · cinematic/restrained/original · physical intentional interactions · inversion subtle not gimmick · cosmic atmosphere · usable without 3D · production-fast · intentional responsive tiers · maintainable · SEO intact.

## 46. FINAL DESIGN PRINCIPLE

Prefer the implementation creating the strongest sense of physical presence with the least unnecessary complexity. Progression: CURIOSITY → IMMERSION → EXPLORATION → DISCOVERY → UNDERSTANDING → RESPECT FOR THE ENGINEERING. "What the hell is this?" → "This is a spaceship." → "I'm navigating his portfolio through it." → "Okay, this person actually knows what they're doing." The last transition is the success criterion.

## IMPORTANT IMPLEMENTATION INSTRUCTION

Do not begin by assuming a specific 3D engine, animation framework, physics library, gesture library, graphics solution, or component library. First: inspect repo → understand architecture → identify experience requirements → discover best-fit libraries → evaluate alternatives → document decisions → prototype highest-risk interaction → validate performance/usability → then implement. Minimum technologies; mature solutions; no rewrite of stable architecture for an experimental visual layer. One coherent product: **WORLDLINE // CONTROL DECK** — the visitor doesn't merely browse information. They navigate it.
