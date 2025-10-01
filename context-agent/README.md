# Context Navigator Agent

- Config: `context-agent/agent-config.json`
- Memory store: `context-agent/memory.json`
- CLI helper: `node context-agent/contextAgent.mjs`

## Usage

```bash
# Show a quick summary
node context-agent/contextAgent.mjs summary

# Add a new decision
node context-agent/contextAgent.mjs add decision "Adopt dark theme" "Switched all screens to #1E1E1E background"

# Track a new goal
node context-agent/contextAgent.mjs add goal "Finalize results UX" "Converge on the animation and score presentation"
```

The doc generator also snapshots the agent memory into `docs/context-agent.md` each time it runs.
