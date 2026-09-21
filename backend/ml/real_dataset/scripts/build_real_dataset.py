import pandas as pd
import glob
import os

# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "raw",
    "JIT-on-JavaScript-projects-master",
    "DATA"
)

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "processed"
)

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "real_labels.csv"
)

# ============================================================
# LOAD ALL PROJECT CSV FILES
# ============================================================

files = glob.glob(os.path.join(DATA_DIR, "*.csv"))

if not files:
    raise FileNotFoundError(
        f"No CSV files found in: {DATA_DIR}"
    )

print("=" * 60)
print("GRAPHIMPACT AI - REAL DATASET BUILDER")
print("=" * 60)

print(f"\nDataset directory:")
print(DATA_DIR)

print(f"\nCSV files found: {len(files)}")

# ============================================================
# PROCESS EACH PROJECT
# ============================================================

dataframes = []

for file_path in sorted(files):

    project_name = os.path.splitext(
        os.path.basename(file_path)
    )[0]

    print(f"\nReading: {project_name}.csv")

    df = pd.read_csv(file_path)

    # Required columns
    required_columns = {
        "commit_id",
        "contains_bug"
    }

    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(
            f"{project_name}.csv is missing columns: {missing}"
        )

    # Keep original research data
    df = df.copy()

    # Add project identity
    df["project"] = project_name

    dataframes.append(df)

    print(f"  Records: {len(df)}")
    print(f"  Columns: {len(df.columns)}")

# ============================================================
# COMBINE ALL PROJECTS
# ============================================================

combined = pd.concat(
    dataframes,
    ignore_index=True
)

print("\n" + "=" * 60)
print("COMBINED DATASET")
print("=" * 60)

print(f"\nTotal records: {len(combined):,}")

# ============================================================
# VALIDATION
# ============================================================

print("\nLabel distribution:")

print(
    combined["contains_bug"]
    .value_counts(dropna=False)
)

print("\nLabel percentage:")

print(
    (
        combined["contains_bug"]
        .value_counts(normalize=True, dropna=False)
        * 100
    ).round(2)
)

# Missing values
missing_labels = combined["contains_bug"].isna().sum()

print(f"\nMissing labels: {missing_labels}")

if missing_labels > 0:
    raise ValueError(
        "Dataset contains missing contains_bug labels."
    )

# Duplicate commits
duplicate_commits = combined["commit_id"].duplicated().sum()

print(f"Duplicate commit IDs: {duplicate_commits}")

if duplicate_commits > 0:
    raise ValueError(
        "Duplicate commit IDs detected."
    )

# ============================================================
# KEEP ONLY IMPORTANT SOURCE COLUMNS + ORIGINAL FEATURES
# ============================================================

# Put project and commit identity first.
first_columns = [
    "project",
    "commit_id",
    "contains_bug"
]

remaining_columns = [
    col for col in combined.columns
    if col not in first_columns
]

combined = combined[
    first_columns + remaining_columns
]

# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

# ============================================================
# SAVE
# ============================================================

combined.to_csv(
    OUTPUT_FILE,
    index=False
)

# ============================================================
# FINAL REPORT
# ============================================================

print("\n" + "=" * 60)
print("DATASET CREATED SUCCESSFULLY")
print("=" * 60)

print(f"\nOutput:")
print(OUTPUT_FILE)

print(f"\nTotal records: {len(combined):,}")

print(
    f"Defect-inducing commits: "
    f"{(combined['contains_bug'] == True).sum():,}"
)

print(
    f"Non-defect-inducing commits: "
    f"{(combined['contains_bug'] == False).sum():,}"
)

print(f"Total columns: {len(combined.columns)}")

print("\nFirst 5 rows:")
print(
    combined[
        ["project", "commit_id", "contains_bug"]
    ].head().to_string(index=False)
)

print("\nDONE.")