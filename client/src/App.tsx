
import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Could not connect to backend."));
  }, []);

  return (
    <main>
      <h1>Event Platform</h1>
      <p>{message}</p>
    </main>
  );
}

export default App;

/*
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from '.pages/Home';
import BrowseEvents from '.pages/BrowseEvents';
import EventDetails from '.pages/EventDetails';
import AboutUs from '.pages/AboutUs';
import LogIn from '.pages/LogIn';
import OrganizerDashboard from '.pages/OrganizerDashboard';
import ManageEvents from '.pages/ManageEvents';
import CreateEvent from '.pages/CreateEvent'; //might just do modular
import EventAnalystics from '.pages/EventAnalytics';
import BoothManagement from '.pages/BoothManagement';
import Leaderboard from '.pages/Leaderboard';
import DigitalActivities from '.pages/DigitalActivities';
import ExhibitorDashboard from '.pages/ExhibitorDashboard';
import ExhibitorBooth from '.pages/ExhibitorBooth';
import ManageActivities from '.pages/ManageActivities';
import CreateActivites from '.pages/CreateActivities';
import EngagementReports from '.pages/EngagementReports';
import QRGenerator from '.pages/QRGenerator';
import AttendeeProfile from '.pages/AttendeeProfile';
import DigitalPassport from '.pages/DigitalPassport';
import ScavengerHunt from '.pages/ScavengerHunt';
import FavoriteExhibitors from '.pages/FavoriteExhibitors';
import AttendeeAchievements from '.pages/AttendeeAchivements';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={< />} />
          <Route path="" element={< />} />
          <Route path="" element={< />} />
          <Route path="" element={< />} />
          <Route path="" element={< />} />
          <Route path="" element={< />} />
          <Route path="" element={< />} />
          <Route path="" element={< />} />
          {/* Catch-all redirect to Dashboard */      /*} 
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
*/