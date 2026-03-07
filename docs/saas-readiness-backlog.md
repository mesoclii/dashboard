# SaaS Readiness Backlog

This file tracks the next backend/platform phase after the current dashboard OAuth and premium-catalog pass.

## Next Platform Work

- Safe internal `negan` -> `possum` rename with Prisma `@@map` compatibility so no stored data is lost.
- Cleanup or formal wiring for dormant `ai-core/*` and `ai-characters/*` modules.
- Deeper adaptive-AI operator pages so the handmade learning system has the same level of dashboard depth as persona/OpenAI controls.
- Cluster-safe guild cache shared across bot processes.
- Redis event bus between bot and dashboard for cache invalidation, live runtime updates, and cross-process actions.
- Audit log system for server admins covering dashboard changes, feature toggles, panel deploys, and sensitive runtime actions.

## Current Assumptions

- Saviors remains the untouched full baseline guild.
- Alexandria remains the public baseline guild.
- OAuth/session guild discovery is handled in the dashboard, while bot invite/install state still comes from the live bot runtime.
