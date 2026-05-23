export const legalStyles = `
.legal-root{font-family:'Tajawal',sans-serif;background:radial-gradient(ellipse at top,#16294f 0%,#0a1428 60%);min-height:100vh;color:#f5f5f5}
.legal-root .font-serif-ar{font-family:'Amiri',serif}
.legal-root .gold-border{border:1px solid rgba(212,175,55,.3)}
.legal-root .gold-glow{box-shadow:0 0 30px -10px rgba(212,175,55,.4)}
.legal-root .card{background:linear-gradient(145deg,rgba(22,41,79,.7),rgba(15,29,58,.7));backdrop-filter:blur(10px)}
.legal-root .card-header{background:linear-gradient(90deg,rgba(212,175,55,.15),transparent);border-bottom:1px solid rgba(212,175,55,.25)}
.legal-root select,.legal-root input,.legal-root textarea{background:rgba(10,20,40,.6);color:#fff;border:1px solid rgba(212,175,55,.3);border-radius:.5rem;padding:.6rem .9rem;width:100%;font:inherit}
.legal-root textarea{resize:vertical;min-height:120px}
.legal-root select:focus,.legal-root input:focus,.legal-root textarea:focus{outline:none;border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.2)}
.legal-root .lbl-form{font-size:.85rem;color:#d1d5db;display:block;margin-bottom:.25rem}
.legal-root .btn-gold{background:linear-gradient(to left,#b8901f,#d4af37);color:#0a1428;font-weight:700;padding:.75rem 1rem;border-radius:.5rem;cursor:pointer;border:0;transition:filter .15s}
.legal-root .btn-gold:hover{filter:brightness(1.1)} .legal-root .btn-gold:disabled{opacity:.6;cursor:not-allowed}
.legal-root .chip{padding:.25rem .75rem;border-radius:9999px;border:1px solid rgba(212,175,55,.3);font-size:.75rem;cursor:pointer;background:transparent;color:#f5f5f5;transition:background .15s}
.legal-root .chip:hover{background:rgba(212,175,55,.1)} .legal-root .chip:disabled{opacity:.5;cursor:not-allowed}
.legal-root .chip-gold{padding:.3rem .8rem;border-radius:9999px;font-size:.7rem;font-weight:700;background:linear-gradient(to left,#b8901f,#d4af37);color:#0a1428}
.legal-root .copy-btn{white-space:nowrap}
.legal-root .badge-shakly{background:rgba(59,130,246,.15);color:#93c5fd;border:1px solid rgba(59,130,246,.4)}
.legal-root .badge-mawdoo{background:rgba(168,85,247,.15);color:#d8b4fe;border:1px solid rgba(168,85,247,.4)}
.legal-root .badge-thaghra{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.4)}
.legal-root .badge-naqd{background:rgba(212,175,55,.15);color:#fcd34d;border:1px solid rgba(212,175,55,.4)}
.legal-root .badge-ta3liq{background:rgba(45,212,191,.15);color:#5eead4;border:1px solid rgba(45,212,191,.4)}
.legal-root .badge-class{background:rgba(252,211,77,.15);color:#fcd34d;border:1px solid rgba(252,211,77,.4)}
.legal-root .badge-penalty{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.4)}
.legal-root .badge-strategy{background:rgba(45,212,191,.15);color:#5eead4;border:1px solid rgba(45,212,191,.4)}
.legal-root .badge-related{background:rgba(167,139,250,.15);color:#c4b5fd;border:1px solid rgba(167,139,250,.4)}
.legal-root .scale-icon{filter:drop-shadow(0 0 8px rgba(212,175,55,.5))}
@keyframes legalFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.legal-root .fade-in{animation:legalFadeIn .4s ease-out}
.legal-root a{color:#d4af37}
.legal-root .container{max-width:80rem;margin:0 auto;padding:0 1.5rem}
.legal-root .grid-12{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:.75rem}
.legal-root .grid-results{display:grid;grid-template-columns:1fr;gap:1.25rem}
@media (min-width:1024px){.legal-root .grid-results{grid-template-columns:repeat(2,1fr)}.legal-root .col-span-2{grid-column:span 2}}
@media (max-width:768px){.legal-root .grid-12 > *{grid-column:span 12 !important}}
.legal-root .col-3{grid-column:span 3} .legal-root .col-4{grid-column:span 4} .legal-root .col-5{grid-column:span 5} .legal-root .col-7{grid-column:span 7} .legal-root .col-9{grid-column:span 9}
.legal-root .skeleton{background:linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,.12),rgba(255,255,255,.05));background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:.4rem;height:1rem;margin:.4rem 0}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.legal-root .stack{display:flex;flex-direction:column;gap:.85rem}
.legal-root .defense-item{background:rgba(10,20,40,.5);border:1px solid rgba(212,175,55,.15);border-radius:.6rem;padding:.85rem 1rem}
.legal-root .defense-shakly{border-right:3px solid #3b82f6}
.legal-root .defense-mawdoo{border-right:3px solid #a855f7}
.legal-root .defense-thaghra{border-right:3px solid #ef4444}
.legal-root .defense-ta3liq{border-right:3px solid #2dd4bf}
.legal-root .defense-title{font-weight:700;color:#fcd34d;margin-bottom:.5rem;font-size:1.02rem;line-height:1.6}
.legal-root .d-field{margin:.3rem 0;line-height:1.85;color:#e5e7eb;font-size:.95rem}
.legal-root .d-field-lbl{color:#fcd34d;font-weight:700;margin-left:.3rem}
.legal-root .d-field-hl{background:rgba(212,175,55,.08);border-right:2px solid #d4af37;padding:.4rem .6rem;border-radius:.35rem;margin-top:.5rem}
.legal-root .amend-box{margin-top:.65rem;background:linear-gradient(135deg,rgba(212,175,55,.15),rgba(184,144,31,.1));border:1px solid rgba(212,175,55,.45);border-right:4px solid #d4af37;padding:.75rem 1rem;border-radius:.5rem;color:#fde68a}
.legal-root .amend-head{color:#d4af37;font-weight:700;margin-bottom:.35rem;font-size:.95rem}
.legal-root .naqd-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.85rem}
.legal-root .naqd-li{border-right:3px solid #d4af37;padding-right:.85rem;background:rgba(10,20,40,.4);border-radius:.4rem;padding-top:.5rem;padding-bottom:.5rem}
.legal-root .naqd-ref{color:#fcd34d;font-weight:700;font-size:.88rem;margin-bottom:.3rem}
.legal-root .naqd-src{display:inline-block;margin-top:.35rem;font-size:.78rem;color:#93c5fd;text-decoration:underline}
.legal-root .cat-pill{display:inline-block;margin-right:.5rem;font-size:.7rem;background:rgba(45,212,191,.18);color:#5eead4;padding:.1rem .55rem;border-radius:9999px;font-weight:400;vertical-align:middle}
.legal-root .muzakkira-box{background:rgba(10,20,40,.4);border-right:4px solid #d4af37;padding:1.25rem;border-radius:.5rem;line-height:2;font-size:1.05rem;color:#f3f4f6;white-space:pre-wrap}
.legal-root .results-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem}
.legal-root .lg-header{border-bottom:1px solid rgba(212,175,55,.3);background:rgba(10,20,40,.8);backdrop-filter:blur(8px);position:sticky;top:0;z-index:50}
.legal-root .lg-header-inner{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;flex-wrap:wrap;gap:.5rem}
.legal-root .hero-icon{display:inline-flex;padding:1.5rem;border-radius:9999px;background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.3);margin-bottom:1rem}
.legal-root .sources-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem}
.legal-root .source-card{display:block;background:rgba(10,20,40,.5);border:1px solid rgba(212,175,55,.2);border-right:4px solid #d4af37;padding:.85rem 1rem;border-radius:.5rem;text-decoration:none;transition:transform .15s,background .15s}
.legal-root .source-card:hover{transform:translateY(-2px);background:rgba(10,20,40,.75)}
.legal-root .source-name{font-weight:700;font-size:.95rem;margin-bottom:.25rem}
.legal-root .source-desc{font-size:.75rem;color:#9ca3af}
.legal-root .lg-footer{border-top:1px solid rgba(212,175,55,.2);margin-top:3rem;padding:1.5rem;text-align:center;font-size:.78rem;color:#9ca3af}
.legal-root .footer-sources{display:flex;flex-wrap:wrap;gap:.85rem;justify-content:center}
.legal-root .footer-sources a{text-decoration:none;font-size:.78rem}
.legal-root .footer-sources a:hover{text-decoration:underline}
.legal-root .tabs{display:flex;gap:.5rem;margin-bottom:1.5rem;flex-wrap:wrap}
.legal-root .tab{padding:.7rem 1.2rem;background:rgba(10,20,40,.5);border:1px solid rgba(212,175,55,.3);color:#d1d5db;border-radius:.5rem;cursor:pointer;font-size:.9rem;font-weight:500;font-family:inherit;transition:all .15s}
.legal-root .tab:hover{background:rgba(212,175,55,.1)}
.legal-root .tab-active{background:linear-gradient(to left,#b8901f,#d4af37);color:#0a1428;font-weight:700;border-color:#d4af37}
.legal-root .penalty-box{margin-top:.5rem;padding:.65rem .85rem;border-radius:.4rem;border-right:3px solid}
.legal-root .penalty-up{background:rgba(239,68,68,.1);border-color:#ef4444}
.legal-root .penalty-down{background:rgba(45,212,191,.1);border-color:#2dd4bf}
.legal-root .penalty-head{font-weight:700;margin-bottom:.35rem;font-size:.9rem}
.legal-root .penalty-up .penalty-head{color:#fca5a5}
.legal-root .penalty-down .penalty-head{color:#5eead4}
.legal-root .penalty-box ul{margin:0;padding-right:1.2rem;line-height:1.9;color:#e5e7eb;font-size:.9rem}
.legal-root .strategy-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.6rem;counter-reset:strat}
.legal-root .strategy-li{display:flex;gap:.75rem;align-items:flex-start;background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.25);padding:.7rem .85rem;border-radius:.5rem;line-height:1.8}
.legal-root .strategy-num{flex-shrink:0;width:1.8rem;height:1.8rem;border-radius:50%;background:linear-gradient(135deg,#2dd4bf,#0d9488);color:#0a1428;font-weight:700;display:inline-flex;align-items:center;justify-content:center;font-size:.85rem}
.legal-root .conf-عالية{font-size:.7rem;padding:.15rem .55rem;border-radius:9999px;background:rgba(34,197,94,.2);color:#86efac;font-weight:600}
.legal-root .conf-متوسطة{font-size:.7rem;padding:.15rem .55rem;border-radius:9999px;background:rgba(212,175,55,.2);color:#fcd34d;font-weight:600}
.legal-root .conf-منخفضة{font-size:.7rem;padding:.15rem .55rem;border-radius:9999px;background:rgba(156,163,175,.2);color:#d1d5db;font-weight:600}
.legal-root .value-strip{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin-top:1.5rem}
.legal-root .value-pill{padding:.5rem 1rem;background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.3);color:#fcd34d;border-radius:9999px;font-size:.85rem;font-weight:600}
`;
