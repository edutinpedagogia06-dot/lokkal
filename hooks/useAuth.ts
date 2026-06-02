'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import { AppUser, UserRole } from '@/types'
import { toSlug } from '@/lib/utils'

interface AuthContextValue {
  user: User | null
  profile: AppUser | null
  loading: boolean
  isSeller: boolean
  isOwnerOf: (ownerId: string) => boolean
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (u: User) => {
    const ref = doc(db, 'users', u.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      setProfile(snap.data() as AppUser)
    } else {
      setProfile(null)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) await loadProfile(u)
      else setProfile(null)
      setLoading(false)
    })
    return unsub
  }, [])

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    const u = result.user
    const ref = doc(db, 'users', u.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: u.uid, email: u.email, displayName: u.displayName,
        photoURL: u.photoURL, role: 'buyer' as UserRole,
        city: '', createdAt: serverTimestamp(),
      })
    }
    await loadProfile(u)
  }

  const loginWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await loadProfile(cred.user)
  }

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid, email, displayName, photoURL: '',
      role: 'buyer' as UserRole, city: '', createdAt: serverTimestamp(),
    })
    await loadProfile(cred.user)
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) await loadProfile(user)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      isSeller: profile?.role === 'seller',
      isOwnerOf: (ownerId: string) => !!user && user.uid === ownerId,
      loginWithGoogle, loginWithEmail, registerWithEmail, logout, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
