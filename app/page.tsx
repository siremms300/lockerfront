// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Zap, 
  Bell, 
  BarChart3, 
  MapPin, 
  Shield,
  Clock,
  Users,
  ArrowRight,
  Menu,
  Mail,
  Phone,
  X,
  ChevronDown,
  User,
  LogOut,
  Settings,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI, merchantAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface Merchant {
  businessName: string
  email: string
  businessType: string
  avatar?: string
}

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setIsLoggedIn(false)
        setLoading(false)
        return
      }

      // Verify token by fetching profile
      const response = await merchantAPI.getProfile()
      setMerchant(response.data)
      setIsLoggedIn(true)
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('token')
      localStorage.removeItem('merchant')
      setIsLoggedIn(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      localStorage.removeItem('token')
      localStorage.removeItem('merchant')
      setIsLoggedIn(false)
      setMerchant(null)
      setUserMenuOpen(false)
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#api', label: 'API' },
    { href: '#contact', label: 'Contact' }
  ]

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo with Image - Larger size, no text */}
            <Link href="/" className="flex items-center">
              <div className="relative h-32 w-48">
                <Image
                  src="/logo.png"
                  alt="Locker Network"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-pepper-600 font-medium transition"
                >
                  {link.label}
                </a>
              ))}
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {loading ? (
                <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full"></div>
              ) : isLoggedIn && merchant ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    {merchant.avatar ? (
                      <div className="relative h-8 w-8">
                        <Image
                          src={merchant.avatar}
                          alt={merchant.businessName}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 bg-gradient-to-br from-pepper-500 to-pepper-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(merchant.businessName)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {merchant.businessName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                      >
                        <div className="p-2">
                          <Link href="/dashboard">
                            <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left">
                              <BarChart3 className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">Dashboard</span>
                            </button>
                          </Link>
                          <Link href="/dashboard/settings">
                            <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left">
                              <Settings className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">Settings</span>
                            </button>
                          </Link>
                          <div className="border-t border-gray-200 my-2"></div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-lg transition text-left text-red-600"
                          >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 hover:text-pepper-600 font-medium transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-6 py-2 pepper-gradient text-white rounded-lg hover:shadow-pepper transition-all font-medium flex items-center space-x-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur"
            >
              <div className="px-4 py-4 space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>

                {/* Mobile Auth Section */}
                <div className="border-t border-gray-200 pt-4">
                  {loading ? (
                    <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full mx-auto"></div>
                  ) : isLoggedIn && merchant ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                        {merchant.avatar ? (
                          <div className="relative h-10 w-10">
                            <Image
                              src={merchant.avatar}
                              alt={merchant.businessName}
                              fill
                              className="rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-gradient-to-br from-pepper-500 to-pepper-600 rounded-full flex items-center justify-center text-white font-bold">
                            {getInitials(merchant.businessName)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{merchant.businessName}</p>
                          <p className="text-xs text-gray-500">{merchant.email}</p>
                        </div>
                      </div>
                      <Link href="/dashboard">
                        <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition">
                          Dashboard
                        </button>
                      </Link>
                      <Link href="/dashboard/settings">
                        <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition">
                          Settings
                        </button>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        href="/login"
                        className="block w-full px-4 py-3 text-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="block w-full px-4 py-3 text-center pepper-gradient text-white rounded-lg hover:shadow-lg transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-pepper-50 text-pepper-700 mb-8 animate-fadeIn">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">REAL-TIME LOGISTICS PLATFORM</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight font-display">
              Transform Your
              <span className="text-pepper-500"> African E-commerce</span>
              <br />
              Delivery Experience
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Smart locker network with instant tracking, secure pickups, and automated logistics 
              designed specifically for African markets.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <button className="px-8 py-4 pepper-gradient text-white rounded-xl font-bold hover:shadow-pepper transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3">
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <button className="px-8 py-4 pepper-gradient text-white rounded-xl font-bold hover:shadow-pepper transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3">
                      <span>Start Free Trial</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </Link>
                  <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-pepper-500 hover:text-pepper-600 transition-all">
                    Watch Demo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '99.7%', label: 'Uptime', icon: Shield },
            { value: '50ms', label: 'Live Updates', icon: Zap },
            { value: '24/7', label: 'Access', icon: Clock },
            { value: '2,500+', label: 'Active Lockers', icon: MapPin },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-hard transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-pepper-50 rounded-xl">
                    <Icon className="h-6 w-6 text-pepper-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-gray-500 text-sm">{stat.label}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Features Section with ID for anchor links */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
              Everything You Need to Scale
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              From parcel creation to real-time tracking and analytics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: 'Smart Parcel Management',
                description: 'Create, track, and manage parcels with QR codes, real-time notifications, and automated workflows.',
                features: ['Bulk parcel creation', 'QR code generation', 'Real-time tracking']
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Get deep insights into delivery performance, customer behavior, and revenue optimization.',
                features: ['Live dashboards', 'Performance metrics', 'Revenue analytics']
              },
              {
                icon: MapPin,
                title: 'Network Coverage',
                description: 'Access to our growing network of secure locker locations across major African cities.',
                features: ['City-wide coverage', 'Secure locations', '24/7 access']
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-soft hover:shadow-hard transition-all duration-300 p-8">
                  <div className={`p-4 bg-pepper-50 rounded-xl w-fit mb-6`}>
                    <Icon className="h-8 w-8 text-pepper-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <div className="h-2 w-2 bg-pepper-500 rounded-full mr-3"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '₦15,000',
                period: '/month',
                features: ['100 parcels/month', 'Basic analytics', 'Email support', '5 locker locations']
              },
              {
                name: 'Business',
                price: '₦45,000',
                period: '/month',
                features: ['1,000 parcels/month', 'Advanced analytics', 'Priority support', 'All locations', 'API access'],
                popular: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                features: ['Unlimited parcels', 'Custom analytics', 'Dedicated support', 'SLA guarantee', 'White-label option']
              }
            ].map((plan, index) => (
              <div
                key={index}
                className={cn(
                  "bg-white rounded-2xl p-8 border-2 transition-all duration-300",
                  plan.popular 
                    ? "border-pepper-500 shadow-xl scale-105" 
                    : "border-gray-200 hover:border-pepper-300"
                )}
              >
                {plan.popular && (
                  <span className="bg-pepper-500 text-white px-3 py-1 rounded-full text-xs font-medium -mt-10 mb-4 inline-block">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                  <button className={cn(
                    "w-full py-3 rounded-lg font-medium transition",
                    plan.popular
                      ? "pepper-gradient text-white hover:shadow-lg"
                      : "border-2 border-gray-300 text-gray-700 hover:border-pepper-500 hover:text-pepper-600"
                  )}>
                    {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
                Powerful API for Developers
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Integrate our smart locker network directly into your existing systems with our comprehensive API.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'RESTful API with comprehensive documentation',
                  'Real-time webhooks for instant updates',
                  'Sandbox environment for testing',
                  'Rate limiting and authentication'
                ].map((item, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <div className="h-2 w-2 bg-pepper-500 rounded-full mr-3"></div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={isLoggedIn ? "/dashboard/settings?tab=api" : "/register"}>
                <button className="px-8 py-4 pepper-gradient text-white rounded-lg font-bold hover:shadow-lg transition">
                  {isLoggedIn ? 'View API Keys' : 'Get API Access'}
                </button>
              </Link>
            </div>
            <div className="bg-gray-900 rounded-2xl p-8 text-white">
              <pre className="text-sm overflow-x-auto">
                <code>{`// Example API Request
const response = await fetch('https://api.lockernetwork.africa/v1/parcels', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer: {
      name: 'John Doe',
      phone: '+2348012345678'
    },
    items: [{
      description: 'Smartphone',
      value: 150000
    }],
    delivery: {
      location: 'ikeja_mall',
      pickupDeadline: '2024-04-01'
    }
  })
});

const parcel = await response.json();`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="pepper-gradient rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-6 font-display">
              Ready to Transform Your Logistics?
            </h2>
            <p className="text-pepper-100 text-lg mb-8">
              Join hundreds of merchants already using Locker Network to streamline their delivery operations.
            </p>
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              <button className="px-10 py-4 bg-white text-pepper-600 font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {isLoggedIn ? 'Go to Dashboard' : 'Get Started for Free'}
              </button>
            </Link>
            <p className="mt-6 text-pepper-200 text-sm">
              No credit card required • 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
              Get in Touch
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Have questions? We're here to help
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Mail, title: 'Email', value: 'hello@lockernetwork.africa', action: 'Send email' },
              { icon: Phone, title: 'Phone', value: '+234 800 123 4567', action: 'Call us' },
              { icon: MapPin, title: 'Office', value: 'Lagos, Nigeria', action: 'View map' }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition">
                  <div className="p-4 bg-pepper-50 rounded-xl w-fit mx-auto mb-6">
                    <Icon className="h-8 w-8 text-pepper-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-4">{item.value}</p>
                  <button className="text-pepper-600 font-medium hover:text-pepper-700">
                    {item.action} →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="relative h-12 w-48">
                <Image
                  src="/logo.png"
                  alt="Locker Network"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
              <a href="#" className="hover:text-white transition">GitHub</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
          </div>
          <div className="text-center mt-8 text-gray-400 text-sm">
            © 2026 Locker Network. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}



























































































// // app/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   Package, 
//   Zap, 
//   Bell, 
//   BarChart3, 
//   MapPin, 
//   Shield,
//   Clock,
//   Users,
//   ArrowRight,
//   Menu,
//   Mail,
//   Phone,
//   X,
//   ChevronDown,
//   User,
//   LogOut,
//   Settings,
//   CreditCard
// } from 'lucide-react'
// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { motion, AnimatePresence } from 'framer-motion'
// import { authAPI, merchantAPI } from '@/lib/api'
// import { toast } from 'react-hot-toast'
// import { cn } from '@/lib/utils'

// interface Merchant {
//   businessName: string
//   email: string
//   businessType: string
//   avatar?: string
// }

// export default function Home() {
//   const router = useRouter()
//   const [isLoggedIn, setIsLoggedIn] = useState(false)
//   const [merchant, setMerchant] = useState<Merchant | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
//   const [userMenuOpen, setUserMenuOpen] = useState(false)

//   // Check authentication status on mount
//   useEffect(() => {
//     checkAuthStatus()
//   }, [])

//   const checkAuthStatus = async () => {
//     try {
//       const token = localStorage.getItem('token')
      
//       if (!token) {
//         setIsLoggedIn(false)
//         setLoading(false)
//         return
//       }

//       // Verify token by fetching profile
//       const response = await merchantAPI.getProfile()
//       setMerchant(response.data)
//       setIsLoggedIn(true)
//     } catch (error) {
//       // Token invalid or expired
//       localStorage.removeItem('token')
//       localStorage.removeItem('merchant')
//       setIsLoggedIn(false)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleLogout = async () => {
//     try {
//       await authAPI.logout()
//       localStorage.removeItem('token')
//       localStorage.removeItem('merchant')
//       setIsLoggedIn(false)
//       setMerchant(null)
//       setUserMenuOpen(false)
//       toast.success('Logged out successfully')
//       router.push('/')
//     } catch (error) {
//       toast.error('Failed to logout')
//     }
//   }

//   const getInitials = (name: string) => {
//     return name
//       .split(' ')
//       .map(word => word[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2)
//   }

//   const navLinks = [
//     { href: '#features', label: 'Features' },
//     { href: '#pricing', label: 'Pricing' },
//     { href: '#api', label: 'API' },
//     { href: '#contact', label: 'Contact' }
//   ]

//   return (
//     <div className="min-h-screen bg-linear-to-br from-white via-gray-50 to-gray-100">
//       {/* Navigation */}
//       <nav className="sticky top-0 z-50 glass-effect">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             {/* Logo */}
//             <Link href="/" className="flex items-center space-x-3">
//               <div className="p-2 bg-pepper-500 rounded-lg">
//                 <Package className="h-6 w-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-bold text-gray-900 font-display">LOCKER NETWORK</h1>
//                 <p className="text-xs text-gray-500">Smart Logistics</p>
//               </div>
//             </Link>
            
//             {/* Desktop Navigation Links */}
//             <div className="hidden md:flex items-center space-x-8">
//               {navLinks.map((link) => (
//                 <a
//                   key={link.href}
//                   href={link.href}
//                   className="text-gray-700 hover:text-pepper-600 font-medium transition"
//                 >
//                   {link.label}
//                 </a>
//               ))}
//             </div>
            
//             {/* Desktop Auth Buttons */}
//             <div className="hidden md:flex items-center space-x-4">
//               {loading ? (
//                 <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full"></div>
//               ) : isLoggedIn && merchant ? (
//                 <div className="relative">
//                   <button
//                     onClick={() => setUserMenuOpen(!userMenuOpen)}
//                     className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition"
//                   >
//                     <div className="h-8 w-8 bg-gradient-to-br from-pepper-500 to-pepper-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
//                       {getInitials(merchant.businessName)}
//                     </div>
//                     <span className="text-sm font-medium text-gray-700">
//                       {merchant.businessName}
//                     </span>
//                     <ChevronDown className="h-4 w-4 text-gray-500" />
//                   </button>

//                   {/* User Dropdown Menu */}
//                   <AnimatePresence>
//                     {userMenuOpen && (
//                       <motion.div
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: 10 }}
//                         className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
//                       >
//                         <div className="p-2">
//                           <Link href="/dashboard">
//                             <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left">
//                               <BarChart3 className="h-4 w-4 text-gray-500" />
//                               <span className="text-sm text-gray-700">Dashboard</span>
//                             </button>
//                           </Link>
//                           <Link href="/dashboard/settings">
//                             <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left">
//                               <Settings className="h-4 w-4 text-gray-500" />
//                               <span className="text-sm text-gray-700">Settings</span>
//                             </button>
//                           </Link>
//                           <div className="border-t border-gray-200 my-2"></div>
//                           <button
//                             onClick={handleLogout}
//                             className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-lg transition text-left text-red-600"
//                           >
//                             <LogOut className="h-4 w-4" />
//                             <span className="text-sm">Logout</span>
//                           </button>
//                         </div>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               ) : (
//                 <>
//                   <Link
//                     href="/login"
//                     className="px-4 py-2 text-gray-700 hover:text-pepper-600 font-medium transition"
//                   >
//                     Sign In
//                   </Link>
//                   <Link
//                     href="/register"
//                     className="px-6 py-2 pepper-gradient text-white rounded-lg hover:shadow-pepper transition-all font-medium flex items-center space-x-2"
//                   >
//                     <span>Get Started</span>
//                     <ArrowRight className="h-4 w-4" />
//                   </Link>
//                 </>
//               )}
//             </div>

//             {/* Mobile Menu Button */}
//             <button
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//               className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
//             >
//               {mobileMenuOpen ? (
//                 <X className="h-6 w-6 text-gray-600" />
//               ) : (
//                 <Menu className="h-6 w-6 text-gray-600" />
//               )}
//             </button>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         <AnimatePresence>
//           {mobileMenuOpen && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: 'auto' }}
//               exit={{ opacity: 0, height: 0 }}
//               className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur"
//             >
//               <div className="px-4 py-4 space-y-4">
//                 {/* Mobile Navigation Links */}
//                 <div className="space-y-2">
//                   {navLinks.map((link) => (
//                     <a
//                       key={link.href}
//                       href={link.href}
//                       className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
//                       onClick={() => setMobileMenuOpen(false)}
//                     >
//                       {link.label}
//                     </a>
//                   ))}
//                 </div>

//                 {/* Mobile Auth Section */}
//                 <div className="border-t border-gray-200 pt-4">
//                   {loading ? (
//                     <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full mx-auto"></div>
//                   ) : isLoggedIn && merchant ? (
//                     <div className="space-y-3">
//                       <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
//                         <div className="h-10 w-10 bg-gradient-to-br from-pepper-500 to-pepper-600 rounded-full flex items-center justify-center text-white font-bold">
//                           {getInitials(merchant.businessName)}
//                         </div>
//                         <div>
//                           <p className="font-medium text-gray-900">{merchant.businessName}</p>
//                           <p className="text-xs text-gray-500">{merchant.email}</p>
//                         </div>
//                       </div>
//                       <Link href="/dashboard">
//                         <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition">
//                           Dashboard
//                         </button>
//                       </Link>
//                       <Link href="/dashboard/settings">
//                         <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition">
//                           Settings
//                         </button>
//                       </Link>
//                       <button
//                         onClick={handleLogout}
//                         className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition"
//                       >
//                         Logout
//                       </button>
//                     </div>
//                   ) : (
//                     <div className="space-y-3">
//                       <Link
//                         href="/login"
//                         className="block w-full px-4 py-3 text-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
//                         onClick={() => setMobileMenuOpen(false)}
//                       >
//                         Sign In
//                       </Link>
//                       <Link
//                         href="/register"
//                         className="block w-full px-4 py-3 text-center pepper-gradient text-white rounded-lg hover:shadow-lg transition"
//                         onClick={() => setMobileMenuOpen(false)}
//                       >
//                         Get Started
//                       </Link>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </nav>

//       {/* Hero Section */}
//       <section className="relative overflow-hidden">
//         <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
//           <div className="text-center">
//             <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-pepper-50 text-pepper-700 mb-8 animate-fadeIn">
//               <Zap className="h-4 w-4" />
//               <span className="text-sm font-medium">REAL-TIME LOGISTICS PLATFORM</span>
//             </div>
            
//             <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight font-display">
//               Transform Your
//               <span className="text-pepper-500"> African E-commerce</span>
//               <br />
//               Delivery Experience
//             </h1>
            
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
//               Smart locker network with instant tracking, secure pickups, and automated logistics 
//               designed specifically for African markets.
//             </p>
            
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               {isLoggedIn ? (
//                 <Link href="/dashboard">
//                   <button className="px-8 py-4 pepper-gradient text-white rounded-xl font-bold hover:shadow-pepper transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3">
//                     <span>Go to Dashboard</span>
//                     <ArrowRight className="h-5 w-5" />
//                   </button>
//                 </Link>
//               ) : (
//                 <>
//                   <Link href="/register">
//                     <button className="px-8 py-4 pepper-gradient text-white rounded-xl font-bold hover:shadow-pepper transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3">
//                       <span>Start Free Trial</span>
//                       <ArrowRight className="h-5 w-5" />
//                     </button>
//                   </Link>
//                   <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-pepper-500 hover:text-pepper-600 transition-all">
//                     Watch Demo
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Stats */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-20">
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//           {[
//             { value: '99.7%', label: 'Uptime', icon: Shield },
//             { value: '50ms', label: 'Live Updates', icon: Zap },
//             { value: '24/7', label: 'Access', icon: Clock },
//             { value: '2,500+', label: 'Active Lockers', icon: MapPin },
//           ].map((stat, index) => {
//             const Icon = stat.icon;
//             return (
//               <div key={index} className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-hard transition-shadow">
//                 <div className="flex items-center space-x-4">
//                   <div className="p-3 bg-pepper-50 rounded-xl">
//                     <Icon className="h-6 w-6 text-pepper-600" />
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
//                     <div className="text-gray-500 text-sm">{stat.label}</div>
//                   </div>
//                 </div>
//               </div>
//             )
//           })}
//         </div>
//       </div>

//       {/* Features Section with ID for anchor links */}
//       <section id="features" className="py-20 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
//               Everything You Need to Scale
//             </h2>
//             <p className="text-gray-600 text-lg max-w-2xl mx-auto">
//               From parcel creation to real-time tracking and analytics
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {[
//               {
//                 icon: Package,
//                 title: 'Smart Parcel Management',
//                 description: 'Create, track, and manage parcels with QR codes, real-time notifications, and automated workflows.',
//                 features: ['Bulk parcel creation', 'QR code generation', 'Real-time tracking']
//               },
//               {
//                 icon: BarChart3,
//                 title: 'Advanced Analytics',
//                 description: 'Get deep insights into delivery performance, customer behavior, and revenue optimization.',
//                 features: ['Live dashboards', 'Performance metrics', 'Revenue analytics']
//               },
//               {
//                 icon: MapPin,
//                 title: 'Network Coverage',
//                 description: 'Access to our growing network of secure locker locations across major African cities.',
//                 features: ['City-wide coverage', 'Secure locations', '24/7 access']
//               },
//             ].map((feature, index) => {
//               const Icon = feature.icon;
//               return (
//                 <div key={index} className="bg-white rounded-2xl shadow-soft hover:shadow-hard transition-all duration-300 p-8">
//                   <div className={`p-4 bg-pepper-50 rounded-xl w-fit mb-6`}>
//                     <Icon className="h-8 w-8 text-pepper-600" />
//                   </div>
//                   <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
//                   <p className="text-gray-600 mb-6">{feature.description}</p>
//                   <ul className="space-y-3">
//                     {feature.features.map((item, idx) => (
//                       <li key={idx} className="flex items-center text-gray-700">
//                         <div className="h-2 w-2 bg-pepper-500 rounded-full mr-3"></div>
//                         {item}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )
//             })}
//           </div>
//         </div>
//       </section>

//       {/* Pricing Section */}
//       <section id="pricing" className="py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
//               Simple, Transparent Pricing
//             </h2>
//             <p className="text-gray-600 text-lg max-w-2xl mx-auto">
//               Choose the plan that fits your business needs
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {[
//               {
//                 name: 'Starter',
//                 price: '₦15,000',
//                 period: '/month',
//                 features: ['100 parcels/month', 'Basic analytics', 'Email support', '5 locker locations']
//               },
//               {
//                 name: 'Business',
//                 price: '₦45,000',
//                 period: '/month',
//                 features: ['1,000 parcels/month', 'Advanced analytics', 'Priority support', 'All locations', 'API access'],
//                 popular: true
//               },
//               {
//                 name: 'Enterprise',
//                 price: 'Custom',
//                 period: '',
//                 features: ['Unlimited parcels', 'Custom analytics', 'Dedicated support', 'SLA guarantee', 'White-label option']
//               }
//             ].map((plan, index) => (
//               <div
//                 key={index}
//                 className={cn(
//                   "bg-white rounded-2xl p-8 border-2 transition-all duration-300",
//                   plan.popular 
//                     ? "border-pepper-500 shadow-xl scale-105" 
//                     : "border-gray-200 hover:border-pepper-300"
//                 )}
//               >
//                 {plan.popular && (
//                   <span className="bg-pepper-500 text-white px-3 py-1 rounded-full text-xs font-medium -mt-10 mb-4 inline-block">
//                     Most Popular
//                   </span>
//                 )}
//                 <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
//                 <div className="mb-6">
//                   <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
//                   <span className="text-gray-600">{plan.period}</span>
//                 </div>
//                 <ul className="space-y-3 mb-8">
//                   {plan.features.map((feature, idx) => (
//                     <li key={idx} className="flex items-center text-gray-700">
//                       <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
//                       {feature}
//                     </li>
//                   ))}
//                 </ul>
//                 <Link href={isLoggedIn ? "/dashboard" : "/register"}>
//                   <button className={cn(
//                     "w-full py-3 rounded-lg font-medium transition",
//                     plan.popular
//                       ? "pepper-gradient text-white hover:shadow-lg"
//                       : "border-2 border-gray-300 text-gray-700 hover:border-pepper-500 hover:text-pepper-600"
//                   )}>
//                     {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
//                   </button>
//                 </Link>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* API Section */}
//       <section id="api" className="py-20 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
//             <div>
//               <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
//                 Powerful API for Developers
//               </h2>
//               <p className="text-gray-600 text-lg mb-6">
//                 Integrate our smart locker network directly into your existing systems with our comprehensive API.
//               </p>
//               <ul className="space-y-4 mb-8">
//                 {[
//                   'RESTful API with comprehensive documentation',
//                   'Real-time webhooks for instant updates',
//                   'Sandbox environment for testing',
//                   'Rate limiting and authentication'
//                 ].map((item, index) => (
//                   <li key={index} className="flex items-center text-gray-700">
//                     <div className="h-2 w-2 bg-pepper-500 rounded-full mr-3"></div>
//                     {item}
//                   </li>
//                 ))}
//               </ul>
//               <Link href={isLoggedIn ? "/dashboard/settings?tab=api" : "/register"}>
//                 <button className="px-8 py-4 pepper-gradient text-white rounded-lg font-bold hover:shadow-lg transition">
//                   {isLoggedIn ? 'View API Keys' : 'Get API Access'}
//                 </button>
//               </Link>
//             </div>
//             <div className="bg-gray-900 rounded-2xl p-8 text-white">
//               <pre className="text-sm overflow-x-auto">
//                 <code>{`// Example API Request
// const response = await fetch('https://api.lockernetwork.africa/v1/parcels', {
//   method: 'POST',
//   headers: {
//     'Authorization': 'Bearer YOUR_API_KEY',
//     'Content-Type': 'application/json'
//   },
//   body: JSON.stringify({
//     customer: {
//       name: 'John Doe',
//       phone: '+2348012345678'
//     },
//     items: [{
//       description: 'Smartphone',
//       value: 150000
//     }],
//     delivery: {
//       location: 'ikeja_mall',
//       pickupDeadline: '2024-04-01'
//     }
//   })
// });

// const parcel = await response.json();`}</code>
//               </pre>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="py-20">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <div className="pepper-gradient rounded-3xl p-12 text-white">
//             <h2 className="text-4xl font-bold mb-6 font-display">
//               Ready to Transform Your Logistics?
//             </h2>
//             <p className="text-pepper-100 text-lg mb-8">
//               Join hundreds of merchants already using Locker Network to streamline their delivery operations.
//             </p>
//             <Link href={isLoggedIn ? "/dashboard" : "/register"}>
//               <button className="px-10 py-4 bg-white text-pepper-600 font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
//                 {isLoggedIn ? 'Go to Dashboard' : 'Get Started for Free'}
//               </button>
//             </Link>
//             <p className="mt-6 text-pepper-200 text-sm">
//               No credit card required • 14-day free trial
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* Contact Section */}
//       <section id="contact" className="py-20 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
//               Get in Touch
//             </h2>
//             <p className="text-gray-600 text-lg max-w-2xl mx-auto">
//               Have questions? We're here to help
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {[
//               { icon: Mail, title: 'Email', value: 'hello@lockernetwork.africa', action: 'Send email' },
//               { icon: Phone, title: 'Phone', value: '+234 800 123 4567', action: 'Call us' },
//               { icon: MapPin, title: 'Office', value: 'Lagos, Nigeria', action: 'View map' }
//             ].map((item, index) => {
//               const Icon = item.icon
//               return (
//                 <div key={index} className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition">
//                   <div className="p-4 bg-pepper-50 rounded-xl w-fit mx-auto mb-6">
//                     <Icon className="h-8 w-8 text-pepper-600" />
//                   </div>
//                   <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
//                   <p className="text-gray-600 mb-4">{item.value}</p>
//                   <button className="text-pepper-600 font-medium hover:text-pepper-700">
//                     {item.action} →
//                   </button>
//                 </div>
//               )
//             })}
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-gray-300 py-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col md:flex-row justify-between items-center">
//             <div className="flex items-center space-x-3 mb-6 md:mb-0">
//               <div className="p-2 bg-pepper-500 rounded-lg">
//                 <Package className="h-5 w-5 text-white" />
//               </div>
//               <div>
//                 <h3 className="text-xl font-bold text-white font-display">LOCKER NETWORK</h3>
//                 <p className="text-gray-400 text-sm">© 2024 All rights reserved</p>
//               </div>
//             </div>
            
//             <div className="flex space-x-6">
//               <a href="#" className="hover:text-white transition">Twitter</a>
//               <a href="#" className="hover:text-white transition">LinkedIn</a>
//               <a href="#" className="hover:text-white transition">GitHub</a>
//               <a href="#" className="hover:text-white transition">Contact</a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }









































// // app/page.tsx
// import { 
//   Package, 
//   Zap, 
//   Bell, 
//   BarChart3, 
//   MapPin, 
//   Shield,
//   Clock,
//   Users,
//   ArrowRight
// } from 'lucide-react'

// export default function Home() {
//   return (
//     <div className="min-h-screen bg-linear-to-br from-white via-gray-50 to-gray-100">
//       {/* Navigation */}
//       <nav className="sticky top-0 z-50 glass-effect">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center space-x-3">
//               <div className="p-2 bg-pepper-500 rounded-lg">
//                 <Package className="h-6 w-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-bold text-gray-900 font-display">LOCKER NETWORK</h1>
//                 <p className="text-xs text-gray-500">Merchant Portal</p>
//               </div>
//             </div>
            
//             <div className="hidden md:flex items-center space-x-8">
//               <a href="#" className="text-gray-700 hover:text-pepper-600 font-medium">Features</a>
//               <a href="#" className="text-gray-700 hover:text-pepper-600 font-medium">Pricing</a>
//               <a href="#" className="text-gray-700 hover:text-pepper-600 font-medium">API</a>
//               <a href="#" className="text-gray-700 hover:text-pepper-600 font-medium">Contact</a>
//             </div>
            
//             <div className="flex items-center space-x-4">
//               <button className="px-4 py-2 text-gray-700 hover:text-pepper-600 font-medium">
//                 Sign In
//               </button>
//               <button className="px-6 py-2 pepper-gradient text-white rounded-lg hover:shadow-pepper transition-all font-medium flex items-center space-x-2">
//                 <span>Get Started</span>
//                 <ArrowRight className="h-4 w-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="relative overflow-hidden">
//         <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
//           <div className="text-center">
//             <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-pepper-50 text-pepper-700 mb-8 animate-fadeIn">
//               <Zap className="h-4 w-4" />
//               <span className="text-sm font-medium">REAL-TIME LOGISTICS PLATFORM</span>
//             </div>
            
//             <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight font-display">
//               Transform Your
//               <span className="text-pepper-500"> African E-commerce</span>
//               <br />
//               Delivery Experience
//             </h1>
            
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
//               Smart locker network with instant tracking, secure pickups, and automated logistics 
//               designed specifically for African markets.
//             </p>
            
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <button className="px-8 py-4 pepper-gradient text-white rounded-xl font-bold hover:shadow-pepper transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3">
//                 <span>Start Free Trial</span>
//                 <ArrowRight className="h-5 w-5" />
//               </button>
//               <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-pepper-500 hover:text-pepper-600 transition-all">
//                 Watch Demo
//               </button>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Stats */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-20">
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//           {[
//             { value: '99.7%', label: 'Uptime', icon: Shield },
//             { value: '50ms', label: 'Live Updates', icon: Zap },
//             { value: '24/7', label: 'Access', icon: Clock },
//             { value: '2,500+', label: 'Active Lockers', icon: MapPin },
//           ].map((stat, index) => {
//             const Icon = stat.icon;
//             return (
//               <div key={index} className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-hard transition-shadow">
//                 <div className="flex items-center space-x-4">
//                   <div className="p-3 bg-pepper-50 rounded-xl">
//                     <Icon className="h-6 w-6 text-pepper-600" />
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
//                     <div className="text-gray-500 text-sm">{stat.label}</div>
//                   </div>
//                 </div>
//               </div>
//             )
//           })}
//         </div>
//       </div>

//       {/* Features */}
//       <section className="py-20 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4 font-display">
//               Everything You Need to Scale
//             </h2>
//             <p className="text-gray-600 text-lg max-w-2xl mx-auto">
//               From parcel creation to real-time tracking and analytics
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {[
//               {
//                 icon: Package,
//                 title: 'Smart Parcel Management',
//                 description: 'Create, track, and manage parcels with QR codes, real-time notifications, and automated workflows.',
//                 features: ['Bulk parcel creation', 'QR code generation', 'Real-time tracking']
//               },
//               {
//                 icon: BarChart3,
//                 title: 'Advanced Analytics',
//                 description: 'Get deep insights into delivery performance, customer behavior, and revenue optimization.',
//                 features: ['Live dashboards', 'Performance metrics', 'Revenue analytics']
//               },
//               {
//                 icon: MapPin,
//                 title: 'Network Coverage',
//                 description: 'Access to our growing network of secure locker locations across major African cities.',
//                 features: ['City-wide coverage', 'Secure locations', '24/7 access']
//               },
//             ].map((feature, index) => {
//               const Icon = feature.icon;
//               return (
//                 <div key={index} className="bg-white rounded-2xl shadow-soft hover:shadow-hard transition-all duration-300 p-8">
//                   <div className={`p-4 bg-pepper-50 rounded-xl w-fit mb-6`}>
//                     <Icon className="h-8 w-8 text-pepper-600" />
//                   </div>
//                   <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
//                   <p className="text-gray-600 mb-6">{feature.description}</p>
//                   <ul className="space-y-3">
//                     {feature.features.map((item, idx) => (
//                       <li key={idx} className="flex items-center text-gray-700">
//                         <div className="h-2 w-2 bg-pepper-500 rounded-full mr-3"></div>
//                         {item}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )
//             })}
//           </div>
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="py-20">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <div className="pepper-gradient rounded-3xl p-12 text-white">
//             <h2 className="text-4xl font-bold mb-6 font-display">
//               Ready to Transform Your Logistics?
//             </h2>
//             <p className="text-pepper-100 text-lg mb-8">
//               Join hundreds of merchants already using Locker Network to streamline their delivery operations.
//             </p>
//             <button className="px-10 py-4 bg-white text-pepper-600 font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
//               Get Started for Free
//             </button>
//             <p className="mt-6 text-pepper-200 text-sm">
//               No credit card required • 14-day free trial
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-gray-300 py-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col md:flex-row justify-between items-center">
//             <div className="flex items-center space-x-3 mb-6 md:mb-0">
//               <div className="p-2 bg-pepper-500 rounded-lg">
//                 <Package className="h-5 w-5 text-white" />
//               </div>
//               <div>
//                 <h3 className="text-xl font-bold text-white font-display">LOCKER NETWORK</h3>
//                 <p className="text-gray-400 text-sm">© 2024 All rights reserved</p>
//               </div>
//             </div>
            
//             <div className="flex space-x-6">
//               <a href="#" className="hover:text-white transition">Twitter</a>
//               <a href="#" className="hover:text-white transition">LinkedIn</a>
//               <a href="#" className="hover:text-white transition">GitHub</a>
//               <a href="#" className="hover:text-white transition">Contact</a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }

































































































// // app/page.tsx
// import { Package, Zap, Bell, BarChart3, MapPin } from 'lucide-react'

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row items-center justify-between mb-12">
//           <div className="flex items-center space-x-4 mb-6 md:mb-0">
//             <div className="p-3 bg-red-600 rounded-xl shadow-lg">
//               <Package className="h-8 w-8 text-white" />
//             </div>
//             <div>
//               <h1 className="text-4xl font-bold text-gray-900">Locker Network</h1>
//               <p className="text-gray-600 text-lg">Merchant Portal</p>
//             </div>
//           </div>
//           <div className="flex space-x-4">
//             <button className="px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition flex items-center space-x-2">
//               <Bell className="h-5 w-5" />
//               <span>Login</span>
//             </button>
//             <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2">
//               <Zap className="h-5 w-5" />
//               <span>Get Started</span>
//             </button>
//           </div>
//         </div>

//         {/* Hero Section */}
//         <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-3xl p-8 md:p-12 text-white mb-16 shadow-2xl">
//           <div className="max-w-3xl">
//             <div className="flex items-center space-x-3 mb-6">
//               <div className="p-2 bg-white/20 rounded-lg">
//                 <Zap className="h-6 w-6" />
//               </div>
//               <span className="font-semibold">REAL-TIME LOGISTICS</span>
//             </div>
//             <h2 className="text-5xl font-bold mb-6 leading-tight">
//               Transform Your E-commerce Delivery Across Africa
//             </h2>
//             <p className="text-xl text-red-100 mb-8">
//               Smart locker network with instant tracking, secure pickups, and automated logistics for merchants.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4">
//               <button className="px-8 py-4 bg-white text-red-600 font-bold rounded-xl hover:bg-gray-100 transition transform hover:-translate-y-1 shadow-lg">
//                 Start Free Trial
//               </button>
//               <button className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition">
//                 Watch Demo →
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
//           {[
//             { value: '24/7', label: 'Access' },
//             { value: '99%', label: 'Reliability' },
//             { value: '2,500+', label: 'Lockers' },
//             { value: '50ms', label: 'Live Updates' },
//           ].map((stat, index) => (
//             <div key={index} className="bg-white p-6 rounded-2xl shadow-lg text-center">
//               <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
//               <div className="text-gray-600">{stat.label}</div>
//             </div>
//           ))}
//         </div>

//         {/* Features */}
//         <div className="mb-16">
//           <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
//             Everything You Need to Scale
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {[
//               { 
//                 icon: Package, 
//                 title: 'Smart Parcel Management', 
//                 desc: 'Create, track, and manage parcels with QR codes, real-time notifications, and automated workflows.',
//                 color: 'bg-red-100 text-red-600'
//               },
//               { 
//                 icon: BarChart3, 
//                 title: 'Live Analytics Dashboard', 
//                 desc: 'Advanced insights into delivery performance, customer behavior, and revenue tracking.',
//                 color: 'bg-blue-100 text-blue-600'
//               },
//               { 
//                 icon: MapPin, 
//                 title: 'Network Coverage', 
//                 desc: 'Access to our growing network of secure locker locations across major African cities.',
//                 color: 'bg-green-100 text-green-600'
//               },
//             ].map((feature, index) => (
//               <div key={index} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
//                 <div className={`${feature.color} p-4 rounded-xl w-fit mb-6`}>
//                   <feature.icon className="h-8 w-8" />
//                 </div>
//                 <h4 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h4>
//                 <p className="text-gray-600">{feature.desc}</p>
//                 <button className="mt-6 text-red-600 font-semibold hover:text-red-700 flex items-center">
//                   Learn more →
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* CTA */}
//         <div className="text-center">
//           <h3 className="text-3xl font-bold text-gray-900 mb-6">
//             Ready to Transform Your Logistics?
//           </h3>
//           <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
//             Join hundreds of merchants already using Locker Network to streamline their delivery operations and grow their business.
//           </p>
//           <button className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
//             Get Started for Free
//           </button>
//         </div>
//       </div>
//     </main>
//   )
// }