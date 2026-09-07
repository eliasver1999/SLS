import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Solutions from './pages/Solutions'
import Catalogue from './pages/Catalogue'
import Product from './pages/Product'
import Apply from './pages/Apply'
import About from './pages/About'
import Projects from './pages/Projects'
import Contact from './pages/Contact'
import OrderReceived from './pages/OrderReceived'
import OrderDetail from './pages/OrderDetail'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import UIKit from './pages/UIKit'
import Sitemap from './pages/Sitemap'
import NotFound from './pages/NotFound'
import Quote from './pages/Quote'
import Legal from './pages/Legal'
import Profile from './pages/Profile'
import Documents from './pages/Documents'
import { RequireAdmin, RequireAuth } from './components/Guards'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="solutions" element={<Solutions />} />
          <Route path="catalogue" element={<Catalogue />} />
          <Route path="product/:slug" element={<Product />} />
          <Route path="apply" element={<Apply />} />
          <Route path="about" element={<About />} />
          <Route path="projects" element={<Projects />} />
          <Route path="contact" element={<Contact />} />
          <Route path="order-received" element={<OrderReceived />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route
            path="dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="documents"
            element={
              <RequireAuth>
                <Documents />
              </RequireAuth>
            }
          />
          <Route
            path="orders/:id"
            element={
              <RequireAuth>
                <OrderDetail />
              </RequireAuth>
            }
          />
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route path="quote" element={<Quote />} />
          <Route path="privacy" element={<Legal doc="privacy" />} />
          <Route path="cookies" element={<Legal doc="storage" />} />
          <Route path="terms" element={<Legal doc="terms" />} />
          {/* Internal references — the design system and the IA diagram.
              They were reachable by anyone who guessed the URL, and used to
              be linked from the footer. Kept for the team, behind the admin
              guard. */}
          <Route
            path="ui-kit"
            element={
              <RequireAdmin>
                <UIKit />
              </RequireAdmin>
            }
          />
          <Route
            path="sitemap"
            element={
              <RequireAdmin>
                <Sitemap />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
