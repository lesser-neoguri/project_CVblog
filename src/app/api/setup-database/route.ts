import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    // posts 테이블 생성
    const { error: postsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT,
          excerpt TEXT,
          slug TEXT UNIQUE NOT NULL,
          published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (postsError) {
      console.error('Posts table creation error:', postsError)
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    // profiles 테이블 생성
    const { error: profilesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) PRIMARY KEY,
          name TEXT,
          bio TEXT,
          avatar_url TEXT,
          website TEXT,
          github_url TEXT,
          linkedin_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (profilesError) {
      console.error('Profiles table creation error:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // 샘플 데이터 삽입
    const { error: insertError } = await supabaseAdmin
      .from('posts')
      .insert([
        {
          title: '첫 번째 블로그 포스트',
          content: '이것은 첫 번째 블로그 포스트입니다.',
          excerpt: 'Supabase와 Next.js를 사용한 블로그 프로젝트의 첫 번째 포스트입니다.',
          slug: 'first-post'
        }
      ])

    if (insertError && !insertError.message.includes('duplicate key')) {
      console.error('Sample data insertion error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: '데이터베이스 설정이 완료되었습니다!',
      success: true 
    })

  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({ 
      error: '데이터베이스 설정 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
