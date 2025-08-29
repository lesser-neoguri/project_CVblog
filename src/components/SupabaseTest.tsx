'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SupabaseTest() {
  const [status, setStatus] = useState<string>('연결 확인 중...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .limit(1)
        
        if (error) {
          setError(error.message)
          setStatus('연결 실패')
        } else {
          setStatus('Supabase 연결 성공!')
        }
      } catch (err) {
        setError('연결 오류가 발생했습니다.')
        setStatus('연결 실패')
      }
    }

    testConnection()
  }, [])

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
