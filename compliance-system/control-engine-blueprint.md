# Control Engine Prototype Blueprint

**Target control:** BA-05 — OFAC Screening & Holds  
**Why this one:** Exercises all three verdicts (allow, block, review), requires a plugin call, triggers the Graph A/B split for human review, needs an SLA timer, and is a compliance floor control. If BA-05 works, the abstraction is validated.

---

## What Exists Today

### Control Builder UI (Next.js, deployed on Vercel)
- [x] `ControlBuilderApp.jsx` — main app shell with control list, grouped by source file
- [x] `ControlEditor.jsx` — edit/JSON/YAML tabs, validation, vocabulary-aware dropdowns
- [x] `RequestModal.jsx` — vocabulary request workflow (event or field)
- [x] UI components: `Badge`, `Section`, `Dropdown` (with grouped search + "Request new...")
- [x] Import/export: JSON import, vocabulary YAML manifest export
- [x] 223 controls loaded from `/controls.json` at runtime

### Vocabulary System
- [x] `vocabulary-adapter.js` — transforms parser output (arrays) → UI shape (keyed objects by category)
- [x] `vocabulary.js` — async loader with `EMPTY_VOCABULARY` fallback
- [x] `static-vocabulary.js` — non-spec-derived data (SLA patterns, regulations, roles, audit suffixes)
- [x] `vocabulary-export.js` — normalizes event/field IDs from control text, builds reverse indexes (controls↔events, controls↔fields), generates YAML manifest

### Fair Lending OpenAPI Spec (`fair-lending-openapi.yaml`)
- [x] 2400+ line spec covering FL-01 through FL-14
- [x] `x-events` on schemas (domain events with trigger conditions)
- [x] `x-computed` fields (plugin-sourced and derived)
- [x] `x-pii`, `x-retention`, `x-freshness`, `x-control-refs` extensions
- [x] `x-state-machine` on status enums with transition events
- [x] `x-audit-events` on path operations
- [x] Entities: LendingProduct, Application, CreditReport, ATRChecklist, Valuation, Decision, AdverseAction, Exception, CreditPackage, RateSheet, Prequal, FLRiskAssessment, LendingPolicy

### What's NOT Built Yet
- [ ] Vocabulary parser (extracts vocabulary.json from the OpenAPI spec)
- [ ] BSA/AML OpenAPI spec surface (BA-05 needs Member, Payment, OFAC schemas)
- [ ] The compiler
- [ ] The engine
- [ ] Compiled graph schema
- [ ] Any runtime execution or audit logging

---

## Phase 1: The Control YAML

BA-05 already exists in `controls.json` but in the legal-authored format (triggers, inputs, outputs as strings). The compiler needs a formalized YAML with typed conditions and verdicts.

- [ ] Write BA-05 control YAML in compiler-ready format
  - [ ] Define trigger: `payment.pre.screen`
  - [ ] Define inputs: `party.name`, `party.dob`, `party.country`
  - [ ] Define conditions against `ofac_screening_result.match_score`
    - [ ] `> 0.95` → block
    - [ ] `< 0.5` → allow
  - [ ] Define `default_verdict: review`
  - [ ] Define review block: `on_approve: commit_inflight`, `on_reject: void_inflight`
  - [ ] Define outputs: `ofac.blocked`, `ofac.report.filed`
  - [ ] Define SLA: `report_filing: 24h`
- [ ] Define the compiler-ready YAML schema (Zod)
  - [ ] This is distinct from the `controls.json` schema used by the Control Builder UI
  - [ ] Must include typed `conditions` array, `default_verdict`, `review` block
  - [ ] The Control Builder UI will eventually author this format; for now, hand-write it
- [ ] Validate YAML parses against the schema

## Phase 2: The Minimal OpenAPI Spec Surface for BA-05

The Fair Lending spec exists and demonstrates all the `x-` extension patterns. BA-05 needs a small BSA/AML spec addition using the same conventions.

- [ ] Create `bsa-aml-openapi.yaml` (minimal, only what BA-05 needs)
  - [ ] Reuse the same `x-` extension conventions from `fair-lending-openapi.yaml`
  - [ ] `Member` schema with `name`, `dob`, `country` fields + `x-pii` extensions
  - [ ] `Payment` schema with `member_id` reference (resolution path for input resolution)
  - [ ] `payment.pre.screen` event definition in `x-events`
  - [ ] `ofac_screening_result` as an `x-computed` field with `source: plugin:ofac_screener`
  - [ ] `case.resolved` event definition (for Graph B trigger)
  - [ ] State machine on Payment status with `x-state-machine` transitions
- [ ] Confirm the spec contains enough for the compiler to resolve all BA-05 inputs
- [ ] Verify `x-` extension shapes are consistent with Fair Lending spec

## Phase 3: The Vocabulary Parser

The bridge between the spec and the compiler. The UI adapter (`vocabulary-adapter.js`) already handles the output shape. The parser itself is not built.

- [ ] Build the parser (`vocabulary-parser/` project)
  - [ ] `ref-resolver.ts` — resolve `$ref` pointers, flatten `allOf`
  - [ ] `extractors.ts` — extract entities, fields, events, computed fields, plugins from spec
    - [ ] Walk `components/schemas` for entity extraction (keyed on `x-entity`)
    - [ ] Flatten properties to dot-notation paths (e.g., `application.insider_flag`)
    - [ ] Extract `x-events` from schemas and `x-audit-events` from paths
    - [ ] Extract `x-computed` and `x-plugin` fields
    - [ ] Carry `x-pii`, `x-retention`, `x-freshness`, `x-control-refs` metadata
  - [ ] `parser.ts` — orchestrator that runs extraction phases in order
  - [ ] `ui-translator.ts` — converts parser arrays → UI keyed format
    - [ ] This replaces the manual step currently handled by `vocabulary-adapter.js`
  - [ ] `cli.ts` — CLI entry point, reads spec YAML, writes `vocabulary.json`
- [ ] Run parser against `fair-lending-openapi.yaml` to validate
  - [ ] Output should produce vocabulary the existing Control Builder UI can load
  - [ ] Verify field count, event count, entity count match spec
- [ ] Run parser against `bsa-aml-openapi.yaml` for BA-05 vocabulary
- [ ] Integration: wire parser output into existing `loadVocabulary()` path

## Phase 4: The Compiler

- [ ] Input resolution
  - [ ] Parse BA-05 YAML and extract input references
  - [ ] Load vocabulary from parser output (not raw spec — parser is the interface)
  - [ ] Resolve `party.name` → `Member.name` via `Payment.member_id` using spec relationships
  - [ ] Resolve `party.dob` → `Member.dob` via same path
  - [ ] Resolve `party.country` → `Member.country` via same path
  - [ ] Generate fetch nodes for each resolution hop
  - [ ] Detect `ofac_screening_result` as plugin-sourced (`x-computed.source: plugin:ofac_screener`), generate plugin call node
- [ ] Condition compilation
  - [ ] Convert `match_score > 0.95 → block` into condition node + action node + edges
  - [ ] Convert `match_score < 0.5 → allow` into condition node + action node + edges
  - [ ] Convert `default_verdict: review` into explicit negation condition node
    - [ ] Expression: `NOT(score > 0.95) AND NOT(score < 0.5)` → review action node
    - [ ] `default_verdict` is compiler sugar — engine never sees the word "default"
- [ ] Review split
  - [ ] Detect `review` verdict with `on_approve`/`on_reject`
  - [ ] Produce Graph A (evaluation: trigger → fetches → plugin → conditions → verdict)
  - [ ] Produce Graph B (resolution: trigger `case.resolved` where `control_id == "BA-05"`)
    - [ ] `decision == "approve"` → `commit_inflight` action node
    - [ ] `decision == "reject"` → `void_inflight` action node
  - [ ] Link Graph A and Graph B via `control_id` in metadata
- [ ] Completeness check
  - [ ] Verify all condition paths lead to a verdict
  - [ ] Verify review block has both `on_approve` and `on_reject`
  - [ ] Verify all inputs resolve against vocabulary
- [ ] Output: compiled graph JSON
  - [ ] Define the graph schema (nodes, edges, metadata, version manifest)
  - [ ] Serialize Graph A and Graph B as single bulk insert (Ramp lesson)
  - [ ] Include version manifest (control version, spec version, plugin version)

## Phase 5: The Engine

- [ ] Graph loader
  - [ ] Load compiled graph(s) from file (Supabase later)
  - [ ] Build trigger index: `payment.pre.screen` → [Graph A], `case.resolved` → [Graph B]
- [ ] Built-in action primitives (only what BA-05 needs)
  - [ ] `fetch` — retrieve entity data (mock Supabase call for prototype)
  - [ ] `call_plugin` — invoke OFAC screener (mock plugin for prototype)
  - [ ] `evaluate_condition` — compare field against value with operator
  - [ ] `return_verdict` — return allow / block / review
  - [ ] `emit_audit_event` — write structured log entry
  - [ ] `create_case` — create review case record (mock for prototype)
  - [ ] `commit_inflight` — commit Blnk inflight transaction (mock)
  - [ ] `void_inflight` — void Blnk inflight transaction (mock)
- [ ] Graph traversal
  - [ ] Topological sort of nodes
  - [ ] Execute each node on the frontier
  - [ ] Maintain execution context (state bag) for passing data between nodes
  - [ ] Follow true/false edges from condition nodes
  - [ ] Stop at verdict node, return result
- [ ] Audit logging
  - [ ] Log every node execution: node ID, type, input values, output values, timestamp
  - [ ] Log final verdict with all contributing condition evaluations

## Phase 6: Wire It Up End-to-End

- [ ] Simulate the happy path (allow)
  - [ ] Create mock event: `payment.pre.screen` with a clean member
  - [ ] Engine receives event, looks up trigger index, finds Graph A
  - [ ] Traverses: fetch member → call OFAC plugin (score 0.2) → condition `< 0.5` true → allow
  - [ ] Verify audit log shows fetch, plugin call, condition evaluation, verdict
- [ ] Simulate the block path
  - [ ] Mock event with a sanctioned member (OFAC score 0.98)
  - [ ] Traverses: fetch → plugin → condition `> 0.95` true → block
  - [ ] Verify `ofac.blocked` audit event emitted
- [ ] Simulate the review path (Graph A → case → Graph B)
  - [ ] Mock event with ambiguous member (OFAC score 0.7)
  - [ ] Graph A: fetch → plugin → no condition matches → negation condition true → review
  - [ ] Verify case record created with `control_id: BA-05`, `transaction_id`
  - [ ] Simulate `case.resolved` event with `decision: approve`
  - [ ] Graph B: condition `decision == approve` → `commit_inflight`
  - [ ] Verify audit trail links Graph A and Graph B executions via case record
- [ ] Simulate the review-reject path
  - [ ] Same as above but `decision: reject` → `void_inflight`

## Phase 7: Validate the Abstraction

- [ ] Confirm the engine has zero domain knowledge
  - [ ] Engine code contains no reference to "OFAC", "sanctions", "compliance", etc.
  - [ ] All domain concepts live in the compiled graph, not the engine
- [ ] Confirm the compiler is the only layer that reads control YAML + spec
  - [ ] Engine only reads compiled graphs
- [ ] Confirm `default_verdict` does not appear in the compiled graph
  - [ ] It was expanded into a negation condition node by the compiler
- [ ] Confirm Graph A and Graph B are fully independent
  - [ ] Engine doesn't know they're related — linkage is in the case record
- [ ] Test with a Fair Lending control (FL-07 or FL-08) using the existing spec
  - [ ] Does the engine need new primitives?
  - [ ] Does the compiler need new capabilities?
  - [ ] Does the graph schema need changes?
  - [ ] Does the vocabulary parser handle FL spec correctly?
- [ ] Write down what's missing for the full 223-control rollout