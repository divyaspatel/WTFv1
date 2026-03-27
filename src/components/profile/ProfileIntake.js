import React, { useState } from 'react';

const STEPS = [
  { id: 'basics',   label: 'About you'        },
  { id: 'stage',    label: 'Where you are now' },
  { id: 'situation',label: 'Your situation'    },
  { id: 'clinical', label: 'Your doctor knows' },
  { id: 'referral', label: 'One last thing'    },
];

const JOURNEY_STAGES = [
  { value: 'researching',       label: 'Starting to research'                                              },
  { value: 'pre_consultation',  label: 'Looking to see a specialist'                                       },
  { value: 'post_consultation', label: "I've had an initial consultation, deciding next steps"             },
  { value: 'mid_cycle',         label: 'In the middle of a cycle right now'                                },
  { value: 'post_retrieval',    label: "I've done an egg retrieval/embryo freezing cycle, figuring out what's next" },
];

const BLOOD_TEST_OPTIONS = [
  { value: 'not_yet',      label: 'Not yet'                   },
  { value: 'waiting',      label: 'Yes, waiting on results'   },
  { value: 'have_results', label: 'Yes, I have results'       },
];

const HAS_CHILDREN_OPTIONS = [
  { value: 'no',           label: 'No'                 },
  { value: 'yes_one',      label: 'Yes, one'           },
  { value: 'yes_multiple', label: 'Yes, more than one' },
];

const PARTNER_OPTIONS = [
  { value: 'male_partner',     label: 'My partner is biologically male'     },
  { value: 'non_male_partner', label: 'My partner is not biologically male' },
  { value: 'no_partner',       label: "I don't have a partner"              },
];

const CONCERN_OPTIONS = [
  { value: 'cost',           label: 'Cost'                     },
  { value: 'success_rates',  label: 'Success rates'            },
  { value: 'timeline',       label: 'Timeline'                 },
  { value: 'finding_doctor', label: 'Finding the right doctor' },
  { value: 'understanding',  label: 'Understanding the process'},
  { value: 'other',          label: 'Other'                    },
];

const RISKS = [
  { value: 'endo',        label: 'Endometriosis'                    },
  { value: 'pcos',        label: 'PCOS'                             },
  { value: 'low_amh',     label: 'Low AMH / low reserve'            },
  { value: 'dor',         label: 'Diminished ovarian reserve (DOR)' },
  { value: 'male_factor', label: 'Male factor'                      },
  { value: 'unexplained', label: 'Unexplained infertility'          },
];

const REFERRAL_OPTIONS = [
  { value: 'direct',       label: 'Divya directly reached out to me'             },
  { value: 'social_media', label: 'Social media (Facebook, Reddit, Instagram)'   },
  { value: 'other',        label: 'Other'                                         },
];

const POST_CONSULTATION_STAGES = ['post_consultation', 'mid_cycle', 'post_retrieval'];

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
    <button className={`intake-option${selected ? ' selected' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function ChipButton({ selected, onClick, children }) {
  return (
    <button className={`intake-chip${selected ? ' selected' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export default function ProfileIntake({ onComplete, initialValues }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name:                  initialValues?.name                  || '',
    birth_year:            initialValues?.birth_year != null    ? String(initialValues.birth_year) : '',
    country:               initialValues?.country               || '',
    state:                 initialValues?.state                 || '',
    city:                  initialValues?.city                  || '',
    journey_stage:         initialValues?.journey_stage         || '',
    blood_test_status:     initialValues?.blood_test_status     || '',
    has_children:          initialValues?.has_children          || '',
    partner_status:        initialValues?.partner_status        || '',
    biggest_concern:       initialValues?.biggest_concern       || '',
    biggest_concern_other: initialValues?.biggest_concern_other || '',
    risks:                 initialValues?.risks                 || [],
    doctor_notes:          initialValues?.doctor_notes          || '',
    amh:                   initialValues?.amh != null           ? String(initialValues.amh) : '',
    afc:                   initialValues?.afc != null           ? String(initialValues.afc) : '',
    referral_source:       initialValues?.referral_source       || '',
    referral_source_other: initialValues?.referral_source_other || '',
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
    if (step === 0) return form.name && form.birth_year && form.country && form.state;
    if (step === 1) return form.journey_stage && form.blood_test_status;
    if (step === 2) return (
      form.has_children &&
      form.partner_status &&
      form.biggest_concern &&
      (form.biggest_concern !== 'other' || form.biggest_concern_other.trim())
    );
    return true; // steps 3 and 4 all optional
  }

  function handleNext() {
    if (step === 2 && !POST_CONSULTATION_STAGES.includes(form.journey_stage)) {
      setStep(4); // skip clinical step
      return;
    }
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSubmit();
  }

  function handleBack() {
    if (step === 4 && !POST_CONSULTATION_STAGES.includes(form.journey_stage)) {
      setStep(2); // skip back over clinical step
    } else {
      setStep(s => s - 1);
    }
  }

  function handleSubmit() {
    const showNumbers = POST_CONSULTATION_STAGES.includes(form.journey_stage);
    onComplete({
      name:                  form.name                  || null,
      birth_year:            form.birth_year            ? parseInt(form.birth_year) : null,
      country:               form.country               || null,
      state:                 form.state                 || null,
      city:                  form.city                  || null,
      journey_stage:         form.journey_stage         || null,
      blood_test_status:     form.blood_test_status     || null,
      has_children:          form.has_children          || null,
      partner_status:        form.partner_status        || null,
      biggest_concern:       form.biggest_concern       || null,
      biggest_concern_other: form.biggest_concern === 'other' ? (form.biggest_concern_other || null) : null,
      risks:                 form.risks.length > 0 ? form.risks : null,
      doctor_notes:          form.doctor_notes          || null,
      amh:                   showNumbers && form.amh    ? parseFloat(form.amh) : null,
      afc:                   showNumbers && form.afc    ? parseInt(form.afc)   : null,
      referral_source:       form.referral_source       || null,
      referral_source_other: form.referral_source === 'other' ? (form.referral_source_other || null) : null,
    });
  }

  return (
    <div className="intake-wrap">
      <div className="intake-card">
        <StepDots current={step} total={STEPS.length} />

        {/* ── Step 0: About you ── */}
        {step === 0 && (
          <div className="intake-step">
            <h2 className="intake-heading">First, a bit about you</h2>
            <p className="intake-sub">This helps us show you what's relevant — nothing is shared.</p>

            <div className="intake-field">
              <label className="intake-label">What's your name? <span className="intake-required">*</span></label>
              <input
                className="intake-input"
                type="text"
                placeholder="e.g. Sarah"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>

            <div className="intake-field">
              <label className="intake-label">Birth year <span className="intake-required">*</span></label>
              <input
                className="intake-input"
                type="number"
                placeholder="e.g. 1992"
                value={form.birth_year}
                onChange={e => set('birth_year', e.target.value)}
                min={1960} max={2005}
              />
            </div>

            <div className="intake-field">
              <label className="intake-label">Country <span className="intake-required">*</span></label>
              <input
                className="intake-input"
                type="text"
                placeholder="e.g. United States"
                value={form.country}
                onChange={e => set('country', e.target.value)}
              />
            </div>

            <div className="intake-location-row">
              <div className="intake-field">
                <label className="intake-label">State / Province <span className="intake-required">*</span></label>
                <input
                  className="intake-input"
                  type="text"
                  placeholder="e.g. New York"
                  value={form.state}
                  onChange={e => set('state', e.target.value)}
                />
              </div>
              <div className="intake-field">
                <label className="intake-label">City <span className="intake-optional">(optional)</span></label>
                <input
                  className="intake-input"
                  type="text"
                  placeholder="e.g. Brooklyn"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Where you are now ── */}
        {step === 1 && (
          <div className="intake-step">
            <h2 className="intake-heading">Where are you right now?</h2>
            <p className="intake-sub">We'll highlight what's most relevant for where you are.</p>

            <div className="intake-field">
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

            <div className="intake-field" style={{ marginTop: 20 }}>
              <label className="intake-label">Have you gotten a blood test or ultrasound yet? <span className="intake-required">*</span></label>
              <div className="intake-options">
                {BLOOD_TEST_OPTIONS.map(o => (
                  <OptionButton
                    key={o.value}
                    selected={form.blood_test_status === o.value}
                    onClick={() => set('blood_test_status', o.value)}
                  >
                    {o.label}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Your situation ── */}
        {step === 2 && (
          <div className="intake-step">
            <h2 className="intake-heading">Your situation</h2>

            <div className="intake-field">
              <label className="intake-label">Do you already have children? <span className="intake-required">*</span></label>
              <div className="intake-options">
                {HAS_CHILDREN_OPTIONS.map(o => (
                  <OptionButton
                    key={o.value}
                    selected={form.has_children === o.value}
                    onClick={() => set('has_children', o.value)}
                  >
                    {o.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="intake-field">
              <label className="intake-label">Partner status <span className="intake-required">*</span></label>
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
              <label className="intake-label">What's your biggest concern right now? <span className="intake-required">*</span></label>
              <div className="intake-chips">
                {CONCERN_OPTIONS.map(o => (
                  <ChipButton
                    key={o.value}
                    selected={form.biggest_concern === o.value}
                    onClick={() => set('biggest_concern', o.value)}
                  >
                    {o.label}
                  </ChipButton>
                ))}
              </div>
              {form.biggest_concern === 'other' && (
                <input
                  className="intake-input"
                  style={{ marginTop: 10 }}
                  type="text"
                  placeholder="Tell us more..."
                  value={form.biggest_concern_other}
                  onChange={e => set('biggest_concern_other', e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: What your doctor knows (post-consultation only) ── */}
        {step === 3 && (
          <div className="intake-step">
            <h2 className="intake-heading">What your doctor knows</h2>
            <p className="intake-sub">All optional — skip anything you don't have yet.</p>

            <div className="intake-field">
              <label className="intake-label">
                Any known risk factors? <span className="intake-optional">(select all that apply)</span>
              </label>
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
              <label className="intake-label">
                Anything else your doctor has mentioned? <span className="intake-optional">(optional)</span>
              </label>
              <textarea
                className="intake-input intake-textarea"
                placeholder="e.g. thin uterine lining, irregular cycles..."
                value={form.doctor_notes}
                onChange={e => set('doctor_notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="intake-location-row">
              <div className="intake-field">
                <label className="intake-label">
                  AMH level <span className="intake-optional">(ng/mL)</span>
                </label>
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
                <label className="intake-label">
                  AFC <span className="intake-optional">(follicle count)</span>
                </label>
                <input
                  className="intake-input"
                  type="number"
                  placeholder="e.g. 12"
                  value={form.afc}
                  onChange={e => set('afc', e.target.value)}
                  min={0} max={50}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: One last thing ── */}
        {step === 4 && (
          <div className="intake-step">
            <h2 className="intake-heading">One last thing</h2>
            <p className="intake-sub">Totally optional — helps us understand how people find us.</p>

            <div className="intake-field">
              <label className="intake-label">How did you hear about WTF?</label>
              <div className="intake-options">
                {REFERRAL_OPTIONS.map(o => (
                  <OptionButton
                    key={o.value}
                    selected={form.referral_source === o.value}
                    onClick={() => set('referral_source', o.value)}
                  >
                    {o.label}
                  </OptionButton>
                ))}
              </div>
              {form.referral_source === 'other' && (
                <input
                  className="intake-input"
                  style={{ marginTop: 10 }}
                  type="text"
                  placeholder="Tell us more..."
                  value={form.referral_source_other}
                  onChange={e => set('referral_source_other', e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <div className="intake-nav">
          {step > 0 && (
            <button className="intake-back" onClick={handleBack} type="button">
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
