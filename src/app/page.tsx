export default function Home() {
  return (
    <main>
      {/* 데모 콘텐츠 */}
      <div className="content-wrapper">
        <h1 className="content-title">스크롤 데모</h1>
        <p className="content-description">
          아래로 스크롤하면 네비게이션 바가 숨겨집니다. 스크롤을 멈추면 다시 나타납니다.
        </p>
        
        {[...Array(20)].map((_, i) => (
          <div key={i} className="content-section">
            <h2 className="section-title">섹션 {i + 1}</h2>
            <p className="section-text">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}