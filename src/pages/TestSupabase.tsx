import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function TestSupabase() {
  const [todos, setTodos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function getTodos() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from('todos').select()

        if (error) throw error

        if (data) {
          setTodos(data)
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data')
      } finally {
        setLoading(false)
      }
    }

    getTodos()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pengujian Supabase</h1>
      <p className="mb-4 text-gray-600">Halaman ini menguji koneksi Supabase ke tabel "todos" berdasarkan tutorial Supabase.</p>
      
      {loading && <p>Loading data...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error: </strong> {error}
        </div>
      )}

      {!loading && !error && todos.length === 0 && (
        <p className="text-gray-500">Tabel "todos" kosong atau belum dibuat di database Supabase Anda.</p>
      )}

      {!loading && !error && todos.length > 0 && (
        <ul className="list-disc pl-5">
          {todos.map((todo) => (
            <li key={todo.id} className="mb-2">
              <span className="font-semibold">{todo.name || todo.title || JSON.stringify(todo)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
