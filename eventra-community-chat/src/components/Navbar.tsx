export default function Navbar() {
  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-inner">
          <a className="brand" href="#">
            <div className="logo"></div>
            <strong>Eventra</strong>
          </a>

          <div className="nav-links">
            <a href="#">Markets</a>
            <a href="#">CCNY</a>
            <a href="#" className="active">Community</a>
            <a href="#">Account</a>
          </div>

          <div className="nav-actions-right">
            <span id="nav-auth">
              <a className="btn-nav-ghost" href="/login">Log in</a>
              <a className="btn-nav-primary" href="/signup">Sign up</a>
            </span>

            <div className="avatar">JD</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
