import { useEffect, useState, useCallback } from 'react';
import './index.css';
import { useGameStore } from './state/useGameStore';
import { useMultiplayerStore } from './state/useMultiplayerStore';

type Mode = 'home' | 'solo' | 'multi';

const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') };
};

// Countdown Timer Hook
const useCountdown = (endTime: number | null) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(null);
      return;
    }

    const updateTime = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
};

// iOS 26 Style Components
const Button = ({
  children,
  variant = 'primary',
  onClick,
  disabled,
  full,
  icon,
  style,
}: {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
  icon?: boolean;
  style?: React.CSSProperties;
}) => (
  <button
    className={`btn btn-${variant} ${full ? 'btn-full' : ''} ${icon ? 'btn-icon' : ''}`}
    onClick={onClick}
    disabled={disabled}
    type="button"
    style={style}
  >
    {children}
  </button>
);

const Pill = ({ label, accent }: { label: string; accent?: boolean }) => (
  <span className="pill" style={accent ? {} : { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--glass-border)' }}>
    {label}
  </span>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`card ${className}`}>{children}</div>
);

const Timer = ({ seconds }: { seconds: number | null }) => {
  if (seconds === null) return null;
  const isLow = seconds <= 10;
  return (
    <div className="timer" style={{ color: isLow ? 'var(--accent)' : 'var(--text-primary)' }}>
      ⏱️ {seconds}s
    </div>
  );
};

// Home Screen
function Home({ onSelect }: { onSelect: (mode: Mode) => void }) {
  return (
    <div className="stack gap-lg">
      <div className="hero">
        <div className="hero-icon">🎭</div>
        <p className="eyebrow">Imposter Cards</p>
        <h1>Find the Imposter</h1>
        <p className="muted">
          One player gets a different prompt. Answer quickly, read others' responses, and vote to find who doesn't belong.
        </p>
      </div>
      <div className="stack gap-sm">
        <Button full onClick={() => onSelect('solo')}>
          Pass & Play
        </Button>
        <Button full variant="secondary" onClick={() => onSelect('multi')}>
          🌐 Multiplayer
        </Button>
      </div>
      <p className="muted" style={{ textAlign: 'center', fontSize: 13 }}>
        ✨ Dynamic spicy questions generated each round
      </p>
    </div>
  );
}

// Solo/Pass & Play Mode (unchanged)
function SoloView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const [nameInput, setNameInput] = useState(store.players.map((p) => p.name).join('\n'));
  const [category, setCategory] = useState(store.getCategories()[0] ?? '');
  const [voteSelections, setVoteSelections] = useState<Record<number, number>>({});

  useEffect(() => {
    store.resetGame();
    store.goToLobby();
  }, []);

  useEffect(() => {
    setVoteSelections({});
  }, [store.currentPhase]);

  const start = () => {
    const names = nameInput.split('\n').filter(Boolean);
    if (names.length < 3) {
      alert('Add at least 3 players to play.');
      return;
    }
    store.configurePlayers(names);
    store.startRound(category);
  };

  const handleCastVote = () => {
    store.players.forEach((_, idx) => {
      const target = voteSelections[idx];
      if (target !== undefined) {
        store.castVote(idx, target);
      }
    });
    store.advancePhase();
  };

  const renderLobby = () => (
    <Card>
      <div className="card-header">
        <div>
          <p className="eyebrow">Pass & Play</p>
          <h2>Game Setup</h2>
        </div>
        <Pill label="Offline" />
      </div>
      <label className="label">Players (one per line, min 3)</label>
      <textarea
        className="input"
        rows={5}
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        placeholder="Alice&#10;Bob&#10;Charlie&#10;Diana"
      />
      <label className="label">Category</label>
      <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
        {store.getCategories().map((cat) => (
          <option key={cat} value={cat}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </select>
      <div className="stack gap-sm" style={{ marginTop: 20 }}>
        <Button full onClick={start}>Start Game</Button>
        <Button variant="ghost" onClick={onBack}>← Back</Button>
      </div>
    </Card>
  );

  const renderDeal = () => (
    <Card>
      <div className="card-header">
        <div>
          <p className="eyebrow">Round Started</p>
          <h2>Reveal Your Cards</h2>
        </div>
        <Pill label={store.currentCategory || ''} accent />
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>
        Tap each name to reveal their secret prompt. Don't let others see!
      </p>
      <div className="stack gap-sm">
        {store.players.map((player, idx) => (
          <details key={player.id} className="reveal">
            <summary>{player.name}</summary>
            <p className="prompt">{store.promptForPlayer(idx)}</p>
          </details>
        ))}
      </div>
      <Button full onClick={() => store.advancePhase()} style={{ marginTop: 20 }}>
        Everyone Ready → Discuss
      </Button>
    </Card>
  );

  const renderDiscussion = () => (
    <Card>
      <div className="card-header">
        <div>
          <p className="eyebrow">Discussion Time</p>
          <h2>Talk About Your Prompts</h2>
        </div>
      </div>
      <div className="prompt-display">
        💬 Everyone answer your prompt out loud. Listen carefully for the imposter!
      </div>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        Discuss for 60–90 seconds, then vote.
      </p>
      <Button full onClick={() => store.advancePhase()} style={{ marginTop: 20 }}>
        Start Voting
      </Button>
    </Card>
  );

  const renderVoting = () => (
    <Card>
      <div className="card-header">
        <div>
          <p className="eyebrow">Voting</p>
          <h2>Who's the Imposter?</h2>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>
        Each player selects who they think is the imposter.
      </p>
      <div className="stack gap-sm">
        {store.players.map((player, voterIdx) => (
          <div key={player.id} className="voting-row">
            <span>{player.name} votes:</span>
            <select
              className="input"
              value={voteSelections[voterIdx] ?? ''}
              onChange={(e) => setVoteSelections({ ...voteSelections, [voterIdx]: Number(e.target.value) })}
            >
              <option value="">Select...</option>
              {store.players.map((target, targetIdx) =>
                targetIdx === voterIdx ? null : (
                  <option key={target.id} value={targetIdx}>{target.name}</option>
                ),
              )}
            </select>
          </div>
        ))}
      </div>
      <Button
        full
        onClick={handleCastVote}
        disabled={Object.keys(voteSelections).length !== store.players.length}
        style={{ marginTop: 20 }}
      >
        Reveal Results
      </Button>
    </Card>
  );

  const renderResults = () => {
    const eliminated = store.eliminatedPlayerIndex ?? -1;
    const eliminatedName = store.players[eliminated]?.name ?? 'Unknown';
    const imposterName = store.imposterIndex !== null ? store.players[store.imposterIndex]?.name : 'Unknown';
    const crewWon = store.isImposterEliminated();

    return (
      <Card className="result-card">
        <div className="result-icon">{crewWon ? '🎉' : '😈'}</div>
        <div className="result-title">{crewWon ? 'Crew Wins!' : 'Imposter Wins!'}</div>
        <div className="result-info">
          <p>Eliminated: <strong>{eliminatedName}</strong></p>
          <p>The Imposter was: <strong style={{ color: 'var(--accent)' }}>{imposterName}</strong></p>
        </div>
        <div className="stack gap-sm">
          <Button full onClick={() => { store.resetGame(); store.goToLobby(); }}>Play Again</Button>
          <Button variant="ghost" onClick={onBack}>← Home</Button>
        </div>
      </Card>
    );
  };

  const phase = store.currentPhase;
  return (
    <>
      {phase === 'lobby' && renderLobby()}
      {phase === 'deal' && renderDeal()}
      {phase === 'discussion' && renderDiscussion()}
      {phase === 'voting' && renderVoting()}
      {phase === 'results' && renderResults()}
    </>
  );
}

// Multiplayer Mode - Updated with answering phase
function MultiplayerView({ onBack }: { onBack: () => void }) {
  const store = useMultiplayerStore();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [votingTime, setVotingTime] = useState(60);
  const [vote, setVote] = useState<string>('');
  const [prompt, setPrompt] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const room = store.room;
  const myIndex = store.getMyPlayerIndex();
  const isHost = store.isHost();
  const timeLeft = useCountdown(room?.timerEndTime || null);

  useEffect(() => {
    store.connect().catch(() => undefined);
    return () => store.disconnect();
  }, []);

  useEffect(() => {
    if (store.currentPhase === 'deal' && room && myIndex >= 0) {
      store.requestPrompt(myIndex).then((p) => setPrompt(p));
    }
    if (store.currentPhase === 'voting') {
      setHasVoted(false);
    }
    if (store.currentPhase === 'waiting') {
      setAnswer('');
      setPrompt(null);
    }
  }, [store.currentPhase, room, myIndex]);

  const handleSubmitAnswer = useCallback(async () => {
    if (answer.trim() && !store.hasSubmittedAnswer) {
      await store.submitAnswer(answer.trim());
    }
  }, [answer, store]);

  // Render functions
  const renderHome = () => (
    <Card>
      <div className="card-header">
        <div>
          <p className="eyebrow">Multiplayer</p>
          <h2>Join or Create</h2>
        </div>
        <div className="status">
          <span className="status-dot" />
          Online
        </div>
      </div>
      <label className="label">Your Name</label>
      <input
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <div className="stack gap-sm" style={{ marginTop: 20 }}>
        <Button full onClick={() => store.createRoom(name)} disabled={!name.trim()}>
          Create Room
        </Button>
        <p className="muted" style={{ textAlign: 'center', margin: '8px 0' }}>— or join existing —</p>
        <div className="row">
          <input
            className="input"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            style={{ flex: 1, textAlign: 'center', letterSpacing: 4, fontWeight: 600 }}
          />
          <Button onClick={() => store.joinRoom(code, name)} disabled={!code || !name.trim()}>
            Join
          </Button>
        </div>
      </div>
      <Button variant="ghost" onClick={onBack} style={{ marginTop: 16 }}>← Back</Button>
    </Card>
  );

  const renderWaiting = () => (
    <Card>
      <div className="card-header">
        <div><p className="eyebrow">Room Code</p></div>
        {isHost && <Pill label="Host" accent />}
      </div>
      <div className="room-code">{room?.code}</div>
      <p className="muted" style={{ textAlign: 'center', marginBottom: 16 }}>
        Share this code with friends
      </p>
      <label className="label">Players ({room?.players.length || 0})</label>
      <div className="chip-row">
        {room?.players.map((p) => (
          <span key={p.id} className="chip">
            {room?.hostId === p.id ? '⭐ ' : ''}{p.name}
          </span>
        ))}
      </div>
      {isHost && (
        <>
          <label className="label">Voting Time (seconds)</label>
          <div className="row">
            {[30, 60, 90, 120].map(t => (
              <Button
                key={t}
                variant={votingTime === t ? 'primary' : 'secondary'}
                onClick={() => { setVotingTime(t); store.updateSettings(t); }}
                style={{ flex: 1, padding: '10px 8px' }}
              >
                {t}s
              </Button>
            ))}
          </div>
          <Button
            full
            onClick={() => store.startGame('spicy')}
            disabled={(room?.players.length || 0) < 3}
            style={{ marginTop: 20 }}
          >
            Start Game {(room?.players.length || 0) < 3 ? '(Need 3+)' : ''}
          </Button>
        </>
      )}
      {!isHost && (
        <div className="prompt-display" style={{ marginTop: 16 }}>
          ⏳ Waiting for host to start...
        </div>
      )}
      <Button variant="ghost" onClick={onBack} style={{ marginTop: 16 }}>Leave Room</Button>
    </Card>
  );

  const renderDeal = () => (
    <Card>
      <div className="card-header">
        <div>
          <p className="eyebrow">Your Secret Prompt</p>
          <h2>Don't Share!</h2>
        </div>
        <Pill label={`${room?.currentPlayerIndex || 0}/${room?.players.length || 0} ready`} />
      </div>
      <div className="prompt-display" style={{ fontSize: 18, padding: 20 }}>
        {prompt ?? '⏳ Loading...'}
      </div>
      <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
        Memorize your prompt, then tap ready.
      </p>
      <Button full onClick={() => store.cardViewed()} style={{ marginTop: 20 }}>
        I'm Ready ✓
      </Button>
    </Card>
  );

  const renderAnswering = () => (
    <Card>
      <div className="card-header">
        <div>
          <p className="eyebrow">Answer Time</p>
          <h2>Type Your Response</h2>
        </div>
        <Timer seconds={timeLeft} />
      </div>
      <div className="prompt-display" style={{ fontSize: 16, marginBottom: 16 }}>
        {prompt}
      </div>
      {!store.hasSubmittedAnswer ? (
        <>
          <label className="label">Your Answer</label>
          <textarea
            className="input"
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            maxLength={280}
            disabled={store.hasSubmittedAnswer}
          />
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {answer.length}/280 • {room?.answeredCount || 0}/{room?.players.length || 0} answered
          </p>
          <Button
            full
            onClick={handleSubmitAnswer}
            disabled={!answer.trim()}
            style={{ marginTop: 16 }}
          >
            Submit Answer
          </Button>
        </>
      ) : (
        <div className="prompt-display" style={{ background: 'var(--accent-soft)' }}>
          ✅ Answer submitted! Waiting for others... ({room?.answeredCount || 0}/{room?.players.length || 0})
        </div>
      )}
    </Card>
  );

  const renderDiscussion = () => {
    const answers = store.getAnswers();
    return (
      <Card>
        <div className="card-header">
          <div>
            <p className="eyebrow">Discussion</p>
            <h2>Read All Answers</h2>
          </div>
        </div>
        <p className="muted" style={{ marginBottom: 16 }}>
          One of these answers is from the imposter with a different question!
        </p>
        <div className="stack gap-sm">
          {answers.map((a, idx) => (
            <div key={idx} className="answer-card">
              <div className="answer-name">{a.name}</div>
              <div className="answer-text">{a.answer}</div>
            </div>
          ))}
        </div>
        {isHost && (
          <Button full onClick={() => store.startVoting()} style={{ marginTop: 20 }}>
            Start Voting
          </Button>
        )}
        {!isHost && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
            Discuss who seems suspicious...
          </p>
        )}
      </Card>
    );
  };

  const renderVoting = () => (
    <Card>
      <div className="card-header">
        <div>
          <p className="eyebrow">Voting</p>
          <h2>Pick the Imposter</h2>
        </div>
        <Timer seconds={timeLeft} />
      </div>
      <p className="muted" style={{ marginBottom: 8 }}>
        {room?.votedCount || 0}/{room?.players.length || 0} voted
      </p>
      {!hasVoted ? (
        <>
          <label className="label">Who's the imposter?</label>
          <select className="input" value={vote} onChange={(e) => setVote(e.target.value)}>
            <option value="">Select a player...</option>
            {room?.players.map((p, idx) =>
              idx === myIndex ? null : (
                <option key={p.id} value={idx}>{p.name}</option>
              ),
            )}
          </select>
          <Button
            full
            disabled={vote === ''}
            onClick={() => {
              if (vote !== '') {
                store.castVote(myIndex, Number(vote));
                setHasVoted(true);
              }
            }}
            style={{ marginTop: 20 }}
          >
            Submit Vote
          </Button>
        </>
      ) : (
        <div className="prompt-display">
          ✅ Vote submitted! Waiting for others...
        </div>
      )}
    </Card>
  );

  const renderResults = () => {
    const crewWon = room?.imposterIndex === room?.eliminatedPlayerIndex;
    const answers = store.getAnswers();
    
    return (
      <Card className="result-card">
        <div className="result-icon">{crewWon ? '🎉' : '😈'}</div>
        <div className="result-title">{crewWon ? 'Crew Wins!' : 'Imposter Wins!'}</div>
        {room && (
          <div className="result-info">
            <p>Eliminated: <strong>{room.eliminatedPlayerIndex !== null ? room.players[room.eliminatedPlayerIndex]?.name : '—'}</strong></p>
            <p>The Imposter was: <strong style={{ color: 'var(--accent)' }}>{room.imposterIndex !== undefined ? room.players[room.imposterIndex]?.name : '—'}</strong></p>
          </div>
        )}
        {room?.promptPair && (
          <div className="stack gap-xs" style={{ marginBottom: 16, fontSize: 14 }}>
            <p><strong>Crew prompt:</strong> {room.promptPair.majority}</p>
            <p><strong>Imposter prompt:</strong> {room.promptPair.imposter}</p>
          </div>
        )}
        <details className="reveal" style={{ marginBottom: 16 }}>
          <summary>View All Answers</summary>
          <div className="stack gap-xs" style={{ padding: 12 }}>
            {answers.map((a, idx) => (
              <p key={idx}>
                <strong style={{ color: room?.imposterIndex === idx ? 'var(--accent)' : 'inherit' }}>
                  {a.name}{room?.imposterIndex === idx ? ' 😈' : ''}:
                </strong> {a.answer}
              </p>
            ))}
          </div>
        </details>
        {isHost && (
          <Button full onClick={() => store.playAgain()}>Play Again</Button>
        )}
        {!isHost && (
          <div className="prompt-display">⏳ Waiting for host...</div>
        )}
      </Card>
    );
  };

  // Connection states
  if (!store.isConnected && store.isConnecting) {
    return <Card><div className="prompt-display">⏳ Connecting to server...</div></Card>;
  }

  if (store.connectionError) {
    return (
      <Card>
        <div className="card-header">
          <div>
            <p className="eyebrow">Connection Error</p>
            <h2>Unable to Connect</h2>
          </div>
        </div>
        <p className="muted">{store.connectionError}</p>
        <Button variant="ghost" onClick={onBack} style={{ marginTop: 16 }}>← Back</Button>
      </Card>
    );
  }

  // Phase routing
  if (store.currentPhase === 'home' || store.currentPhase === 'join') return renderHome();
  if (store.currentPhase === 'waiting') return renderWaiting();
  if (store.currentPhase === 'deal') return renderDeal();
  if (store.currentPhase === 'answering') return renderAnswering();
  if (store.currentPhase === 'discussion') return renderDiscussion();
  if (store.currentPhase === 'voting') return renderVoting();
  if (store.currentPhase === 'results') return renderResults();

  return renderHome();
}

// Main App
function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [showPwaTip, setShowPwaTip] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if ((isIos || isAndroid) && !isStandalone) {
      const dismissed = sessionStorage.getItem('pwa-tip-dismissed');
      if (!dismissed) setShowPwaTip(true);
    }
  }, []);

  const dismissPwaTip = () => {
    setShowPwaTip(false);
    sessionStorage.setItem('pwa-tip-dismissed', 'true');
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">🎭 Imposter</div>
        <div className="topbar-actions">
          {mode !== 'home' && (
            <Button variant="ghost" onClick={() => setMode('home')}>Home</Button>
          )}
          <Button variant="ghost" icon onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </div>
      </header>

      {showPwaTip && (
        <div className="content" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="banner">
            <div>
              <strong>📲 Add to Home Screen</strong>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                Tap Share → "Add to Home Screen" for the best experience.
              </p>
            </div>
            <Button variant="ghost" onClick={dismissPwaTip}>✕</Button>
          </div>
        </div>
      )}

      <main className="content">
        {mode === 'home' && <Home onSelect={setMode} />}
        {mode === 'solo' && <SoloView onBack={() => setMode('home')} />}
        {mode === 'multi' && <MultiplayerView onBack={() => setMode('home')} />}
      </main>

      <footer className="footer">
        Made for mobile • Spicy questions generated each round
      </footer>
    </div>
  );
}

export default App;
