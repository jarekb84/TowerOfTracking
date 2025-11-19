---
description: Generate user-focused PRD from feature ideas or voice transcripts
---

You are being invoked via the `/prd` slash command to generate a Product Requirement Document.

**Expected usage**:
- User pastes voice transcript or describes feature ideas in chat
- User types `/prd` (no arguments needed)
- Command processes the conversation context

## Instructions

1. **Analyze conversation context** for feature requirements:
   - Look for voice transcripts (raw, unstructured text)
   - Look for feature descriptions or user problems
   - Extract core user pain points and desired outcomes

2. **Invoke the `prd-generator` agent** to create the PRD:
   - Agent will analyze input and consult architecture-review
   - Agent will generate 2-3 page user-focused PRD
   - Agent will avoid code snippets, business metrics, and technical depth

3. **Save the generated PRD**:
   - Use the Write tool to save PRD to `docs/` directory
   - Filename format: `PRD-feature-name.md` (kebab-case)
   - Confirm to user: "PRD saved to docs/PRD-feature-name.md"

4. **Display summary** to user:
   - Core problem being solved
   - Primary user benefit
   - Next steps (e.g., "Ready to implement? Let me know!")

## Example Invocations

```
User: [Pastes 500-word voice transcript about feature ideas]
User: /prd