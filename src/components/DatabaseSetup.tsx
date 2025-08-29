'use client'

import { useState } from 'react'

export default function DatabaseSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setupDatabase = async () => {
    setIsLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        // 페이지 새로고침하여 연결 상태 업데이트
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(data.error || '데이터베이스 설정 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">데이터베이스 설정</h3>
      <p className="text-sm text-gray-600 mb-4">
        posts 테이블이 존재하지 않습니다. 데이터베이스를 설정하세요.
      </p>
      
      <button
        onClick={setupDatabase}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '설정 중...' : '데이터베이스 설정'}
      </button>

      {message && (
        <p className="text-sm text-green-600 mt-2">{message}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 mt-2">오류: {error}</p>
      )}
    </div>
  )
}
