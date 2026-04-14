import { useState } from 'react'
import { db, auth } from '../firebase'
import { doc, setDoc } from 'firebase/firestore'
import { XMarkIcon } from '@heroicons/react/24/outline'
import './GoalsModal.css'

function GoalsModal({ currentCalories, currentProtein, onSave, onClose }) {
  const [calories, setCalories] = useState(currentCalories)
  const [protein, setProtein] = useState(currentProtein)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const nextCalories = Number(calories)
    const nextProtein = Number(protein)
    if (!nextCalories || !nextProtein) return

    setSaving(true)

    // Optimistic update for instant UX.
    onSave(nextCalories, nextProtein)
    localStorage.setItem(`kio3-goals-${auth.currentUser.uid}`, JSON.stringify({
      calories: nextCalories,
      protein: nextProtein,
      updatedAt: Date.now()
    }))
    onClose()
    try {
      await setDoc(doc(db, 'goals', auth.currentUser.uid), {
        calories: nextCalories,
        protein: nextProtein,
        updatedAt: new Date()
      }, { merge: true })
    } catch {
      // Local values are already applied; Firestore will retry once online in most cases.
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Set Your Goals</h3>
          <button className="modal-close" onClick={onClose}>
            <XMarkIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div className="modal-body">
          <div className="goal-input-group">
            <label>Daily Calorie Goal (kcal)</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
            <p className="goal-hint">Recommended for bulking: 3000 — 4000 kcal</p>
          </div>

          <div className="goal-input-group">
            <label>Daily Protein Goal (g)</label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
            <p className="goal-hint">Recommended: 1.6 — 2.2g per kg of bodyweight</p>
          </div>
        </div>

        <button className="modal-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Goals'}
        </button>
      </div>
    </div>
  )
}

export default GoalsModal