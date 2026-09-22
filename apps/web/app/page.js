'use client';

import { useEffect, useMemo, useState } from 'react';
import registry from '../data/requirements.json';

const LOGO = 'https://pemrosesan.oss.go.id/media/logos/LOGO_OSS_NEW.png';

const STAGES = [
  ['FILLING', 'Lengkapi Slot'],
  ['VALIDATING', 'Validasi'],
  ['ORCHESTRATING', 'Orkestrasi'],
  ['ISSUING', 'Penerbitan'],
  ['COMPLETE', 'Selesai']
];

function inferType(text) {
  const t = String(text || '').toLowerCase();
  if (/pembayaran|pnbp|retribusi|bea /.test(t)) return 'PAYMENT';
  if (/pas foto|foto terbaru|foto berwarna/.test(t)) return 'PHOTO';
  if (/pernyataan|pakta integritas|komitmen|kesiapan/.test(t)) return 'DECLARATION';
  if (/dokumen|surat |proposal|sertifikat|akta|bukti|rekomendasi|persetujuan|rencana|kontrak|lampiran|specimen|izin /.test(t)) return 'UPLOAD';
  return 'FORM';
}

function typeLabel(type) {
  return {
    PAYMENT: 'Pembayaran',
    PHOTO: 'Foto',
    DECLARATION: 'Pernyataan',
    UPLOAD: 'Upload Dokumen',
    FORM: 'Form Isian'
  }[type] || 'Form Isian';
}

function isComplete(slot, value) {
  const type = inferType(slot.requirement);
  if (!value) return false;
  if (type === 'UPLOAD' || type === 'PHOTO') return Boolean(value.fileName);
  if (type === 'PAYMENT') return Boolean(value.fileName && String(value.reference || '').trim());
  if (type === 'DECLARATION') return Boolean(value.confirmed);
  return Boolean(String(value.value || '').trim());
}

function editDistance(a, b) {
  const x = String(a || ''), y = String(b || '');
  const dp = Array.from({ length: x.length + 1 }, function() { return Array(y.length + 1).fill(0); });
  for (let i = 0; i <= x.length; i++) dp[i][0] = i;
  for (let j = 0; j <= y.length; j++) dp[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[x.length][y.length];
}

function scoreKbli(item, query) {
  const q = query.toLowerCase().trim();
  if (!q) return item.requirementCount;
  let score = 0;
  if (item.code === q) score += 1000;
  else if (item.code.startsWith(q)) score += 600;
  else if (item.code.includes(q)) score += 350;
  if (/^\d+$/.test(q)) score += Math.max(0, 180 - editDistance(item.code, q) * 35);
  const tokens = q.split(/\s+/).filter(Boolean);
  tokens.forEach(function(token) {
    if (item.searchText.includes(token)) score += 70;
  });
  return score;
}

function stageIndex(stage) {
  const idx = STAGES.findIndex(function(s) { return s[0] === stage; });
  return idx < 0 ? 0 : idx;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [responses, setResponses] = useState({});
  const [activeCode, setActiveCode] = useState('');
  const [stage, setStage] = useState('FILLING');
  const [credentials, setCredentials] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, tone: 'info', text: 'Biro Jasa Virtual siap membantu. Mulai dengan memilih KBLI yang ingin Anda urus.' }
  ]);
  const [assistant, setAssistant] = useState('Anda ingin mengurus KBLI apa? Ketik kode KBLI atau kata yang terkait dengan persyaratan.');

  const selected = useMemo(function() {
    return registry.kbliIndex.find(function(x) { return x.code === selectedCode; }) || null;
  }, [selectedCode]);

  const searchResults = useMemo(function() {
    const ranked = registry.kbliIndex
      .map(function(item) { return { item: item, score: scoreKbli(item, query) }; })
      .filter(function(x) { return query.trim() ? x.score > 0 : true; })
      .sort(function(a, b) { return b.score - a.score || b.item.requirementCount - a.item.requirementCount || a.item.code.localeCompare(b.item.code); })
      .slice(0, 8)
      .map(function(x) { return x.item; });
    return ranked;
  }, [query]);

  const reqs = useMemo(function() {
    if (!selectedCode) return [];
    return registry.requirements.filter(function(r) { return r.kblis.includes(selectedCode); });
  }, [selectedCode]);

  const parentCodes = useMemo(function() {
    const parents = new Set();
    reqs.forEach(function(a) {
      reqs.forEach(function(b) {
        if (b.level > a.level && b.code.startsWith(a.code + '.')) parents.add(a.code);
      });
    });
    return parents;
  }, [reqs]);

  const slots = useMemo(function() {
    return reqs.filter(function(r) { return !parentCodes.has(r.code); });
  }, [reqs, parentCodes]);

  const activeSlot = useMemo(function() {
    return slots.find(function(s) { return s.code === activeCode; }) || null;
  }, [slots, activeCode]);

  const completedCount = useMemo(function() {
    return slots.filter(function(s) { return isComplete(s, responses[s.code]); }).length;
  }, [slots, responses]);

  const progress = slots.length ? Math.round((completedCount / slots.length) * 100) : 0;
  const missing = Math.max(0, slots.length - completedCount);

  useEffect(function() {
    if (!selectedCode) return;
    try {
      const saved = JSON.parse(localStorage.getItem('oss-vfc-session-' + selectedCode) || 'null');
      if (saved) {
        setResponses(saved.responses || {});
        setStage(saved.stage || 'FILLING');
        setCredentials(saved.credentials || []);
        setNotifications(saved.notifications || []);
      } else {
        setResponses({});
        setStage('FILLING');
        setCredentials([]);
        setNotifications([{ id: Date.now(), tone: 'info', text: 'Kabinet KBLI ' + selectedCode + ' dibuka. Lengkapi slot persyaratan yang tersedia.' }]);
      }
    } catch {
      setResponses({});
      setStage('FILLING');
      setCredentials([]);
    }
  }, [selectedCode]);

  useEffect(function() {
    if (!selectedCode) return;
    try {
      localStorage.setItem('oss-vfc-session-' + selectedCode, JSON.stringify({
        responses: responses,
        stage: stage,
        credentials: credentials,
        notifications: notifications.slice(-8)
      }));
    } catch {}
  }, [selectedCode, responses, stage, credentials, notifications]);

  useEffect(function() {
    if (!selected || !slots.length || stage !== 'FILLING') return;
    const timer = setTimeout(function() {
      const next = slots.find(function(s) { return !isComplete(s, responses[s.code]); });
      if (next) {
        setAssistant('Saya menemukan ' + missing + ' slot yang belum lengkap. Prioritas berikutnya: ' + next.code + ' — ' + next.requirement);
      } else {
        setAssistant('Semua slot persyaratan sudah lengkap. Sistem mulai memproses penerbitan credential secara asynchronous.');
      }
    }, 750);
    return function() { clearTimeout(timer); };
  }, [selected, slots, responses, missing, stage]);

  useEffect(function() {
    if (!selectedCode || !slots.length) return;
    if (completedCount === slots.length && stage === 'FILLING') {
      setStage('VALIDATING');
      setNotifications(function(current) {
        return current.concat({ id: Date.now(), tone: 'success', text: 'Semua slot lengkap. Validasi otomatis dimulai.' });
      });
    }
  }, [completedCount, slots.length, selectedCode, stage]);

  useEffect(function() {
    if (!selectedCode) return;
    let timer;
    if (stage === 'VALIDATING') {
      setAssistant('Dokumen sedang divalidasi. Anda tetap dapat melihat isi kabinet selama proses berjalan.');
      timer = setTimeout(function() {
        setStage('ORCHESTRATING');
        setNotifications(function(current) { return current.concat({ id: Date.now(), tone: 'info', text: 'Validasi selesai. Paket permohonan sedang diorkestrasi.' }); });
      }, 1700);
    } else if (stage === 'ORCHESTRATING') {
      setAssistant('Paket permohonan sedang dirouting ke proses penerbitan yang sesuai.');
      timer = setTimeout(function() {
        setStage('ISSUING');
        setNotifications(function(current) { return current.concat({ id: Date.now(), tone: 'info', text: 'Paket diterima. Penerbitan credential sedang diproses.' }); });
      }, 1800);
    } else if (stage === 'ISSUING') {
      setAssistant('Credential sedang diterbitkan. Ini simulasi PoC, bukan dokumen OSS yang berlaku.');
      timer = setTimeout(function() {
        setCredentials([
          { id: 'cred-nib-' + selectedCode, name: 'NIB (Simulasi)', issuer: 'OSS v2 PoC', status: 'ISSUED', issuedAt: new Date().toISOString() },
          { id: 'cred-permit-' + selectedCode, name: 'Credential Izin KBLI ' + selectedCode + ' (Simulasi)', issuer: 'OSS v2 PoC', status: 'ISSUED', issuedAt: new Date().toISOString() }
        ]);
        setStage('COMPLETE');
        setNotifications(function(current) { return current.concat({ id: Date.now(), tone: 'success', text: 'Simulasi penerbitan selesai. Credential telah masuk ke kompartemen Credentials.' }); });
      }, 1800);
    } else if (stage === 'COMPLETE') {
      setAssistant('Proses selesai. Credential hasil simulasi sudah tersimpan di kompartemen Credentials pada filing cabinet.');
    }
    return function() { if (timer) clearTimeout(timer); };
  }, [stage, selectedCode]);

  function chooseKbli(item) {
    setSelectedCode(item.code);
    setQuery(item.code);
    setActiveCode('');
    setAssistant('KBLI ' + item.code + ' dipilih. Saya sedang menyiapkan slot persyaratan berdasarkan registry.');
  }

  function updateResponse(code, patch) {
    setResponses(function(current) {
      const next = Object.assign({}, current);
      next[code] = Object.assign({}, current[code] || {}, patch, { updatedAt: new Date().toISOString() });
      return next;
    });
  }

  function resetSession() {
    if (!selectedCode) return;
    try { localStorage.removeItem('oss-vfc-session-' + selectedCode); } catch {}
    setResponses({});
    setStage('FILLING');
    setCredentials([]);
    setNotifications([{ id: Date.now(), tone: 'info', text: 'Sesi direset. Silakan lengkapi kembali seluruh slot.' }]);
    setAssistant('Kabinet sudah direset. Saya akan memberi saran slot berikutnya setelah Anda mulai mengisi.');
  }

  function closeCabinet() {
    setSelectedCode('');
    setResponses({});
    setCredentials([]);
    setStage('FILLING');
    setActiveCode('');
    setAssistant('Anda ingin mengurus KBLI apa? Ketik kode KBLI atau kata yang terkait dengan persyaratan.');
  }

  const activeValue = activeSlot ? (responses[activeSlot.code] || {}) : {};
  const activeType = activeSlot ? inferType(activeSlot.requirement) : '';

  return (
    <main className="appShell">
      <header className="ossHeader">
        <div className="brand">
          <img src={LOGO} alt="Logo OSS" />
          <div>
            <strong>Virtual Filing Cabinet</strong>
            <small>OSS v2 · Proof of Concept</small>
          </div>
          <span>PROTOTYPE</span>
        </div>
        <div className="headerMeta">
          <b>Repository Persyaratan</b>
          <small>{registry.meta.requirementRows} persyaratan · {registry.meta.uniqueKbli} KBLI</small>
        </div>
      </header>

      <section className="serviceHero">
        <div className="assistantAvatar">BJ</div>
        <div className="assistantBubble">
          <div className="assistantTitle">Biro Jasa Virtual</div>
          <h1>{selected ? 'Kabinet KBLI ' + selected.code : 'Anda ingin mengurus KBLI apa?'}</h1>
          <p>{assistant}</p>
          <div className="searchBox">
            <span>⌕</span>
            <input
              value={query}
              onChange={function(e) { setQuery(e.target.value); }}
              placeholder="Contoh: 03151, 08104, pembayaran PNBP, proposal..."
            />
          </div>
          {!selected && (
            <div className="searchResults">
              {searchResults.map(function(item) {
                return (
                  <button key={item.code} onClick={function() { chooseKbli(item); }}>
                    <div className="kbliCode">{item.code}</div>
                    <div className="kbliInfo">
                      <b>{item.sectorNames.join(' · ')}</b>
                      <span>{item.requirementCount} baris persyaratan · {item.level1Count} level-1</span>
                      <small>{item.preview.join(' • ')}</small>
                    </div>
                    <i>→</i>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <>
          <section className="dashboard">
            <div className="metric"><small>KBLI</small><b>{selected.code}</b><span>{selected.sectorNames.join(', ')}</span></div>
            <div className="metric"><small>Slot wajib</small><b>{slots.length}</b><span>{completedCount} sudah lengkap</span></div>
            <div className="metric"><small>Progress</small><b>{progress}%</b><span>{missing} slot tersisa</span></div>
            <div className="metric"><small>Status proses</small><b>{STAGES[stageIndex(stage)][1]}</b><span>{stage === 'COMPLETE' ? 'Credential tersedia' : 'Asynchronous processing'}</span></div>
            <button className="ghostButton" onClick={resetSession}>Reset sesi</button>
            <button className="ghostButton" onClick={closeCabinet}>Ganti KBLI</button>
          </section>

          <section className="progressCard">
            <div className="progressTop">
              <div>
                <b>Progress Dashboard</b>
                <span>Slot → Validasi → Orkestrasi → Penerbitan Credential</span>
              </div>
              <strong>{progress}%</strong>
            </div>
            <div className="progressTrack"><div style={{ width: progress + '%' }} /></div>
            <div className="stageRow">
              {STAGES.map(function(s, i) {
                const current = stageIndex(stage);
                return (
                  <div key={s[0]} className={i < current ? 'stage done' : i === current ? 'stage current' : 'stage'}>
                    <i>{i < current ? '✓' : i + 1}</i>
                    <span>{s[1]}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="workGrid">
            <section className="cabinetSection">
              <div className="cabinetHeading">
                <div>
                  <span>VIRTUAL FILING CABINET</span>
                  <h2>Kabinet Persyaratan KBLI {selected.code}</h2>
                  <p>Setiap laci merepresentasikan satu slot persyaratan dari <code>persyaratan_register_deduplicated</code>.</p>
                </div>
                <div className="cabinetLegend"><span className="dot emptyDot" /> Belum lengkap <span className="dot completeDot" /> Lengkap</div>
              </div>

              <div className="cabinetFrame">
                <div className="credentialShelf">
                  <div className="shelfTitle"><span>◆</span><div><b>Credentials</b><small>Dokumen yang sudah diterbitkan OSS</small></div></div>
                  <div className="credentialList">
                    {credentials.length === 0 && <div className="credentialEmpty">Belum ada credential pada sesi ini.</div>}
                    {credentials.map(function(c) {
                      return (
                        <article className="credentialCard" key={c.id}>
                          <span>VC</span>
                          <div><b>{c.name}</b><small>{c.issuer} · SIMULASI</small></div>
                          <i>✓</i>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <div className="slotStack">
                  {reqs.map(function(slot) {
                    const isParent = parentCodes.has(slot.code);
                    const done = !isParent && isComplete(slot, responses[slot.code]);
                    if (isParent) {
                      return (
                        <div className="groupDrawer" key={slot.code} style={{ marginLeft: ((slot.level - 1) * 18) + 'px' }}>
                          <span>{slot.code}</span>
                          <b>{slot.requirement}</b>
                          <small>Kelompok persyaratan · Level {slot.level}</small>
                        </div>
                      );
                    }
                    return (
                      <button
                        className={done ? 'slotDrawer complete' : 'slotDrawer'}
                        key={slot.code}
                        onClick={function() { setActiveCode(slot.code); }}
                        style={{ marginLeft: ((slot.level - 1) * 18) + 'px' }}
                      >
                        <div className="drawerHandle" />
                        <div className="slotCode">{slot.code}<span>L{slot.level}</span></div>
                        <div className="slotText">
                          <b>{slot.requirement}</b>
                          <small>{typeLabel(inferType(slot.requirement))}</small>
                        </div>
                        <div className="slotState">{done ? '✓ Lengkap' : 'Isi slot'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="sidePanel">
              <div className="advisorCard">
                <div className="advisorHead"><span>BJ</span><div><b>Biro Jasa Virtual</b><small>Asynchronous Advisor</small></div></div>
                <p>{assistant}</p>
                {stage === 'FILLING' && missing > 0 && (
                  <button onClick={function() {
                    const next = slots.find(function(s) { return !isComplete(s, responses[s.code]); });
                    if (next) setActiveCode(next.code);
                  }}>Buka slot yang disarankan</button>
                )}
              </div>

              <div className="notificationCard">
                <h3>Notifikasi</h3>
                <div className="notificationList">
                  {notifications.slice().reverse().map(function(n) {
                    return <div className={'notice ' + (n.tone || 'info')} key={n.id}><i /> <span>{n.text}</span></div>;
                  })}
                </div>
              </div>

              <div className="sourceCard">
                <h3>Data Source</h3>
                <p><b>{registry.meta.sourceFile}</b></p>
                <p>{registry.meta.requirementRows} baris registry, {registry.meta.uniqueKbli} KBLI unik.</p>
                <small>Tipe slot (form/upload/payment/declaration/photo) adalah klasifikasi heuristic untuk PoC berdasarkan teks persyaratan; tipe tersebut bukan kolom asli workbook.</small>
              </div>
            </aside>
          </div>
        </>
      )}

      {activeSlot && (
        <div className="modalBackdrop" onMouseDown={function(e) { if (e.target === e.currentTarget) setActiveCode(''); }}>
          <section className="slotModal">
            <div className="modalHeader">
              <div>
                <span>{activeSlot.code} · Level {activeSlot.level}</span>
                <h2>{activeSlot.requirement}</h2>
              </div>
              <button onClick={function() { setActiveCode(''); }}>×</button>
            </div>
            <div className="typeBanner"><b>{typeLabel(activeType)}</b><span>Klasifikasi input PoC berdasarkan teks persyaratan.</span></div>

            {(activeType === 'UPLOAD' || activeType === 'PHOTO') && (
              <div className="fieldBlock">
                <label>{activeType === 'PHOTO' ? 'Pilih file foto' : 'Upload dokumen'}</label>
                <div className="uploadBox">
                  <input type="file" onChange={function(e) {
                    const f = e.target.files && e.target.files[0];
                    if (f) updateResponse(activeSlot.code, { fileName: f.name, fileSize: f.size });
                  }} />
                  <b>{activeValue.fileName || 'Belum ada file dipilih'}</b>
                  {activeValue.fileName && <small>{Math.ceil((activeValue.fileSize || 0) / 1024)} KB · metadata file disimpan untuk demo</small>}
                </div>
                <label>Catatan</label>
                <textarea value={activeValue.notes || ''} onChange={function(e) { updateResponse(activeSlot.code, { notes: e.target.value }); }} placeholder="Catatan opsional..." />
              </div>
            )}

            {activeType === 'PAYMENT' && (
              <div className="fieldBlock">
                <label>Nomor referensi pembayaran / PNBP</label>
                <input value={activeValue.reference || ''} onChange={function(e) { updateResponse(activeSlot.code, { reference: e.target.value }); }} placeholder="Masukkan nomor referensi" />
                <label>Nominal / keterangan pembayaran</label>
                <input value={activeValue.amount || ''} onChange={function(e) { updateResponse(activeSlot.code, { amount: e.target.value }); }} placeholder="Contoh: Rp1.000.000" />
                <label>Upload bukti pembayaran</label>
                <div className="uploadBox">
                  <input type="file" onChange={function(e) {
                    const f = e.target.files && e.target.files[0];
                    if (f) updateResponse(activeSlot.code, { fileName: f.name, fileSize: f.size });
                  }} />
                  <b>{activeValue.fileName || 'Belum ada bukti diunggah'}</b>
                </div>
              </div>
            )}

            {activeType === 'DECLARATION' && (
              <div className="fieldBlock">
                <label className="checkLabel"><input type="checkbox" checked={Boolean(activeValue.confirmed)} onChange={function(e) { updateResponse(activeSlot.code, { confirmed: e.target.checked }); }} /> Saya mengonfirmasi bahwa pernyataan/komitmen ini dipenuhi.</label>
                <label>Catatan / pernyataan</label>
                <textarea value={activeValue.notes || ''} onChange={function(e) { updateResponse(activeSlot.code, { notes: e.target.value }); }} placeholder="Tambahkan catatan jika diperlukan..." />
              </div>
            )}

            {activeType === 'FORM' && (
              <div className="fieldBlock">
                <label>Isian persyaratan</label>
                <textarea value={activeValue.value || ''} onChange={function(e) { updateResponse(activeSlot.code, { value: e.target.value }); }} placeholder={'Isi informasi untuk: ' + activeSlot.requirement} />
              </div>
            )}

            <div className="modalFooter">
              <div className={isComplete(activeSlot, activeValue) ? 'slotCompletion yes' : 'slotCompletion'}>
                {isComplete(activeSlot, activeValue) ? '✓ Slot sudah lengkap' : 'Slot belum lengkap'}
              </div>
              <button onClick={function() { setActiveCode(''); }}>Simpan & tutup</button>
            </div>
          </section>
        </div>
      )}

      <footer>
        <b>OSS v2 Virtual Filing Cabinet PoC</b>
        <span>Konsep kabinet digital dengan slot persyaratan, async advisor, progress dashboard, dan credential compartment.</span>
      </footer>
    </main>
  );
}
