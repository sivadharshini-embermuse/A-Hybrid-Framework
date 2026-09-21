const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");

const {
  compareProjects,
} = require("../services/changeDetection");

const {
  analyseDependencies,
} = require("../services/dependencyAnalysis");

const {
  analyseImpact,
} = require("../services/impactAnalysis");

const {
  generateRecommendations,
} = require("../services/recommendationEngine");

const {
  extractFeatures,
} = require("../services/featureExtractor");

const {
  predictRisk,
} = require("../ml/mlClient");

const {
  buildJITFeatures,
} = require("../ml/jitFeatureAdapter");


// =====================================================
// ZIP EXTRACTION
// =====================================================

async function extractZip(zipPath, outputPath) {
  await fs
    .createReadStream(zipPath)
    .pipe(
      unzipper.Extract({
        path: outputPath,
      })
    )
    .promise();
}


// =====================================================
// NORMALIZE FILE PATH
// =====================================================

function normalizePath(file) {
  return String(file || "")
    .replace(/\\/g, "/");
}


// =====================================================
// ANALYSE CHANGES
// =====================================================

async function analyseChanges(req, res) {
  try {

    // ===================================================
    // 1. CHECK UPLOADS
    // ===================================================

    if (
      !req.files?.original ||
      !req.files?.modified
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Both original and modified ZIP files are required",
      });
    }


    const originalZip =
      req.files.original[0];

    const modifiedZip =
      req.files.modified[0];


    // ===================================================
    // 2. EXTRACTION PATHS
    // ===================================================

    const originalPath =
      path.join(
        __dirname,
        "../extracted/original"
      );

    const modifiedPath =
      path.join(
        __dirname,
        "../extracted/modified"
      );


    // ===================================================
    // 3. CLEAN OLD EXTRACTION
    // ===================================================

    try {
      fs.rmSync(
        originalPath,
        {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 200,
        }
      );
    } catch (error) {
      console.log(
        "Original extraction cleanup skipped:",
        error.message
      );
    }


    try {
      fs.rmSync(
        modifiedPath,
        {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 200,
        }
      );
    } catch (error) {
      console.log(
        "Modified extraction cleanup skipped:",
        error.message
      );
    }


    // ===================================================
    // 4. CREATE DIRECTORIES
    // ===================================================

    fs.mkdirSync(
      originalPath,
      {
        recursive: true,
      }
    );

    fs.mkdirSync(
      modifiedPath,
      {
        recursive: true,
      }
    );


    // ===================================================
    // 5. EXTRACT ZIP FILES
    // ===================================================

    await extractZip(
      originalZip.path,
      originalPath
    );

    await extractZip(
      modifiedZip.path,
      modifiedPath
    );


    // ===================================================
    // 6. CHANGE DETECTION
    // ===================================================

    const result =
      compareProjects(
        originalPath,
        modifiedPath
      );


    // ===================================================
    // 7. DEPENDENCY ANALYSIS
    // ===================================================

    const dependencyMap =
      analyseDependencies(
        modifiedPath
      );


    // ===================================================
    // 8. RECOMMENDATIONS
    // ===================================================

    const recommendations =
      generateRecommendations({
        result,
        dependencyMap,
        modifiedProjectPath:
          modifiedPath,
      });


    // ===================================================
    // 9. FEATURE EXTRACTION
    // ===================================================

    const mlFeatures = [];


    for (
      const item of result.modified || []
    ) {

      const normalizedFile =
        normalizePath(item.file);


      const recommendation =
        recommendations.find(
          (rec) =>
            normalizePath(rec.file) ===
            normalizedFile
        );


      const features =
        extractFeatures({

          file:
            normalizedFile,

          changes:
            item.changes || [],

          directImpact:
            recommendation?.directImpact ||
            [],

          indirectImpact:
            recommendation?.indirectImpact ||
            [],

          context: {

            functions:
              recommendation?.changedFunctions ||
              [],

            variables:
              recommendation?.changedVariables ||
              [],

            categories:
              recommendation?.categories ||
              [],

          },

        });


      mlFeatures.push({
        ...features,

        file:
          normalizedFile,
      });
    }


    // ===================================================
    // 10. ML RISK PREDICTION
    // ===================================================

    const riskPredictions = [];


    for (
      const features of mlFeatures
    ) {

      try {

        const jitResult = buildJITFeatures({
          graphFeatures: features,
          changes: result.modified.find(
            (item) =>
              normalizePath(item.file) ===
              normalizePath(features.file)
          )?.changes || [],
          file: features.file,
        });

        const prediction =
          await predictRisk(jitResult.mlInput);


        riskPredictions.push({

          file:
            normalizePath(
              features.file
            ),

          prediction,
          jitFeatures: jitResult.jitFeatures,

        });

      } catch (error) {

        console.error(
          "Risk prediction failed for:",
          features.file,
          error.message
        );


        riskPredictions.push({

          file:
            normalizePath(
              features.file
            ),

          prediction: {

            success: false,

            riskLevel:
              "LOW",

            riskScore:
              0,

            probabilities: {},

            featureImportance: {},

            error:
              error.message,

          },

        });
      }
    }


    // ===================================================
    // 11. MODIFIED FILES
    // ===================================================

    const modifiedFiles =
      (result.modified || []).map(
        (item) =>
          normalizePath(item.file)
      );


    // ===================================================
    // 12. IMPACT ANALYSIS
    // ===================================================

    const impactMap =
      analyseImpact(
        modifiedFiles,
        dependencyMap
      );


    // ===================================================
    // 13. NORMALIZE IMPACT MAP
    // ===================================================

    const normalizedImpactMap = {};


    Object.entries(
      impactMap || {}
    ).forEach(
      ([file, impacts]) => {

        const normalizedFile =
          normalizePath(file);


        normalizedImpactMap[
          normalizedFile
        ] =
          Array.isArray(impacts)
            ? impacts.map(
                (item) =>
                  normalizePath(item)
              )
            : [];

      }
    );


    // ===================================================
    // 14. FINAL RISK CALCULATION
    // ===================================================

    const finalRiskPredictions =
      riskPredictions.map(
        (item) => {

          const file =
            normalizePath(
              item.file
            );


          const prediction =
            item.prediction || {};


          const probabilities =
            prediction.probabilities ||
            {};


          // ---------------------------------------------
          // ML SEVERITY
          // ---------------------------------------------

          const mlSeverity =
            (
              (Number(
                probabilities.LOW || 0
              ) * 0) +

              (Number(
                probabilities.MEDIUM || 0
              ) * 50) +

              (Number(
                probabilities.HIGH || 0
              ) * 100)
            );


          // ---------------------------------------------
          // IMPACT SCORE
          // ---------------------------------------------

          const affectedFiles =
            normalizedImpactMap[file] || [];


          const affectedCount =
            affectedFiles.length;


          // Maximum impact contribution = 20
          const impactScore =
            Math.min(
              affectedCount * 5,
              20
            );


          // ---------------------------------------------
          // RECOMMENDATION SEVERITY
          // ---------------------------------------------

          const recommendation =
            recommendations.find(
              (rec) =>
                normalizePath(
                  rec.file
                ) === file
            );


          const recommendationSeverity =
            String(
              recommendation?.severity ||
              "LOW"
            ).toUpperCase();


          let recommendationScore = 0;


          if (
            recommendationSeverity ===
            "HIGH"
          ) {
            recommendationScore = 100;

          } else if (
            recommendationSeverity ===
            "MEDIUM"
          ) {
            recommendationScore = 50;

          } else {
            recommendationScore = 0;
          }


          // ---------------------------------------------
          // FINAL SCORE
          // ---------------------------------------------

          /*
             ML prediction       = 60%
             Recommendation      = 25%
             Dependency impact   = 15%
          */

          let finalScore =
            (mlSeverity * 0.60) +
            (recommendationScore * 0.25) +
            (impactScore * 0.15);


          /*
             If recommendation engine identifies
             HIGH severity, don't allow the final
             result to appear completely LOW.
          */

          if (
            recommendationSeverity ===
              "HIGH" &&
            finalScore < 35
          ) {
            finalScore = 35;
          }


          // Keep score between 0 and 100

          finalScore =
            Math.max(
              0,
              Math.min(
                100,
                finalScore
              )
            );


          // ---------------------------------------------
          // FINAL LEVEL
          // ---------------------------------------------

          let finalLevel;


          if (
            finalScore >= 70
          ) {

            finalLevel =
              "HIGH";

          } else if (
            finalScore >= 35
          ) {

            finalLevel =
              "MEDIUM";

          } else {

            finalLevel =
              "LOW";
          }


          return {

            file,

            prediction: {

              ...prediction,

              success:
                prediction.success !== false,

              riskLevel:
                finalLevel,

              riskScore:
                Number(
                  finalScore.toFixed(1)
                ),

              mlSeverity:
                Number(
                  mlSeverity.toFixed(1)
                ),

              impactScore:
                Number(
                  impactScore.toFixed(1)
                ),

              recommendationSeverity,

              affectedFiles:
                affectedCount,

              affectedFileList:
                affectedFiles,

            },

          };
        }
      );


    // ===================================================
    // 15. OVERALL PROJECT RISK
    // ===================================================

    const totalRiskFiles =
      finalRiskPredictions.length;


    const overallRiskScore =
      totalRiskFiles > 0
        ? finalRiskPredictions.reduce(
            (
              sum,
              item
            ) => {

              return (
                sum +
                Number(
                  item.prediction?.riskScore ||
                  0
                )
              );

            },
            0
          ) /
          totalRiskFiles

        : 0;


    let overallRiskLevel;


    if (
      overallRiskScore >= 70
    ) {

      overallRiskLevel =
        "HIGH";

    } else if (
      overallRiskScore >= 35
    ) {

      overallRiskLevel =
        "MEDIUM";

    } else {

      overallRiskLevel =
        "LOW";
    }


    // ===================================================
    // 16. DEBUG OUTPUT
    // ===================================================

    console.log(
      "========== RISK + IMPACT DEBUG =========="
    );

    console.log(
      "RISK PREDICTIONS:"
    );

    console.log(
      JSON.stringify(
        finalRiskPredictions,
        null,
        2
      )
    );

    console.log(
      "OVERALL RISK:"
    );

    console.log(
      {
        level:
          overallRiskLevel,

        score:
          Number(
            overallRiskScore.toFixed(1)
          ),
      }
    );

    console.log(
      "IMPACT MAP:"
    );

    console.log(
      JSON.stringify(
        normalizedImpactMap,
        null,
        2
      )
    );

    console.log(
      "=========================================="
    );


    // ===================================================
    // 17. DELETE UPLOADED ZIP FILES
    // ===================================================

    try {

      if (
        fs.existsSync(
          originalZip.path
        )
      ) {
        fs.unlinkSync(
          originalZip.path
        );
      }

      if (
        fs.existsSync(
          modifiedZip.path
        )
      ) {
        fs.unlinkSync(
          modifiedZip.path
        );
      }

    } catch (error) {

      console.log(
        "ZIP cleanup skipped:",
        error.message
      );
    }


    // ===================================================
    // 18. FINAL RESPONSE
    // ===================================================

    res.json({

      success:
        true,

      result,

      dependencyMap,

      impactMap:
        normalizedImpactMap,

      recommendations,

      mlFeatures,

      riskPredictions:
        finalRiskPredictions,

      overallRisk: {

        level:
          overallRiskLevel,

        score:
          Number(
            overallRiskScore.toFixed(1)
          ),

      },

    });

  } catch (error) {

    console.error(
      error
    );


    res.status(500).json({

      success:
        false,

      message:
        "Project analysis failed",

      error:
        error.message,

    });
  }
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  analyseChanges,
};