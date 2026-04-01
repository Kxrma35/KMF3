import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, ScaleIcon } from '@heroicons/react/24/outline'
import './Progress.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

function Progress() {
  const [weights, setWeights] = useState([])
  const user = auth.currentUser
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(
      collection(db, 'weights'),
      where('uid', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      setWeights(data)
    })
    return unsub
  }, [])

  const latest = weights[weights.length - 1]
  const first = weights[0]
  const change = latest && first ? (latest.weight - first.weight).toFixed(1) : 0

  return (
    <div className="progress-page">

      <div className="progress-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeftIcon className="back-icon" /> Back
        </button>
        <h2 className="progress-title">
          <ScaleIcon className="progress-title-icon" /> Weight Progress
        </h2>
      </div>

      <div className="progress-stats">
        <div className="stat-card">
          <div className="stat-value">{latest ? latest.weight : '--'}</div>
          <div className="stat-label">Current (kg)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{first ? first.weight : '--'}</div>
          <div className="stat-label">Starting (kg)</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${change > 0 ? 'positive' : change < 0 ? 'negative' : ''}`}>
            {change > 0 ? '+' : ''}{change} kg
          </div>
          <div className="stat-label">Total Change</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{weights.length}</div>
          <div className="stat-label">Entries</div>
        </div>
      </div>

      <div className="progress-card">
        <h3 className="section-title">Weight Over Time</h3>
        {weights.length < 2 ? (
          <p className="empty-text">Log at least 2 weight entries to see your progress chart.</p>
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
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.4,
                fill: true
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.parsed.y} kg`
                  }
                }
              },
              scales: {
                y: {
                  grid: { color: '#F0F2FA' },
                  ticks: { color: '#8B90A7', callback: (v) => `${v} kg` }
                },
                x: {
                  grid: { display: false },
                  ticks: { color: '#8B90A7' }
                }
              }
            }}
          />
        )}
      </div>

      <div className="progress-card">
        <h3 className="section-title">Weight Log</h3>
        {weights.length === 0 ? (
          <p className="empty-text">No weight entries yet. Log your weight from the dashboard.</p>
        ) : (
          <div className="weight-log">
            {[...weights].reverse().map(w => (
              <div key={w.id} className="weight-entry">
                <span className="weight-date">{w.date}</span>
                <span className="weight-value">{w.weight} kg</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default Progress