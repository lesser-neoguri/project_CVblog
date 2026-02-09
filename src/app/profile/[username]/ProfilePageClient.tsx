'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Profile } from '@/lib/supabase';

interface ProfilePageClientProps {
  profile: Profile;
}

export default function ProfilePageClient({ profile }: ProfilePageClientProps) {
  const { isLightTheme } = useTheme();
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: isLightTheme ? '#FAF8F3' : '#1a1a1a',
        color: isLightTheme ? '#111' : '#fafafa',
        padding: '60px 20px 100px',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        {/* 프로필 헤더 */}
        <div
          style={{
            padding: '40px',
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
            marginBottom: '32px',
            display: 'flex',
            gap: '32px',
            alignItems: 'flex-start',
          }}
        >
          {/* 프로필 사진 */}
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || profile.username || 'Profile'}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: isLightTheme
                  ? '4px solid rgba(0, 0, 0, 0.1)'
                  : '4px solid rgba(255, 255, 255, 0.2)',
              }}
            />
          )}

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              {profile.full_name || profile.username}
            </h1>
            {profile.username && (
              <p
                style={{
                  fontSize: '16px',
                  opacity: 0.6,
                  marginBottom: '16px',
                }}
              >
                @{profile.username}
              </p>
            )}
            {profile.bio && (
              <p
                style={{
                  fontSize: '18px',
                  marginBottom: '16px',
                  lineHeight: '1.6',
                }}
              >
                {profile.bio}
              </p>
            )}

            {/* 연락처 및 링크 */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                marginTop: '20px',
              }}
            >
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.1)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  📧 {profile.email}
                </a>
              )}
              {profile.location && (
                <span
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.1)',
                    fontSize: '14px',
                  }}
                >
                  📍 {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.1)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  🌐 Website
                </a>
              )}
              {profile.github && (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.1)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  💻 GitHub
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.1)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  💼 LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 설명 */}
        {profile.description && (
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: isLightTheme
                ? 'rgba(255, 255, 255, 0.6)'
                : 'rgba(255, 255, 255, 0.08)',
              border: isLightTheme
                ? '1px solid rgba(0, 0, 0, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.14)',
              marginBottom: '32px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              소개
            </h2>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
              }}
            >
              {profile.description}
            </p>
          </div>
        )}

        {/* 학력 */}
        {profile.education && profile.education.length > 0 && (
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: isLightTheme
                ? 'rgba(255, 255, 255, 0.6)'
                : 'rgba(255, 255, 255, 0.08)',
              border: isLightTheme
                ? '1px solid rgba(0, 0, 0, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.14)',
              marginBottom: '32px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '20px',
              }}
            >
              학력
            </h2>
            {profile.education.map((edu) => (
              <div
                key={edu.id}
                style={{
                  padding: '20px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  background: isLightTheme
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  {edu.institution}
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    marginBottom: '8px',
                  }}
                >
                  {edu.degree} in {edu.field}
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    opacity: 0.7,
                    marginBottom: '8px',
                  }}
                >
                  {edu.startDate} - {edu.current ? '재학중' : edu.endDate}
                </p>
                {edu.description && (
                  <p
                    style={{
                      fontSize: '14px',
                      marginTop: '12px',
                      lineHeight: '1.6',
                    }}
                  >
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 경력 */}
        {profile.experience && profile.experience.length > 0 && (
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: isLightTheme
                ? 'rgba(255, 255, 255, 0.6)'
                : 'rgba(255, 255, 255, 0.08)',
              border: isLightTheme
                ? '1px solid rgba(0, 0, 0, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.14)',
              marginBottom: '32px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '20px',
              }}
            >
              경력
            </h2>
            {profile.experience.map((exp) => (
              <div
                key={exp.id}
                style={{
                  padding: '20px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  background: isLightTheme
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  {exp.position}
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    marginBottom: '8px',
                  }}
                >
                  {exp.company}
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    opacity: 0.7,
                    marginBottom: '8px',
                  }}
                >
                  {exp.startDate} - {exp.current ? '재직중' : exp.endDate}
                </p>
                {exp.description && (
                  <p
                    style={{
                      fontSize: '14px',
                      marginTop: '12px',
                      lineHeight: '1.6',
                    }}
                  >
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 프로젝트 */}
        {profile.projects && profile.projects.length > 0 && (
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: isLightTheme
                ? 'rgba(255, 255, 255, 0.6)'
                : 'rgba(255, 255, 255, 0.08)',
              border: isLightTheme
                ? '1px solid rgba(0, 0, 0, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.14)',
              marginBottom: '32px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '20px',
              }}
            >
              프로젝트
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {profile.projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: isLightTheme
                      ? 'rgba(0, 0, 0, 0.03)'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      wordBreak: 'keep-all',
                    }}
                  >
                    {project.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      marginBottom: '12px',
                      lineHeight: '1.6',
                    }}
                  >
                    {project.description}
                  </p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '12px',
                      }}
                    >
                      {project.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            background: isLightTheme
                              ? 'rgba(0, 0, 0, 0.08)'
                              : 'rgba(255, 255, 255, 0.1)',
                            fontSize: '12px',
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 기술 스택 */}
        {profile.skills && profile.skills.length > 0 && (
          <div
            style={{
              padding: '32px',
              borderRadius: '16px',
              background: isLightTheme
                ? 'rgba(255, 255, 255, 0.6)'
                : 'rgba(255, 255, 255, 0.08)',
              border: isLightTheme
                ? '1px solid rgba(0, 0, 0, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.14)',
              marginBottom: '32px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '20px',
              }}
            >
              기술 스택
            </h2>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: isLightTheme
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.1)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 뒤로 가기 버튼 */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 600,
              background: isLightTheme ? '#111' : '#fafafa',
              color: isLightTheme ? '#fafafa' : '#111',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            뒤로 가기
          </button>
        </div>
      </div>
    </main>
  );
}
