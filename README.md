## Roadmap
[ ] Vocabulary parser that pulls the vocabulary from the openAPI spec, we care about the endpoints, the schemas, and the parameters
[ ] Automate generation of specification from the actual API, 
[ ] Schema binding: How do controls stay coupled to your OpenAPI spec so changes propagate?
[ ] Wrapper to enforce annotations
[ ] The parser walks the generated OpenAPI spec and flattens everything into a vocabulary that the Control Manager understands: endpoints, fields (with their types and paths), events, computed fields, and enums. It follows $ref pointers to resolve nested schemas, outputs dot-notation paths like wire_transfer.originator.address.city, and tags each field with metadata (type, required, enum values) so the Control Manager can offer appropriate operators and validate control logic.

You're saying the OpenAPI spec should contain:

Endpoints (standard)
Request/response schemas (standard)
Events (non-standard, needs extension)
Computed/derived fields (non-standard, needs extension)
This pushes you toward OpenAPI as the single source of truth for everything the control system can reference. That's a strong position — it means one artifact to maintain, one place lawyers look, one thing to diff.

But it also means your spec is no longer "just" an API description. It's a control vocabulary specification that happens to also describe HTTP endpoints.

Prototype checklist:
[x] Hosted on vercel
[ ] Show control creation, changing an existing control and creating a new one from scratch
[ ] Flesh out the life cycle of approval and deployment of changes to controls
[ ] Hook up control builder to gitbook so that when a control is changed it publishes to gitbook (after approval)
[ ] Automatically run parsing on each commit (Github action)
[ ] Show a change in API spec leads to diff in vocabulary and flags affected controls
[ ] Show automatic dashboard that is created for each policy (combination of controls)
[ ] Show audit trail of the events
