import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import './FoodSearch.css'

const USDA_API_KEY = 'DEMO_KEY' 

function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${USDA_API_KEY}&pageSize=8&dataType=SR%20Legacy,Foundation`
        )
        const data = await res.json()

        const foods = (data.foods || []).map(food => {
          const nutrients = food.foodNutrients || []
          const calNutrient = nutrients.find(n =>
            n.nutrientName === 'Energy' && n.unitName === 'KCAL'
          )
          const proteinNutrient = nutrients.find(n => n.nutrientName === 'Protein')

          return {
            name: food.description,
            calories: calNutrient ? Math.round(calNutrient.value) : 0,
            protein: proteinNutrient ? Math.round(proteinNutrient.value) : 0,
          }
        }).filter(f => f.calories > 0)

        setResults(foods)
        setOpen(foods.length > 0)
      } catch (err) {
        console.error('Food search error:', err)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  const handleSelect = (food) => {
    onSelect(food)
    setQuery(food.name)
    setOpen(false)
  }

  return (
    <div className="food-search-wrapper" ref={wrapperRef}>
      <div className="food-search-input-wrap">
        <MagnifyingGlassIcon className="food-search-icon" />
        <input
          className="food-search-input"
          placeholder="Search any food (e.g. chicken breast, oats...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value) onSelect({ name: '', calories: '', protein: '' })
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <div className="food-search-spinner" />}
      </div>

      {open && (
        <div className="food-dropdown">
          <div className="food-dropdown-header">
            <span>USDA Food Database</span>
            <span>{results.length} results</span>
          </div>
          {results.map((food, i) => (
            <button key={i} className="food-item" onClick={() => handleSelect(food)}>
              <span className="food-item-name">{food.name.toLowerCase()}</span>
              <div className="food-item-macros">
                <span className="food-badge calorie-badge">{food.calories} kcal</span>
                <span className="food-badge protein-badge">{food.protein}g protein</span>
              </div>
            </button>
          ))}
          <div className="food-dropdown-footer">
            Per 100g · Powered by USDA FoodData Central
          </div>
        </div>
      )}
    </div>
  )
}

export default FoodSearch