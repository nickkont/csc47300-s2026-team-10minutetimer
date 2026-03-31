export default function Sidebar() {
  return (
    <aside className="left-sidebar">
      <div className="sidebar-heading">Browse</div>
      <a className="sidebar-link" href="/events">All Markets</a>
      <a className="sidebar-link" href="/events">CCNY</a>
      <a className="sidebar-link" href="/events">Sports</a>
      <a className="sidebar-link" href="/events">Politics</a>

      <div className="sidebar-divider"></div>

      <div className="sidebar-heading">Trending</div>
      <div id="sidebar-markets">
        {/* Later we will map your teammates' MarketCard components here */}
      </div>
    </aside>
  );
}
