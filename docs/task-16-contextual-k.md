# Task 16 — Contextual K-Factor

**Date:** 2026-04-26
**Baseline:** `pavfix-blend-w06` (K=25, HA=160, RTM=0.10, w=0.6, slope=6.986)
**Decision:** Not shipped. Improvement below noise floor.

---

## Sweep results

| Config | Sensitivity | Tip% | LogLoss | Delta vs s=0 |
|--------|-----------|------|---------|-------------|
| ctxk-s0000 | 0 | 66.1% | 0.8607 | 0.0000 |
| ctxk-s0010 | 0.001 | 66.1% | 0.8607 | 0.0000 |
| ctxk-s0020 | 0.002 | 66.1% | 0.8606 | -0.0001 |
| ctxk-s0050 | 0.005 | 66.1% | 0.8604 | -0.0003 |
| **ctxk-s0100** | **0.01** | **66.4%** | **0.8602** | **-0.0005** |
| ctxk-s0200 | 0.02 | 66.2% | 0.8602 | -0.0005 |
| ctxk-s0500 | 0.05 | 66.1% | 0.8646 | +0.0039 |
| ctxk-s1000 | 0.1 | 48.1% | 3.2170 | diverges |

U-shaped response: optimum at sensitivity 0.01-0.02, total improvement 0.0005.
At sensitivity >= 0.05, K grows too large and destabilizes ratings.

## Bootstrap validation

| Metric | Delta (best vs baseline) | 95% CI | Excludes zero? |
|--------|------------------------|--------|---------------|
| LogLoss | -0.0006 | [-0.0018, +0.0008] | **No** |
| Brier | -0.0001 | [-0.0005, +0.0003] | **No** |
| Tip% | +0.4% | [-0.1%, +1.0%] | **No** |

## Decision

The improvement (0.0005 LogLoss) is directionally correct but well within
the noise floor (CI width ~0.0026). **Contextual K is not shipped.**

The implementation remains in the engine at sensitivity=0 (no-op). If more
data becomes available (doubling the test window to ~2000 matches), this
could become detectable. For now, the Task 12 West Coast misrating is not
addressable via this lever at the current sample size.
