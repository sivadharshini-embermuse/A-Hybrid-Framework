function AnalyzePage({
  originalFile,
  modifiedFile,
  setOriginalFile,
  setModifiedFile,
  analyseChanges,
  loading,
  error,
}) {
  return (
    <div>

      <div className="page-intro">
        <div>
          <h2>
            Compare project versions
          </h2>

          <p>
            Upload the original and
            modified ZIP files to
            detect changes and their
            impact.
          </p>
        </div>
      </div>

      {/* UPLOAD */}

      <div className="upload-grid">

        <UploadBox
          number="01"
          title="Original Project"
          description="Upload the original version"
          file={originalFile}
          setFile={setOriginalFile}
        />

        <UploadBox
          number="02"
          title="Modified Project"
          description="Upload the changed version"
          file={modifiedFile}
          setFile={setModifiedFile}
        />

      </div>

      {/* ERROR */}

      {error && (
        <div className="error-box">
          <span>!</span>
          {error}
        </div>
      )}

      {/* ACTION */}

      <div className="analyze-action">

        <button
          className="primary-button large"
          onClick={
            analyseChanges
          }
          disabled={loading}
        >
          {loading
            ? "Analyzing project..."
            : "Analyze Changes →"}
        </button>

      </div>

      {/* PROCESS INFO */}

      <div className="process-box">

        <div className="process-item">
          <span>01</span>
          Upload versions
        </div>

        <div className="process-line"></div>

        <div className="process-item">
          <span>02</span>
          Detect changes
        </div>

        <div className="process-line"></div>

        <div className="process-item">
          <span>03</span>
          Analyze impact
        </div>

        <div className="process-line"></div>

        <div className="process-item">
          <span>04</span>
          Visualize graph
        </div>

      </div>

    </div>
  );
}

function UploadBox({
  number,
  title,
  description,
  file,
  setFile,
}) {
  return (
    <div className="upload-box">

      <div className="upload-number">
        {number}
      </div>

      <div className="upload-content">

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

        <label className="file-button">

          Choose ZIP file

          <input
            type="file"
            accept=".zip"
            onChange={(e) => {
              setFile(
                e.target.files?.[0] ||
                  null
              );
            }}
          />

        </label>

        {file && (
          <div className="selected-file">
            ✓ {file.name}
          </div>
        )}

      </div>

    </div>
  );
}

export default AnalyzePage;