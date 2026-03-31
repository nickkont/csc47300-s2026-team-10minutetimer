import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-inner">
          <Link className="brand" to="/">
            <div className="logo"></div>
            <strong>Eventra</strong>
          </Link>

          <div className="nav-links">
            <Link to="/marketplace">Markets</Link>
            <Link to="/marketplace">CCNY</Link>
            <Link to="/">Community</Link>
            <Link to="/account">Account</Link>
          </div>

          <div className="nav-actions-right">
            <span id="nav-auth">
              <Link className="btn-nav-ghost" to="/login">Log in</Link>
              <Link className="btn-nav-primary" to="/signup">Sign up</Link>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
