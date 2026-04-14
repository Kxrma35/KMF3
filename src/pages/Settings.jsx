import { useEffect, useMemo, useState } from 'react'
import { auth, db } from '../firebase'
import { doc, getDoc, getDocFromCache, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, ArrowRightOnRectangleIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline'
import { isAdminEmail } from '../utils/admin'
import './Settings.css'

function roundInt(n) {
  return Math.round(Number(n) || 0)
}

function calcTargets({ phase, weightKg }) {
  const w = Math.max(0, Number(weightKg) || 0)

  // Simple, predictable defaults (fast UX). User can still override in Goals modal.
  const maintenance = w ? w * 33 : 0
  const calDelta = phase === 'bulk' ? 300 : phase === 'cut' ? -300 : 0
  const calories = w ? maintenance + calDelta : 0

  const proteinPerKg = phase === 'maintain' ? 1.8 : 2.0
  const protein = w ? w * proteinPerKg : 0

  return { calories: roundInt(calories), protein: roundInt(protein) }
}

export default function Settings() {
  const user = auth.currentUser
  const navigate = useNavigate()
  const isAdmin = isAdminEmail(user?.email)

  const [saving, setSaving] = useState(false)
  const [hydrating, setHydrating] = useState(true)

  const [phase, setPhase] = useState('bulk') // bulk | cut | maintain
  const [weightKg, setWeightKg] = useState('')
  const [autoTargets, setAutoTargets] = useState(true)

  const preview = useMemo(() => calcTargets({ phase, weightKg }), [phase, weightKg])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const ref = doc(db, 'goals', user.uid)

        // Fast path: local cache (instant if previously loaded).
        try {
          const cached = await getDocFromCache(ref)
          if (alive && cached.exists()) {
            const d = cached.data()
            setPhase(d.phase || 'bulk')
            setWeightKg(d.weightKg ?? '')
            setAutoTargets(d.autoTargets ?? true)
          }
        } catch {
          // No cached doc yet; fall through to network fetch.
        }

        // Refresh with latest server value in background.
        const snap = await getDoc(ref)
        if (alive && snap.exists()) {
          const d = snap.data()
          setPhase(d.phase || 'bulk')
          setWeightKg(d.weightKg ?? '')
          setAutoTargets(d.autoTargets ?? true)
        }
      } finally {
        if (alive) setHydrating(false)
      }
    })()
    return () => { alive = false }
  }, [user.uid])

  const save = async () => {
    setSaving(true)
    const patch = {
      phase,
      weightKg: weightKg === '' ? '' : Number(weightKg),
      autoTargets,
      updatedAt: new Date()
    }

    if (autoTargets) {
      const targets = calcTargets({ phase, weightKg })
      patch.calories = targets.calories || 3500
      patch.protein = targets.protein || 180
    }

    await setDoc(doc(db, 'goals', user.uid), patch, { merge: true })
    setSaving(false)
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeftIcon className="back-icon" /> Back
        </button>
        <h2 className="settings-title">
          <Cog6ToothIcon className="settings-title-icon" /> Settings
        </h2>
      </div>

      <div className="settings-card">
        <h3 className="section-title">Phase & Targets</h3>

        <>
          <div className="settings-row">
            <label className="settings-label">Phase</label>
            <div className="segmented">
              {[
                { id: 'bulk', label: 'Bulk' },
                { id: 'maintain', label: 'Maintain' },
                { id: 'cut', label: 'Cut' }
              ].map(p => (
                <button
                  key={p.id}
                  className={`seg-btn ${phase === p.id ? 'active' : ''}`}
                  onClick={() => setPhase(p.id)}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <label className="settings-label" htmlFor="weightKg">Bodyweight (kg)</label>
            <input
              id="weightKg"
              className="field"
              placeholder="e.g. 75.5"
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>

          <div className="settings-row switch-row">
            <div>
              <div className="switch-title">Auto targets</div>
              <div className="switch-sub">Update your calorie/protein goals automatically from your phase + weight.</div>
            </div>
            <button
              type="button"
              className={`switch ${autoTargets ? 'on' : ''}`}
              onClick={() => setAutoTargets(v => !v)}
              aria-pressed={autoTargets}
            >
              <span className="knob" />
            </button>
          </div>

          {autoTargets && (
            <div className="preview">
              <div className="preview-item">
                <div className="preview-val">{preview.calories || '--'}</div>
                <div className="preview-lbl">kcal / day</div>
              </div>
              <div className="preview-item">
                <div className="preview-val">{preview.protein || '--'}</div>
                <div className="preview-lbl">protein g / day</div>
              </div>
            </div>
          )}

          <button className="primary-btn" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {hydrating && <p className="empty-text">Syncing your latest settings...</p>}
        </>
      </div>

      <div className="settings-card">
        <h3 className="section-title">Community</h3>
        <button className="secondary-btn" onClick={() => navigate('/feedback')}>
          <ChatBubbleLeftRightIcon className="secondary-icon" /> Leave Feedback
        </button>
        {isAdmin && (
          <button className="secondary-btn secondary-btn-admin" onClick={() => navigate('/admin-feedback')}>
            <ChartBarSquareIcon className="secondary-icon" /> Feedback Dashboard
          </button>
        )}
      </div>

      <div className="settings-card">
        <h3 className="section-title">Account</h3>
        <button className="danger-btn" onClick={() => signOut(auth)}>
          <ArrowRightOnRectangleIcon className="danger-icon" /> Logout
        </button>
      </div>
    </div>
  )
}

