import { useEffect, useMemo, useState } from 'react'
import { auth, db } from '../firebase'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'
import { XMarkIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import './TemplatesModal.css'

function todayKey() {
  return new Date().toISOString().split('T')[0]
}

export default function TemplatesModal({ mealsToday, onClose }) {
  const user = auth.currentUser

  const [templates, setTemplates] = useState([])
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [applyingId, setApplyingId] = useState(null)

  const cleanMeals = useMemo(() => {
    return (mealsToday || []).map(m => ({
      name: m.name || '',
      calories: Number(m.calories) || 0,
      protein: Number(m.protein) || 0,
      cost: Number(m.cost) || 0
    })).filter(m => m.name && m.calories)
  }, [mealsToday])

  useEffect(() => {
    const qT = query(collection(db, 'templates'), where('uid', '==', user.uid))
    return onSnapshot(qT, s => {
      const data = s.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setTemplates(data)
    })
  }, [user.uid])

  const saveTemplate = async () => {
    if (!name.trim() || cleanMeals.length === 0) return
    setSaving(true)
    await addDoc(collection(db, 'templates'), {
      uid: user.uid,
      name: name.trim(),
      meals: cleanMeals,
      createdAt: new Date()
    })
    setName('')
    setSaving(false)
  }

  const applyTemplate = async (t) => {
    if (!t?.meals?.length) return
    setApplyingId(t.id)
    const date = todayKey()
    const ops = t.meals.map(m => addDoc(collection(db, 'meals'), {
      uid: user.uid,
      date,
      name: m.name,
      calories: Number(m.calories) || 0,
      protein: Number(m.protein) || 0,
      cost: Number(m.cost) || 0,
      createdAt: new Date(),
      fromTemplateId: t.id
    }))
    await Promise.all(ops)
    setApplyingId(null)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Meal Templates</h3>
          <button className="modal-close" onClick={onClose}>
            <XMarkIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div className="modal-body">
          <div className="tpl-create">
            <div className="tpl-title">Save today as a template</div>
            <div className="tpl-sub">
              {cleanMeals.length === 0 ? 'Add at least one meal first.' : `${cleanMeals.length} meals ready to save.`}
            </div>
            <div className="tpl-row">
              <input
                className="tpl-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name (e.g. Weekday bulk)"
              />
              <button className="tpl-save" onClick={saveTemplate} disabled={saving || cleanMeals.length === 0}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="tpl-list-head">
            <span>Your templates</span>
            <span className="tpl-count">{templates.length}</span>
          </div>

          {templates.length === 0 ? (
            <p className="empty-msg">No templates yet — save a day you repeat often.</p>
          ) : (
            <ul className="tpl-list">
              {templates.map(t => (
                <li key={t.id} className="tpl-item">
                  <div className="tpl-info">
                    <div className="tpl-name">{t.name}</div>
                    <div className="tpl-meta">
                      {(t.meals?.length || 0)} meals · {Math.round((t.meals || []).reduce((a, m) => a + (Number(m.calories) || 0), 0))} kcal
                    </div>
                  </div>
                  <div className="tpl-actions">
                    <button
                      className="tpl-apply"
                      onClick={() => applyTemplate(t)}
                      disabled={applyingId === t.id}
                      title="Log this template today"
                    >
                      <ArrowDownTrayIcon className="tpl-icon" />
                    </button>
                    <button
                      className="tpl-del"
                      onClick={() => deleteDoc(doc(db, 'templates', t.id))}
                      title="Delete template"
                    >
                      <TrashIcon className="tpl-icon danger" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

