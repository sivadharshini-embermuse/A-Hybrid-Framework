const fs = require("fs");
const path = require("path");

const DATASET_DIR = path.join(__dirname, "dataset");
const DATASET_FILE = path.join(
  DATASET_DIR,
  "risk-dataset.json"
);

function ensureDataset() {
  if (!fs.existsSync(DATASET_DIR)) {
    fs.mkdirSync(DATASET_DIR, {
      recursive: true,
    });
  }

  if (!fs.existsSync(DATASET_FILE)) {
    fs.writeFileSync(
      DATASET_FILE,
      JSON.stringify([], null, 2)
    );
  }
}

function addTrainingSample(features, riskLevel) {
  ensureDataset();

  const dataset = JSON.parse(
    fs.readFileSync(DATASET_FILE, "utf8")
  );

  dataset.push({
    ...features,
    riskLevel,
  });

  fs.writeFileSync(
    DATASET_FILE,
    JSON.stringify(dataset, null, 2)
  );

  return dataset.length;
}

function getDataset() {
  ensureDataset();

  return JSON.parse(
    fs.readFileSync(DATASET_FILE, "utf8")
  );
}

module.exports = {
  addTrainingSample,
  getDataset,
};