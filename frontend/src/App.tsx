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
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Login from './pages/Login'
import UIKit from './pages/UIKit'
import Sitemap from './pages/Sitemap'
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
          <Route
            path="dashboard"
            element={
              <RequireAuth>
                <Dashboard />
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
          <Route path="ui-kit" element={<UIKit />} />
          <Route path="sitemap" element={<Sitemap />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
