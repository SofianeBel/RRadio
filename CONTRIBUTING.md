# Contributing to RRadio

Thank you for your interest in contributing to RRadio. This document outlines the process for building the project, submitting bug reports, and opening pull requests.

## Code of Conduct

All contributors and participants are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat others with respect.

## Legal and Intellectual Property Rules

Before contributing code, assets, or documentation, please review our [Legal Disclaimer](DISCLAIMER.md) and [License](LICENSE).

You must adhere to the following rules:

1. **Do not commit copyrighted audio files.** RRadio does not bundle audio. Tracks stream from remote preservation endpoints.
2. **Do not commit extracted game assets.** Do not commit files directly extracted from commercial game installations.
3. **Respect trademarks.** Do not add official Rockstar Games trademarks, logos, or "R*" branding into UI elements or icons.
4. **All contributions are licensed under GNU GPLv3.** By submitting a pull request, you agree that your contribution is licensed under the terms of the GNU General Public License version 3.

## Development Setup

RRadio is a desktop application built with Tauri v2 (Rust backend) and React 19 / TypeScript (frontend).

### Prerequisites

- Windows 10 (version 1903 or higher) or Windows 11
- [Rust](https://rustup.rs/) (stable toolchain with MSVC support)
- [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) (version 20 or higher)
- Visual Studio C++ Build Tools (required for Tauri on Windows)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sofianebel/RRadio.git
   cd RRadio
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run the development server:
   ```bash
   bun run tauri:dev
   ```

4. Build the production application:
   ```bash
   bun run tauri:build
   ```

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.

Format:
```text
<type>(<scope>): <description>
```

Types:
- `feat`: A new user-facing feature
- `fix`: A bug fix
- `docs`: Documentation updates
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Tooling, dependency, or configuration updates

Examples:
- `feat(audio): add playback volume slider to settings`
- `fix(overlay): prevent window activation on hotkey summon`
- `docs(readme): add installation guide with screenshots`

Rules:
- Write in English using the imperative mood (`add`, `fix`, `update`, not `added` or `fixes`).
- Keep commits small, focused, and limited to one logical change.
- Never write vague messages such as `update`, `fix bugs`, or `wip`.

## Pull Request Process

1. Create a descriptive branch from `master`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Verify that the frontend builds with zero TypeScript errors:
   ```bash
   bun run build
   ```
3. Test your changes on the real Windows desktop surface:
   - Ensure the transparent overlay does not steal keyboard focus.
   - Verify global hotkey behavior (`F8`, `F9`, `F7`, `F10`).
   - Check Discord Rich Presence if modifying player state.
4. Push your branch and open a Pull Request using the repository pull request template.
5. Ensure CI checks pass on your pull request.
