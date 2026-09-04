# Security Policy

## Supported Versions

Only the latest release of RRadio receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | Yes                |
| < 0.1.0 | No                 |

## Reporting a Vulnerability

We take the security of RRadio and its users seriously.

If you discover a security vulnerability, please do not report it through public GitHub issues or public discussions.

Instead, please report security issues through one of the following methods:

1. **GitHub Security Advisory**: Use the **Report a vulnerability** button under the **Security** tab of the GitHub repository.
2. **Direct Contact**: If GitHub Advisories are unavailable, open a confidential issue labeled `[Security Disclosure]`.

### What to Include

Please provide as much information as possible to help us investigate and reproduce the issue:

- Type of issue (e.g., local privilege escalation, insecure loopback server, credential exposure)
- Step-by-step instructions to reproduce the vulnerability
- Operating system version and build
- Affected component (e.g., Tauri IPC layer, OAuth PKCE loopback, Discord RPC thread)
- A proof of concept if available

## Security Architecture Notes

- **Local OAuth Loopback**: RRadio spawns a short-lived loopback HTTP listener strictly bound to `127.0.0.1` on a random port only during Google OAuth PKCE authorization. The listener terminates immediately once the authorization code is captured.
- **Local Storage**: User access tokens are stored in the local browser context. Do not share your application state or localStorage dumps publicly.
- **No Remote Code Execution**: RRadio does not execute arbitrary remote code or download untrusted executable scripts.
