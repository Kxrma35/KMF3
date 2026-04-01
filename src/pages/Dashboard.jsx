import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useNavigate } from 'react-router-dom'
import {
  FireIcon,
  ScaleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
  AdjustmentsHorizontalIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'
import ChatBot from '../components/ChatBot'
import GoalsModal from '../components/GoalsModal'
import BarcodeScanner from '../components/BarcodeScanner'
import './Dashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function Dashboard() {
  const [meals, setMeals] = useState([])
  const [mealName, setMealName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [weight, setWeight] = useState('')
  const [weeklyData, setWeeklyData] = useState([])
  const [calorieGoal, setCalorieGoal] = useState(3500)
  const [proteinGoal, setProteinGoal] = useState(180)
  const [showGoals, setShowGoals] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const user = auth.currentUser
  const navigate = useNavigate()

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const loadGoals = async () => {
      const snap = await getDoc(doc(db, 'goals', user.uid))
      if (snap.exists()) {
        setCalorieGoal(snap.data().calories)
        setProteinGoal(snap.data().protein)
      }
    }
    loadGoals()
  }, [])

  useEffect(() => {
    const q = query(
      collection(db, 'meals'),
      where('uid', '==', user.uid),
      where('date', '==', today)
    )
    const unsub = onSnapshot(q, (snap) => {
      setMeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })

    const q = query(
      collection(db, 'meals'),
      where('uid', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const allMeals = snap.docs.map(doc => doc.data())
      const data = last7.map(date => ({
        date: date.slice(5),
        calories: allMeals
          .filter(m => m.date === date)
          .reduce((sum, m) => sum + m.calories, 0)
      }))
      setWeeklyData(data)
    })
    return unsub
  }, [])

  useEffect(() => {
    const q = query(
      collection(db, 'meals'),
      where('uid', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const allMeals = snap.docs.map(doc => doc.data())

      const dailyCalories = {}
      allMeals.forEach(m => {
        dailyCalories[m.date] = (dailyCalories[m.date] || 0) + m.calories
      })

      const sortedDates = Object.keys(dailyCalories).sort()
      let best = 0
      let temp = 0

      sortedDates.forEach(date => {
        if (dailyCalories[date] >= calorieGoal) {
          temp++
          if (temp > best) best = temp
        } else {
          temp = 0
        }
      })

      let currentStreak = 0
      const todayDate = new Date()
      for (let i = 0; i < 365; i++) {
        const d = new Date(todayDate)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        if (dailyCalories[dateStr] >= calorieGoal) {
          currentStreak++
        } else {
          break
        }
      }

      setStreak(currentStreak)
      setBestStreak(best)
    })
    return unsub
  }, [calorieGoal])

  const addMeal = async () => {
    if (!mealName || !calories) return
    await addDoc(collection(db, 'meals'), {
      uid: user.uid,
      name: mealName,
      calories: Number(calories),
      protein: Number(protein) || 0,
      date: today,
      createdAt: new Date()
    })
    setMealName('')
    setCalories('')
    setProtein('')
  }

  const logWeight = async () => {
    if (!weight) return
    await addDoc(collection(db, 'weights'), {
      uid: user.uid,
      weight: Number(weight),
      date: today,
      createdAt: new Date()
    })
    setWeight('')
  }

  const deleteMeal = async (id) => {
    await deleteDoc(doc(db, 'meals', id))
  }

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0)
  const caloriePercent = Math.min((totalCalories / calorieGoal) * 100, 100)
  const proteinPercent = Math.min((totalProtein / proteinGoal) * 100, 100)
  const caloriesLeft = calorieGoal - totalCalories

  return (
    <div className="dashboard">

      {/* Header */}
      <div className="dash-header">
        <div>
          <p className="dash-greeting">Good morning</p>
          <h2 className="dash-name">{user.email.split('@')[0]}</h2>
        </div>
        <div className="dash-actions">
          <button className="logout-btn" onClick={() => setShowGoals(true)}>
            <AdjustmentsHorizontalIcon className="btn-icon" /> Goals
          </button>
          <button className="logout-btn" onClick={() => navigate('/progress')}>
            <ArrowTrendingUpIcon className="btn-icon" /> Progress
          </button>
          <button className="logout-btn" onClick={() => signOut(auth)}>
            <ArrowRightOnRectangleIcon className="btn-icon" /> Logout
          </button>
        </div>
      </div>

      {/* Calorie Card */}
      <div className="calorie-card">
        <div className="calorie-top">
          <span className="calorie-label">
            <FireIcon className="inline-icon" /> Daily Calories
          </span>
        </div>
        <div className="calorie-eaten">Eaten {totalCalories} kcal</div>
        <div className="calorie-left">{caloriesLeft > 0 ? caloriesLeft : 0}</div>
        <div className="calorie-sub">KCAL LEFT</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${caloriePercent}%` }}></div>
        </div>
        <div className="calorie-footer">
          <span>Goal: {calorieGoal} kcal</span>
          <span>{Math.round(caloriePercent)}%</span>
        </div>
      </div>

      {/* Macros Row */}
      <div className="macros-row">
        <div className="macro-card">
          <div className="macro-value">{totalProtein}g</div>
          <div className="macro-label">Protein</div>
          <div className="macro-bar">
            <div className="macro-fill protein" style={{ width: `${proteinPercent}%` }}></div>
          </div>
          <div className="macro-goal">/ {proteinGoal}g</div>
        </div>
        <div className="macro-card">
          <div className="macro-value">{meals.length}</div>
          <div className="macro-label">Meals</div>
          <div className="macro-bar">
            <div className="macro-fill meals" style={{ width: `${Math.min(meals.length * 20, 100)}%` }}></div>
          </div>
          <div className="macro-goal">today</div>
        </div>
        <div className="macro-card">
          <div className="macro-value streak-value">{streak}</div>
          <div className="macro-label">Day Streak</div>
          <div className="macro-bar">
            <div className="macro-fill streak" style={{ width: `${Math.min(streak * 10, 100)}%` }}></div>
          </div>
          <div className="macro-goal">best: {bestStreak}</div>
        </div>
        <div className="macro-card">
          <div className="macro-value">{totalCalories > calorieGoal ? '+' + (totalCalories - calorieGoal) : caloriesLeft}</div>
          <div className="macro-label">{totalCalories > calorieGoal ? 'Over' : 'Remaining'}</div>
          <div className="macro-bar">
            <div className="macro-fill remaining" style={{ width: `${caloriePercent}%` }}></div>
          </div>
          <div className="macro-goal">kcal</div>
        </div>
      </div>

      {/* Two column layout on desktop */}
      <div className="desktop-grid">

        {/* Add Meal */}
        <div className="section-card">
          <h3 className="section-title">
            <PlusCircleIcon className="title-icon" /> Add Meal
            <button className="scan-btn" onClick={() => setShowScanner(true)}>
              <QrCodeIcon style={{ width: 18, height: 18 }} /> Scan
            </button>
          </h3>
          <div className="add-meal-form">
            <input
              placeholder="Meal name (e.g. Chicken & Rice)"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
            />
            <div className="add-meal-row">
              <input
                placeholder="Calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
              <input
                placeholder="Protein (g)"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>
            <button className="add-btn" onClick={addMeal}>Add Meal</button>
          </div>
        </div>

        {/* Meal List */}
        <div className="section-card">
          <h3 className="section-title">Today's Meals</h3>
          {meals.length === 0 ? (
            <p className="empty-text">No meals logged yet. Add your first meal!</p>
          ) : (
            <div className="meal-list">
              {meals.map(meal => (
                <div key={meal.id} className="meal-item">
                  <div className="meal-info">
                    <span className="meal-name">{meal.name}</span>
                    <span className="meal-protein">{meal.protein}g protein</span>
                  </div>
                  <div className="meal-item-right">
                    <span className="meal-calories">{meal.calories} kcal</span>
                    <button className="delete-btn" onClick={() => deleteMeal(meal.id)}>
                      <TrashIcon className="delete-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="desktop-grid">

        {/* Log Weight */}
        <div className="section-card">
          <h3 className="section-title">
            <ScaleIcon className="title-icon" /> Log Weight
          </h3>
          <div className="weight-form">
            <input
              placeholder="Weight in kg (e.g. 75.5)"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <button className="add-btn" onClick={logWeight}>Log</button>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="section-card">
          <h3 className="section-title">
            <ChartBarIcon className="title-icon" /> Weekly Calories
          </h3>
          {weeklyData.length > 0 && (
            <Bar
              data={{
                labels: weeklyData.map(d => d.date),
                datasets: [{
                  label: 'Calories',
                  data: weeklyData.map(d => d.calories),
                  backgroundColor: 'rgba(79, 110, 247, 0.7)',
                  borderRadius: 8,
                }]
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: '#F0F2FA' },
                    ticks: { color: '#8B90A7' }
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

      </div>

      {showGoals && (
        <GoalsModal
          currentCalories={calorieGoal}
          currentProtein={proteinGoal}
          onSave={(cal, pro) => {
            setCalorieGoal(cal)
            setProteinGoal(pro)
          }}
          onClose={() => setShowGoals(false)}
        />
      )}

      {showScanner && (
        <BarcodeScanner
          onResult={(product) => {
            setMealName(product.name)
            setCalories(String(product.calories))
            setProtein(String(product.protein))
            setShowScanner(false)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <ChatBot
        totalCalories={totalCalories}
        totalProtein={totalProtein}
        calorieGoal={calorieGoal}
        proteinGoal={proteinGoal}
        meals={meals}
      />

    </div>
  )
}

export default Dashboard