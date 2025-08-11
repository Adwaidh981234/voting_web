import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Unlock, Trash } from "lucide-react";

export default function VotingApp() {
  const [candidates, setCandidates] = useState(() => {
    const stored = localStorage.getItem("candidates");
    return stored
      ? JSON.parse(stored)
      : [
          { name: "Candidate A", votes: 0 },
          { name: "Candidate B", votes: 0 },
        ];
  });

  const [voterName, setVoterName] = useState("");
  const [confirmedName, setConfirmedName] = useState(false);
  const [adminLocked, setAdminLocked] = useState(true);
  const [password, setPassword] = useState("");
  const [locked, setLocked] = useState(false);
  const [editing, setEditing] = useState([]);
  const [confirmingVote, setConfirmingVote] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [voterLog, setVoterLog] = useState(() => {
    const stored = localStorage.getItem("voterLog");
    return stored ? JSON.parse(stored) : [];
  });
  const [showResults, setShowResults] = useState(false);
  const [voteBlink, setVoteBlink] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hoverTimers, setHoverTimers] = useState({});

  useEffect(() => {
    localStorage.setItem("candidates", JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem("voterLog", JSON.stringify(voterLog));
  }, [voterLog]);

  const beep = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  };

  const speakNext = () => {
    const utterance = new SpeechSynthesisUtterance("Next!");
    utterance.volume = 1;
    utterance.pitch = 1.4;
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const vote = (index) => {
    if (locked || confirmingVote !== index) return;

    const updated = [...candidates];
    updated[index].votes++;
    setCandidates(updated);

    const log = [...voterLog, { name: voterName, voted: candidates[index].name }];
    setVoterLog(log);

    setVoteBlink(index);
    setShowThankYou(true);
    beep();

    setTimeout(() => {
      setVoteBlink(null);
      setShowThankYou(false);
      setConfirmedName(false);
      setVoterName("");
      setConfirmingVote(null);
      speakNext();
    }, 1000);
  };

  const confirmVote = (index) => setConfirmingVote(index);

  const resetVotes = () => {
    setCandidates([
      { name: "Candidate A", votes: 0 },
      { name: "Candidate B", votes: 0 },
    ]);
    setVoterLog([]);
  };

  const changeName = (index, newName) => {
    const updated = [...candidates];
    updated[index].name = newName;
    setCandidates(updated);
  };

  const toggleEdit = (index) => {
    const updated = [...editing];
    updated[index] = !editing[index];
    setEditing(updated);
  };

  const removeCandidate = (index) => {
    const updated = [...candidates];
    updated.splice(index, 1);
    setCandidates(updated);
  };

  const unlockAdmin = () => {
    if (password === "admin123") {
      setAdminLocked(false);
      setIsAdmin(true);
      setEditing(candidates.map(() => false));
    } else {
      alert("Incorrect password");
    }
  };

  const addCandidate = () => {
    setCandidates([...candidates, { name: `Candidate ${candidates.length + 1}`, votes: 0 }]);
    setEditing([...editing, false]);
  };

  const getWinner = () => {
    const maxVotes = Math.max(...candidates.map((c) => c.votes));
    const winners = candidates.filter((c) => c.votes === maxVotes);
    return winners.length === 1
      ? `Winner: ${winners[0].name}`
      : `Tie between: ${winners.map((w) => w.name).join(", ")}`;
  };

  const alreadyVoted = voterLog.some((log) => log.name.toLowerCase() === voterName.toLowerCase());

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-bold relative">
      <span className="absolute bottom-2 right-2 text-sm text-green-400 animate-pulse slow-fade">
        created by Aswin & Adwaidh
      </span>

      {!isAdmin && !confirmedName && (
        <div className="w-full max-w-sm space-y-4 text-center mb-10">
          <h1 className="text-2xl">Enter Voter Name</h1>
          <Input
            placeholder="Your Name"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !alreadyVoted && voterName && setConfirmedName(true)}
            className="rounded-lg text-black"
          />
          <Button
            onClick={() => setConfirmedName(true)}
            disabled={!voterName || alreadyVoted}
            className="w-full"
          >
            Confirm
          </Button>
          {alreadyVoted && <p className="text-red-500">This name has already voted.</p>}
        </div>
      )}

      {!confirmedName && adminLocked && !isAdmin && (
        <div className="mb-10 text-center space-y-2 w-full max-w-xs">
          <h1 className="text-xl text-center">Admin Login</h1>
          <Input
            placeholder="Admin Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && unlockAdmin()}
            className="text-black"
          />
          <Button onClick={unlockAdmin} className="w-full">Login</Button>
        </div>
      )}

      {(confirmedName || isAdmin) && (
        <div className="w-full max-w-3xl space-y-4 mt-4 text-center">
          {confirmedName && <h1 className="text-3xl mb-4">Welcome, {voterName}</h1>}
          <div className="grid gap-4">
            {candidates.map((c, i) => (
              <Card key={i} className="bg-gray-900 text-white p-4 rounded-xl shadow">
                <CardContent className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        voteBlink === i ? "bg-green-500 animate-ping" : "bg-gray-500"
                      }`}
                    />
                    {editing[i] && isAdmin ? (
                      <Input
                        defaultValue={c.name}
                        onBlur={(e) => changeName(i, e.target.value)}
                        className="text-black w-36"
                      />
                    ) : (
                      <span className="w-36 text-left">{c.name}</span>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => toggleEdit(i)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => removeCandidate(i)}>
                          <Trash size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                  {!isAdmin && (
                    <Button
                      onClick={() => (confirmingVote === i ? vote(i) : confirmVote(i))}
                      disabled={locked}
                      className={`rounded-full px-4 py-2 transition-transform duration-200 hover:scale-110 hover:bg-green-600 ${
                        confirmingVote === i ? "bg-yellow-500" : "bg-blue-500"
                      } animate-hover-delay`}
                      onMouseEnter={(e) => {
                        const btn = e.currentTarget;
                        const id = `btn-${i}`;
                        const timer = setTimeout(() => {
                          btn.classList.add("animate-tilt");
                        }, 3000);
                        setHoverTimers((prev) => ({ ...prev, [id]: timer }));
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget;
                        const id = `btn-${i}`;
                        btn.classList.remove("animate-tilt");
                        clearTimeout(hoverTimers[id]);
                      }}
                    >
                      {confirmingVote === i ? "Confirm Vote" : "Vote"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {showThankYou && <p className="text-green-400 text-xl mt-4">Thanks for voting!</p>}

          {isAdmin && (
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => {
                  setAdminLocked(true);
                  setIsAdmin(false);
                  setPassword(""); // Clear password when locking admin
                }}
                variant="destructive"
                className="w-full"
              >
                Lock Admin
              </Button>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={resetVotes}>Reset Votes</Button>
                <Button onClick={() => setLocked(!locked)}>
                  {locked ? <Unlock className="mr-1" /> : <Lock className="mr-1" />}
                  {locked ? "Unlock Voting" : "Lock Voting"}
                </Button>
                <Button onClick={addCandidate}>Add Candidate</Button>
                <Button onClick={() => setShowResults(!showResults)}>
                  {showResults ? "Hide Results" : "Show Results"}
                </Button>
              </div>

              {showResults && (
                <div>
                  <h3 className="mt-2">Vote Count</h3>
                  <ul className="list-disc pl-4">
                    {candidates.map((c, i) => (
                      <li key={i}>
                        {c.name}: {c.votes}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">{getWinner()}</p>
                  <h3 className="mt-4">Voter Log</h3>
                  <ul className="list-disc pl-4">
                    {voterLog.map((log, i) => (
                      <li key={i}>
                        {log.name} voted {log.voted}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

