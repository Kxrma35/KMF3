import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { useNavigate } from 'react-router-dom'
import {
  TrashIcon, ArrowRightOnRectangleIcon, AdjustmentsHorizontalIcon,
  QrCodeIcon, ChartBarIcon, FireIcon, BoltIcon
} from '@heroicons/react/24/outline'
import ChatBot from '../components/ChatBot'
import GoalsModal from '../components/GoalsModal'
import BarcodeScanner from '../components/BarcodeScanner'
import FoodSearch from '../components/FoodSearch'
import './Dashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

/* ── SVG Arc Gauge ─────────────────────────── */
function CalorieGauge({ eaten, goal }) {
  const r = 78, cx = 100, cy = 108
  const pct = Math.min(eaten / goal, 1)

  const polarToXY = (deg, radius) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const arc = (startDeg, endDeg) => {
    const s = polarToXY(startDeg, r)
    const e = polarToXY(endDeg, r)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const START = 150, SPAN = 240
  const fillEnd = START + SPAN * pct
  const left = Math.max(0, goal - eaten)

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 200 150" className="gauge-svg">
        <path d={arc(START, START + SPAN)} fill="none"
          stroke="rgba(255,255,255,0.22)" strokeWidth="13" strokeLinecap="round"/>
        {pct > 0.01 && (
          <path d={arc(START, fillEnd)} fill="none"
            stroke="white" strokeWidth="13" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))' }}/>
        )}
        <text x="100" y="96"  textAnchor="middle" className="g-big">{left.toLocaleString()}</text>
        <text x="100" y="113" textAnchor="middle" className="g-unit">KCAL LEFT</text>
        <text x="100" y="130" textAnchor="middle" className="g-sub">
          {Math.round(pct * 100)}% of {goal.toLocaleString()}
        </text>
      </svg>
    </div>
  )
}

/* ── Mini Ring ──────────────────────────────── */
function MiniRing({ pct, color }) {
  const r = 15, circ = 2 * Math.PI * r
  return (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4"/>
      <circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ - Math.min(pct, 1) * circ}
        transform="rotate(-90 19 19)"
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }}/>
    </svg>
  )
}

/* ── Dashboard ──────────────────────────────── */
export default function Dashboard() {
  const [meals, setMeals]               = useState([])
  const [mealName, setMealName]         = useState('')
  const [calories, setCalories]         = useState('')
  const [protein, setProtein]           = useState('')
  const [weight, setWeight]             = useState('')
  const [weeklyData, setWeeklyData]     = useState([])
  const [calorieGoal, setCalorieGoal]   = useState(3500)
  const [proteinGoal, setProteinGoal]   = useState(180)
  const [showGoals, setShowGoals]       = useState(false)
  const [showScanner, setShowScanner]   = useState(false)
  const [streak, setStreak]             = useState(0)
  const [bestStreak, setBestStreak]     = useState(0)
  const user     = auth.currentUser
  const navigate = useNavigate()
  const today    = new Date().toISOString().split('T')[0]

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  useEffect(() => {
    getDoc(doc(db, 'goals', user.uid)).then(s => {
      if (s.exists()) { setCalorieGoal(s.data().calories); setProteinGoal(s.data().protein) }
    })
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'meals'), where('uid','==',user.uid), where('date','==',today))
    return onSnapshot(q, s => setMeals(s.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  useEffect(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]
    })
    return onSnapshot(query(collection(db,'meals'), where('uid','==',user.uid)), s => {
      const all = s.docs.map(d => d.data())
      setWeeklyData(last7.map(date => ({
        date: date.slice(5),
        calories: all.filter(m => m.date === date).reduce((a, m) => a + m.calories, 0)
      })))
    })
  }, [])

  useEffect(() => {
    return onSnapshot(query(collection(db,'meals'), where('uid','==',user.uid)), s => {
      const daily = {}
      s.docs.map(d => d.data()).forEach(m => { daily[m.date] = (daily[m.date]||0) + m.calories })
      const sorted = Object.keys(daily).sort()
      let best = 0, tmp = 0
      sorted.forEach(d => daily[d] >= calorieGoal ? (tmp++, tmp > best && (best = tmp)) : (tmp = 0))
      let cur = 0
      for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i)
        if (daily[d.toISOString().split('T')[0]] >= calorieGoal) cur++; else break
      }
      setStreak(cur); setBestStreak(best)
    })
  }, [calorieGoal])

  const addMeal = async () => {
    if (!mealName || !calories) return
    await addDoc(collection(db,'meals'), {
      uid: user.uid, name: mealName, calories: Number(calories),
      protein: Number(protein)||0, date: today, createdAt: new Date()
    })
    setMealName(''); setCalories(''); setProtein('')
  }

  const logWeight = async () => {
    if (!weight) return
    await addDoc(collection(db,'weights'), {
      uid: user.uid, weight: Number(weight), date: today, createdAt: new Date()
    })
    setWeight('')
  }

  const totalCalories  = meals.reduce((s, m) => s + m.calories, 0)
  const totalProtein   = meals.reduce((s, m) => s + m.protein, 0)
  const calPct         = totalCalories / calorieGoal
  const protPct        = totalProtein  / proteinGoal

  return (
    <div className="app-shell">
      <div className="dash-scroll">

        {/* Header */}
        <header className="dash-header">
          <div>
            <p className="dash-greeting">{greeting()} </p>
            <h1 className="dash-name">{user.email.split('@')[0]}</h1>
          </div>
          <div className="header-btns">
            <button className="icon-pill" onClick={() => setShowGoals(true)}>
              <AdjustmentsHorizontalIcon className="pill-icon"/>
            </button>
          </div>
        </header>

        {/* Calorie Hero */}
        <div className="calorie-hero">
          <div className="hero-top-row">
            <span className="hero-tag"><FireIcon className="hero-fire"/> Daily Calories</span>
            <span className="hero-eaten">Eaten <b>{totalCalories.toLocaleString()}</b> kcal</span>
          </div>
          <CalorieGauge eaten={totalCalories} goal={calorieGoal}/>
          <div className="hero-track"><div className="hero-fill" style={{ width:`${Math.min(calPct*100,100)}%` }}/></div>
        </div>

        {/* Stat Cards 2×2 */}
        <div className="stat-grid">
          {[
            { label: 'Protein',    value: `${totalProtein}g`, sub: `/ ${proteinGoal}g goal`,     pct: protPct,               color: '#34C77B', cls: 'green'  },
            { label: 'Meals',      value: meals.length,       sub: 'logged today',                pct: meals.length/6,        color: '#FB923C', cls: 'orange' },
            { label: 'Streak',     value: `${streak}d`,       sub: `best: ${bestStreak} days`,    pct: streak/Math.max(bestStreak,1), color: '#A78BFA', cls: 'purple' },
            { label: totalCalories > calorieGoal ? 'Over' : 'Left',
              value: totalCalories > calorieGoal
                ? `+${(totalCalories-calorieGoal).toLocaleString()}`
                : (calorieGoal-totalCalories).toLocaleString(),
              sub: 'kcal', pct: calPct, color: '#60A5FA', cls: 'blue' },
          ].map(c => (
            <div key={c.label} className={`stat-card ${c.cls}`}>
              <div className="stat-top">
                <div>
                  <p className="stat-val">{c.value}</p>
                  <p className="stat-lbl">{c.label}</p>
                </div>
                <MiniRing pct={c.pct} color={c.color}/>
              </div>
              <p className="stat-sub">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Add Meal */}
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Add Meal</h2>
            <button className="scan-pill" onClick={() => setShowScanner(true)}>
              <QrCodeIcon className="scan-icon"/> Scan
            </button>
          </div>
          <div className="add-form">
            <FoodSearch onSelect={f => { setMealName(f.name); setCalories(String(f.calories)); setProtein(String(f.protein)) }}/>
            <div className="add-row">
              <input className="field" placeholder="Calories" type="number"
                value={calories} onChange={e => setCalories(e.target.value)}/>
              <input className="field" placeholder="Protein (g)" type="number"
                value={protein} onChange={e => setProtein(e.target.value)}/>
            </div>
            <button className="add-btn" onClick={addMeal}>
              <BoltIcon className="add-icon"/> Add Meal
            </button>
          </div>
        </section>

        {/* Meals List */}
        <section className="card">
          <h2 className="card-title">Today's Meals</h2>
          {meals.length === 0
            ? <p className="empty-msg">No meals yet — add your first one above! </p>
            : <ul className="meal-list">
                {meals.map((m, i) => (
                  <li key={m.id} className="meal-item" style={{ animationDelay:`${i*50}ms` }}>
                    <span className="meal-dot"/>
                    <div className="meal-info">
                      <span className="meal-name">{m.name}</span>
                      <span className="meal-prot">{m.protein}g protein</span>
                    </div>
                    <div className="meal-right">
                      <span className="meal-kcal">{m.calories} kcal</span>
                      <button className="del-btn" onClick={() => deleteDoc(doc(db,'meals',m.id))}>
                        <TrashIcon className="del-icon"/>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
          }
        </section>

        {/* Log Weight */}
        <section className="card">
          <h2 className="card-title">Log Weight</h2>
          <div className="weight-row">
            <input className="field" placeholder="Weight in kg (e.g. 75.5)"
              type="number" value={weight} onChange={e => setWeight(e.target.value)}/>
            <button className="weight-btn" onClick={logWeight}>Log</button>
          </div>
        </section>

        {/* Weekly Chart */}
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Weekly Calories</h2>
            <button className="text-link" onClick={() => navigate('/progress')}>View all →</button>
          </div>
          {weeklyData.length > 0 && (
            <Bar data={{
              labels: weeklyData.map(d => d.date),
              datasets: [{
                data: weeklyData.map(d => d.calories),
                backgroundColor: weeklyData.map(d =>
                  d.calories >= calorieGoal ? 'rgba(52,199,123,0.8)' : 'rgba(167,139,250,0.7)'),
                borderRadius: 10, borderSkipped: false
              }]
            }} options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: '#F0EEF8' }, ticks: { color: '#9B96B8' } },
                x: { grid: { display: false }, ticks: { color: '#9B96B8' } }
              }
            }}/>
          )}
        </section>

        <div style={{ height: 90 }}/>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-btn active" onClick={() => navigate('/')}>
          <span className="nav-icon"></span><span className="nav-lbl">Home</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/progress')}>
          <ChartBarIcon className="nav-hero-icon"/><span className="nav-lbl">Progress</span>
        </button>
        <button className="nav-btn" onClick={() => signOut(auth)}>
          <ArrowRightOnRectangleIcon className="nav-hero-icon"/><span className="nav-lbl">Logout</span>
        </button>
      </nav>

      {showGoals && (
        <GoalsModal currentCalories={calorieGoal} currentProtein={proteinGoal}
          onSave={(c,p) => { setCalorieGoal(c); setProteinGoal(p) }}
          onClose={() => setShowGoals(false)}/>
      )}
      {showScanner && (
        <BarcodeScanner
          onResult={p => { setMealName(p.name); setCalories(String(p.calories)); setProtein(String(p.protein)); setShowScanner(false) }}
          onClose={() => setShowScanner(false)}/>
      )}
      <ChatBot totalCalories={totalCalories} totalProtein={totalProtein}
        calorieGoal={calorieGoal} proteinGoal={proteinGoal} meals={meals}/>
    </div>
  )
}