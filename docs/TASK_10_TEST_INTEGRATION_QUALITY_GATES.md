# Task 10: Jenkins Test Integration & Automated Quality Gates

## 1. Scope
Integration of Selenium test suite into the CI/CD pipeline stage with automated quality gate enforcement.

## 2. Quality Gate Policy
* Pipeline halts immediately if any Selenium or unit test fails.
* Build is marked UNSTABLE or FAILED; deployment stage is blocked.

## 3. Pipeline Output
[Pipeline] stage: Automated Testing
Running Selenium TestNG Suite...
Tests run: 3, Failures: 0, Skips: 0
Quality Gate: PASSED (100% test pass rate)
