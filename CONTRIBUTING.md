# Contributing

We are building **one application with five areas of responsibility**, not five separate projects.

## Golden rules

1. **Branch per person / feature.** Never commit directly to `main`. `main` must always build.
2. **Pull requests only.** No one overwrites another person''s work. Every PR needs one review.
3. **Test before you hand over.** A component is not "done" until it is tested and documented.
4. **Never commit secrets.** `.env`, private keys, API keys stay out of git. Use `.env.example`.
5. **The chain is the source of truth.** FE/BE verify on-chain results; they never fabricate them.
6. **Freeze the interface early.** The contract ABI, API shapes, and events are the integration
   contract (see `docs/02-integration-contract.md`). Changing them is a team decision.

## Branch naming

```
bc/<feature>   be/<feature>   fe/<feature>   qa/<feature>   docs/<topic>
```

## Commit messages

`type: short description` — types: feat, fix, test, docs, chore, refactor.

## Pull request flow

1. Branch from `main`, do the work, keep commits focused.
2. Push and open a PR using the template. Link the issue it closes.
3. Request a review. Address comments. Squash-merge once approved and green.

## Local checks before opening a PR

- Contracts: `cd contracts && forge build && forge test -vv`
- App: `cd app && npm run build`
