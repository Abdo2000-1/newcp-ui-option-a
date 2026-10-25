# New CP OpenAPI Contract Reference

## Purpose

This directory contains the repository-local reference for the supplied New CP service-instance API contract. It is the starting point for AI-assisted API analysis, typed client work, mock adapters, contract tests, and future live integration planning.

These files do not prove that a backend is deployed, that V204 is applied, that tenant permissions work, or that F07 is live.

## Source files

- `newcp.openapi.yaml`: primary machine-readable OpenAPI 3.0.3 source.
- `newcp.openapi.pdf`: human-readable rendered review copy of the same contract.
- Original source location: `H:\3DDX\02 Backend\`.

The contract status is:

`APPROVED_QB8_QB15_IMPLEMENTATION_TARGET; F07_AND_LIVE_API_UNVERIFIED; NOT_FINAL`

## AI reading rules

1. Read `AGENTS.md` or `CLAUDE.md` before using this contract.
2. Treat the YAML as the primary machine-readable source and the PDF as a review copy.
3. Preserve `MOCK`, `INTEGRATED`, `BLOCKED`, and `NOT VERIFIED` labels accurately.
4. Never invent endpoints, fields, payloads, response shapes, roles, tenant behavior, retry policy, callbacks, credentials, or production URLs.
5. The localhost server URL is an example only.
6. Passing mock tests is not evidence of live integration.
7. Do not edit the contract snapshot without recording its version, hash, source, and compatibility impact.

## Current boundary

The React Option A repository currently supports offline mock behavior for bounded service-instance scenarios. Live API calls, database access, migrations, ETL, F07 Bill To persistence, and production configuration remain separately gated.
