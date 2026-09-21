# Risk Labeling Specification

## 1. Purpose

This document defines how historical software changes are labeled
for training and evaluating the Change Impact Analysis risk model.

The objective is to create labels that represent real-world software
risk rather than labels generated from the same code features used
by the machine learning model.

---

## 2. Primary Prediction Target

The primary prediction target is:

- BUG-INDUCING
- NON-BUG-INDUCING

A change is considered BUG-INDUCING when there is sufficient historical
evidence that the change introduced a defect that was later corrected
or explicitly identified as a bug.

A change is considered NON-BUG-INDUCING when there is sufficient
historical evidence that it was not associated with a subsequently
identified defect.

Changes without sufficient evidence will not be forced into either class.

---

## 3. Label Definitions

### BUG-INDUCING

A historical code change may be labeled BUG-INDUCING when:

1. The change modified production/source code.
2. Later history contains evidence of a bug or defect related to that change.
3. The later bug-fixing change can be linked to the earlier change
   with sufficient confidence.

### NON-BUG-INDUCING

A historical code change may be labeled NON-BUG-INDUCING when:

1. The change modified production/source code.
2. There is no identified evidence that the change introduced a defect.
3. The change has sufficient historical observation after it was introduced.

### UNKNOWN

A change is labeled UNKNOWN when:

1. There is insufficient historical evidence.
2. The relationship between the change and a later bug fix is ambiguous.
3. The change cannot be reliably classified.

UNKNOWN samples will not be used as training labels unless a later
labeling process provides stronger evidence.

---

## 4. Important Principle

Labels must NOT be generated directly from the same code-change
features used by the prediction model.

Examples of features that must not directly determine the label:

- changedLines
- addedLines
- removedLines
- changedFunctions
- changedVariables
- dependency counts
- businessLogic
- stateChange
- apiChange

These features may be used as model inputs, but they must not be
used as the ground-truth labeling rule.

---

## 5. Evidence Sources

Potential evidence sources include:

- Git commit history
- Pull requests
- Bug-fix commits
- Issue references
- Revert commits
- Regression fixes
- Release history
- Developer-maintained issue discussions

The strongest available evidence should be preferred.

---

## 6. Label Confidence

Each label should have a confidence level:

- HIGH
- MEDIUM
- LOW

Only sufficiently reliable labels should be included in the final
training dataset.

---

## 7. Dataset Policy

The dataset should preserve the original historical order of changes.

Training and evaluation data must be separated in a way that prevents
information from future changes leaking into earlier changes.

Repository-aware and time-aware splitting should be considered.

---

## 8. Multi-Class Risk

The existing LOW / MEDIUM / HIGH risk display will remain as a
product-level risk representation.

However, the primary research target will first be validated using
the binary BUG-INDUCING / NON-BUG-INDUCING task.

A separate severity definition may be introduced later if sufficient
evidence exists to support LOW / MEDIUM / HIGH labels independently.

---

## 9. Evaluation

The model will not be evaluated using accuracy alone.

Evaluation should include:

- Precision
- Recall
- F1-score
- Balanced Accuracy
- Confusion Matrix
- ROC-AUC where applicable
- PR-AUC where applicable
- Calibration
- Per-class performance

---

## 10. Acceptance Principle

The real-data model will replace the synthetic-label model only if
evaluation demonstrates that it provides meaningful predictive value
on unseen historical data.

Synthetic-label performance will not be presented as real-world
predictive accuracy.