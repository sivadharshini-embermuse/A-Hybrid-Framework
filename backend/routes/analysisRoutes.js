const express = require("express");
const multer = require("multer");
const {
  analyseChanges,
} = require("../controllers/analysisController");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

router.post(
  "/analyse",
  upload.fields([
    { name: "original", maxCount: 1 },
    { name: "modified", maxCount: 1 },
  ]),
  analyseChanges
);

module.exports = router;