# Product

## Register

product

## Platform

web

## Users

Knowledge-operations staff at a bank, working long desk sessions on large monitors under office daylight. Three roles share the same surface: project owners (configure projects, manage topics, generate and stage intents), contributors (restricted by mirrored SharePoint access — view and generate only against documents they can reach), and checkers (approve or reject staged submissions under maker–checker segregation). They live inside one project at a time and hop between topics constantly.

## Product Purpose

The Intent Generation backoffice turns a project's SharePoint working folder into an approved chatbot knowledge base. Owners point a project at a SharePoint root, promote its subfolders to topics, sync document and URL sources, run GenAI (single or batch) or manual intent-response generation, review and stage the results, and pass them through checker approval into the production intent library. Success: a maker can go from "new documents landed in SharePoint" to "approved intents live" without leaving the app or losing track of governance state.

## Positioning

From SharePoint folder to approved chatbot answer in one governed flow.

## Brand Personality

Precise, calm, quietly confident. An instrument, not a dashboard: the craft shows in typography, alignment, and state clarity rather than decoration. Wow through finish — the one earned moment of theatre is the generation run itself.

## Anti-references

- The OCBC corporate-red enterprise default this prototype deliberately breaks from (client asked for creative exploration beyond the bank's design language).
- Generic AI-SaaS grammar: cream backgrounds, gradient text, identical icon-card grids, hero metrics.
- Bootstrap-admin / AdminLTE density-without-hierarchy.

## Design Principles

1. **The task swallows the chrome.** Earned familiarity: standard affordances, dense tables, no invented controls. A Linear/Stripe-fluent user should trust every component at first sight.
2. **Governance is visible, never noisy.** Draft → staged → pending approval → live/deleted is a single legible state vocabulary repeated identically on every screen.
3. **Context is always legible.** Project is global and unmistakable; topic scope is declared at the top of every scoped view. A user must never wonder which project or topic an action will hit.
4. **One signature moment per journey.** The generation run (launch → live progress → completion summary) is the product's theatre; everything else stays quiet so it can land.
5. **Density with dignity.** Hundreds of intents, dozens of sources: tables run dense, but rhythm, tabular numerals, and generous section spacing keep them readable.

## Accessibility & Inclusion

WCAG 2.1 AA. Body text ≥4.5:1; all interactive states keyboard-reachable with visible focus; every animation has a `prefers-reduced-motion` fallback; status never conveyed by color alone (always paired with label or icon).
