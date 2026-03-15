import React, { useState } from 'react';

const STEPS = [
  { id: 'basics',      label: 'About you'              },
  { id: 'situation',   label: 'Your situation'          },
  { id: 'stage',       label: 'Where you are now'       },
  { id: 'clinical',    label: 'What your doctor knows'  },
];

const GOALS = [
  { value: 'future_flexibility', label: 'Keep my options open for the future'   },
  { value: 'live_birth',         label: 'Have one child'                         },
  { value: 'multiple_births',    label: 'Have more than one child'               },
];

const PARTNER_OPTIONS = [
  { value: 'male_partner',    label: 'I have a male partner'                      },
  { value: 'no_male_partner', label: 'No male partner — going it alone or with a female partner' },
];

const JOURNEY_STAGES = [
  { value: 'researching',       label: 'Just starting to research'                },
  { value: 'pre_consultation',  label: 'Looking for or about to see a specialist' },
  { value: 'post_consultation', label: "I've had a consultation, deciding next steps" },
  { value: 'mid_cycle',         label: "I'm in the middle of a cycle right now"   },
  { value: 'post_retrieval',    label: "I've done a retrieval, figuring out what's next" },
  { value: 'transfer',          label: "I'm preparing for or have done a transfer" },
];

const RISKS = [
  { value: 'endo',        label: 'Endometriosis'           },
  { value: 'pcos',        label: 'PCOS'                    },
  { value: 'low_amh',     label: 'Low AMH / low reserve'   },
  { value: 'dor',         label: 'Diminished ovarian reserve (DOR)' },
  { value: 'male_factor', label: 'Male factor'             },
  { value: 'unexplained', label: 'Unexplained infertility' },
  { value: 'other',       label: 'Something else'          },
];

function StepDots({ current, total }) {
  return (
    <div className="intake-dots">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`intake-dot${i === current ? ' active' : i < current ? ' done' : ''}`} />
      ))}
    </div>
  );
}

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      className={`intake-option${selected ? ' selected' : ''}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ChipButton({ selected, onClick, children }) {
  return (
    <button
      className={`intake-chip${selected ? ' selected' : ''}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export default function ProfileIntake({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    age: '',
    location: '',
    partner_status: '',
    goal: '',
    journey_stage: '',
    risks: [],
    had_consultation: null,
    amh: '',
    afc: '',
  });

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function toggleRisk(value) {
    setForm(f => ({
      ...f,
      risks: f.risks.includes(value)
        ? f.risks.filter(r => r !== value)
        : [...f.risks, value],
    }));
  }

  function canAdvance() {
    if (step === 0) return form.age && form.location;
    if (step === 1) return form.partner_status && form.goal;
    if (step === 2) return form.journey_stage;
    return true; // step 3 is optional
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSubmit();
  }

  function handleSubmit() {
    const payload = {
      age:              parseInt(form.age) || null,
      location:         form.location || null,
      partner_status:   form.partner_status || null,
      goal:             form.goal || null,
      journey_stage:    form.journey_stage || null,
      risks:            form.risks.length > 0 ? form.risks : null,
      had_consultation: form.had_consultation,
      amh:              form.amh ? parseFloat(form.amh) : null,
      afc:              form.afc ? parseInt(form.afc) : null,
    };
    onComplete(payload);
  }

  return (
    <div className="intake-wrap">
      <div className="intake-card">
        <StepDots current={step} total={STEPS.length} />

        {/* ── Step 0: Basics ── */}
        {step === 0 && (
          <div className="intake-step">
            <h2 className="intake-heading">First, a bit about you</h2>
            <p className="intake-sub">This helps us show you what's relevant — nothing is shared.</p>

            <div className="intake-field">
              <label className="intake-label">How old are you?</label>
              <input
                className="intake-input"
                type="number"
                placeholder="e.g. 32"
                value={form.age}
                onChange={e => set('age', e.target.value)}
                min={18} max={55}
              />
            </div>

            <div className="intake-field">
              <label className="intake-label">Where are you located?</label>
              <input
                className="intake-input"
                type="text"
                placeholder="e.g. New York City, NY"
                value={form.location}
                onChange={e => set('location', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Situation ── */}
        {step === 1 && (
          <div className="intake-step">
            <h2 className="intake-heading">Your situation</h2>

            <div className="intake-field">
              <label className="intake-label">Partner status</label>
              <div className="intake-options">
                {PARTNER_OPTIONS.map(o => (
                  <OptionButton
                    key={o.value}
                    selected={form.partner_status === o.value}
                    onClick={() => set('partner_status', o.value)}
                  >
                    {o.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="intake-field">
              <label className="intake-label">What are you hoping for?</label>
              <div className="intake-options">
                {GOALS.map(o => (
                  <OptionButton
                    key={o.value}
                    selected={form.goal === o.value}
                    onClick={() => set('goal', o.value)}
                  >
                    {o.label}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Journey stage ── */}
        {step === 2 && (
          <div className="intake-step">
            <h2 className="intake-heading">Where are you right now?</h2>
            <p className="intake-sub">We'll show you what's most relevant for where you are.</p>

            <div className="intake-options">
              {JOURNEY_STAGES.map(o => (
                <OptionButton
                  key={o.value}
                  selected={form.journey_stage === o.value}
                  onClick={() => set('journey_stage', o.value)}
                >
                  {o.label}
                </OptionButton>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Clinical (optional) ── */}
        {step === 3 && (
          <div className="intake-step">
            <h2 className="intake-heading">What your doctor knows</h2>
            <p className="intake-sub">All optional — skip anything you don't have yet.</p>

            <div className="intake-field">
              <label className="intake-label">Any known risk factors? <span className="intake-optional">(select all that apply)</span></label>
              <div className="intake-chips">
                {RISKS.map(r => (
                  <ChipButton
                    key={r.value}
                    selected={form.risks.includes(r.value)}
                    onClick={() => toggleRisk(r.value)}
                  >
                    {r.label}
                  </ChipButton>
                ))}
              </div>
            </div>

            <div className="intake-field">
              <label className="intake-label">Have you had a consultation with an RE?</label>
              <div className="intake-options" style={{ flexDirection: 'row', gap: 8 }}>
                <OptionButton
                  selected={form.had_consultation === true}
                  onClick={() => set('had_consultation', true)}
                >
                  Yes
                </OptionButton>
                <OptionButton
                  selected={form.had_consultation === false}
                  onClick={() => set('had_consultation', false)}
                >
                  Not yet
                </OptionButton>
              </div>
            </div>

            {form.had_consultation === true && (
              <>
                <div className="intake-field">
                  <label className="intake-label">AMH level <span className="intake-optional">(ng/mL, if you know it)</span></label>
                  <input
                    className="intake-input"
                    type="number"
                    placeholder="e.g. 2.1"
                    value={form.amh}
                    onChange={e => set('amh', e.target.value)}
                    step="0.1" min={0} max={20}
                  />
                </div>
                <div className="intake-field">
                  <label className="intake-label">AFC — antral follicle count <span className="intake-optional">(if you know it)</span></label>
                  <input
                    className="intake-input"
                    type="number"
                    placeholder="e.g. 12"
                    value={form.afc}
                    onChange={e => set('afc', e.target.value)}
                    min={0} max={50}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Nav ── */}
        <div className="intake-nav">
          {step > 0 && (
            <button className="intake-back" onClick={() => setStep(s => s - 1)} type="button">
              Back
            </button>
          )}
          <button
            className="intake-next"
            onClick={handleNext}
            disabled={!canAdvance()}
            type="button"
          >
            {step === STEPS.length - 1 ? 'Show my pathway' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
