from datasets import load_dataset

print("Downloading dataset...")

dataset = load_dataset(
    "helloadhavan/github_issues",
    split="train"
)

print("Dataset downloaded successfully!")
print("Rows:", len(dataset))
print("Columns:")
print(dataset.column_names)

print("\nFirst record:")
print(dataset[0])