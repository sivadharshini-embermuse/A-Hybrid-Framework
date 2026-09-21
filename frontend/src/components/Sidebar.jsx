function Sidebar({
  activePage,
  setActivePage,
  hasResult,
}) {
  const menuItems = [
    {
      id: "dashboard",
      icon: "▣",
      label: "Dashboard",
    },
    {
      id: "analyze",
      icon: "⇄",
      label: "Analyze Project",
    },
    {
      id: "changes",
      icon: "◈",
      label: "Change Analysis",
    },
    {
      id: "graph",
      icon: "◎",
      label: "Impact Graph",
    },
    {
      id: "explorer",
      icon: "🗂️",
      label: "Project Explorer",
    },
    {
        id: "recommendations",
        icon: "✦",
        label: "Recommendations",
    },
    {
        id: "risk",
        icon: "⚠️",
        label: "Risk Prediction",
    },
  ];

  return (
    <aside className="sidebar">

      {/* LOGO */}

      <div className="brand">

        <div className="brand-icon">
          ◈
        </div>

        <div>
          <div className="brand-title">
            Change Analyzer
          </div>

          <div className="brand-subtitle">
            Project intelligence
          </div>
        </div>

      </div>

      {/* NAVIGATION */}

      <nav className="sidebar-nav">

        <div className="nav-heading">
          WORKSPACE
        </div>

        {menuItems.map(
          (item) => (
            <button
              key={item.id}
              className={`nav-item ${
                activePage === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActivePage(
                  item.id
                )
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

              {item.id ===
                "changes" &&
                hasResult && (
                  <span className="nav-badge">
                    ✓
                  </span>
                )}
            </button>
          )
        )}
      </nav>

      {/* BOTTOM STATUS */}

      <div className="sidebar-bottom">

        <div className="project-status">

          <div className="status-label">
            PROJECT STATUS
          </div>

          <div className="status-row">

            <span className="status-dot"></span>

            <span>
              {hasResult
                ? "Analysis ready"
                : "Ready"}
            </span>

          </div>

        </div>

        <div className="version">
          Change Analyzer v1.0
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;