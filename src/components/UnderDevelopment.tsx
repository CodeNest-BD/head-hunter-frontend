"use client";

import { useEffect, useState } from "react";

/**
 * Full-screen "under development" placeholder. Faithful port of the client's
 * `Under Development.html` mock: drifting blue blobs, a word-by-word headline
 * that ends in a typewriter cycling "development." with a blinking caret, and a
 * shimmering progress bar. Kept self-contained (inline <style> for the custom
 * keyframes) so it drops onto the landing page as-is.
 */

const CSS = `
.ud-root{position:relative;min-height:100vh;display:flex;flex-direction:column;overflow:hidden;background:#0b1526;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.ud-root a{color:#3b82f6;text-decoration:none}
.ud-root a:hover{color:#60a5fa}
.ud-blob1{position:absolute;top:-180px;right:-140px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.22),transparent 65%);animation:ud-drift 14s ease-in-out infinite}
.ud-blob2{position:absolute;bottom:-220px;left:-160px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.14),transparent 65%);animation:ud-drift2 18s ease-in-out infinite}
.ud-nav{position:relative;display:flex;align-items:center;padding:28px 56px;animation:ud-fade .8s ease both}
.ud-brand{display:flex;align-items:center;gap:10px}
.ud-brandname{font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-.02em}
.ud-main{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px 80px}
.ud-pill{display:inline-flex;align-items:center;gap:9px;border:1px solid rgba(96,165,250,.4);border-radius:99px;padding:8px 18px;font-size:12px;font-weight:700;letter-spacing:.12em;color:#93c5fd;animation:ud-rise .7s cubic-bezier(.22,1,.36,1) .15s both}
.ud-dot{width:7px;height:7px;border-radius:99px;background:#3b82f6;animation:ud-pulse 1.8s ease-in-out infinite}
.ud-h1{margin:30px 0 0;font-size:clamp(44px,7vw,84px);line-height:1.06;font-weight:800;letter-spacing:-.03em;color:#ffffff;text-wrap:balance}
.ud-mask{display:inline-block;overflow:hidden;vertical-align:bottom}
.ud-word{display:inline-block;animation:ud-word .7s cubic-bezier(.22,1,.36,1) both}
.ud-typed{color:#3b82f6}
.ud-caret{display:inline-block;width:4px;height:.85em;background:#3b82f6;vertical-align:-.08em;margin-left:4px;border-radius:2px;animation:ud-caret 1s step-end infinite}
.ud-sub{max-width:440px;margin:28px 0 0;font-size:17px;line-height:1.65;color:#aab8cc;animation:ud-rise .7s cubic-bezier(.22,1,.36,1) .9s both}
.ud-track{width:260px;height:3px;border-radius:99px;background:rgba(148,163,184,.18);margin-top:44px;overflow:hidden;animation:ud-fade .7s ease 1.1s both}
.ud-fill{width:45%;height:100%;border-radius:99px;background:linear-gradient(90deg,transparent,#3b82f6,#60a5fa,transparent);animation:ud-bar 2.4s ease-in-out 1.3s infinite}
@keyframes ud-word{from{opacity:0;transform:translateY(110%)}to{opacity:1;transform:translateY(0)}}
@keyframes ud-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes ud-fade{from{opacity:0}to{opacity:1}}
@keyframes ud-pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}
@keyframes ud-drift{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-40px)}}
@keyframes ud-drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,30px)}}
@keyframes ud-bar{0%{transform:translateX(-100%)}60%{transform:translateX(160%)}100%{transform:translateX(160%)}}
@keyframes ud-caret{0%,49%{opacity:1}50%,100%{opacity:0}}
`;

function useTypedWord(word: string): string {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    let i = 0;
    let dir = 1;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i += dir;
      setTyped(word.slice(0, i));
      let delay = 90;
      if (dir === 1 && i === word.length) {
        dir = -1;
        delay = 2600;
      } else if (dir === -1 && i === 0) {
        dir = 1;
        delay = 500;
      } else if (dir === -1) {
        delay = 45;
      }
      timer = setTimeout(step, delay);
    };
    timer = setTimeout(step, 900);
    return () => clearTimeout(timer);
  }, [word]);
  return typed;
}

export default function UnderDevelopment() {
  const typed = useTypedWord("development.");

  return (
    <div className="ud-root">
      <style>{CSS}</style>

      <div className="ud-blob1" />
      <div className="ud-blob2" />

      <nav className="ud-nav">
        <div className="ud-brand">
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
            <path d="M2 2l8 8-8 8V2z" fill="#2563eb" />
            <path d="M12 2l8 8-8 8V2z" fill="#2563eb" />
          </svg>
          <span className="ud-brandname">HeadHunter</span>
        </div>
      </nav>

      <div className="ud-main">
        <div className="ud-pill">
          <span className="ud-dot" />
          COMING SOON
        </div>

        <h1 className="ud-h1">
          <span className="ud-mask">
            <span className="ud-word" style={{ animationDelay: ".3s" }}>
              This{" "}
            </span>
          </span>
          <span className="ud-mask">
            <span className="ud-word" style={{ animationDelay: ".38s" }}>
              is{" "}
            </span>
          </span>
          <span className="ud-mask">
            <span className="ud-word" style={{ animationDelay: ".46s" }}>
              under
            </span>
          </span>
          <br />
          <span className="ud-mask">
            <span
              className="ud-word ud-typed"
              style={{ animationDelay: ".58s" }}
            >
              {typed}
              <span className="ud-caret" />
            </span>
          </span>
        </h1>

        <p className="ud-sub">
          We&apos;re building something worth the wait. Check back soon.
        </p>

        <div className="ud-track">
          <div className="ud-fill" />
        </div>
      </div>
    </div>
  );
}
