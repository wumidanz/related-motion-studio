/* global React */
/* BlobDark — the dark-mode cousin of BlobLight. Five warm-toned blobs
   drift and morph across a near-black field (#0e0d0c). Used as the
   ambient background for the Contact section. */

function BlobDark() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: '#0e0d0c' }}>
      <style>{`
        .bd-b { position: absolute; border-radius: 50%; will-change: transform, border-radius; }
        .bd-b1 { width: 440px; height: 440px;
          background: radial-gradient(circle at 40% 40%, #f0ece6 0%, #d4cfc8 45%, transparent 70%);
          filter: blur(60px); opacity: 0.18;
          animation: bdb1s 9s ease-in-out infinite, bdb1m 13s ease-in-out infinite; }
        .bd-b2 { width: 360px; height: 380px;
          background: radial-gradient(circle at 50% 55%, #c8a090 0%, #b89080 55%, transparent 76%);
          filter: blur(54px); opacity: 0.5;
          animation: bdb2s 11s ease-in-out infinite, bdb2m 15s ease-in-out infinite; }
        .bd-b3 { width: 280px; height: 280px;
          background: radial-gradient(circle at 50% 50%, #3a3530 0%, #2a2520 60%, transparent 80%);
          filter: blur(48px); opacity: 0.9;
          animation: bdb3s 7s ease-in-out infinite, bdb3m 17s ease-in-out infinite; }
        .bd-b4 { width: 260px; height: 240px;
          background: radial-gradient(circle at 48% 48%, #ddd0c0 0%, #c8baa8 40%, transparent 72%);
          filter: blur(52px); opacity: 0.25;
          animation: bdb4s 10s ease-in-out infinite, bdb4m 12s ease-in-out infinite; }
        .bd-b5 { width: 220px; height: 220px;
          background: radial-gradient(circle at 50% 50%, #a08070 0%, #907060 60%, transparent 80%);
          filter: blur(44px); opacity: 0.45;
          animation: bdb5s 13s ease-in-out infinite, bdb5m 19s ease-in-out infinite; }

        @keyframes bdb1s {
          0%,100% { border-radius:50% 50% 50% 50%/50% 50% 50% 50%; transform:scale(1) rotate(0deg); }
          22%     { border-radius:70% 30% 60% 40%/40% 60% 40% 60%; transform:scale(1.1) rotate(5deg); }
          50%     { border-radius:36% 64% 42% 58%/64% 36% 62% 38%; transform:scale(0.91) rotate(-4deg); }
          74%     { border-radius:58% 42% 72% 28%/34% 66% 38% 62%; transform:scale(1.08) rotate(3deg); }
        }
        @keyframes bdb1m {
          0%,100% { top:-160px; left:-80px; }
          22%     { top:60px;   left:30%; }
          48%     { top:-100px; left:62%; }
          72%     { top:80px;   left:0%; }
          88%     { top:-140px; left:40%; }
        }
        @keyframes bdb2s {
          0%,100% { border-radius:50% 50% 50% 50%/50% 50% 50% 50%; transform:scale(1) rotate(0deg); }
          28%     { border-radius:64% 36% 52% 48%/48% 52% 64% 36%; transform:scale(1.13) rotate(-6deg); }
          60%     { border-radius:38% 62% 66% 34%/40% 60% 38% 62%; transform:scale(0.89) rotate(5deg); }
        }
        @keyframes bdb2m {
          0%,100% { top:160px;  left:18%; }
          26%     { top:380px;  left:42%; }
          54%     { top:100px;  left:60%; }
          80%     { top:440px;  left:6%; }
        }
        @keyframes bdb3s {
          0%,100% { border-radius:50%; transform:scale(1) rotate(0deg); }
          33%     { border-radius:60% 40% 54% 46%/46% 54% 50% 50%; transform:scale(1.2) rotate(10deg); }
          66%     { border-radius:42% 58% 62% 38%/60% 40% 54% 46%; transform:scale(0.86) rotate(-8deg); }
        }
        @keyframes bdb3m {
          0%,100% { top:-80px;  right:-100px; }
          30%     { top:200px;  right:-30px; }
          58%     { top:20px;   right:48%; }
          82%     { top:340px;  right:-50px; }
        }
        @keyframes bdb4s {
          0%,100% { border-radius:50%; transform:scale(1) rotate(0deg); }
          38%     { border-radius:54% 46% 66% 34%/42% 58% 44% 56%; transform:scale(1.15) rotate(-9deg); }
          70%     { border-radius:38% 62% 44% 56%/62% 38% 58% 42%; transform:scale(0.87) rotate(6deg); }
        }
        @keyframes bdb4m {
          0%,100% { bottom:-80px; right:-60px; }
          34%     { bottom:180px; right:30%; }
          62%     { bottom:-60px; right:55%; }
          84%     { bottom:280px; right:4%; }
        }
        @keyframes bdb5s {
          0%,100% { border-radius:50%; transform:scale(1); }
          42%     { border-radius:62% 38% 54% 46%/46% 54% 60% 40%; transform:scale(1.17); }
          76%     { border-radius:46% 54% 64% 36%/56% 44% 46% 54%; transform:scale(0.85); }
        }
        @keyframes bdb5m {
          0%,100% { top:400px;  left:-80px; }
          38%     { top:180px;  left:64%; }
          68%     { top:460px;  left:36%; }
        }
      `}</style>
      <div className="bd-b bd-b1" />
      <div className="bd-b bd-b2" />
      <div className="bd-b bd-b3" />
      <div className="bd-b bd-b4" />
      <div className="bd-b bd-b5" />
    </div>
  );
}

window.BlobDark = BlobDark;
