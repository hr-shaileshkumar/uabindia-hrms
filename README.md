# HRMS (UabIndia)

This repository contains the HRMS monorepo: Backend (`.NET 8`), Frontend (React/Vite), and Mobile (Expo).

## CI status

> Replace `OWNER` and `REPO` in the badge URLs below with your GitHub owner and repository name.

- PR Pre-commit Checks: 

[![PR Pre-commit Checks](https://github.com/OWNER/REPO/actions/workflows/pr-precommit-checks.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/pr-precommit-checks.yml)

- CI (build & test):

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

## How to update the badges automatically

- Automatic replacement helper:

	Run the script which uses your local `git` remote to replace placeholders:

	```powershell
	.\scripts\update-readme-badges.ps1
	```

	Or on macOS / Linux:

	```bash
	./scripts/update-readme-badges.sh
	```

	The script will detect `remote.origin.url`, extract `owner/repo` and replace `OWNER/REPO` in `README.md` and `Backend/README.md`.

## Quick links

- Backend README: [Backend/README.md](Backend/README.md)
- Migration scripts: [Backend/migrations_scripts/README.md](Backend/migrations_scripts/README.md)
