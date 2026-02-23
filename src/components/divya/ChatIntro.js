import React from 'react';

export default function ChatIntro() {
  return (
    <div className="chat-intro">
      <div className="chat-date-divider">March 2024 · Egg Freezing Cycle</div>

      <div className="chat-bubble-row from-divya">
        <div className="chat-avatar-small">D</div>
        <div>
          <div className="chat-bubble her">
            <span className="sender-name">Divya</span>
            ok so I'm doing it. I'm actually doing it. 29 years old, just started my egg freezing cycle at RMANY in NYC 🥹
            <span className="chat-timestamp">Mar 4 · 7:14 AM</span>
          </div>
        </div>
      </div>

      <div className="chat-bubble-row from-divya">
        <div className="chat-avatar-small">D</div>
        <div>
          <div className="chat-bubble her">
            I kept every scan, every bloodwork number, every medication dose. If you're about to do this — or thinking about it — I want you to have what I wish I had: a real person's real data 💛
            <span className="chat-timestamp">Mar 4 · 7:15 AM</span>
          </div>
        </div>
      </div>

      <div className="chat-bubble-row from-user">
        <div>
          <div className="chat-bubble me">
            wait you tracked EVERYTHING? like actual numbers?
            <span className="chat-timestamp">Mar 4 · 7:18 AM</span>
          </div>
        </div>
      </div>

      <div className="chat-bubble-row from-divya">
        <div className="chat-avatar-small">D</div>
        <div>
          <div className="chat-bubble her">
            <span className="sender-name">Divya</span>
            every single day. medications, follicle sizes, E2 levels, symptoms, how I felt at 11pm after my shot 😂 scroll down — it's all here
            <span className="chat-timestamp">Mar 4 · 7:19 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
