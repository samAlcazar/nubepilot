import users from '../../users/credentials.json'

const SESSION_KEY = 'nubepilot.session'

export const authenticateUser = ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase()

  const user = users.find(candidate => {
    return candidate.email.toLowerCase() === normalizedEmail && candidate.password === password
  })

  if (!user) {
    return null
  }

  const { password: _PASSWORD, ...safeUser } = user
  return safeUser
}

export const getStoredSession = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const storedSession = window.localStorage.getItem(SESSION_KEY)

  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession)
  } catch {
    window.localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export const setStoredSession = (user) => {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export const clearStoredSession = () => {
  window.localStorage.removeItem(SESSION_KEY)
}