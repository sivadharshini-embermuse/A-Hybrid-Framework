function Dashboard({ result, setActivePage }) {
  const summary = result?.summary;

  const ArrowRightIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );

  const GridIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  );

  const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );

  const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  const MinusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  const ListIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );

  const NetworkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  );

  return (
    <div className="dashboard">
      <div className="hero-section">
        <div>
          <div className="eyebrow">PROJECT INTELLIGENCE</div>
          <h2 style={{ color: "white" }}>Understand how your code changes propagate.</h2>
          <p>Compare two versions of your project and identify files affected by the changes.</p>
        </div>
        <button className="primary-button" onClick={() => setActivePage("analyze")}>
          Analyze Project <ArrowRightIcon />
        </button>
      </div>

      <div className="section-title">Analysis Overview</div>
      <div className="stats-grid">
        <StatCard
          label="Total Files"
          value={summary?.totalFiles ?? "-"}
          icon={<GridIcon />}
        />
        <StatCard
          label="Modified"
          value={summary?.modified ?? "-"}
          icon={<EditIcon />}
          type="modified"
        />
        <StatCard
          label="Added"
          value={summary?.added ?? "-"}
          icon={<PlusIcon />}
          type="added"
        />
        <StatCard
          label="Deleted"
          value={summary?.deleted ?? "-"}
          icon={<MinusIcon />}
          type="deleted"
        />
      </div>

      <div className="section-title">Explore</div>
      <div className="quick-grid">
        <button className="quick-card" onClick={() => setActivePage("changes")}>
          <div className="quick-icon"><ListIcon /></div>
          <div>
            <h3>Change Analysis</h3>
            <p>View added, deleted and modified files.</p>
          </div>
          <ArrowRightIcon />
        </button>
        <button className="quick-card" onClick={() => setActivePage("graph")}>
          <div className="quick-icon"><NetworkIcon /></div>
          <div>
            <h3>Impact Graph</h3>
            <p>Visualize the affected project structure.</p>
          </div>
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, type = "" }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-top">
        <span>{label}</span>
        <div className="stat-icon">{icon}</div>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

export default Dashboard;