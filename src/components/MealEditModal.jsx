import { useMemo, useState } from 'react'
import { db } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { XMarkIcon } from '@heroicons/react/24/outline'
import './MealEditModal.css'

export default function MealEditModal({ meal, onClose }) {
  const initial = useMemo(() => ({
    name: meal?.name || '',
    calories: String(meal?.calories ?? ''),
    protein: String(meal?.protein ?? ''),
    cost: String(meal?.cost ?? '')
  }), [meal])

  const [name, setName] = useState(initial.name)
  const [calories, setCalories] = useState(initial.calories)
  const [protein, setProtein] = useState(initial.protein)
  const [cost, setCost] = useState(initial.cost)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!meal?.id) return
    if (!name.trim() || !calories) return
    setSaving(true)
    await updateDoc(doc(db, 'meals', meal.id), {
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      cost: cost === '' ? 0 : Number(cost) || 0,
      updatedAt: new Date()
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Meal</h3>
          <button className="modal-close" onClick={onClose}>
            <XMarkIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div className="modal-body">
          <div className="edit-input-group">
            <label>Meal name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken & rice"
            />
          </div>

          <div className="edit-grid">
            <div className="edit-input-group">
              <label>Calories</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="kcal"
              />
            </div>
            <div className="edit-input-group">
              <label>Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="g"
              />
            </div>
          </div>

          <div className="edit-input-group">
            <label>Cost (optional)</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="e.g. 350"
            />
            <p className="edit-hint">Use your local currency. Insights will sum weekly spend.</p>
          </div>
        </div>

        <button className="modal-save-btn" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

