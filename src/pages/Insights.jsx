import { useEffect, useMemo, useState } from 'react'
import { auth, db } from '../firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, ChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import './Insights.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler)

function toDateKey(d) {
  return d.toISOString().split('T')[0]
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function toCsvRow(fields) {
  return fields.map(v => {
    const s = v === null || v === undefined ? '' : String(v)
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`
    return s
  }).join(',')
}

export default function Insights() {
  const user = auth.currentUser
  const navigate = useNavigate()

  const [mealsAll, setMealsAll] = useState([])
  const [weights, setWeights] = useState([])

  useEffect(() => {
    const qMeals = query(collection(db, 'meals'), where('uid', '==', user.uid))
    const unsubMeals = onSnapshot(qMeals, s => {
      setMealsAll(s.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    const qWeights = query(collection(db, 'weights'), where('uid', '==', user.uid))
    const unsubWeights = onSnapshot(qWeights, s => {
      const data = s.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      setWeights(data)
    })

    return () => { unsubMeals(); unsubWeights() }
  }, [user.uid])

  const { last7, daily, spend7, kcal7, prot7 } = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return toDateKey(d)
    })

    const byDate = {}
    mealsAll.forEach(m => {
      const d = m.date
      if (!d) return
      if (!byDate[d]) byDate[d] = { calories: 0, protein: 0, cost: 0 }
      byDate[d].calories += Number(m.calories) || 0
      byDate[d].protein += Number(m.protein) || 0
      byDate[d].cost += Number(m.cost) || 0
    })

    const dailyRows = dates.map(d => ({
      date: d.slice(5),
      calories: byDate[d]?.calories || 0,
      protein: byDate[d]?.protein || 0,
      cost: byDate[d]?.cost || 0
    }))

    const sum = (k) => dailyRows.reduce((a, r) => a + (r[k] || 0), 0)
    return {
      last7: dates,
      daily: dailyRows,
      spend7: sum('cost'),
      kcal7: sum('calories'),
      prot7: sum('protein')
    }
  }, [mealsAll])

  const avgKcal = Math.round(kcal7 / 7)
  const avgProt = Math.round(prot7 / 7)

  const exportCsv = () => {
    const meals = mealsAll
      .slice()
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))

    const mealHeader = ['type', 'date', 'name', 'calories', 'protein_g', 'cost', 'createdAt']
    const mealRows = meals.map(m => toCsvRow([
      'meal',
      m.date || '',
      m.name || '',
      Number(m.calories) || 0,
      Number(m.protein) || 0,
      Number(m.cost) || 0,
      m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : (m.createdAt ? String(m.createdAt) : '')
    ]))

    const weightHeader = ['type', 'date', 'weight_kg', 'createdAt']
    const weightRows = weights.map(w => toCsvRow([
      'weight',
      w.date || '',
      Number(w.weight) || 0,
      w.createdAt?.toDate ? w.createdAt.toDate().toISOString() : (w.createdAt ? String(w.createdAt) : '')
    ]))

    const csv = [
      toCsvRow(mealHeader),
      ...mealRows,
      '',
      toCsvRow(weightHeader),
      ...weightRows
    ].join('\n')

    downloadText(`kio3-export-${toDateKey(new Date())}.csv`, csv)
  }

  return (
    <div className="insights-page">
      <div className="insights-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeftIcon className="back-icon" /> Back
        </button>
        <h2 className="insights-title">
          <ChartBarIcon className="insights-title-icon" /> Insights
        </h2>
        <button className="export-btn" onClick={exportCsv} title="Export CSV">
          <ArrowDownTrayIcon className="export-icon" />
        </button>
      </div>

      <div className="insights-stats">
        <div className="stat-card">
          <div className="stat-value">{avgKcal}</div>
          <div className="stat-label">Avg kcal (7d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgProt}g</div>
          <div className="stat-label">Avg protein (7d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(spend7)}</div>
          <div className="stat-label">Spend (7d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{mealsAll.length}</div>
          <div className="stat-label">Meals logged</div>
        </div>
      </div>

      <div className="insights-card">
        <h3 className="section-title">Last 7 Days — Calories</h3>
        <Bar
          data={{
            labels: daily.map(d => d.date),
            datasets: [{
              data: daily.map(d => d.calories),
              backgroundColor: 'rgba(167,139,250,0.75)',
              borderRadius: 10,
              borderSkipped: false
            }]
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#F0EEF8' }, ticks: { color: '#9B96B8' } },
              x: { grid: { display: false }, ticks: { color: '#9B96B8' } }
            }
          }}
        />
      </div>

      <div className="insights-card">
        <h3 className="section-title">Weight Trend</h3>
        {weights.length < 2 ? (
          <p className="empty-text">Log at least 2 weight entries to see your trend.</p>
        ) : (
          <Line
            data={{
              labels: weights.map(w => w.date),
              datasets: [{
                label: 'Weight (kg)',
                data: weights.map(w => w.weight),
                borderColor: '#4F6EF7',
                backgroundColor: 'rgba(79, 110, 247, 0.08)',
                borderWidth: 2.5,
                pointBackgroundColor: '#4F6EF7',
                pointRadius: 4,
                tension: 0.35,
                fill: true
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { grid: { color: '#F0F2FA' }, ticks: { color: '#8B90A7', callback: v => `${v} kg` } },
                x: { grid: { display: false }, ticks: { color: '#8B90A7' } }
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

