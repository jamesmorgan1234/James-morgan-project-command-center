# Error Code Catalog — Codes, Meaning, Exact First-Response Rule

## Global handling policy
- Reject/contain before retry on writes with unknown outcome.
- READ failure may retry with bounded exponential backoff; monetary/purchase/refund writes require external reconciliation.
- Every incident/exception has a correlation ID, severity, evidence and safe recovery path.
- No error grants authority or triggers paid action.

## DAT
| Code | Meaning | Handling |
|---|---|---|
| `DAT-001` | Missing required field | Reject mutation; identify field |
| `DAT-002` | Invalid datatype | Reject and report field |
| `DAT-003` | Unknown enum | Quarantine; schema-drift alert |
| `DAT-004` | Impossible numeric value | Reject; incident if systemic |
| `DAT-005` | Stale source | Refresh or block risky use |
| `DAT-006` | Source conflict | CONFLICTING; no silent resolution |
| `DAT-007` | Timestamp order invalid | Reject |
| `DAT-008` | Currency missing | Economics INCOMPLETE |
| `DAT-009` | Unit missing | Reject dependent calculation |
| `DAT-010` | Duplicate entity suspicion | Hold merge |
| `DAT-011` | Payload integrity failure | Reject payload |
| `DAT-012` | Schema unsupported | Stop affected connector writes |

## IDN
| Code | Meaning | Handling |
|---|---|---|
| `IDN-001` | Identifier missing | Hold automatic match |
| `IDN-002` | Invalid checksum/format | Reject match |
| `IDN-003` | Identifier not found | Keep unknown |
| `IDN-004` | Identifier maps to conflicts | Hold and investigate |
| `IDN-005` | Pack-size mismatch | Reject auto-match |
| `IDN-006` | Variant mismatch | Reject auto-match |
| `IDN-007` | Brand mismatch | Reject auto-match |
| `IDN-008` | MPN mismatch | Reject auto-match |
| `IDN-009` | Condition mismatch | Reject auto-match |
| `IDN-010` | Confidence below threshold | Review/hold |
| `IDN-011` | Bundle mismatch | Reject auto-match |
| `IDN-012` | Counterfeit suspicion | Quarantine; compliance review |

## SUP
| Code | Meaning | Handling |
|---|---|---|
| `SUP-001` | Supplier unavailable | Open affected read/update breaker; do not buy |
| `SUP-002` | Authentication failed | Disable connector writes |
| `SUP-003` | Supplier not approved | Block order |
| `SUP-004` | Offer unavailable | No listing activation |
| `SUP-005` | Stock stale | Reduce/zero ATP |
| `SUP-006` | Cost stale | Freeze unsafe repricing |
| `SUP-007` | Cost anomaly | Quarantine feed; pricing breaker |
| `SUP-008` | Inventory anomaly | Quarantine feed; inventory breaker |
| `SUP-009` | Order rejected | No blind retry; alternative evaluation |
| `SUP-010` | Order result unknown | Reconcile before retry |
| `SUP-011` | Duplicate order suspected | Freeze retries; investigate |
| `SUP-012` | Shipment late | Exception and health risk |
| `SUP-013` | Tracking invalid | Hold confirmation; verify |
| `SUP-014` | Unapproved substitution | Reject/resolve fulfillment |
| `SUP-015` | Authorization absent | Block product/brand |
| `SUP-016` | Return refused | Case and financial reserve |
| `SUP-017` | Quality degraded | Constrain supplier |
| `SUP-018` | Supplier blocked | Block new commitments |

## MKT
| Code | Meaning | Handling |
|---|---|---|
| `MKT-001` | Authentication failed | Disable write |
| `MKT-002` | Scope denied | Do not escalate privilege |
| `MKT-003` | Rate limited | Throttle/backoff/jitter |
| `MKT-004` | Endpoint unavailable | Safe retry for reads; reconcile writes |
| `MKT-005` | API version unsupported | Disable affected action |
| `MKT-006` | Listing rejected | Inspect reason, correct after validation |
| `MKT-007` | Listing suppressed | Block affected SKU |
| `MKT-008` | Price rejected | Preserve trusted price |
| `MKT-009` | Inventory rejected | Conservative stock/exception |
| `MKT-010` | Invalid order payload | Quarantine order |
| `MKT-011` | Duplicate webhook | Idempotent no-op |
| `MKT-012` | Webhook gap | Poll/reconcile |
| `MKT-013` | Events out of order | Reconcile version and state |
| `MKT-014` | Write result unknown | Read back before retry |
| `MKT-015` | Account warning | Escalate risk |
| `MKT-016` | Account restricted | Limit writes, preserve state |
| `MKT-017` | Policy conflict | Block affected operation |
| `MKT-018` | Schema drift | Quarantine affected connector data |

## INV
| Code | Meaning | Handling |
|---|---|---|
| `INV-001` | Insufficient stock | Reject reservation |
| `INV-002` | Reservation conflict | Retry conditional compare-and-swap |
| `INV-003` | Negative inventory | Open breaker, audit |
| `INV-004` | Stock stale | Reduce sellable quantity |
| `INV-005` | Location mismatch | Reconcile location |
| `INV-006` | Oversell risk | Fence exposure and alert |
| `INV-007` | Duplicate reservation | Return prior idempotent result |
| `INV-008` | Reservation expired | Require new reservation |
| `INV-009` | Allocation conflict | Recalculate per-channel allocation |
| `INV-010` | Reconciliation mismatch | Record discrepancy |
| `INV-011` | Mass quantity anomaly | Quarantine feed |
| `INV-012` | Write result unknown | Read back before retry |

## PRC
| Code | Meaning | Handling |
|---|---|---|
| `PRC-001` | Required cost missing | Block pricing action |
| `PRC-002` | Below hard floor | Hard reject |
| `PRC-003` | Above safe ceiling | Reject/review pricing rule |
| `PRC-004` | Currency mismatch | Reject |
| `PRC-005` | Decimal anomaly | Freeze repricing |
| `PRC-006` | Competitor anomaly | Do not chase |
| `PRC-007` | MAP conflict | Block |
| `PRC-008` | Fee model incomplete | Economics INCOMPLETE |
| `PRC-009` | Excessive volatility | Freeze or cap |
| `PRC-010` | Repricing loop | Circuit breaker |
| `PRC-011` | Bulk-change threshold | Stop rollout |
| `PRC-012` | Write result unknown | Verify external current price |

## ORD
| Code | Meaning | Handling |
|---|---|---|
| `ORD-001` | Duplicate external order | Return original internal order |
| `ORD-002` | Invalid state | Reject transition |
| `ORD-003` | Unknown listing | Quarantine order |
| `ORD-004` | Unknown product | Quarantine order |
| `ORD-005` | Insufficient inventory | Fulfillment exception; no phantom stock |
| `ORD-006` | Already cancelled | No-op/reconcile |
| `ORD-007` | Marketplace/supplier conflict | Reconcile all systems |
| `ORD-008` | Partial-cancel conflict | Review line quantities |
| `ORD-009` | No fulfillment source | Block new commitments |
| `ORD-010` | Idempotency collision | Hard conflict |
| `ORD-011` | Amount mismatch | Hold financial finalization |
| `ORD-012` | Acceptance result unknown | Check authoritative state |

## FUL
| Code | Meaning | Handling |
|---|---|---|
| `FUL-001` | No valid route | Block |
| `FUL-002` | Primary source failed | Assess certified fallback |
| `FUL-003` | Backup invalid | Block |
| `FUL-004` | Label failed | Check prior label before retry |
| `FUL-005` | Tracking missing | Escalate |
| `FUL-006` | Tracking invalid | Verify |
| `FUL-007` | Carrier mismatch | Reconcile |
| `FUL-008` | Shipment late | Exception/health alert |
| `FUL-009` | Package lost | Carrier/customer claims workflow |
| `FUL-010` | Delivery exception | Customer case |
| `FUL-011` | Address invalid | Hold fulfillment appropriately |
| `FUL-012` | Write result unknown | Reconcile source |

## RET
| Code | Meaning | Handling |
|---|---|---|
| `RET-001` | Ineligible return | Handle per marketplace rights |
| `RET-002` | Quantity exceeds purchased | Reject excess |
| `RET-003` | Window conflict | Policy verification |
| `RET-004` | Return lost | Carrier case |
| `RET-005` | Disposition unknown | No automatic restock |
| `RET-006` | Supplier recovery rejected | Financial case |
| `RET-007` | Duplicate return | Idempotent no-op |
| `RET-008` | Condition mismatch | Evidence/inspection |

## FIN
| Code | Meaning | Handling |
|---|---|---|
| `FIN-001` | Settlement mismatch | Create discrepancy |
| `FIN-002` | Duplicate financial event | No-op/reject |
| `FIN-003` | Refund exceeds balance | Hard reject |
| `FIN-004` | Currency mismatch | Reject and reconcile |
| `FIN-005` | Fee unexplained | Keep unresolved |
| `FIN-006` | Payout unexplained | Keep unresolved |
| `FIN-007` | Duplicate refund suspected | Freeze and reconcile |
| `FIN-008` | Missing ledger counterpart | Reject post |
| `FIN-009` | Historical mutation attempted | Reject; correction event |
| `FIN-010` | Reconciliation incomplete | Explicit UNRESOLVED |
| `FIN-011` | Missing cost source | Profit uncertain |
| `FIN-012` | Cash exposure limit | Block commitment |

## POL
| Code | Meaning | Handling |
|---|---|---|
| `POL-001` | Product prohibited | Hard block |
| `POL-002` | Category restricted | Block until verified eligible |
| `POL-003` | Brand restricted | Block |
| `POL-004` | Authorization evidence missing | Hold |
| `POL-005` | Recall active | Block and contain |
| `POL-006` | Safety document missing | Hold |
| `POL-007` | Policy uncertain | Hold unsafe action |
| `POL-008` | Policy source stale | Re-verify |
| `POL-009` | Policy contradiction | Hold |
| `POL-010` | Seller-of-record conflict | Block fulfillment |
| `POL-011` | Fulfillment method prohibited | Block |
| `POL-012` | Listing claim unsupported | Remove/hold claim |

## SEC
| Code | Meaning | Handling |
|---|---|---|
| `SEC-001` | Auth anomaly | Investigate/contain |
| `SEC-002` | Credential expired | Disable write, renew only authorized |
| `SEC-003` | Compromise suspected | Revoke/rotate via approved process |
| `SEC-004` | Unauthorized capability | Deny |
| `SEC-005` | Scope violation | Deny and audit |
| `SEC-006` | Cross-company access | Deny and critical incident |
| `SEC-007` | Bad webhook signature | Reject |
| `SEC-008` | Replay | Reject duplicate |
| `SEC-009` | Secret in output | Redact; investigate |
| `SEC-010` | Malicious input | Quarantine data |
| `SEC-011` | Dependency integrity failure | Block release |
| `SEC-012` | Audit tampering | Critical containment |

## AIX
| Code | Meaning | Handling |
|---|---|---|
| `AIX-001` | Confidence low | No auto-action |
| `AIX-002` | Evidence missing | Do not promote claim |
| `AIX-003` | Models disagree | Hold/review |
| `AIX-004` | Unsupported fact | Reject |
| `AIX-005` | Prompt injection | Treat as inert data |
| `AIX-006` | Output schema invalid | Reject/retry safe inference only |
| `AIX-007` | Model unavailable | Continue deterministic services |
| `AIX-008` | Prediction drift | Reevaluate model |
| `AIX-009` | Benchmark regression | Do not graduate |
| `AIX-010` | Tool beyond authority | Deny |

## SYS
| Code | Meaning | Handling |
|---|---|---|
| `SYS-001` | Database unavailable | Circuit breaker |
| `SYS-002` | Queue unavailable | Durable buffering/recovery |
| `SYS-003` | Worker crash | Resume from durable state |
| `SYS-004` | Storage unavailable | Degrade safely |
| `SYS-005` | Network timeout | Classified retry |
| `SYS-006` | Transaction conflict | CAS/backoff/reconcile |
| `SYS-007` | Lock timeout | No duplicate effect; retry safe |
| `SYS-008` | Clock skew | Do not order by wallclock alone |
| `SYS-009` | Storage threshold | Prevent data loss |
| `SYS-010` | Config invalid | Block activation |
| `SYS-011` | Migration mismatch | Block release |
| `SYS-012` | Health check failure | Contain affected component |
