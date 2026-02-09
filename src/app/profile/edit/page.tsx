'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import ImageUploader from '@/components/ImageUploader';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import {
  getCurrentProfile,
  upsertProfile,
  setCurrentProfileId,
} from '@/lib/profiles';
import {
  Profile,
  Education,
  Experience,
  Project,
  Award,
  Certification,
  Publication,
  RelatedCourse,
  LanguageTest,
  Scholarship,
  Extracurricular,
} from '@/lib/supabase';

export default function ProfileEditPage() {
  const { isLightTheme } = useTheme();
  const router = useRouter();
  const { modalState, showAlert, closeModal } = useModal();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // 기본 정보
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [description, setDescription] = useState('');

  // 링크
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // 복합 필드
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<RelatedCourse[]>([]);
  const [languageTests, setLanguageTests] = useState<LanguageTest[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getCurrentProfile();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setLocation(data.location || '');
        setAvatarUrl(data.avatar_url || '');
        setBio(data.bio || '');
        setDescription(data.description || '');
        setWebsite(data.website || '');
        setGithub(data.github || '');
        setLinkedin(data.linkedin || '');
        setEducation(data.education || []);
        setExperience(data.experience || []);
        setProjects(data.projects || []);
        setSkills(data.skills || []);
        setAwards(data.awards || []);
        setCertifications(data.certifications || []);
        setPublications(data.publications || []);
        setRelatedCourses(data.related_courses || []);
        setLanguageTests(data.language_tests || []);
        setScholarships(data.scholarships || []);
      }
    } catch (err: unknown) {
      console.error('프로필 로딩 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (imageUrl: string, markdownText: string) => {
    setAvatarUrl(imageUrl);
  };

  const handleImageUploadError = (error: string) => {
    setError(error);
    setTimeout(() => setError(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const savedProfile = await upsertProfile({
        id: profile?.id,
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
        avatar_url: avatarUrl || null,
        bio: bio.trim() || null,
        description: description.trim() || null,
        website: website.trim() || null,
        github: github.trim() || null,
        linkedin: linkedin.trim() || null,
        education,
        experience,
        projects,
        skills,
        awards,
        certifications,
        publications,
        related_courses: relatedCourses,
        language_tests: languageTests,
        scholarships,
      });

      setCurrentProfileId(savedProfile.id);

      showAlert(
        profile ? '프로필이 수정되었습니다!' : '프로필이 생성되었습니다!'
      );
      setTimeout(() => router.push('/profile'), 1000);
    } catch (err: unknown) {
      console.error('저장 오류:', err);
      setError(err instanceof Error ? err.message : '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: isLightTheme ? '#FAF8F3' : '#1a1a1a',
          color: isLightTheme ? '#111' : '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ fontSize: '16px', opacity: 0.7 }}>로딩 중...</p>
      </main>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: isLightTheme
      ? '1px solid rgba(0, 0, 0, 0.1)'
      : '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    background: isLightTheme
      ? 'rgba(255, 255, 255, 0.8)'
      : 'rgba(0, 0, 0, 0.2)',
    color: isLightTheme ? '#111' : '#fafafa',
    outline: 'none',
    boxSizing: 'border-box' as const,
    minWidth: 0,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
  };

  const sectionStyle = {
    marginBottom: '32px',
    padding: '24px',
    borderRadius: '12px',
    background: isLightTheme
      ? 'rgba(0, 0, 0, 0.02)'
      : 'rgba(255, 255, 255, 0.03)',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: isLightTheme ? '#FAF8F3' : '#1a1a1a',
        color: isLightTheme ? '#111' : '#fafafa',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        padding: '40px 20px 100px',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto', minWidth: 0 }}>
        <div
          style={{
            padding: '24px',
            borderRadius: '20px',
            background: isLightTheme
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.08)',
            border: isLightTheme
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: isLightTheme
              ? '0 12px 30px rgba(0,0,0,0.08)'
              : '0 12px 30px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
            boxSizing: 'border-box' as const,
            overflow: 'hidden',
          }}
        >
          <h1
            style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700 }}
          >
            {profile ? '프로필 수정' : '프로필 생성'}
          </h1>
          <p style={{ margin: '0 0 40px 0', opacity: 0.7, fontSize: '15px' }}>
            대학원 입시 및 취업을 위한 포트폴리오를 작성하세요
          </p>

          <form onSubmit={handleSubmit}>
            {/* 기본 정보 섹션 */}
            <div style={sectionStyle}>
              <h2
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                📋 기본 정보
              </h2>

              {/* 프로필 사진 */}
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                {avatarUrl ? (
                  <div
                    style={{ position: 'relative', display: 'inline-block' }}
                  >
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: isLightTheme
                          ? '3px solid rgba(0, 0, 0, 0.1)'
                          : '3px solid rgba(255, 255, 255, 0.2)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div>
                    <label style={labelStyle}>프로필 사진</label>
                    <ImageUploader
                      onImageUpload={handleImageUpload}
                      onError={handleImageUploadError}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label htmlFor="fullName" style={labelStyle}>
                    이름 (필수)
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="홍길동"
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minWidth: 0 }}>
                  <div style={{ minWidth: 0 }}>
                    <label htmlFor="email" style={labelStyle}>
                      이메일
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <label htmlFor="phone" style={labelStyle}>
                      전화번호
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-1234-5678"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="location" style={labelStyle}>
                    위치
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="서울, 대한민국"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="bio" style={labelStyle}>
                    한 줄 소개
                  </label>
                  <input
                    id="bio"
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="간단한 자기소개를 한 줄로 작성하세요"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="description" style={labelStyle}>
                    자기소개
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="상세한 자기소개를 작성하세요..."
                    rows={6}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* 링크 섹션 */}
            <div style={sectionStyle}>
              <h2
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                🔗 링크
              </h2>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label htmlFor="website" style={labelStyle}>
                    웹사이트
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="github" style={labelStyle}>
                    GitHub
                  </label>
                  <input
                    id="github"
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/username"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="linkedin" style={labelStyle}>
                    LinkedIn
                  </label>
                  <input
                    id="linkedin"
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* 학력 섹션 */}
            <div style={sectionStyle}>
              <h2
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                🎓 학력
              </h2>
              
              {education.map((edu, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '20px',
                    padding: '20px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minWidth: 0 }}>
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].school = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="학교명"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={edu.major}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].major = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="전공"
                        style={inputStyle}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', minWidth: 0 }}>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].degree = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="학위 (학사/석사/박사)"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={edu.startYear}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].startYear = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="입학년도"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={edu.endYear}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].endYear = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="졸업년도"
                        style={inputStyle}
                      />
                    </div>

                    <input
                      type="text"
                      value={edu.gpa || ''}
                      onChange={(e) => {
                        const newEdu = [...education];
                        newEdu[index].gpa = e.target.value;
                        setEducation(newEdu);
                      }}
                      placeholder="학점 (예: 4.0/4.5)"
                      style={inputStyle}
                    />

                    <textarea
                      value={edu.description || ''}
                      onChange={(e) => {
                        const newEdu = [...education];
                        newEdu[index].description = e.target.value;
                        setEducation(newEdu);
                      }}
                      placeholder="설명 (선택사항)"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEducation(education.filter((_, i) => i !== index));
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setEducation([
                    ...education,
                    {
                      school: '',
                      degree: '',
                      major: '',
                      startYear: '',
                      endYear: '',
                    },
                  ]);
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isLightTheme ? '#111' : '#fafafa',
                  color: isLightTheme ? '#fafafa' : '#111',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                + 학력 추가
              </button>
            </div>

            {/* 경력 섹션 */}
            <div style={sectionStyle}>
              <h2
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                💼 경력
              </h2>

              {experience.map((exp, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '20px',
                    padding: '20px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minWidth: 0 }}>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...experience];
                          newExp[index].company = e.target.value;
                          setExperience(newExp);
                        }}
                        placeholder="회사/기관명"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const newExp = [...experience];
                          newExp[index].position = e.target.value;
                          setExperience(newExp);
                        }}
                        placeholder="직책"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'center', minWidth: 0 }}>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => {
                          const newExp = [...experience];
                          newExp[index].startDate = e.target.value;
                          setExperience(newExp);
                        }}
                        style={inputStyle}
                      />
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => {
                          const newExp = [...experience];
                          newExp[index].endDate = e.target.value;
                          setExperience(newExp);
                        }}
                        disabled={exp.current}
                        style={inputStyle}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={exp.current || false}
                          onChange={(e) => {
                            const newExp = [...experience];
                            newExp[index].current = e.target.checked;
                            if (e.target.checked) {
                              newExp[index].endDate = '';
                            }
                            setExperience(newExp);
                          }}
                        />
                        재직중
                      </label>
                    </div>

                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...experience];
                        newExp[index].description = e.target.value;
                        setExperience(newExp);
                      }}
                      placeholder="업무 내용"
                      rows={4}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setExperience(experience.filter((_, i) => i !== index));
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setExperience([
                    ...experience,
                    {
                      company: '',
                      position: '',
                      startDate: '',
                      endDate: '',
                      description: '',
                    },
                  ]);
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isLightTheme ? '#111' : '#fafafa',
                  color: isLightTheme ? '#fafafa' : '#111',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                + 경력 추가
              </button>
            </div>

            {/* 기술 스택 섹션 */}
            <div style={sectionStyle}>
              <h2
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                🛠️ 기술 스택
              </h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 16px',
                      background: isLightTheme ? '#111' : '#fafafa',
                      color: isLightTheme ? '#fafafa' : '#111',
                      borderRadius: '20px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => {
                        setSkills(skills.filter((_, i) => i !== index));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="기술 스택 입력 (예: React, TypeScript)"
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !skills.includes(value)) {
                        setSkills([...skills, value]);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                    const value = input.value.trim();
                    if (value && !skills.includes(value)) {
                      setSkills([...skills, value]);
                      input.value = '';
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    background: isLightTheme ? '#111' : '#fafafa',
                    color: isLightTheme ? '#fafafa' : '#111',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  추가
                </button>
              </div>
            </div>

            {/* 장학금 섹션 */}
            <div style={sectionStyle}>
              <h2
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                💰 장학금
              </h2>
              
              {scholarships.map((scholarship, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '20px',
                    padding: '20px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minWidth: 0 }}>
                      <input
                        type="text"
                        value={scholarship.title}
                        onChange={(e) => {
                          const newScholarships = [...scholarships];
                          newScholarships[index].title = e.target.value;
                          setScholarships(newScholarships);
                        }}
                        placeholder="장학금명 (예: 국가우수장학금)"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={scholarship.issuer}
                        onChange={(e) => {
                          const newScholarships = [...scholarships];
                          newScholarships[index].issuer = e.target.value;
                          setScholarships(newScholarships);
                        }}
                        placeholder="발급기관"
                        style={inputStyle}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', minWidth: 0 }}>
                      <input
                        type="text"
                        value={scholarship.date}
                        onChange={(e) => {
                          const newScholarships = [...scholarships];
                          newScholarships[index].date = e.target.value;
                          setScholarships(newScholarships);
                        }}
                        placeholder="수여일 (예: 2024)"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={scholarship.duration || ''}
                        onChange={(e) => {
                          const newScholarships = [...scholarships];
                          newScholarships[index].duration = e.target.value;
                          setScholarships(newScholarships);
                        }}
                        placeholder="기간 (예: 4년 전액)"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={scholarship.amount || ''}
                        onChange={(e) => {
                          const newScholarships = [...scholarships];
                          newScholarships[index].amount = e.target.value;
                          setScholarships(newScholarships);
                        }}
                        placeholder="금액 (선택)"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setScholarships(scholarships.filter((_, i) => i !== index));
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setScholarships([
                    ...scholarships,
                    {
                      title: '',
                      issuer: '',
                      date: '',
                    },
                  ]);
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isLightTheme ? '#111' : '#fafafa',
                  color: isLightTheme ? '#fafafa' : '#111',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                + 장학금 추가
              </button>
            </div>

            {/* 어학 시험 성적 섹션 */}
            <div style={sectionStyle}>
              <h2
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                🌐 어학 시험 성적
              </h2>
              
              {languageTests.map((test, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '20px',
                    padding: '20px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minWidth: 0 }}>
                      <input
                        type="text"
                        value={test.testName}
                        onChange={(e) => {
                          const newTests = [...languageTests];
                          newTests[index].testName = e.target.value;
                          setLanguageTests(newTests);
                        }}
                        placeholder="시험명 (TOEFL, IELTS, TOEIC 등)"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={test.score}
                        onChange={(e) => {
                          const newTests = [...languageTests];
                          newTests[index].score = e.target.value;
                          setLanguageTests(newTests);
                        }}
                        placeholder="점수"
                        style={inputStyle}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', minWidth: 0, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={test.date}
                        onChange={(e) => {
                          const newTests = [...languageTests];
                          newTests[index].date = e.target.value;
                          setLanguageTests(newTests);
                        }}
                        placeholder="취득일 (예: 2024-03)"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={test.expiryDate || ''}
                        onChange={(e) => {
                          const newTests = [...languageTests];
                          newTests[index].expiryDate = e.target.value;
                          setLanguageTests(newTests);
                        }}
                        placeholder="만료일 (선택)"
                        style={inputStyle}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={test.expired || false}
                          onChange={(e) => {
                            const newTests = [...languageTests];
                            newTests[index].expired = e.target.checked;
                            setLanguageTests(newTests);
                          }}
                        />
                        만료됨
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLanguageTests(languageTests.filter((_, i) => i !== index));
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setLanguageTests([
                    ...languageTests,
                    {
                      testName: '',
                      score: '',
                      date: '',
                    },
                  ]);
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isLightTheme ? '#111' : '#fafafa',
                  color: isLightTheme ? '#fafafa' : '#111',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                + 시험 성적 추가
              </button>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  marginBottom: '24px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            {/* 저장 버튼 */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: isLightTheme ? '#111' : '#fafafa',
                  color: isLightTheme ? '#fafafa' : '#111',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? '저장 중...' : profile ? '수정 완료' : '프로필 생성'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/profile')}
                style={{
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: 'transparent',
                  color: isLightTheme ? '#111' : '#fafafa',
                  border: isLightTheme
                    ? '1px solid rgba(0, 0, 0, 0.2)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 모달 */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </main>
  );
}
