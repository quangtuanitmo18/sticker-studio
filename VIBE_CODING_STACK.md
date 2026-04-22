# AI Vibe Coding Stack

This document outlines the architecture and operational discipline of our AI-assisted development environment (Vibe Coding Stack).

## 1. Current Stack

- **Antigravity**: The main cockpit for interacting with agents, rules, skills, workflows, artifacts, and knowledge.
- **antigravity-kit**: A comprehensive base setup with ready-to-use agents, skills, and workflows for rapid deployment.
- **GitNexus (MCP)**: Understands the codebase via a knowledge graph, call chains, dependencies, impact analysis, and repo wiki.
- **Context7 (MCP)**: Fetches the correct and up-to-date documentation for frameworks and libraries.
- **Karpathy-style rules**: Enforces strict agent behavior (careful thinking, simplicity, surgical edits, goal-driven execution).
- **Project Rules**: Repository-specific rules and technical guidelines.
- **Knowledge Items**: Antigravity's long-term memory, functioning as app-level/global architectural memory.
- **Operational Discipline**: The strict enforcement of Definition of Done (DoD), MCP testing, and security boundaries.

---

## 2. Role of Each Layer

### Antigravity

Used for:

- Chatting with agents
- Executing workflows
- Viewing and managing artifacts
- Coordinating MCPs and tools

### antigravity-kit

Used for:

- Providing common, out-of-the-box workflows
- Skipping from-scratch configurations
- Accelerating onboarding and project scaffolding

### GitNexus (MCP)

Used for:

- Graph-based repository understanding
- Tracing call chains and dependency flows
- Performing impact analysis
- Repo wiki and overall codebase awareness

### Context7 (MCP)

Used for:

- Fetching the latest framework/library documentation
- Ensuring accurate versioning
- Reducing API hallucinations from outdated LLM training data

### Karpathy Rules

Used to enforce agents to:

- Think before coding
- Prioritize simplicity (_Simplicity First_)
- Make surgical changes
- Execute goal-driven loops

### Project Rules

Used for:

- Defining test/lint/build commands
- Package manager specifications
- Architectural boundaries
- Migration and deployment policies
- Specifying files that should remain untouched

### Knowledge Items

Used for:

- Documenting recurring lessons learned
- Project-specific patterns
- Working preferences
- Long-term architectural memory
  _(Note: This should not replace standard Project Rules.)_

### Operational Discipline

Used to ensure 100% reliable vibe coding:

- **Repository-Specific DoD**: Enforcing strict criteria (tests pass, lint/typecheck pass, build passes, no unrelated files modified, verify/rollback notes for risky changes) before declaring any task complete.
- **MCP Debugging Discipline**: Testing new MCPs via the Inspector or a debug flow first. Never trusting a tool blindly just because it says "connected successfully".
- **Security Boundaries**: Clearly defining permissions for MCPs and tools. Being highly cautious with browser access, secrets, database modifications, deployments, and filesystem operations.

---

## 3. What Goes Where?

### In Project Rules

- Test, lint, and build commands
- Migration and deployment policies
- Service and module boundaries
- Security constraints
- Repository-specific Definition of Done (DoD)

### In Skills / Workflows

- Debugging regressions
- Safe refactoring
- PR reviews
- Incident investigation
- Writing migrations
- Planning before coding

### In Knowledge Items

- _"This repo prioritizes small, incremental patches"_
- _"If auth fails, check env sync first"_
- _"Service A should not call Service B directly"_
- _"This specific type of bug is usually a race condition"_

### For Context7 (MCP)

- External documentation and third-party APIs outside the repository

### For GitNexus (MCP)

- Internal repository structure, graph, and codebase logic

---

## 4. Final Conclusion

The definitive stack is:
**`Antigravity` + `antigravity-kit` + `GitNexus MCP` + `Context7 MCP` + `Karpathy-style rules` + `Project Rules` + `Skills / Workflows` + `Knowledge Items` + `Operational Discipline`**

> This is a perfectly structured stack for serious engineering: it provides a powerful cockpit, graph logic, accurate docs, strict rules, actionable workflows, persistent memory, safe guardrails, and rigorous operational discipline.

---

## 5. Golden Operational Principle

> **"Fewer, properly layered tools are far better than a mess of overlapping ones."**
