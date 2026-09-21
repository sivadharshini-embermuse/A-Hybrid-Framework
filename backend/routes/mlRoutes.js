const express = require("express");

const {
  addTrainingSample,
} = require("../ml/datasetBuilder");

const router = express.Router();

router.post("/label", (req, res) => {
  try {
    const {
      features,
      riskLevel,
    } = req.body;

    if (!features) {
      return res.status(400).json({
        success: false,
        message: "Features are required",
      });
    }

    const allowedLevels = [
      "LOW",
      "MEDIUM",
      "HIGH",
    ];

    if (!allowedLevels.includes(riskLevel)) {
      return res.status(400).json({
        success: false,
        message:
          "Risk level must be LOW, MEDIUM or HIGH",
      });
    }

    const totalSamples =
      addTrainingSample(
        features,
        riskLevel
      );

    res.json({
      success: true,
      message: "Training sample saved",
      totalSamples,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to save training sample",
      error: error.message,
    });
  }
});

module.exports = router;