
  const STORAGE_KEY = 'flashcard_app_data';
  const DEFAULT_CARDS = [
    { q: "What is the powerhouse of the cell?", a: "The mitochondria" },
    { q: "What is Newton's second law of motion?", a: "F = ma (Force equals mass times acceleration)" },
    { q: "What year did World War II end?", a: "1945" },
    { q: "What is the chemical symbol for gold?", a: "Au (from the Latin 'Aurum')" },
    { q: "Who wrote 'Romeo and Juliet'?", a: "William Shakespeare" }
  ];

  function loadData() {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch(e) {}
    return null;
  }
  function saveData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ cards, marks, current, shuffled })); } catch(e) {}
  }

  const saved = loadData();
  let cards   = saved ? saved.cards   : DEFAULT_CARDS;
  let marks   = saved ? saved.marks   : {};
  let current = saved ? saved.current : 0;
  let shuffled= saved ? saved.shuffled: false;
  let order = [], flipped = false, editIdx = null;

  function buildOrder() {
    order = cards.map((_, i) => i);
    if (shuffled) for (let i = order.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
  }
  function currentCardIdx() { return order[current]; }

  function render() {
    if (!order.length) buildOrder();
    const total = cards.length;
    document.getElementById('deck-count').textContent = total;
    document.getElementById('progress').textContent = total ? `${current+1} / ${total}` : '0 / 0';
    document.getElementById('btn-prev').disabled = current <= 0;
    document.getElementById('btn-next').disabled = current >= total-1;
    const scene = document.getElementById('card-scene');
    const ci = document.getElementById('card-inner');
    if (!total) {
      document.getElementById('front-text').textContent = 'Add a card to get started';
      document.getElementById('back-text').textContent = '';
      document.getElementById('flip-hint').textContent = '';
      ci.classList.remove('flipped');
      document.getElementById('mark-row').style.display = 'none';
      document.getElementById('score-bar').style.display = 'none';
      scene.style.cursor = 'default';
      renderDeck(); return;
    }
    scene.style.cursor = 'pointer';
    const card = cards[currentCardIdx()];
    document.getElementById('front-text').textContent = card.q;
    document.getElementById('back-text').textContent = card.a;
    document.getElementById('flip-hint').textContent = flipped ? '' : 'Click card or "Show answer"';
    if (flipped) ci.classList.add('flipped'); else ci.classList.remove('flipped');
    document.getElementById('mark-row').style.display = flipped ? 'flex' : 'none';
    document.getElementById('score-bar').style.display = 'flex';
    document.getElementById('known-count').textContent = Object.values(marks).filter(Boolean).length;
    document.getElementById('unknown-count').textContent = Object.values(marks).filter(v=>v===false).length;
    document.getElementById('left-count').textContent = total - Object.keys(marks).length;
    renderDeck();
  }

  function renderDeck() {
    const list = document.getElementById('deck-list');
    if (!cards.length) { list.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>No flashcards yet!</div>'; return; }
    list.innerHTML = cards.map((c,i) => {
      const isActive = order[current]===i;
      const mark = marks[i];
      const icon = mark===true?'✓ ':mark===false?'✗ ':'';
      return `<div class="deck-item ${isActive?'active':''}">
        <div class="deck-num">${i+1}</div>
        <div class="deck-texts" onclick="jumpTo(${i})">
          <div class="deck-q">${esc(c.q)}</div>
          <div class="deck-a">${icon}${esc(c.a)}</div>
        </div>
        <div class="deck-actions">
          <button onclick="openEdit(${i})" title="Edit">✏️</button>
          <button class="danger" onclick="deleteCard(${i})" title="Delete">🗑</button>
        </div>
      </div>`;
    }).join('');
  }

  function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
  function flipCard() { if(!cards.length) return; flipped=!flipped; render(); }
  function prevCard() { if(current>0){current--;flipped=false;saveData();render();} }
  function nextCard() { if(current<cards.length-1){current++;flipped=false;saveData();render();} }
  function jumpTo(i) { const p=order.indexOf(i); if(p!==-1){current=p;flipped=false;saveData();render();} }
  function markCard(known) { marks[currentCardIdx()]=known; if(current<cards.length-1){current++;flipped=false;} saveData();render(); }
  function resetMarks() { marks={};flipped=false;current=0;saveData();render(); }
  function toggleShuffle() { shuffled=!shuffled; document.getElementById('shuffle-btn').classList.toggle('active',shuffled); buildOrder();current=0;flipped=false;saveData();render(); }

  function openAdd() { editIdx=null; document.getElementById('modal-title').textContent='Add flashcard'; document.getElementById('modal-save-btn').textContent='Add card'; document.getElementById('m-q').value=''; document.getElementById('m-a').value=''; document.getElementById('modal-overlay').classList.add('open'); setTimeout(()=>document.getElementById('m-q').focus(),50); }
  function openEdit(i) { editIdx=i; document.getElementById('modal-title').textContent='Edit flashcard'; document.getElementById('modal-save-btn').textContent='Save changes'; document.getElementById('m-q').value=cards[i].q; document.getElementById('m-a').value=cards[i].a; document.getElementById('modal-overlay').classList.add('open'); setTimeout(()=>document.getElementById('m-q').focus(),50); }
  function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
  function closeModalOverlay(e) { if(e.target===document.getElementById('modal-overlay')) closeModal(); }

  function saveCard() {
    const q=document.getElementById('m-q').value.trim();
    const a=document.getElementById('m-a').value.trim();
    if(!q||!a){alert('Please fill in both fields.');return;}
    if(editIdx!==null){cards[editIdx]={q,a};}
    else{cards.push({q,a});buildOrder();current=order.indexOf(cards.length-1);}
    closeModal();flipped=false;saveData();render();
  }

  function deleteCard(i) {
    if(!confirm('Delete this flashcard?'))return;
    cards.splice(i,1); delete marks[i];
    const nm={};
    Object.keys(marks).forEach(k=>{const ki=parseInt(k);if(ki<i)nm[ki]=marks[k];else if(ki>i)nm[ki-1]=marks[k];});
    marks=nm; buildOrder();
    if(current>=cards.length)current=Math.max(0,cards.length-1);
    flipped=false;saveData();render();
  }

  document.addEventListener('keydown',e=>{
    if(document.getElementById('modal-overlay').classList.contains('open')){if(e.key==='Escape')closeModal();return;}
    if(e.key==='ArrowLeft')prevCard();
    else if(e.key==='ArrowRight')nextCard();
    else if(e.key===' '||e.key==='Enter'){e.preventDefault();flipCard();}
  });

  buildOrder();
  document.getElementById('shuffle-btn').classList.toggle('active',shuffled);
  render();
