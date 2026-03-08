import { useState } from 'react'
import { Outlet, Link, NavLink } from 'react-router-dom'
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/clerk-react'

const navItems = [
  { to: '/ranges', label: 'Find a Range' },
  { to: '/gunsmiths', label: 'Find a Gunsmith' },
  { to: '/nfa-tracker', label: 'NFA Tracker' },
  { to: '/compatibility', label: 'Parts Compatibility' },
  { to: '/matches', label: 'Matches & Events', comingSoon: true },
]

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isSignedIn } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur border-b border-stone-800">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/" className="font-semibold text-lg text-stone-100 tracking-tight">
              TacticalShack
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, label, comingSoon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded text-sm font-medium transition-colors ${
                      comingSoon ? 'text-stone-500 cursor-default' : ''
                    } ${
                      isActive && !comingSoon
                        ? 'text-accent bg-surface-elevated'
                        : !comingSoon
                        ? 'text-stone-300 hover:text-stone-100 hover:bg-surface-muted'
                        : ''
                    }`
                  }
                >
                  {label}
                  {comingSoon && <span className="ml-1 text-xs">(soon)</span>}
                </NavLink>
              ))}
              <span className="ml-2 flex items-center gap-1">
                {isSignedIn ? (
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: { avatarBox: 'w-8 h-8' },
                      variables: { colorPrimary: '#c8622a' },
                    }}
                  />
                ) : (
                  <>
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        className="px-3 py-2 rounded text-sm font-medium text-stone-300 hover:text-stone-100 hover:bg-surface-muted"
                      >
                        Sign in
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        type="button"
                        className="px-3 py-2 rounded text-sm font-medium bg-accent text-white hover:bg-accent-light"
                      >
                        Sign up
                      </button>
                    </SignUpButton>
                  </>
                )}
              </span>
            </nav>

            <button
              type="button"
              className="md:hidden p-2 text-stone-400 hover:text-stone-100"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-stone-800">
              <div className="flex flex-col gap-1">
                {navItems.map(({ to, label, comingSoon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="px-3 py-2 rounded text-stone-300 hover:bg-surface-muted hover:text-stone-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                    {comingSoon && <span className="text-xs text-stone-500 ml-1">(coming soon)</span>}
                  </Link>
                ))}
                <div className="mt-2 pt-2 border-t border-stone-700 flex gap-2">
                  {isSignedIn ? (
                    <UserButton afterSignOutUrl="/" />
                  ) : (
                    <>
                      <SignInButton mode="modal">
                        <button type="button" className="px-3 py-2 rounded text-sm text-stone-300">
                          Sign in
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button type="button" className="px-3 py-2 rounded text-sm bg-accent text-white">
                          Sign up
                        </button>
                      </SignUpButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 pt-14 sm:pt-16">
        <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-stone-800 bg-surface-elevated">
        <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-stone-500">© TacticalShack</span>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link to="/about" className="text-sm text-stone-400 hover:text-stone-200">
                About
              </Link>
              <Link to="/contact" className="text-sm text-stone-400 hover:text-stone-200">
                Contact
              </Link>
              <Link to="/terms" className="text-sm text-stone-400 hover:text-stone-200">
                Terms
              </Link>
              <Link to="/privacy" className="text-sm text-stone-400 hover:text-stone-200">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
