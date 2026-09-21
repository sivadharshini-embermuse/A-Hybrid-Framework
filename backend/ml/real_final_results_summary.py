import os
import pandas as pd


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PROCESSED_DIR = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed"
)


def load_csv(filename):
    path = os.path.join(PROCESSED_DIR, filename)

    if not os.path.exists(path):
        print(f"WARNING: File not found -> {filename}")
        return None

    return pd.read_csv(path)


def print_section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def main():

    print("Loading existing experiment results...")

    # ---------------------------------------------------------
    # 1. BASELINE COMPARISON
    # ---------------------------------------------------------

    baseline = load_csv(
        "baseline_comparison_test.csv"
    )

    if baseline is not None:

        print_section("1. BASELINE MODEL COMPARISON")

        print(
            baseline.to_string(index=False)
        )

    # ---------------------------------------------------------
    # 2. THRESHOLD RESULTS
    # ---------------------------------------------------------

    threshold = load_csv(
        "threshold_results.csv"
    )

    if threshold is not None:

        print_section("2. THRESHOLD TUNING")

        print(
            threshold.to_string(index=False)
        )

    # ---------------------------------------------------------
    # 3. FINAL TEST RESULTS
    # ---------------------------------------------------------

    final_test = load_csv(
        "final_test_results_threshold_040.csv"
    )

    if final_test is not None:

        print_section("3. FINAL TEST RESULTS")

        print(
            final_test.to_string(index=False)
        )

    # ---------------------------------------------------------
    # 4. FEATURE GROUP RESULTS
    # ---------------------------------------------------------

    feature_group = load_csv(
        "feature_group_results.csv"
    )

    if feature_group is not None:

        print_section("4. FEATURE GROUP COMPARISON")

        print(
            feature_group.to_string(index=False)
        )

    # ---------------------------------------------------------
    # 5. ABLATION STUDY
    # ---------------------------------------------------------

    ablation = load_csv(
        "ablation_results.csv"
    )

    if ablation is not None:

        print_section("5. ABLATION STUDY")

        print(
            ablation.to_string(index=False)
        )

    # ---------------------------------------------------------
    # 6. ROBUSTNESS
    # ---------------------------------------------------------

    robustness = load_csv(
        "robustness_results.csv"
    )

    if robustness is not None:

        print_section("6. ROBUSTNESS ANALYSIS")

        print(
            robustness.to_string(index=False)
        )

    # ---------------------------------------------------------
    # 7. ROBUST FEATURE IMPORTANCE
    # ---------------------------------------------------------

    feature_importance = load_csv(
        "robust_feature_importance.csv"
    )

    if feature_importance is not None:

        print_section("7. ROBUST FEATURE IMPORTANCE")

        print(
            feature_importance.head(10).to_string()
        )

    # ---------------------------------------------------------
    # 8. STATISTICAL TEST
    # ---------------------------------------------------------

    statistical = load_csv(
        "statistical_test_results.csv"
    )

    if statistical is not None:

        print_section("8. STATISTICAL SIGNIFICANCE")

        print(
            statistical.to_string(index=False)
        )

    # ---------------------------------------------------------
    # 9. PER-PROJECT RESULTS
    # ---------------------------------------------------------

    project = load_csv(
        "per_project_test_results.csv"
    )

    if project is not None:

        print_section("9. PER-PROJECT PERFORMANCE")

        project_sorted = project.sort_values(
            "f1",
            ascending=False
        )

        print(
            project_sorted[
                [
                    "project",
                    "samples",
                    "bug_rate",
                    "precision",
                    "recall",
                    "f1",
                    "roc_auc",
                    "pr_auc"
                ]
            ].to_string(index=False)
        )

    # ---------------------------------------------------------
    # 10. FINAL PAPER-READY SUMMARY
    # ---------------------------------------------------------

    print_section(
        "FINAL PAPER-READY SUMMARY"
    )

    summary_rows = []

    # Baseline best model
    if baseline is not None:

        best_baseline = baseline.sort_values(
            "f1",
            ascending=False
        ).iloc[0]

        summary_rows.append(
            {
                "Experiment": "Best Baseline Model",
                "Model": best_baseline["model"],
                "F1": best_baseline["f1"],
                "ROC_AUC": best_baseline["roc_auc"],
                "PR_AUC": best_baseline["pr_auc"]
            }
        )

    # Final threshold model
    if final_test is not None:

        row = final_test.iloc[0]

        summary_rows.append(
            {
                "Experiment": "Final Test Model (Threshold 0.40)",
                "Model": "HistGradientBoosting",
                "F1": row["f1"],
                "ROC_AUC": row["roc_auc"],
                "PR_AUC": row["pr_auc"]
            }
        )

    # Robustness mean
    if robustness is not None:

        summary_rows.append(
            {
                "Experiment": "Temporal Robustness Mean",
                "Model": "HistGradientBoosting",
                "F1": robustness["f1"].mean(),
                "ROC_AUC": robustness["roc_auc"].mean(),
                "PR_AUC": robustness["pr_auc"].mean()
            }
        )

    # Statistical comparison
    if statistical is not None:

        for _, row in statistical.iterrows():

            print(
                f"{row['metric']}: "
                f"Traditional={row['traditional_mean']:.4f}, "
                f"All19={row['all_19_mean']:.4f}, "
                f"Difference={row['mean_difference']:.4f}, "
                f"p={row['p_value']:.4f}"
            )

    summary = pd.DataFrame(summary_rows)

    print(
        summary.to_string(index=False)
    )

    # ---------------------------------------------------------
    # SAVE FINAL SUMMARY
    # ---------------------------------------------------------

    output_file = os.path.join(
        PROCESSED_DIR,
        "final_results_summary.csv"
    )

    summary.to_csv(
        output_file,
        index=False
    )

    print("\n" + "=" * 60)
    print("FINAL SUMMARY SAVED")
    print("=" * 60)

    print(output_file)

    # ---------------------------------------------------------
    # KEY FINDINGS
    # ---------------------------------------------------------

    print_section("KEY RESEARCH FINDINGS")

    print(
        """
1. HistGradientBoosting provides the strongest baseline
   performance among the evaluated baseline models.

2. The locked threshold of 0.40 substantially increases
   bug detection recall.

3. Temporal robustness experiments show stable ROC-AUC
   performance across multiple chronological windows.

4. LA is the dominant predictive feature according to
   robust permutation importance.

5. Removing LA causes a clear performance degradation,
   indicating its strong predictive contribution.

6. JavaScript-specific features provide only a small
   additional improvement over traditional JIT features.

7. The statistical tests indicate that the improvement
   from adding JavaScript-specific features is NOT
   statistically significant at p < 0.05.

8. Model performance varies across projects, showing
   differences in cross-project generalization.
"""
    )

    print("\nDone.")


if __name__ == "__main__":
    main()