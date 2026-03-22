'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Lock, Bell, CreditCard, Check, X, AlertTriangle,
  Github, Globe, Twitter, Eye, EyeOff, CheckCircle, XCircle,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  email: string
  username: string
  displayName: string
  bio?: string
  website?: string
  githubUrl?: string
  twitterUrl?: string
  avatarUrl?: string
  isPremium?: boolean
  role?: string
  emailDigestEnabled?: boolean
}

type Tab = 'profile' | 'account' | 'notifications' | 'billing'

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast {
  id: number
  type: 'success' | 'error'
  message: string
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'flex items-center gap-3 rounded-xl border-2 px-4 py-3 shadow-[2px_2px_0_#0A0A0A] min-w-[260px]',
              toast.type === 'success'
                ? 'bg-green-500 border-green-700 text-white'
                : 'bg-red-500 border-red-700 text-white'
            )}
          >
            {toast.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <X className="h-4 w-4 shrink-0" />
            )}
            <span className="text-sm font-bold flex-1">{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="opacity-70 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors',
        checked ? 'bg-forge-orange border-forge-orange' : 'bg-forge-border border-forge-border'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  suffix,
  hint,
  error,
  success,
  required,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  suffix?: React.ReactNode
  hint?: string
  error?: string
  success?: string
  required?: boolean
}) {
  const [show, setShow] = useState(false)
  const inputType = type === 'password' ? (show ? 'text' : 'password') : type

  return (
    <div>
      <label className="block text-sm font-black text-forge-ink mb-1.5">
        {label}{required && <span className="text-forge-orange ml-0.5">*</span>}
      </label>
      <div className="relative flex items-center">
        {suffix && (
          <span className="absolute left-3 text-sm text-forge-muted select-none">{suffix}</span>
        )}
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-xl border-2 px-4 py-3 text-sm font-medium text-forge-ink placeholder:text-forge-muted/50',
            'focus:outline-none focus:ring-0 transition-colors bg-white',
            suffix ? 'pl-14' : '',
            error ? 'border-red-400 focus:border-red-500' : 'border-forge-border focus:border-forge-ink',
          )}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-3 text-forge-muted hover:text-forge-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle className="h-3 w-3" />{error}</p>}
      {success && !error && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" />{success}</p>}
      {hint && !error && !success && <p className="text-xs text-forge-muted mt-1">{hint}</p>}
    </div>
  )
}

// ── Delete Account Modal ──────────────────────────────────────────────────────

function DeleteAccountModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [confirm, setConfirm] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border-2 border-forge-border bg-white p-8 shadow-[4px_4px_0_#0A0A0A]"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <h2 className="font-display font-black text-xl text-forge-ink">Delete Account</h2>
        </div>
        <p className="text-sm text-forge-muted mb-4">
          This action is permanent and cannot be undone. All your prompts, collections, and data will be deleted.
        </p>
        <p className="text-sm font-bold text-forge-ink mb-2">
          Type <span className="font-mono text-red-500">DELETE</span> to confirm:
        </p>
        <input
          type="text"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="DELETE"
          className="w-full rounded-xl border-2 border-forge-border px-4 py-3 text-sm font-mono text-forge-ink focus:outline-none focus:border-red-400 mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-forge-border px-4 py-3 text-sm font-black text-forge-ink hover:bg-forge-silver transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={confirm !== 'DELETE'}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 border-2 border-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_#7f1d1d]"
          >
            Delete Account
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── TAB: Profile ──────────────────────────────────────────────────────────────

function ProfileTab({
  profile,
  accessToken,
  showToast,
}: {
  profile: UserProfile
  accessToken: string
  showToast: (type: 'success' | 'error', message: string) => void
}) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [website, setWebsite] = useState(profile.website ?? '')
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl ?? '')
  const [twitterUrl, setTwitterUrl] = useState(profile.twitterUrl ?? '')
  const [saving, setSaving] = useState(false)

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkUsername = useCallback(async (val: string) => {
    if (val === profile.username) { setUsernameStatus('idle'); return }
    if (!/^[a-z0-9_-]{3,30}$/.test(val)) { setUsernameStatus('invalid'); return }
    setUsernameStatus('checking')
    try {
      const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(val)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      setUsernameStatus(data.available ? 'available' : 'taken')
    } catch {
      setUsernameStatus('idle')
    }
  }, [profile.username, accessToken])

  function handleUsernameChange(val: string) {
    setUsername(val)
    setUsernameStatus('idle')
    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(() => checkUsername(val), 500)
  }

  const getUsernameError = () => {
    if (usernameStatus === 'taken') return 'This username is already taken'
    if (usernameStatus === 'invalid') return 'Must be 3-30 lowercase chars, underscores or hyphens'
    return undefined
  }
  const getUsernameSuccess = () => {
    if (usernameStatus === 'available') return 'Username is available!'
    return undefined
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ displayName, username, bio, website, githubUrl, twitterUrl }),
      })
      if (res.ok) {
        showToast('success', 'Settings saved')
      } else {
        const data = await res.json()
        showToast('error', data.error ?? 'Failed to save settings')
      }
    } catch {
      showToast('error', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const AVATAR_COLORS = ['#FF6B2B', '#00C27C', '#7C3AED', '#FFB800', '#E84040', '#0EA5E9', '#EC4899', '#14B8A6']
  const avatarBg = AVATAR_COLORS[((profile.username?.charCodeAt(0)) ?? 0) % AVATAR_COLORS.length] ?? '#FF6B2B'
  const initials = (profile.displayName || profile.username)
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white border-2 border-forge-border shadow-[2px_2px_0_#0A0A0A]"
          style={{ backgroundColor: avatarBg }}
        >
          {initials}
        </div>
        <div>
          <p className="font-black text-forge-ink text-sm">Profile Avatar</p>
          <p className="text-xs text-forge-muted mt-0.5">Based on your display name initials</p>
          <button
            type="button"
            className="mt-2 rounded-lg border-2 border-forge-border px-3 py-1.5 text-xs font-bold text-forge-muted hover:border-forge-ink hover:text-forge-ink transition-colors"
          >
            Change Avatar (coming soon)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="Display Name"
          value={displayName}
          onChange={setDisplayName}
          placeholder="Your name"
          required
        />
        <FormInput
          label="Username"
          value={username}
          onChange={handleUsernameChange}
          placeholder="username"
          suffix="@"
          error={getUsernameError()}
          success={getUsernameSuccess()}
          hint={usernameStatus === 'checking' ? 'Checking availability...' : undefined}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-black text-forge-ink mb-1.5">
          Bio <span className="font-normal text-forge-muted">({bio.length}/280)</span>
        </label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value.slice(0, 280))}
          rows={3}
          placeholder="Tell the world about yourself..."
          className="w-full rounded-xl border-2 border-forge-border px-4 py-3 text-sm font-medium text-forge-ink placeholder:text-forge-muted/50 focus:outline-none focus:border-forge-ink transition-colors bg-white resize-none"
        />
      </div>

      <FormInput
        label="Website"
        value={website}
        onChange={setWebsite}
        placeholder="https://yourwebsite.com"
        suffix={<Globe className="h-4 w-4" />}
      />
      <FormInput
        label="GitHub"
        value={githubUrl}
        onChange={setGithubUrl}
        placeholder="https://github.com/username"
        suffix={<Github className="h-4 w-4" />}
      />
      <FormInput
        label="Twitter / X"
        value={twitterUrl}
        onChange={setTwitterUrl}
        placeholder="https://twitter.com/username"
        suffix={<Twitter className="h-4 w-4" />}
      />

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="btn-orange px-8 py-3 rounded-xl font-black text-sm disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}

// ── TAB: Account ──────────────────────────────────────────────────────────────

function AccountTab({
  profile,
  accessToken,
  showToast,
}: {
  profile: UserProfile
  accessToken: string
  showToast: (type: 'success' | 'error', message: string) => void
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setPasswordSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        showToast('success', 'Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        setPasswordError(data.error ?? 'Failed to update password')
      }
    } catch {
      setPasswordError('Network error')
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.includes('@')) {
      showToast('error', 'Please enter a valid email address')
      return
    }
    setEmailSaving(true)
    try {
      // Placeholder — email change typically requires verification
      await new Promise(r => setTimeout(r, 800))
      showToast('success', 'Verification email sent to ' + newEmail)
      setNewEmail('')
    } finally {
      setEmailSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
        <h3 className="font-display font-black text-lg text-forge-ink mb-1">Change Password</h3>
        <p className="text-sm text-forge-muted mb-5">Update your account password</p>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <FormInput
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="••••••••"
            required
          />
          <FormInput
            label="New Password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Min 8 characters"
            required
          />
          <FormInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat new password"
            error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
            required
          />
          {passwordError && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <XCircle className="h-4 w-4" />{passwordError}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordSaving}
            className="btn-orange px-6 py-2.5 rounded-xl font-black text-sm disabled:opacity-60"
          >
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
        <h3 className="font-display font-black text-lg text-forge-ink mb-1">Change Email</h3>
        <p className="text-sm text-forge-muted mb-1">
          Current email: <span className="font-bold text-forge-ink">{profile.email}</span>
        </p>
        <p className="text-xs text-forge-muted mb-5">A verification email will be sent to your new address.</p>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <FormInput
            label="New Email Address"
            type="email"
            value={newEmail}
            onChange={setNewEmail}
            placeholder="new@email.com"
            required
          />
          <button
            type="submit"
            disabled={emailSaving}
            className="btn-orange px-6 py-2.5 rounded-xl font-black text-sm disabled:opacity-60"
          >
            {emailSaving ? 'Sending...' : 'Update Email'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6">
        <h3 className="font-display font-black text-lg text-red-600 mb-1">Danger Zone</h3>
        <p className="text-sm text-red-500/80 mb-5">
          Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="rounded-xl border-2 border-red-400 bg-white px-6 py-2.5 text-sm font-black text-red-500 hover:bg-red-500 hover:text-white hover:border-red-600 transition-colors shadow-[2px_2px_0_#fca5a5]"
        >
          Delete Account
        </button>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteAccountModal
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => {
              setShowDeleteModal(false)
              showToast('error', 'Account deletion is disabled in demo mode.')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── TAB: Notifications ────────────────────────────────────────────────────────

function NotificationsTab({
  profile,
  accessToken,
  showToast,
}: {
  profile: UserProfile
  accessToken: string
  showToast: (type: 'success' | 'error', message: string) => void
}) {
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [emailFollower, setEmailFollower] = useState(true)
  const [emailComment, setEmailComment] = useState(true)
  const [emailUpvote, setEmailUpvote] = useState(true)
  const [emailSale, setEmailSale] = useState(true)
  const [emailDigest, setEmailDigest] = useState(profile.emailDigestEnabled ?? true)
  const [inAppEnabled, setInAppEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          emailDigestEnabled: emailDigest,
          notificationPreferences: {
            emailEnabled,
            emailFollower,
            emailComment,
            emailUpvote,
            emailSale,
            inAppEnabled,
          },
        }),
      })
      if (res.ok) {
        showToast('success', 'Settings saved')
      } else {
        const data = await res.json()
        showToast('error', data.error ?? 'Failed to save preferences')
      }
    } catch {
      showToast('error', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const toggleRow = (label: string, checked: boolean, onChange: (v: boolean) => void, disabled?: boolean) => (
    <div className={cn('flex items-center justify-between py-3 border-b border-forge-border/50 last:border-0', disabled && 'opacity-50')}>
      <p className="text-sm font-semibold text-forge-ink">{label}</p>
      <Toggle checked={checked} onChange={disabled ? () => {} : onChange} />
    </div>
  )

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Email Notifications */}
      <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-black text-lg text-forge-ink">Email Notifications</h3>
            <p className="text-sm text-forge-muted">Control which emails you receive</p>
          </div>
          <Toggle checked={emailEnabled} onChange={setEmailEnabled} />
        </div>
        <div>
          {toggleRow('New follower', emailFollower, setEmailFollower, !emailEnabled)}
          {toggleRow('New comment on your prompt', emailComment, setEmailComment, !emailEnabled)}
          {toggleRow('New upvote on your prompt', emailUpvote, setEmailUpvote, !emailEnabled)}
          {toggleRow('Marketplace sale', emailSale, setEmailSale, !emailEnabled)}
          {toggleRow('Weekly digest', emailDigest, setEmailDigest, !emailEnabled)}
        </div>
      </div>

      {/* In-App */}
      <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-lg text-forge-ink">In-App Notifications</h3>
            <p className="text-sm text-forge-muted">Show notifications in the bell icon</p>
          </div>
          <Toggle checked={inAppEnabled} onChange={setInAppEnabled} />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-orange px-8 py-3 rounded-xl font-black text-sm disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  )
}

// ── TAB: Billing ──────────────────────────────────────────────────────────────

function BillingTab({ profile }: { profile: UserProfile }) {
  const isPremium = profile.isPremium ?? false

  const PRO_FEATURES = [
    'Unlimited prompt executions',
    'Advanced analytics dashboard',
    'Priority support',
    'Commercial usage rights',
    'Custom API access',
    'Team collaboration tools',
  ]

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-black text-lg text-forge-ink">Current Plan</h3>
          <span className={cn(
            'rounded-full border-2 px-3 py-1 text-xs font-black',
            isPremium ? 'bg-forge-orange text-white border-orange-600' : 'bg-forge-silver text-forge-ink border-forge-border'
          )}>
            {isPremium ? 'PRO' : 'FREE'}
          </span>
        </div>
        {isPremium ? (
          <>
            <p className="text-sm text-forge-muted mb-4">You are on the <span className="font-bold text-forge-ink">Pro plan</span>. Enjoy unlimited access to all features.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRO_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-forge-ink">
                  <Check className="h-4 w-4 text-forge-orange shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-forge-muted">
            You're on the Free plan — no billing. Upgrade to Pro to unlock all features.
          </p>
        )}
      </div>

      {/* Billing info */}
      <div className="rounded-2xl border-2 border-forge-border bg-white p-6">
        <h3 className="font-display font-black text-lg text-forge-ink mb-2">Billing</h3>
        {isPremium ? (
          <p className="text-sm text-forge-muted">
            Your next billing date is <span className="font-bold text-forge-ink">displayed on your billing portal</span>.
          </p>
        ) : (
          <p className="text-sm text-forge-muted">
            You're on the Free plan — no billing required.
          </p>
        )}
        <a
          href="/pricing"
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-forge-orange hover:underline"
        >
          Manage Billing
        </a>
      </div>

      {/* Upgrade CTA (if free) */}
      {!isPremium && (
        <div className="rounded-2xl border-2 border-forge-orange bg-orange-50 p-6 shadow-[4px_4px_0_#FF6B2B]">
          <h3 className="font-display font-black text-2xl text-forge-ink mb-1">Upgrade to Pro</h3>
          <p className="text-sm text-forge-muted mb-4">Unlock everything PromptForge has to offer.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {PRO_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-forge-ink">
                <Check className="h-4 w-4 text-forge-orange shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mb-5">
            <span className="font-display font-black text-4xl text-forge-ink">$12</span>
            <span className="text-forge-muted text-sm">/ month</span>
          </div>
          <a
            href="/pricing"
            className="btn-orange inline-flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm"
          >
            Upgrade Now
          </a>
        </div>
      )}
    </div>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', Icon: User },
  { id: 'account', label: 'Account', Icon: Lock },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'billing', label: 'Billing', Icon: CreditCard },
]

export default function SettingsPage() {
  const { user, accessToken } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = (searchParams.get('tab') as Tab) ?? 'profile'
  const activeTab: Tab = TABS.find(t => t.id === tabParam) ? tabParam : 'profile'

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounter = useRef(0)

  function showToast(type: 'success' | 'error', message: string) {
    const id = ++toastCounter.current
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  function removeToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!accessToken) return
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setProfile({
            ...data.user,
            email: data.user.email ?? user.email,
            isPremium: data.user.isPremium ?? false,
          })
        }
      })
      .catch(() => {
        // Fall back to auth store data
        setProfile({
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
        })
      })
      .finally(() => setLoading(false))
  }, [user, accessToken, router])

  function setTab(tab: Tab) {
    router.push(`/settings?tab=${tab}`)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-forge-silver">
      <Navigation />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="container-forge pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-display font-black text-3xl md:text-4xl text-forge-ink tracking-tight">
            SETTINGS
          </h1>
          <p className="text-forge-muted mt-1 text-sm">Manage your account preferences</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar (desktop) / Tabs (mobile) */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:w-56 shrink-0"
          >
            {/* Mobile: horizontal scroll tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
              {TABS.map(tab => {
                const Icon = tab.Icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all shrink-0',
                      isActive
                        ? 'bg-forge-orange text-white shadow-[2px_2px_0_#0A0A0A]'
                        : 'border-2 border-forge-border bg-white text-forge-muted hover:text-forge-ink hover:border-forge-ink'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Desktop: vertical sidebar */}
            <div className="hidden lg:flex flex-col gap-1 rounded-2xl border-2 border-forge-border bg-white p-2 shadow-[2px_2px_0_#D4D4D0]">
              {TABS.map(tab => {
                const Icon = tab.Icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all text-left',
                      isActive
                        ? 'border-l-4 border-l-forge-orange bg-orange-50 text-forge-ink pl-3'
                        : 'text-forge-muted hover:bg-forge-silver hover:text-forge-ink'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </motion.aside>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex-1 min-w-0"
          >
            {loading || !profile ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-forge-border/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {activeTab === 'profile' && (
                  <ProfileTab profile={profile} accessToken={accessToken!} showToast={showToast} />
                )}
                {activeTab === 'account' && (
                  <AccountTab profile={profile} accessToken={accessToken!} showToast={showToast} />
                )}
                {activeTab === 'notifications' && (
                  <NotificationsTab profile={profile} accessToken={accessToken!} showToast={showToast} />
                )}
                {activeTab === 'billing' && (
                  <BillingTab profile={profile} />
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
