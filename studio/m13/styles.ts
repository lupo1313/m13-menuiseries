// Styles de l'espace M13, limités aux classes « m13- » de nos propres composants (aucune retouche du Studio).
export const css = `
@font-face{font-family:'M13 Serif';src:url('/static/fonts/fraunces-500-latin.woff2') format('woff2');font-weight:500;font-display:swap}
@font-face{font-family:'M13 Serif';src:url('/static/fonts/fraunces-600-latin.woff2') format('woff2');font-weight:600;font-display:swap}
@font-face{font-family:'M13 Sans';src:url('/static/fonts/manrope-400-latin.woff2') format('woff2');font-weight:400;font-display:swap}
@font-face{font-family:'M13 Sans';src:url('/static/fonts/manrope-500-latin.woff2') format('woff2');font-weight:500;font-display:swap}
@font-face{font-family:'M13 Sans';src:url('/static/fonts/manrope-600-latin.woff2') format('woff2');font-weight:600 800;font-display:swap}
.m13{--navy:#13304b;--navy2:#1d3f5f;--cream:#f6f1ea;--cream2:#fbf8f3;--bronze:#a8794b;--bronze2:#bb8f60;--ink:#15283a;--muted:#5f6b75;--line:#dcd4c8;--red:#b83a2e;--ok:#2f7a4f;
  position:relative;height:100%;overflow:auto;-webkit-overflow-scrolling:touch;font-family:'M13 Sans',system-ui,sans-serif;color:var(--ink);background:var(--cream);font-size:16px;line-height:1.4}
.m13 *{box-sizing:border-box}
.m13 button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.m13-col{max-width:560px;margin:0 auto;padding:0 20px}

/* ---------- Accueil ---------- */
.m13-home{min-height:100%;display:flex;flex-direction:column;color:#fff;background:linear-gradient(180deg,#0f2840 0%,var(--navy) 45%,#1f4566 100%)}
.m13-home-top{padding:40px 0 28px;text-align:center}
.m13-logo{display:inline-flex;align-items:center;gap:16px;color:#fff;text-decoration:none}
.m13-logo svg{width:44px;height:76px;flex:none}
.m13-logo-m{font-family:'M13 Serif',Georgia,serif;font-weight:500;font-size:64px;line-height:.9;letter-spacing:-1px;display:block}
.m13-logo-s{display:block;font-size:13px;letter-spacing:.38em;margin-top:8px;font-weight:500}
.m13-home h1{font-weight:500;font-size:40px;letter-spacing:-.3px;margin:44px 0 8px}
.m13-home-sub{margin:0;opacity:.88;font-size:17px}
.m13-actions{display:grid;gap:18px;padding-bottom:28px}
.m13-card{display:flex;align-items:center;gap:18px;width:100%;min-height:92px;padding:18px 22px;border:0;border-radius:16px;text-align:left;background:var(--cream2);color:var(--navy);box-shadow:0 10px 26px rgba(0,0,0,.22);transition:transform .15s}
.m13-card:active{transform:scale(.985)}
.m13-card:focus-visible{outline:3px solid #f0c48f;outline-offset:3px}
.m13-card-ico{flex:none;width:46px;height:46px;display:grid;place-items:center;color:var(--navy)}
.m13-card-ico svg{width:38px;height:38px}
.m13-card-txt{flex:1;min-width:0}
.m13-card-t{display:block;font-size:23px;font-weight:700;letter-spacing:-.2px}
.m13-card-s{display:block;font-size:15px;color:var(--muted);margin-top:4px}
.m13-chev{flex:none;width:22px;height:22px;opacity:.85}
.m13-card--primary{background:linear-gradient(180deg,var(--bronze2),var(--bronze));color:#fff}
.m13-card--primary .m13-card-ico{width:52px;height:52px;border-radius:50%;background:#fff;color:var(--bronze)}
.m13-card--primary .m13-card-ico svg{width:28px;height:28px}
.m13-card--primary .m13-card-t{font-weight:600;font-size:24px}
.m13-home-photo{flex:1;min-height:200px;margin-top:-10px;background:linear-gradient(180deg,var(--navy) 0%,rgba(19,48,75,0) 38%),url('/static/m13-accueil.webp') center 30%/cover no-repeat}

/* ---------- En-tête des écrans ---------- */
.m13-bar{position:sticky;top:0;z-index:3;background:var(--navy);color:#fff}
.m13-bar-in{display:flex;align-items:center;min-height:68px;padding:8px 8px 20px}
.m13-back{width:48px;height:48px;border:0;background:none;color:#fff;display:grid;place-items:center;border-radius:12px}
.m13-back svg{width:26px;height:26px}
.m13-bar h1{flex:1;margin:0 48px 0 0;text-align:center;font-size:24px;font-weight:600;letter-spacing:-.2px}
.m13-panel{position:relative;z-index:2;margin-top:-16px;border-radius:20px 20px 0 0;background:var(--cream2);min-height:calc(100% - 52px);padding-bottom:120px}
.m13-panel h2{font-size:28px;font-weight:700;color:var(--navy);margin:8px 0 18px;letter-spacing:-.3px}

/* ---------- Étapes ---------- */
.m13-steps{display:grid;grid-template-columns:repeat(3,1fr);padding:22px 0 20px;background:var(--cream);border-radius:20px 20px 0 0;margin-bottom:8px}
.m13-step{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;border:0;background:none;color:var(--ink);font-size:16px;padding:0}
.m13-step:not(:last-child)::after{content:'';position:absolute;top:19px;left:calc(50% + 30px);right:calc(-50% + 30px);height:2px;background:var(--line)}
.m13-step-n{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:19px;background:#e9e4dc;color:var(--ink);border:1px solid #d8d1c6}
.m13-step.is-on .m13-step-n{background:var(--bronze);border-color:var(--bronze);color:#fff}
.m13-step.is-done .m13-step-n{background:var(--navy);border-color:var(--navy);color:#fff}
.m13-step.is-on .m13-step-l{font-weight:700}

/* ---------- Champs ---------- */
.m13-field{display:block;margin-bottom:22px}
.m13-label{display:block;font-size:17px;margin-bottom:8px;color:var(--ink)}
.m13-label i{font-style:normal;color:var(--muted)}
.m13-req{color:var(--red);margin-left:3px}
.m13-input,.m13-select,.m13-textarea{width:100%;font:inherit;font-size:17px;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:9px;padding:0 16px;min-height:52px;-webkit-appearance:none;appearance:none}
.m13-textarea{padding:14px 16px;min-height:120px;resize:vertical;line-height:1.45}
.m13-select{padding-right:40px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2315283a' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") right 14px center/18px no-repeat}
.m13-input:focus,.m13-select:focus,.m13-textarea:focus{outline:none;border-color:var(--bronze);box-shadow:0 0 0 3px rgba(168,121,75,.2)}
.m13-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.m13-hint{font-size:14px;color:var(--muted);margin:6px 0 0}

/* ---------- Photos ---------- */
.m13-ph{border:1px solid var(--line);background:#fff;border-radius:14px;padding:14px;margin-bottom:18px}
.m13-ph-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:10px}
.m13-ph-t{font-size:17px;font-weight:700;color:var(--navy)}
.m13-ph-o{font-size:14px;color:var(--muted)}
.m13-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:100%;min-height:132px;border:2px dashed #cfc5b6;border-radius:12px;background:var(--cream);color:var(--navy);font-size:16px;font-weight:600;text-align:center;padding:12px}
.m13-drop svg{width:30px;height:30px;color:var(--bronze)}
.m13-drop small{font-weight:400;color:var(--muted);font-size:14px}
.m13-img{position:relative;border-radius:12px;overflow:hidden;background:#eee8df}
.m13-img img{display:block;width:100%;max-height:300px;object-fit:contain}
.m13-img-acts{display:flex;gap:8px;margin:10px 0}
.m13-btn-s{flex:1;min-height:44px;border-radius:9px;border:1px solid var(--line);background:#fff;color:var(--navy);font-size:15px;font-weight:600;padding:0 12px}
.m13-btn-s.is-danger{color:var(--red)}
.m13-btn-link{border:0;background:none;color:var(--bronze);font-weight:700;font-size:15px;padding:10px 0;text-decoration:underline;text-underline-offset:3px}
.m13-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.m13-gal .m13-drop{min-height:150px}
.m13-gal-i{border:1px solid var(--line);border-radius:12px;padding:8px;background:var(--cream2)}
.m13-gal-i img{display:block;width:100%;height:120px;object-fit:cover;border-radius:8px}
.m13-gal-i .m13-input{min-height:44px;font-size:16px;margin-top:8px;padding:0 10px}
.m13-busy{display:flex;align-items:center;justify-content:center;gap:10px;min-height:132px;color:var(--muted)}
.m13-spin{width:22px;height:22px;border-radius:50%;border:3px solid #ddd3c4;border-top-color:var(--bronze);animation:m13spin .8s linear infinite}
@keyframes m13spin{to{transform:rotate(360deg)}}

/* ---------- Bas d'écran ---------- */
.m13-foot{position:sticky;bottom:0;z-index:4;padding:14px 0 calc(14px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(251,248,243,0),var(--cream2) 30%)}
.m13-foot .m13-col{display:grid;gap:10px}
.m13-btn{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:58px;border:0;border-radius:11px;background:linear-gradient(180deg,var(--bronze2),var(--bronze));color:#fff;font-size:20px;font-weight:600;box-shadow:0 6px 16px rgba(120,80,40,.25)}
.m13-btn svg{width:24px;height:24px}
.m13-btn:disabled{opacity:.55;cursor:default}
.m13-btn--ghost{background:#fff;color:var(--navy);border:1px solid var(--line);box-shadow:none;font-size:17px;min-height:52px}
.m13-save{text-align:center;font-size:14px;color:var(--muted);min-height:18px}
.m13-save.is-err{color:var(--red)}

/* ---------- Récapitulatif ---------- */
.m13-sum{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden;margin-bottom:18px}
.m13-sum img{display:block;width:100%;max-height:240px;object-fit:cover}
.m13-sum-b{padding:16px}
.m13-sum-t{font-size:21px;font-weight:700;color:var(--navy);margin:0 0 4px}
.m13-sum-m{color:var(--muted);margin:0 0 10px}
.m13-sum-d{margin:0;white-space:pre-line}
.m13-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.m13-chip{font-size:14px;padding:5px 10px;border-radius:999px;background:var(--cream);color:var(--navy);font-weight:600}
.m13-check{list-style:none;margin:0 0 18px;padding:14px 16px;border-radius:14px}
.m13-check.is-ok{background:#e8f3ec;color:var(--ok);font-weight:600}
.m13-check.is-ko{background:#fbecea;color:var(--red)}
.m13-check li{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0}
.m13-check .m13-btn-link{padding:0;color:var(--red)}
.m13-done{text-align:center;padding:40px 0}
.m13-done-ico{width:76px;height:76px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:#e8f3ec;color:var(--ok)}
.m13-done-ico svg{width:40px;height:40px}

/* ---------- Liste ---------- */
.m13-list{display:grid;gap:12px;padding-top:6px}
.m13-item{display:flex;align-items:center;gap:14px;width:100%;padding:10px 14px 10px 10px;border:1px solid var(--line);border-radius:14px;background:#fff;text-align:left;color:var(--ink);min-height:84px}
.m13-item img,.m13-item .m13-noimg{flex:none;width:64px;height:64px;border-radius:10px;object-fit:cover;background:var(--cream)}
.m13-item-t{display:block;font-weight:700;font-size:17px;color:var(--navy)}
.m13-item-s{display:block;font-size:14px;color:var(--muted);margin-top:2px}
.m13-tag{display:inline-block;margin-top:6px;font-size:13px;font-weight:700;padding:3px 9px;border-radius:999px}
.m13-tag--pub{background:#e8f3ec;color:var(--ok)}
.m13-tag--draft{background:#fdf0e1;color:#9a5b17}
.m13-empty{text-align:center;color:var(--muted);padding:40px 0}
.m13-more{display:block;margin:22px auto 0;text-align:center}

@media (max-width:420px){
  .m13-col{padding:0 16px}
  .m13-home-top{padding-top:28px}
  .m13-logo-m{font-size:56px}
  .m13-home h1{font-size:36px;margin-top:36px}
  .m13-card{min-height:86px;padding:16px 18px}
  .m13-card-t{font-size:21px}
  .m13-card{gap:14px}
  .m13-card--primary .m13-card-t{font-size:21px;white-space:nowrap}
  .m13-card--primary .m13-card-ico{width:46px;height:46px}
  .m13-bar h1{font-size:22px}
  .m13-step{font-size:15px}
  .m13-row{gap:12px}
}
@media (prefers-reduced-motion:reduce){.m13-card,.m13-spin{transition:none;animation:none}}
`
