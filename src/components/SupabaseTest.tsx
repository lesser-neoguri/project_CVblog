'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import DatabaseSetup from './DatabaseSetup'

export default function SupabaseTest() {
  const [status, setStatus] = useState<string>('연결 확인 중...')
  const [error, setError] = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .limit(1)
        
        if (error) {
          if (error.message.includes('does not exist')) {
            setShowSetup(true)
            setStatus('테이블이 존재하지 않습니다')
          } else {
            setError(error.message)
            setStatus('연결 실패')
          }
        } else {
          setStatus('Supabase 연결 성공!')
          setShowSetup(false)
        }
      } catch (err) {
        setError('연결 오류가 발생했습니다.')
        setStatus('연결 실패')
      }
    }

    testConnection()
  }, [])

  if (showSetup) {
    return <DatabaseSetup />
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Supabase 연결 상태</h3>
      <p className="text-sm text-gray-600 mb-2">{status}</p>
      {error && (
        <p className="text-sm text-red-600">
          오류: {error}
        </p>
      )}
    </div>
  )
}
