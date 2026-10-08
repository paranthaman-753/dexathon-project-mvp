import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-screen">
      <div className="card hero-card">
        <p className="eyebrow">பேசும் கணக்கு</p>
        <h1>Pesum Kanakku</h1>
        <p className="subtext">Welcome</p>
        <p className="small-text">உங்கள் கணக்கை பதிவு செய்யுங்கள்</p>

        <Link to="/new-entry" className="primary-button large-button">
          + New Entry
        </Link>
      </div>

      <div className="card action-card">
        <h2>Customers</h2>
        <Link to="/customers" className="secondary-button full-width">
          View Customers
        </Link>
      </div>
    </div>
  );
}
