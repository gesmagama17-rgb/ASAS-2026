import React from 'react';

interface DiagramRendererProps {
  diagramId?: string;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ diagramId }) => {
  if (!diagramId) return null;

  switch (diagramId) {
    case 'ipas-senter-gelas':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <svg viewBox="0 0 360 130" className="w-full max-w-sm h-auto" role="img" aria-label="Gambar berkas cahaya senter melewati gelas berisi air">
            {/* Light beam */}
            <polygon points="88,52 315,30 315,100 88,78" fill="#FEF08A" fillOpacity="0.65" />
            <line x1="88" y1="52" x2="315" y2="30" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="88" y1="78" x2="315" y2="100" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* Flashlight */}
            <rect x="20" y="54" width="52" height="22" rx="4" fill="#475569" stroke="#1E293B" strokeWidth="1.5" />
            <polygon points="72,54 88,46 88,84 72,76" fill="#94A3B8" stroke="#1E293B" strokeWidth="1.5" />
            <rect x="38" y="49" width="12" height="5" rx="1" fill="#FACC15" />
            {/* Glass with water */}
            <path d="M180,22 L190,112 L246,112 L256,22 Z" fill="#E0F2FE" fillOpacity="0.55" stroke="#0284C7" strokeWidth="2" />
            <ellipse cx="218" cy="22" rx="38" ry="6" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
            <path d="M184,56 L190,112 L246,112 L252,56 Z" fill="#7DD3FC" fillOpacity="0.45" />
            <ellipse cx="218" cy="56" rx="34" ry="5" fill="#BAE6FD" fillOpacity="0.7" stroke="#0284C7" strokeWidth="1.2" />
          </svg>
          <figcaption className="text-xs text-slate-500 mt-2">Ilustrasi berkas cahaya senter dan gelas bening</figcaption>
        </figure>
      );

    case 'ipas-telinga':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <svg viewBox="0 0 360 155" className="w-full max-w-sm h-auto" role="img" aria-label="Diagram bagian telinga berlabel a, b, c, dan d">
            {/* Outer ear (pinna) */}
            <path d="M72,30 C42,30 34,62 42,88 C48,108 58,128 74,126 C84,125 88,112 80,104 C70,94 68,72 80,58 C88,48 86,30 72,30 Z" fill="#FDBA74" stroke="#9A3412" strokeWidth="2" />
            {/* Ear canal */}
            <path d="M76,68 L168,68 L168,88 L76,88" fill="#FED7AA" stroke="#9A3412" strokeWidth="1.8" />
            {/* Eardrum */}
            <ellipse cx="172" cy="78" rx="6" ry="18" fill="#FCA5A5" stroke="#991B1B" strokeWidth="2" />
            {/* Ossicles */}
            <path d="M178,76 L196,64 L212,72 L222,82" fill="none" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Cochlea spiral */}
            <path d="M235,84 C235,62 272,60 274,84 C276,104 248,108 245,92 C243,80 262,78 260,88" fill="none" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
            {/* Labels a, b, c, d */}
            <circle cx="30" cy="48" r="12" fill="#0F172A" />
            <text x="30" y="53" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="700">a</text>
            <line x1="42" y1="48" x2="54" y2="52" stroke="#0F172A" strokeWidth="1.5" />

            <circle cx="122" cy="42" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
            <text x="122" y="47" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="700">b</text>
            <line x1="122" y1="54" x2="122" y2="70" stroke="#0F172A" strokeWidth="1.5" />

            <circle cx="195" cy="36" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
            <text x="195" y="41" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="700">c</text>
            <line x1="195" y1="48" x2="176" y2="62" stroke="#0F172A" strokeWidth="1.5" />

            <circle cx="298" cy="60" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
            <text x="298" y="65" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="700">d</text>
            <line x1="286" y1="64" x2="270" y2="74" stroke="#0F172A" strokeWidth="1.5" />
          </svg>
          <figcaption className="text-xs text-slate-500 mt-2">Diagram bagian-bagian telinga (a, b, c, d)</figcaption>
        </figure>
      );

    case 'ipas-rantai-makanan':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <svg viewBox="0 0 420 76" className="w-full max-w-md h-auto" role="img" aria-label="Urutan rantai makanan: Rumput, Belalang, Katak, Ular">
            {[
              { x: 8, label: 'Rumput', bg: '#DCFCE7', stroke: '#16A34A' },
              { x: 112, label: 'Belalang', bg: '#FEF9C3', stroke: '#CA8A04' },
              { x: 216, label: 'Katak', bg: '#E0F2FE', stroke: '#0284C7' },
              { x: 320, label: 'Ular', bg: '#FEE2E2', stroke: '#DC2626' },
            ].map((node, idx) => (
              <g key={node.label}>
                <rect x={node.x} y="16" width="84" height="40" rx="8" fill={node.bg} stroke={node.stroke} strokeWidth="1.8" />
                <text x={node.x + 42} y="41" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="600">{node.label}</text>
                {idx < 3 && (
                  <g>
                    <line x1={node.x + 86} y1="36" x2={node.x + 102} y2="36" stroke="#475569" strokeWidth="2" />
                    <polygon points={`${node.x + 102},31 ${node.x + 110},36 ${node.x + 102},41`} fill="#475569" />
                  </g>
                )}
              </g>
            ))}
          </svg>
          <figcaption className="text-xs text-slate-500 mt-1">Urutan makhluk hidup pada ekosistem sawah</figcaption>
        </figure>
      );

    case 'ipas-rangkaian-listrik':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <svg viewBox="0 0 280 155" className="w-full max-w-xs h-auto" role="img" aria-label="Rangkaian listrik dengan sakelar terbuka">
            {/* Wires */}
            <path d="M60,34 L60,122 L105,122" fill="none" stroke="#0284C7" strokeWidth="3" />
            <path d="M175,122 L220,122 L220,96" fill="none" stroke="#0284C7" strokeWidth="3" />
            <path d="M220,62 L220,34 L156,34" fill="none" stroke="#0284C7" strokeWidth="3" />
            <path d="M124,34 L60,34" fill="none" stroke="#0284C7" strokeWidth="3" />
            {/* Bulb (off) */}
            <circle cx="140" cy="34" r="16" fill="#F1F5F9" stroke="#475569" strokeWidth="2" />
            <path d="M133,38 Q140,22 147,38" fill="none" stroke="#64748B" strokeWidth="1.5" />
            <text x="140" y="13" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">LAMPU (PADAM)</text>
            {/* Open switch */}
            <circle cx="220" cy="96" r="4" fill="#1E293B" />
            <circle cx="220" cy="62" r="4" fill="#1E293B" />
            <line x1="220" y1="96" x2="246" y2="68" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
            <text x="180" y="82" textAnchor="end" fill="#DC2626" fontSize="10" fontWeight="700">SAKELAR TERBUKA</text>
            {/* Battery */}
            <rect x="105" y="109" width="70" height="26" rx="4" fill="#1E293B" />
            <rect x="105" y="109" width="22" height="26" rx="3" fill="#F59E0B" />
            <text x="116" y="126" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="700">+</text>
            <text x="160" y="126" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="700">-</text>
            <text x="140" y="150" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">BATERAI</text>
          </svg>
        </figure>
      );

    case 'mtk-taman-persegi':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <svg viewBox="0 0 220 145" className="w-52 h-auto" role="img" aria-label="Denah taman berbentuk persegi dengan sisi 4 meter">
            <text x="110" y="18" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="700">DENAH TAMAN</text>
            <rect x="65" y="30" width="90" height="90" fill="#ECFDF5" stroke="#0F172A" strokeWidth="2.5" />
            <text x="110" y="112" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="700">4 m</text>
            <text x="168" y="80" textAnchor="start" fill="#475569" fontSize="12" fontWeight="600">4 m</text>
          </svg>
        </figure>
      );

    case 'musik-alat-1':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg text-center">
            {[
              { name: 'Pianika', desc: 'Tuts nada ditiup' },
              { name: 'Seruling', desc: 'Lubang nada ditiup' },
              { name: 'Gendang', desc: 'Membran dipukul' },
              { name: 'Gitar', desc: 'Senar dipetik' },
            ].map((item) => (
              <div key={item.name} className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
          <figcaption className="text-xs text-slate-500 mt-2">Daftar alat musik soal: Pianika · Seruling · Gendang · Gitar</figcaption>
        </figure>
      );

    case 'musik-alat-2':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg text-center">
            {[
              { name: 'Marakas', desc: 'Digoyangkan' },
              { name: 'Triangle', desc: 'Dipukul logam' },
              { name: 'Pianika', desc: 'Memiliki tuts do-re-mi' },
              { name: 'Tamborin', desc: 'Kericik digoyang/pukul' },
            ].map((item) => (
              <div key={item.name} className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </figure>
      );

    case 'musik-alat-3':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg text-center">
            {[
              '1. Tamborin',
              '2. Seruling',
              '3. Gendang',
              '4. Angklung / Kolintang',
            ].map((item) => (
              <div key={item} className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800">
                {item}
              </div>
            ))}
          </div>
        </figure>
      );

    case 'musik-alat-4':
    case 'musik-alat-4-essay':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg text-center">
            {(diagramId === 'musik-alat-4'
              ? ['Gitar', 'Gendang', 'Piano', 'Tamborin']
              : ['Pianika', 'Gendang', 'Seruling', 'Tamborin']
            ).map((item) => (
              <div key={item} className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800">
                {item}
              </div>
            ))}
          </div>
        </figure>
      );

    case 'musik-seruling':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <svg viewBox="0 0 320 60" className="w-72 h-auto" role="img" aria-label="Gambar alat musik seruling atau rekorder">
            <rect x="24" y="20" width="260" height="18" rx="6" fill="#FDE68A" stroke="#92400E" strokeWidth="2" />
            <polygon points="16,23 24,20 24,38 16,35" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
            {[95, 120, 145, 170, 195, 220, 245].map((cx) => (
              <circle key={cx} cx={cx} cy="29" r="4" fill="#451A03" />
            ))}
          </svg>
          <figcaption className="text-xs text-slate-500 mt-1">Alat musik rekorder / seruling</figcaption>
        </figure>
      );

    case 'rupa-garis-zigzag':
      return (
        <figure className="my-4 p-4 bg-slate-50 rounded-xl flex flex-col items-center">
          <svg viewBox="0 0 380 120" className="w-full max-w-md h-auto" role="img" aria-label="Lima jenis garis bernomor 1 sampai 5">
            {/* 1. Lurus */}
            <text x="20" y="24" fill="#0F172A" fontSize="12" fontWeight="700">1.</text>
            <line x1="45" y1="20" x2="170" y2="20" stroke="#0F172A" strokeWidth="2.5" />
            {/* 2. Lengkung / Gelombang */}
            <text x="20" y="56" fill="#0F172A" fontSize="12" fontWeight="700">2.</text>
            <path d="M45,52 Q65,36 85,52 T125,52 T165,52" fill="none" stroke="#0F172A" strokeWidth="2.5" />
            {/* 3. Zig-zag */}
            <text x="20" y="92" fill="#0F172A" fontSize="12" fontWeight="700">3.</text>
            <polyline points="45,94 65,74 85,94 105,74 125,94 145,74 165,94" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round" />
            {/* 4. Putus-putus */}
            <text x="205" y="24" fill="#0F172A" fontSize="12" fontWeight="700">4.</text>
            <line x1="230" y1="20" x2="355" y2="20" stroke="#0F172A" strokeWidth="2.5" strokeDasharray="8 6" />
            {/* 5. Spiral / Ikal */}
            <text x="205" y="70" fill="#0F172A" fontSize="12" fontWeight="700">5.</text>
            <path d="M230,68 C240,48 260,48 265,68 C270,84 252,84 252,68 C252,52 280,48 295,68 C305,84 325,84 340,68" fill="none" stroke="#0F172A" strokeWidth="2.5" />
          </svg>
        </figure>
      );

    case 'rupa-simpul':
      return (
        <figure className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg text-center">
            {[
              { num: '(1)', title: 'Simpul Kepala / Jangkar', desc: 'Mengikat pada tiang' },
              { num: '(2)', title: 'Simpul Mati', desc: 'Menyambung 2 tali / ikatan kuat' },
              { num: '(3)', title: 'Simpul Pangkal', desc: 'Mengikat tali pada tongkat' },
              { num: '(4)', title: 'Simpul Anyam / Ganda', desc: 'Anyaman tali' },
            ].map((item) => (
              <div key={item.num} className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs font-mono font-bold text-sky-700">{item.num}</div>
                <div className="text-xs font-semibold text-slate-800 mt-1">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </figure>
      );

    default:
      return null;
  }
};
