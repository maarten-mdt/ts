import { Routes, Route } from 'react-router-dom'
import Layout from './layout/Layout'
import Home from './pages/Home'
import Ranges from './pages/Ranges'
import RangeDetail from './pages/RangeDetail'
import Gunsmiths from './pages/Gunsmiths'
import GunsmithDetail from './pages/GunsmithDetail'
import NFATracker from './pages/NFATracker'
import Compatibility from './pages/Compatibility'
import Matches from './pages/Matches'
import Admin from './pages/Admin'
import About from './pages/About'
import Contact from './pages/Contact'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="ranges" element={<Ranges />} />
        <Route path="ranges/:slug" element={<RangeDetail />} />
        <Route path="gunsmiths" element={<Gunsmiths />} />
        <Route path="gunsmiths/:slug" element={<GunsmithDetail />} />
        <Route path="nfa-tracker" element={<NFATracker />} />
        <Route path="compatibility" element={<Compatibility />} />
        <Route path="matches" element={<Matches />} />
        <Route path="admin" element={<Admin />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
      </Route>
    </Routes>
  )
}
