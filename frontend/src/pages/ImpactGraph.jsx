import Graph from "../components/Graph";

function ImpactGraph({
  dependencyMap,
  impactMap,
  modifiedFiles,
  result,
}) {
  return (
    <div>

      <div className="page-intro graph-intro">

        <div>
          <h2>
            Change Impact Map
          </h2>

          <p>
            See how modified files
            affect the rest of your
            project.
          </p>
        </div>

        <div className="graph-summary">

          <div>
            <span>Modified</span>
            <strong>
              {result?.summary
                ?.modified ?? 0}
            </strong>
          </div>

          <div>
            <span>Files</span>
            <strong>
              {result?.summary
                ?.totalFiles ?? 0}
            </strong>
          </div>

        </div>

      </div>

      <Graph
        dependencyMap={
          dependencyMap
        }
        impactMap={impactMap}
        modifiedFiles={
          modifiedFiles
        }
      />

    </div>
  );
}

export default ImpactGraph;